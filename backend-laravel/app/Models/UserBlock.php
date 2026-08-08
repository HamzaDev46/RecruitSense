<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserBlock extends Model
{
    use HasFactory;

    protected $fillable = [
        'blocker_id',
        'blocked_id',
    ];

    public function blocker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'blocker_id');
    }

    public function blocked(): BelongsTo
    {
        return $this->belongsTo(User::class, 'blocked_id');
    }

    public static function existsBetween(int $firstUserId, int $secondUserId): bool
    {
        return self::where(function ($query) use ($firstUserId, $secondUserId) {
            $query->where('blocker_id', $firstUserId)
                ->where('blocked_id', $secondUserId);
        })->orWhere(function ($query) use ($firstUserId, $secondUserId) {
            $query->where('blocker_id', $secondUserId)
                ->where('blocked_id', $firstUserId);
        })->exists();
    }

    public static function blockedUserIdsFor(int $userId): array
    {
        return self::where('blocker_id', $userId)
            ->pluck('blocked_id')
            ->merge(self::where('blocked_id', $userId)->pluck('blocker_id'))
            ->unique()
            ->values()
            ->all();
    }

    public static function isBlockedBy(int $blockerId, int $blockedId): bool
    {
        return self::where('blocker_id', $blockerId)
            ->where('blocked_id', $blockedId)
            ->exists();
    }
}
