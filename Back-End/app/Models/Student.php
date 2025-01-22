<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

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

  // Define relationships
  public function enrollments()
  {
    return $this->hasMany(Enrollment::class);
  }

  public function courses()
  {
    return $this->hasManyThrough(Course::class, Enrollment::class);
  }
}
