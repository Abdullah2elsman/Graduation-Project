<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Laravel\Sanctum\PersonalAccessToken;

class Student extends Model
{
  use HasApiTokens, Notifiable;
  protected $fillable = [
    'name',
    'age',
    'email',
    'password',
    'image'
  ];

  protected $hidden = ['password', 'remember_token'];


  public function token()
  {
    return $this->morphMany(PersonalAccessToken::class, 'tokenable');
  }

  // Define relationships
  public function enrollments()
  {
    return $this->hasMany(Enrollment::class);
  }

  public function courses()
  {
    return $this->hasManyThrough(Course::class, Enrollment::class);
  }

  public function examAttempts()
  {
    return $this->hasMany(ExamAttempt::class);
  }
}
