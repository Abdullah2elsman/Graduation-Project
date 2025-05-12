<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Laravel\Sanctum\PersonalAccessToken;

class Admin extends Model
{
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
    
    public function enrollments(){
        return $this->hasMany(Enrollment::class);
    }
}
