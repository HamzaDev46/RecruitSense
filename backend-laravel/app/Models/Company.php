<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Company extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'industry',
        'description',
        'logo_path',
        'cover_image',
        'website',
        'location',
        'phone',
        'contact_email',
        'company_size',
        'founded_year',
        'verification_status',
        'admin_note',
        'dark_mode',
        'notify_messages',
        'notify_candidate_activity',
        'notify_quiz_results',
        'notify_post_activity',
    ];

    protected $casts = [
        'dark_mode' => 'boolean',
        'notify_messages' => 'boolean',
        'notify_candidate_activity' => 'boolean',
        'notify_quiz_results' => 'boolean',
        'notify_post_activity' => 'boolean',
    ];

    protected $appends = ['logo_url', 'cover_image_url'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function jobPostings(): HasMany
    {
        return $this->hasMany(JobPosting::class);
    }

    public function getLogoUrlAttribute(): ?string
    {
        return $this->logo_path ? url(Storage::url($this->logo_path)) : null;
    }

    public function getCoverImageUrlAttribute(): ?string
    {
        return $this->cover_image ? url(Storage::url($this->cover_image)) : null;
    }
}
