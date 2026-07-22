<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class JobSeeker extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'headline',
        'location',
        'phone',
        'website',
        'company',
        'education',
        'experience',
        'about',
        'skills',
        'profile_image',
        'cover_image',
        'cover_position',
        'profile_visibility',
        'show_profile_view_notifications',
        'allow_search_appearance_tracking',
        'dark_mode',
        'notify_connections',
        'notify_messages',
        'notify_application_updates',
        'notify_job_alerts',
        'notify_post_activity',
    ];

    protected $casts = [
        'show_profile_view_notifications' => 'boolean',
        'allow_search_appearance_tracking' => 'boolean',
        'dark_mode' => 'boolean',
        'notify_connections' => 'boolean',
        'notify_messages' => 'boolean',
        'notify_application_updates' => 'boolean',
        'notify_job_alerts' => 'boolean',
        'notify_post_activity' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function resume(): HasOne
    {
        return $this->hasOne(Resume::class);
    }

    public function applications(): HasMany
    {
        return $this->hasMany(Application::class);
    }

    public function experiences(): HasMany
    {
        return $this->hasMany(JobExperience::class)->latest('start_date');
    }

    public function savedJobs(): HasMany
    {
        return $this->hasMany(SavedJob::class);
    }
}
