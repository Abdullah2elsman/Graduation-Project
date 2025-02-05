<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'description', 'instructor_id'];

    public function enrollments()
    {
        return $this->hasMany(Enrollment::class);
    }

    public function students()
    {
        return $this->hasManyThrough(Student::class, Enrollment::class);
    }

    public function instructor()
    {
        return $this->belongsTo(Instructor::class);
    }

    public function exams()
    {
        return $this->hasMany(Exam::class, 'course_id', 'id');
    }
}
