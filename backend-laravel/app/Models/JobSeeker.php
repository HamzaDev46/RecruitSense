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
