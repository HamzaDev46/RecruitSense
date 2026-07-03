<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SkillGap extends Model
{
    use HasFactory;

    protected $fillable = ['application_id', 'missing_skill', 'recommendation'];

    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }
}