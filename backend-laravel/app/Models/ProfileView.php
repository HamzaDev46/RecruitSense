<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProfileView extends Model
{
    use HasFactory;

    protected $fillable = [
        'profile_user_id',
        'viewer_user_id',
        'viewer_ip',
        'viewed_on',
    ];

    protected $casts = [
        'viewed_on' => 'date:Y-m-d',
    ];

    public function profileUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'profile_user_id');
    }

    public function viewerUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'viewer_user_id');
    }
}
