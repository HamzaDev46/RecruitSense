<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PostImpression extends Model
{
    use HasFactory;

    protected $fillable = [
        'post_id',
        'viewer_user_id',
        'viewed_on',
    ];

    protected $casts = [
        'viewed_on' => 'date:Y-m-d',
    ];

    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }

    public function viewerUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'viewer_user_id');
    }
}
