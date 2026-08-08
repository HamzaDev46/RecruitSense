<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JobPosting extends Model
{
    use HasFactory;

    public const STATUS_DRAFT = 'draft';
    public const STATUS_ACTIVE = 'active';
    public const STATUS_CLOSED = 'closed';
    public const STATUSES = [
        self::STATUS_DRAFT,
        self::STATUS_ACTIVE,
        self::STATUS_CLOSED,
    ];

    public const JOB_TYPES = [
        'full_time',
        'part_time',
        'contract',
        'internship',
        'temporary',
    ];

    public const WORK_MODES = [
        'onsite',
        'remote',
        'hybrid',
    ];

    public const EXPERIENCE_LEVELS = [
        'entry',
        'junior',
        'mid',
        'senior',
        'lead',
    ];

    protected $fillable = [
        'company_id',
        'title',
        'description',
        'required_skills',
        'job_type',
        'work_mode',
        'experience_level',
        'location',
        'salary_min',
        'salary_max',
        'salary_currency',
        'application_deadline',
        'status',
    ];

    protected $casts = [
        'salary_min' => 'integer',
        'salary_max' => 'integer',
        'application_deadline' => 'date:Y-m-d',
    ];

    protected $appends = [
        'is_expired',
        'is_accepting_applications',
    ];

    public function scopeAcceptingApplications($query)
    {
        return $query
            ->where('status', self::STATUS_ACTIVE)
            ->where(function ($deadlineQuery) {
                $deadlineQuery
                    ->whereNull('application_deadline')
                    ->orWhereDate('application_deadline', '>=', now()->toDateString());
            });
    }

    public function getIsExpiredAttribute(): bool
    {
        return $this->application_deadline !== null
            && $this->application_deadline->lt(now()->startOfDay());
    }

    public function getIsAcceptingApplicationsAttribute(): bool
    {
        return $this->status === self::STATUS_ACTIVE && !$this->is_expired;
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function applications(): HasMany
    {
        return $this->hasMany(Application::class, 'job_id');
    }

    public function savedJobs(): HasMany
    {
        return $this->hasMany(SavedJob::class, 'job_id');
    }
}
