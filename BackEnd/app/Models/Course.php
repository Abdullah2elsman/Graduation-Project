<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'instructor_id', 
        'admin_id', 
        'description', 
        'file_path', 
        'image_path',
        'file_type'
    ];

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

    public function examAttempts()
    {
        return $this->hasManyThrough(ExamAttempt::class, Exam::class);
    }
}
