<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Models\QuizQuestion;
use App\Models\QuizResponse;
use App\Models\Application;
use App\Services\FlaskAIService;
use App\Support\UserCache;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class QuizController extends Controller
{
    public function __construct(private FlaskAIService $flaskAIService)
    {
    }

    /**
     * Company adds a new quiz question
     */
    public function store(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'company') {
            return response()->json(['message' => 'Only companies can add quiz questions'], 403);
        }

        $validator = Validator::make($request->all(), [
            'category'       => 'required|string|max:255',
            'question_text'  => 'required|string',
            'options'        => 'required|array|min:2',
            'correct_answer' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $payload = $this->validatedQuestionPayload($validator->validated());

        if (isset($payload['error'])) {
            return response()->json(['message' => $payload['error']], 422);
        }

        $question = QuizQuestion::create([
            'company_id'     => $user->company->id,
            'category'       => $payload['category'],
            'question_text'  => $payload['question_text'],
            'options'        => $payload['options'],
            'correct_answer' => $payload['correct_answer'],
        ]);

        $question->loadCount('responses');

        return response()->json([
            'message'  => 'Quiz question added successfully',
            'question' => $question,
        ], 201);
    }

    /**
     * Company views all its own quiz questions
     */
    public function myQuestions(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'company') {
            return response()->json(['message' => 'Only companies can access this'], 403);
        }

        $questions = QuizQuestion::where('company_id', $user->company->id)
            ->withCount('responses')
            ->orderBy('category')
            ->latest()
            ->get();

        return response()->json($questions);
    }

    /**
     * Company generates a batch of quiz questions in one click.
     */
    public function generate(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'company') {
            return response()->json(['message' => 'Only companies can generate quiz questions'], 403);
        }

        $validator = Validator::make($request->all(), [
            'category' => 'required|string|max:255',
            'count' => 'nullable|integer|min:1|max:10',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $category = trim($validator->validated()['category']);
        $count = (int) ($validator->validated()['count'] ?? 5);

        $source = 'fallback';
        $aiResult = $this->flaskAIService->generateQuiz($category, $count);

        if (!isset($aiResult['error']) && !empty($aiResult['questions']) && is_array($aiResult['questions'])) {
            $bank = $this->normalizeGeneratedQuestions($aiResult['questions'], $category);
            $source = $aiResult['source'] ?? 'openai';
        } else {
            $bank = $this->generatedQuestionBank($category);
        }

        if (empty($bank)) {
            $bank = $this->generatedQuestionBank($category);
            $source = 'fallback';
        }

        $existingTexts = QuizQuestion::where('company_id', $user->company->id)
            ->where('category', $category)
            ->pluck('question_text')
            ->map(fn ($text) => mb_strtolower(trim($text)))
            ->all();

        $created = collect($bank)
            ->reject(fn ($question) => in_array(mb_strtolower(trim($question['question_text'])), $existingTexts, true))
            ->take($count)
            ->map(function ($question) use ($user, $category) {
                $createdQuestion = QuizQuestion::create([
                    'company_id' => $user->company->id,
                    'category' => $category,
                    'question_text' => $question['question_text'],
                    'options' => $question['options'],
                    'correct_answer' => $question['correct_answer'],
                ]);

                return $createdQuestion->loadCount('responses');
            })
            ->values();

        if ($created->isEmpty()) {
            return response()->json([
                'message' => $source === 'fallback'
                    ? 'No new fallback questions generated. Add an OpenAI key for fresh AI questions, or delete duplicates first.'
                    : 'No new questions generated. Similar questions already exist in this category.',
                'questions' => [],
                'source' => $source,
            ], 409);
        }

        return response()->json([
            'message' => $created->count() . ($source === 'openai' ? ' AI quiz questions generated' : ' fallback quiz questions generated'),
            'questions' => $created,
            'source' => $source,
        ], 201);
    }

    /**
     * Company updates a quiz question
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        $question = QuizQuestion::findOrFail($id);

        if ($user->role !== 'company' || $question->company_id !== $user->company->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'category'       => 'sometimes|string|max:255',
            'question_text'  => 'sometimes|string',
            'options'        => 'sometimes|array|min:2',
            'correct_answer' => 'sometimes|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $payload = $this->validatedQuestionPayload($validator->validated(), $question);

        if (isset($payload['error'])) {
            return response()->json(['message' => $payload['error']], 422);
        }

        $question->update($payload);
        $question->loadCount('responses');

        return response()->json([
            'message'  => 'Quiz question updated successfully',
            'question' => $question,
        ]);
    }

    /**
     * Company deletes a quiz question
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $question = QuizQuestion::findOrFail($id);

        if ($user->role !== 'company' || $question->company_id !== $user->company->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $question->delete();

        return response()->json(['message' => 'Quiz question deleted successfully']);
    }

    /**
     * Job seeker fetches quiz questions for a specific company
     */
    public function getQuestionsForCompany(Request $request, $companyId)
    {
        $user = $request->user();

        if ($user->role !== 'jobseeker') {
            return response()->json(['message' => 'Only job seekers can access this'], 403);
        }

        $questions = QuizQuestion::where('company_id', $companyId)
            ->get()
            ->map(function ($q) {
                return [
                    'id'            => $q->id,
                    'category'      => $q->category,
                    'question_text' => $q->question_text,
                    'options'       => $q->options,
                    // correct_answer hidden
                ];
            });

        return response()->json($questions);
    }

    private function validatedQuestionPayload(array $data, ?QuizQuestion $question = null): array
    {
        $payload = $data;

        $options = array_key_exists('options', $data)
            ? $data['options']
            : ($question?->options ?? []);

        $options = collect($options)
            ->map(fn ($option) => trim((string) $option))
            ->filter()
            ->unique()
            ->values()
            ->all();

        if (count($options) < 2) {
            return ['error' => 'Add at least two answer options'];
        }

        $correctAnswer = array_key_exists('correct_answer', $data)
            ? trim((string) $data['correct_answer'])
            : trim((string) ($question?->correct_answer ?? ''));

        if (!in_array($correctAnswer, $options, true)) {
            return ['error' => 'Correct answer must match one of the options'];
        }

        $payload['options'] = $options;
        $payload['correct_answer'] = $correctAnswer;

        return $payload;
    }

    private function normalizeGeneratedQuestions(array $questions, string $fallbackCategory): array
    {
        return collect($questions)
            ->map(function ($question) use ($fallbackCategory) {
                $payload = [
                    'category' => trim((string) ($question['category'] ?? $fallbackCategory)),
                    'question_text' => trim((string) ($question['question_text'] ?? '')),
                    'options' => $question['options'] ?? [],
                    'correct_answer' => trim((string) ($question['correct_answer'] ?? '')),
                ];

                $validated = $this->validatedQuestionPayload($payload);

                if (isset($validated['error']) || $validated['question_text'] === '') {
                    return null;
                }

                return $validated;
            })
            ->filter()
            ->unique(fn ($question) => mb_strtolower($question['question_text']))
            ->values()
            ->all();
    }

    private function generatedQuestionBank(string $category): array
    {
        $banks = [
            'Communication' => [
                [
                    'question_text' => 'A client is confused about a project update. What is the best first response?',
                    'options' => ['Send a short unclear reply', 'Explain clearly and confirm their understanding', 'Ignore until they ask again', 'Forward without context'],
                    'correct_answer' => 'Explain clearly and confirm their understanding',
                ],
                [
                    'question_text' => 'During a team meeting, two people speak at the same time. What should you do?',
                    'options' => ['Speak louder than both', 'Invite one person to finish, then the other', 'End the meeting', 'Stay silent for the rest of the meeting'],
                    'correct_answer' => 'Invite one person to finish, then the other',
                ],
                [
                    'question_text' => 'You need to share bad news about a delay. What is the most professional approach?',
                    'options' => ['Hide the delay', 'Blame another team', 'Explain the issue, impact, and next steps', 'Send only the new date'],
                    'correct_answer' => 'Explain the issue, impact, and next steps',
                ],
                [
                    'question_text' => 'A teammate misunderstands your message. What should you do?',
                    'options' => ['Repeat the same words', 'Clarify with simpler wording and examples', 'Stop discussing it', 'Assume they will understand later'],
                    'correct_answer' => 'Clarify with simpler wording and examples',
                ],
                [
                    'question_text' => 'What is the best way to communicate progress on assigned work?',
                    'options' => ['Wait until the deadline', 'Give brief, regular updates with blockers', 'Only message when everything is done', 'Send unrelated details'],
                    'correct_answer' => 'Give brief, regular updates with blockers',
                ],
                [
                    'question_text' => 'A recruiter asks about your experience. What answer is strongest?',
                    'options' => ['Give a vague answer', 'Share specific work, impact, and tools used', 'Say everything is in the resume', 'Avoid examples'],
                    'correct_answer' => 'Share specific work, impact, and tools used',
                ],
            ],
            'Teamwork' => [
                [
                    'question_text' => 'A teammate missed a deadline that affects your task. What should you do first?',
                    'options' => ['Complain to others', 'Help identify the blocker and realign the plan', 'Ignore the issue', 'Report without context'],
                    'correct_answer' => 'Help identify the blocker and realign the plan',
                ],
                [
                    'question_text' => 'Your team disagrees on an implementation approach. What is the best response?',
                    'options' => ['Force your idea', 'Compare options against project goals', 'Stop contributing', 'Delay the decision'],
                    'correct_answer' => 'Compare options against project goals',
                ],
                [
                    'question_text' => 'A new team member is struggling to understand the workflow. What should you do?',
                    'options' => ['Let them figure it out alone', 'Share context and guide them through the process', 'Avoid assigning tasks', 'Criticize their speed'],
                    'correct_answer' => 'Share context and guide them through the process',
                ],
                [
                    'question_text' => 'How should you handle shared work ownership?',
                    'options' => ['Only focus on your part', 'Keep the team updated and support handoffs', 'Avoid documentation', 'Make decisions secretly'],
                    'correct_answer' => 'Keep the team updated and support handoffs',
                ],
                [
                    'question_text' => 'A teammate gives feedback on your work. What is the best reaction?',
                    'options' => ['Reject it immediately', 'Listen, ask questions, and improve where useful', 'Stop sharing work', 'Argue personally'],
                    'correct_answer' => 'Listen, ask questions, and improve where useful',
                ],
                [
                    'question_text' => 'The team is overloaded near a deadline. What action helps most?',
                    'options' => ['Wait for someone else', 'Prioritize tasks and offer help where needed', 'Add unrelated tasks', 'Hide blockers'],
                    'correct_answer' => 'Prioritize tasks and offer help where needed',
                ],
            ],
            'Problem solving' => [
                [
                    'question_text' => 'You find a bug but do not know the cause yet. What is the best first step?',
                    'options' => ['Change random code', 'Reproduce the issue and isolate the failing area', 'Ignore it', 'Delete related files'],
                    'correct_answer' => 'Reproduce the issue and isolate the failing area',
                ],
                [
                    'question_text' => 'A solution works but creates a new risk. What should you do?',
                    'options' => ['Ship it without review', 'Document the risk and compare safer options', 'Hide the risk', 'Stop all work'],
                    'correct_answer' => 'Document the risk and compare safer options',
                ],
                [
                    'question_text' => 'You have limited time and multiple issues. How should you decide what to fix first?',
                    'options' => ['Pick randomly', 'Prioritize by impact and urgency', 'Fix the easiest only', 'Wait for all issues to grow'],
                    'correct_answer' => 'Prioritize by impact and urgency',
                ],
                [
                    'question_text' => 'A user reports that a feature is slow. What should you do before changing code?',
                    'options' => ['Guess the problem', 'Measure where time is being spent', 'Remove the feature', 'Ignore the report'],
                    'correct_answer' => 'Measure where time is being spent',
                ],
                [
                    'question_text' => 'Your first solution fails. What is the strongest next step?',
                    'options' => ['Give up', 'Review evidence and test another hypothesis', 'Blame the tools', 'Hide the failure'],
                    'correct_answer' => 'Review evidence and test another hypothesis',
                ],
                [
                    'question_text' => 'A requirement is unclear. What should you do?',
                    'options' => ['Build whatever you want', 'Ask clarifying questions and confirm assumptions', 'Delay without updates', 'Ignore the requirement'],
                    'correct_answer' => 'Ask clarifying questions and confirm assumptions',
                ],
            ],
            'Leadership' => [
                [
                    'question_text' => 'Your team is blocked and waiting for direction. What should a leader do first?',
                    'options' => ['Assign blame', 'Clarify priorities and unblock the next step', 'Cancel the project', 'Avoid responsibility'],
                    'correct_answer' => 'Clarify priorities and unblock the next step',
                ],
                [
                    'question_text' => 'A team member makes a mistake. What is the best leadership response?',
                    'options' => ['Publicly shame them', 'Address the issue respectfully and focus on learning', 'Ignore quality', 'Remove all their work'],
                    'correct_answer' => 'Address the issue respectfully and focus on learning',
                ],
                [
                    'question_text' => 'How should a leader handle conflicting priorities?',
                    'options' => ['Say yes to everything', 'Align stakeholders on tradeoffs and decisions', 'Hide the conflict', 'Choose the loudest request'],
                    'correct_answer' => 'Align stakeholders on tradeoffs and decisions',
                ],
                [
                    'question_text' => 'A teammate is doing excellent work. What should a leader do?',
                    'options' => ['Ignore it', 'Recognize the contribution and encourage growth', 'Take credit', 'Give unrelated criticism'],
                    'correct_answer' => 'Recognize the contribution and encourage growth',
                ],
                [
                    'question_text' => 'A project is slipping behind schedule. What is the best leadership action?',
                    'options' => ['Hide the delay', 'Reassess scope, communicate early, and adjust plan', 'Push people without context', 'Cancel updates'],
                    'correct_answer' => 'Reassess scope, communicate early, and adjust plan',
                ],
                [
                    'question_text' => 'What helps a team trust a leader?',
                    'options' => ['Unclear expectations', 'Consistent decisions and transparent communication', 'Avoiding feedback', 'Changing priorities secretly'],
                    'correct_answer' => 'Consistent decisions and transparent communication',
                ],
            ],
            'Adaptability' => [
                [
                    'question_text' => 'A project requirement changes late. What should you do?',
                    'options' => ['Reject all changes', 'Assess impact and adjust the plan with the team', 'Ignore the update', 'Start over immediately'],
                    'correct_answer' => 'Assess impact and adjust the plan with the team',
                ],
                [
                    'question_text' => 'You are asked to use a tool you have not used before. What is the best response?',
                    'options' => ['Refuse the task', 'Learn the basics and ask targeted questions', 'Pretend you know it', 'Delay without action'],
                    'correct_answer' => 'Learn the basics and ask targeted questions',
                ],
                [
                    'question_text' => 'A planned solution no longer fits the situation. What should you do?',
                    'options' => ['Keep it anyway', 'Reevaluate and choose a better approach', 'Stop communicating', 'Blame the change'],
                    'correct_answer' => 'Reevaluate and choose a better approach',
                ],
                [
                    'question_text' => 'How should you react to constructive feedback after a process change?',
                    'options' => ['Ignore it', 'Use it to improve your approach', 'Take it personally', 'Avoid future feedback'],
                    'correct_answer' => 'Use it to improve your approach',
                ],
                [
                    'question_text' => 'A teammate leaves and responsibilities shift. What is the best action?',
                    'options' => ['Wait for problems', 'Clarify ownership and update priorities', 'Refuse any change', 'Hide missing work'],
                    'correct_answer' => 'Clarify ownership and update priorities',
                ],
                [
                    'question_text' => 'A deadline moves earlier than expected. What should you do?',
                    'options' => ['Panic silently', 'Focus on essential scope and communicate tradeoffs', 'Ignore the deadline', 'Add more features'],
                    'correct_answer' => 'Focus on essential scope and communicate tradeoffs',
                ],
            ],
        ];

        return $banks[$category] ?? $this->genericQuestionBank($category);
    }

    private function genericQuestionBank(string $category): array
    {
        return [
            [
                'question_text' => 'What is the strongest response when a workplace situation requires ' . strtolower($category) . '?',
                'options' => ['React without asking questions', 'Understand the context and choose a professional action', 'Avoid the situation', 'Blame someone else'],
                'correct_answer' => 'Understand the context and choose a professional action',
            ],
            [
                'question_text' => 'How can a candidate show strong ' . strtolower($category) . ' during a team task?',
                'options' => ['Work without updates', 'Communicate progress and support shared goals', 'Ignore feedback', 'Delay decisions'],
                'correct_answer' => 'Communicate progress and support shared goals',
            ],
            [
                'question_text' => 'A task becomes unclear. Which behavior best supports ' . strtolower($category) . '?',
                'options' => ['Guess silently', 'Clarify expectations and confirm next steps', 'Stop working', 'Change scope alone'],
                'correct_answer' => 'Clarify expectations and confirm next steps',
            ],
            [
                'question_text' => 'What is the best way to improve ' . strtolower($category) . ' after feedback?',
                'options' => ['Reject the feedback', 'Reflect, adjust behavior, and track progress', 'Avoid the reviewer', 'Repeat the same mistake'],
                'correct_answer' => 'Reflect, adjust behavior, and track progress',
            ],
            [
                'question_text' => 'Which action shows professional judgment in ' . strtolower($category) . '?',
                'options' => ['Hide problems', 'Share risks early and propose options', 'Wait until failure', 'Focus only on blame'],
                'correct_answer' => 'Share risks early and propose options',
            ],
        ];
    }

    /**
     * Job seeker submits quiz answers for an application
     */
    public function submitAnswers(Request $request, $applicationId)
    {
        $user = $request->user();
        $application = Application::with('jobPosting.company.user', 'jobSeeker.user')->findOrFail($applicationId);

        if ($user->role !== 'jobseeker' || $application->job_seeker_id !== $user->jobSeeker->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($application->quizResponses()->exists()) {
            return response()->json(['message' => 'Quiz already submitted for this application'], 409);
        }

        $validator = Validator::make($request->all(), [
            'answers'                      => 'required|array|min:1',
            'answers.*.question_id'        => 'required|exists:quiz_questions,id',
            'answers.*.selected_answer'    => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $answers = collect($request->answers);
        $questionIds = $answers->pluck('question_id');

        if ($questionIds->unique()->count() !== $questionIds->count()) {
            return response()->json(['message' => 'Each quiz question can only be answered once'], 422);
        }

        $questions = QuizQuestion::whereIn('id', $questionIds->all())->get()->keyBy('id');
        $companyId = $application->jobPosting->company_id;

        if ($questions->contains(fn ($question) => $question->company_id !== $companyId)) {
            return response()->json(['message' => 'Invalid quiz question for this application'], 422);
        }

        $totalCorrect = 0;
        $totalQuestions = $answers->count();

        $softSkillScore = $totalQuestions > 0
            ? DB::transaction(function () use ($answers, $application, $questions, $totalQuestions, &$totalCorrect) {
                foreach ($answers as $answer) {
                    $question = $questions->get($answer['question_id']);
                    $isCorrect = trim((string) $question->correct_answer) === trim((string) $answer['selected_answer']);

                    if ($isCorrect) {
                        $totalCorrect++;
                    }

                    QuizResponse::create([
                        'application_id'  => $application->id,
                        'question_id'     => $answer['question_id'],
                        'selected_answer' => $answer['selected_answer'],
                        'is_correct'      => $isCorrect,
                    ]);
                }

                return round(($totalCorrect / $totalQuestions) * 100, 2);
            })
            : 0;

        // Recalculate final score: 50% similarity + 30% skill gap + 20% soft skill
        $similarityScore = $application->similarity_score ?? 0;
        $skillGapScore   = $application->skill_gap_score ?? 0;

        $finalScore = round(
            ($similarityScore * 0.50) + ($skillGapScore * 0.30) + ($softSkillScore * 0.20),
            2
        );

        // Update application
        $application->soft_skill_score = $softSkillScore;
        $application->final_score      = $finalScore;
        $application->save();

        $companyUserId = $application->jobPosting?->company?->user_id;

        if (
            $companyUserId
            && $companyUserId !== $user->id
            && \App\Models\User::find($companyUserId)?->notificationEnabledFor('candidate_quiz_submitted')
        ) {
            AppNotification::create([
                'user_id' => $companyUserId,
                'actor_id' => $user->id,
                'type' => 'candidate_quiz_submitted',
                'title' => 'Quiz submitted',
                'message' => $user->name . ' submitted the quiz for ' . $application->jobPosting->title . '.',
                'data' => [
                    'link' => '/company/applicants?application=' . $application->id,
                    'application_id' => $application->id,
                    'job_id' => $application->job_id,
                    'soft_skill_score' => $softSkillScore,
                    'final_score' => $finalScore,
                ],
            ]);
            UserCache::forgetUnreadNotifications($companyUserId);
        }

        return response()->json([
            'message'         => 'Quiz submitted successfully',
            'soft_skill_score'=> $softSkillScore,
            'similarity_score'=> $similarityScore,
            'skill_gap_score' => $skillGapScore,
            'final_score'     => $finalScore,
            'correct_answers' => $totalCorrect,
            'total_questions' => $totalQuestions,
            'quiz_submitted'  => true,
        ]);
    }
}
