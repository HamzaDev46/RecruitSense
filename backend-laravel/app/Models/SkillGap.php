<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SkillGap extends Model
{
    use HasFactory;

    protected $fillable = [
        'application_id',
        'missing_skill',
        'recommendation',
        'course_title',
        'course_platform',
        'course_url',
    ];

    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }
}