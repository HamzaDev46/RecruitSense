<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Application extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'pending';
    public const STATUS_SCREENING = 'screening';
    public const STATUS_SHORTLISTED = 'shortlisted';
    public const STATUS_INTERVIEW = 'interview';
    public const STATUS_OFFERED = 'offered';
    public const STATUS_HIRED = 'hired';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_WITHDRAWN = 'withdrawn';

    public const STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_SCREENING,
        self::STATUS_SHORTLISTED,
        self::STATUS_INTERVIEW,
        self::STATUS_OFFERED,
        self::STATUS_HIRED,
        self::STATUS_REJECTED,
        self::STATUS_WITHDRAWN,
    ];

    public const COMPANY_PIPELINE_STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_SCREENING,
        self::STATUS_SHORTLISTED,
        self::STATUS_INTERVIEW,
        self::STATUS_OFFERED,
        self::STATUS_HIRED,
        self::STATUS_REJECTED,
    ];

    public const ACTIVE_STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_SCREENING,
        self::STATUS_SHORTLISTED,
        self::STATUS_INTERVIEW,
        self::STATUS_OFFERED,
        self::STATUS_HIRED,
        self::STATUS_REJECTED,
    ];

    public const INTERVIEW_STATUSES = [
        'scheduled',
        'rescheduled',
        'completed',
        'cancelled',
        'no_show',
    ];

    protected $fillable = [
        'job_seeker_id', 'job_id', 'similarity_score',
        'skill_gap_score', 'soft_skill_score', 'final_score', 'status',
        'cover_letter', 'withdraw_reason', 'withdrawn_at',
        'interview_scheduled_at', 'interview_mode', 'interview_location',
        'interview_notes', 'interview_status', 'company_notes',
        'company_rating', 'interview_feedback', 'interview_rating',
        'interview_completed_at', 'offer_title', 'offer_compensation',
        'offer_start_date', 'offer_notes', 'offer_sent_at', 'hired_at',
    ];

    protected $casts = [
        'withdrawn_at' => 'datetime',
        'interview_scheduled_at' => 'datetime',
        'interview_completed_at' => 'datetime',
        'offer_start_date' => 'date',
        'offer_sent_at' => 'datetime',
        'hired_at' => 'datetime',
        'company_rating' => 'integer',
        'interview_rating' => 'integer',
    ];

    public function jobSeeker(): BelongsTo
    {
        return $this->belongsTo(JobSeeker::class);
    }

    public function jobPosting(): BelongsTo
    {
        return $this->belongsTo(JobPosting::class, 'job_id');
    }

    public function quizResponses(): HasMany
    {
        return $this->hasMany(QuizResponse::class);
    }

    public function skillGaps(): HasMany
    {
        return $this->hasMany(SkillGap::class);
    }
}
