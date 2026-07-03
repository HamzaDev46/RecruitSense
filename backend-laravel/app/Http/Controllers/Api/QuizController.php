<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\QuizQuestion;
use App\Models\QuizResponse;
use App\Models\Application;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class QuizController extends Controller
{
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
            'category' => 'required|string|max:255',
            'question_text' => 'required|string',
            'options' => 'required|array|min:2',
            'correct_answer' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $question = QuizQuestion::create([
            'company_id' => $user->company->id,
            'category' => $request->category,
            'question_text' => $request->question_text,
            'options' => $request->options,
            'correct_answer' => $request->correct_answer,
        ]);

        return response()->json([
            'message' => 'Quiz question added successfully',
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

        $questions = QuizQuestion::where('company_id', $user->company->id)->latest()->get();

        return response()->json($questions);
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
            'category' => 'sometimes|string|max:255',
            'question_text' => 'sometimes|string',
            'options' => 'sometimes|array|min:2',
            'correct_answer' => 'sometimes|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $question->update($request->only(['category', 'question_text', 'options', 'correct_answer']));

        return response()->json([
            'message' => 'Quiz question updated successfully',
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
     * Job seeker fetches quiz questions for a specific company (after applying)
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
                    'id' => $q->id,
                    'category' => $q->category,
                    'question_text' => $q->question_text,
                    'options' => $q->options,
                    // correct_answer hide kiya — job seeker ko nahi dikhana
                ];
            });

        return response()->json($questions);
    }

    /**
     * Job seeker submits quiz answers for an application
     */
    public function submitAnswers(Request $request, $applicationId)
    {
        $user = $request->user();
        $application = Application::findOrFail($applicationId);

        if ($user->role !== 'jobseeker' || $application->job_seeker_id !== $user->jobSeeker->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'answers' => 'required|array',
            'answers.*.question_id' => 'required|exists:quiz_questions,id',
            'answers.*.selected_answer' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $totalCorrect = 0;
        $totalQuestions = count($request->answers);

        foreach ($request->answers as $answer) {
            $question = QuizQuestion::find($answer['question_id']);
            $isCorrect = $question->correct_answer === $answer['selected_answer'];

            if ($isCorrect) {
                $totalCorrect++;
            }

            QuizResponse::create([
                'application_id' => $application->id,
                'question_id' => $answer['question_id'],
                'selected_answer' => $answer['selected_answer'],
                'is_correct' => $isCorrect,
            ]);
        }

        // Calculate soft skill score as percentage
        $softSkillScore = $totalQuestions > 0 ? round(($totalCorrect / $totalQuestions) * 100, 2) : 0;

        $application->soft_skill_score = $softSkillScore;
        $application->save();

        return response()->json([
            'message' => 'Quiz submitted successfully',
            'score' => $softSkillScore,
            'correct_answers' => $totalCorrect,
            'total_questions' => $totalQuestions,
        ]);
    }
}