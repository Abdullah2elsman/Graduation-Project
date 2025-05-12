<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Exam extends Model
{
    use HasFactory;

    protected $fillable = [
        'course_id',
        'name',
        'instructions',
        'date',
        'time',
        'total_score',
        'duration',
        'creation_method'
    ];

    public function course()
    {
        return $this->belongsTo(Course::class, 'course_id', 'id');
    }

    public function attempts()
    {
        return $this->hasMany(ExamAttempt::class);
    }

    public function questions()
    {
        return $this->hasMany(Question::class);
    }

}
