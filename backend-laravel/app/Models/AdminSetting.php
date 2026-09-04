<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdminSetting extends Model
{
    protected $fillable = ['key', 'value'];

    public static function defaults(): array
    {
        return [
            'site_name' => 'RecruitSense',
            'site_email' => 'admin@recruitsense.com',
            'allow_registrations' => true,
            'email_notifications' => true,
            'maintenance_mode' => false,
            'auto_verify_companies' => true,
        ];
    }

    public static function allValues(): array
    {
        $stored = static::query()
            ->pluck('value', 'key')
            ->map(fn ($value) => json_decode((string) $value, true))
            ->all();

        return array_replace(static::defaults(), $stored);
    }

    public static function getValue(string $key, mixed $default = null): mixed
    {
        $setting = static::where('key', $key)->first();

        if (!$setting) {
            return $default;
        }

        return json_decode((string) $setting->value, true);
    }

    public static function setValue(string $key, mixed $value): void
    {
        static::updateOrCreate(
            ['key' => $key],
            ['value' => json_encode($value)]
        );
    }
}
