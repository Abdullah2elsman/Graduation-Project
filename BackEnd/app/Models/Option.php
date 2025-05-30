<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Option extends Model
{
    protected $fillable = ['question_id', 'option', 'is_correct'];

    protected $casts = [
        'is_correct' => 'boolean',
    ];
    public function question()
    {
        return $this->belongsTo(Question::class);
    }
}
