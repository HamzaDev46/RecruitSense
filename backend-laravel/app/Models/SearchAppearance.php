<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SearchAppearance extends Model
{
    use HasFactory;

    protected $fillable = [
        'profile_user_id',
        'searcher_user_id',
        'query',
        'query_hash',
        'appeared_on',
    ];

    protected $casts = [
        'appeared_on' => 'date',
    ];

    public function profileUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'profile_user_id');
    }

    public function searcherUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'searcher_user_id');
    }
}
