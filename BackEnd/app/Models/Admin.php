<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
class Admin extends Model
{
    use HasApiTokens, Notifiable;
    protected $fillable = [
        'name',
        'email',
        'password'
    ];

    public function enrollments(){
        return $this->hasMany(Enrollment::class);
    }
}
