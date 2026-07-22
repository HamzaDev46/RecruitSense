<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;

class UserCache
{
    public const PROFILE_TTL = 60;
    public const NETWORK_SUMMARY_TTL = 60;
    public const UNREAD_COUNT_TTL = 15;

    public static function profile(int $userId): string
    {
        return "user:{$userId}:profile";
    }

    public static function networkSummary(int $userId): string
    {
        return "user:{$userId}:network-summary";
    }

    public static function unreadNotifications(int $userId): string
    {
        return "user:{$userId}:unread-notifications";
    }

    public static function unreadMessages(int $userId): string
    {
        return "user:{$userId}:unread-messages";
    }

    public static function forgetProfile(int $userId): void
    {
        Cache::forget(self::profile($userId));
    }

    public static function forgetNetworkSummary(int $userId): void
    {
        Cache::forget(self::networkSummary($userId));
    }

    public static function forgetUnreadNotifications(int $userId): void
    {
        Cache::forget(self::unreadNotifications($userId));
    }

    public static function forgetUnreadMessages(int $userId): void
    {
        Cache::forget(self::unreadMessages($userId));
    }

    public static function forgetNetworkForUsers(array $userIds): void
    {
        foreach (array_filter(array_unique($userIds)) as $userId) {
            self::forgetNetworkSummary((int) $userId);
        }
    }

    public static function forgetAllForUser(int $userId): void
    {
        self::forgetProfile($userId);
        self::forgetNetworkSummary($userId);
        self::forgetUnreadNotifications($userId);
        self::forgetUnreadMessages($userId);
    }
}
