<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'email_verified_at', 'google_id', 'avatar_url', 'password', 'role'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function company(): HasOne
    {
        return $this->hasOne(Company::class);
    }

    public function jobSeeker(): HasOne
    {
        return $this->hasOne(JobSeeker::class);
    }

    public function sentConnections(): HasMany
    {
        return $this->hasMany(Connection::class, 'requester_id');
    }

    public function receivedConnections(): HasMany
    {
        return $this->hasMany(Connection::class, 'receiver_id');
    }

    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }

    public function postLikes(): HasMany
    {
        return $this->hasMany(PostLike::class);
    }

    public function postComments(): HasMany
    {
        return $this->hasMany(PostComment::class);
    }

    public function blockedUsers(): HasMany
    {
        return $this->hasMany(UserBlock::class, 'blocker_id');
    }

    public function blockedByUsers(): HasMany
    {
        return $this->hasMany(UserBlock::class, 'blocked_id');
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(AppNotification::class);
    }

    public function actedNotifications(): HasMany
    {
        return $this->hasMany(AppNotification::class, 'actor_id');
    }

    public function jobAlerts(): HasMany
    {
        return $this->hasMany(JobAlert::class);
    }

    public function sentMessages(): HasMany
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    public function notificationEnabledFor(string $type): bool
    {
        if ($this->role === 'company') {
            $this->loadMissing('company');

            if (!$this->company) {
                return true;
            }

            return match (true) {
                $type === 'message_received' => (bool) ($this->company->notify_messages ?? true),
                in_array($type, ['candidate_applied', 'candidate_application_withdrawn'], true) => (bool) ($this->company->notify_candidate_activity ?? true),
                $type === 'candidate_quiz_submitted' => (bool) ($this->company->notify_quiz_results ?? true),
                in_array($type, ['post_like', 'post_comment', 'post_repost'], true) => (bool) ($this->company->notify_post_activity ?? true),
                default => true,
            };
        }

        if ($this->role !== 'jobseeker') {
            return true;
        }

        $this->loadMissing('jobSeeker');

        if (!$this->jobSeeker) {
            return true;
        }

        return match (true) {
            str_starts_with($type, 'application_') => (bool) $this->jobSeeker->notify_application_updates,
            $type === 'message_received' => (bool) $this->jobSeeker->notify_messages,
            in_array($type, ['connection_request', 'connection_accepted'], true) => (bool) $this->jobSeeker->notify_connections,
            $type === 'job_alert_match' => (bool) $this->jobSeeker->notify_job_alerts,
            in_array($type, ['post_like', 'post_comment', 'post_repost'], true) => (bool) $this->jobSeeker->notify_post_activity,
            $type === 'profile_view' => (bool) $this->jobSeeker->show_profile_view_notifications,
            default => true,
        };
    }
}
