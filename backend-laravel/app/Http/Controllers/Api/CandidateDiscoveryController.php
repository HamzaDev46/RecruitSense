<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\JobSeeker;
use App\Models\User;
use App\Models\UserBlock;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CandidateDiscoveryController extends Controller
{
    /**
     * Browse and search all registered job seekers for companies
     */
    public function index(Request $request)
    {
        $companyUser = $request->user();

        if ($companyUser->role !== 'company') {
            return response()->json(['message' => 'Only companies can search candidate directory.'], 403);
        }

        $blockedIds = UserBlock::blockedUserIdsFor($companyUser->id);

        $search = Str::squish((string) $request->query('search', ''));
        $skillFilter = Str::squish((string) $request->query('skill', ''));
        $locationFilter = Str::squish((string) $request->query('location', ''));
        $perPage = max(6, min((int) $request->query('per_page', 12), 48));

        $query = User::query()
            ->where('role', 'jobseeker')
            ->where('account_status', 'active')
            ->whereNotNull('email_verified_at')
            ->whereHas('jobSeeker')
            ->with(['jobSeeker.experiences', 'jobSeeker.resume'])
            ->when(!empty($blockedIds), fn ($q) => $q->whereNotIn('id', $blockedIds));

        // Keyword Search
        if ($search !== '') {
            $like = '%' . $search . '%';
            $query->where(function ($q) use ($like) {
                $q->where('name', 'like', $like)
                    ->orWhere('email', 'like', $like)
                    ->orWhereHas('jobSeeker', function ($sq) use ($like) {
                        $sq->where('headline', 'like', $like)
                            ->orWhere('location', 'like', $like)
                            ->orWhere('about', 'like', $like)
                            ->orWhere('company', 'like', $like)
                            ->orWhere('education', 'like', $like)
                            ->orWhere('skills', 'like', $like);
                    });
            });
        }

        // Skill Filter
        if ($skillFilter !== '' && $skillFilter !== 'all') {
            $skillLike = '%' . $skillFilter . '%';
            $query->whereHas('jobSeeker', function ($q) use ($skillLike) {
                $q->where('skills', 'like', $skillLike);
            });
        }

        // Location Filter
        if ($locationFilter !== '' && $locationFilter !== 'all') {
            $locLike = '%' . $locationFilter . '%';
            $query->whereHas('jobSeeker', function ($q) use ($locLike) {
                $q->where('location', 'like', $locLike);
            });
        }

        $paginator = $query->latest('id')->paginate($perPage);

        // Fetch existing conversations for this company
        $candidateUserIds = $paginator->pluck('id')->all();
        $existingConversations = Conversation::where(function ($q) use ($companyUser) {
            $q->where('user_one_id', $companyUser->id)
                ->orWhere('user_two_id', $companyUser->id);
        })
            ->where(function ($q) use ($candidateUserIds) {
                $q->whereIn('user_one_id', $candidateUserIds)
                    ->orWhereIn('user_two_id', $candidateUserIds);
            })
            ->get()
            ->mapWithKeys(function ($conv) use ($companyUser) {
                $otherId = ($conv->user_one_id === $companyUser->id) ? $conv->user_two_id : $conv->user_one_id;
                return [$otherId => $conv->id];
            });

        $storageUrl = $request->getSchemeAndHttpHost() . '/storage/';

        $candidates = $paginator->getCollection()->map(function ($user) use ($storageUrl, $existingConversations) {
            $profile = $user->jobSeeker;
            $rawSkills = $profile?->skills;
            $skillsArray = is_array($rawSkills)
                ? $rawSkills
                : (is_string($rawSkills) ? array_map('trim', explode(',', $rawSkills)) : []);
            $skillsArray = array_values(array_filter($skillsArray));

            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'headline' => $profile?->headline ?: 'Talented Professional',
                'location' => $profile?->location ?: 'Not specified',
                'about' => $profile?->about,
                'company' => $profile?->company,
                'education' => $profile?->education,
                'skills' => $skillsArray,
                'profile_image_url' => $profile?->profile_image ? $storageUrl . $profile->profile_image : null,
                'experiences_count' => $profile?->experiences ? $profile->experiences->count() : 0,
                'has_resume' => (bool) $profile?->resume,
                'conversation_id' => $existingConversations[$user->id] ?? null,
                'has_conversation' => isset($existingConversations[$user->id]),
                'member_since' => $user->created_at?->format('M Y'),
            ];
        });

        // Collect popular skills for filter chips
        $popularSkills = [
            'React',
            'Node.js',
            'Python',
            'JavaScript',
            'PHP',
            'Laravel',
            'TypeScript',
            'Vue.js',
            'Tailwind CSS',
            'SQL',
            'Machine Learning',
            'UI/UX Design',
            'DevOps',
            'AWS',
            'Docker',
        ];

        return response()->json([
            'data' => $candidates,
            'meta' => [
                'total' => $paginator->total(),
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
            ],
            'popular_skills' => $popularSkills,
        ]);
    }
}
