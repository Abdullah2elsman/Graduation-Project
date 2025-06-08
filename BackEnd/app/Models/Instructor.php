<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Laravel\Sanctum\PersonalAccessToken;

class Instructor extends Authenticatable{
    use HasApiTokens, Notifiable;
    protected $fillable = [
        'name',
        'email',
        'password'
    ];

    protected $hidden = ['password', 'remember_token'];


    public function token()
    {
        return $this->morphMany(PersonalAccessToken::class, 'tokenable');
    }

    public function courses()
    {
        return $this->hasMany(Course::class);
    }
    
}
