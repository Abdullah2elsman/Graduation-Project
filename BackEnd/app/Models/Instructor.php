<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Laravel\Sanctum\HasApiTokens;

class Instructor extends Model
{
    use HasApiTokens;
    protected $fillable = [
        'name',
        'email',
        'password'
    ];

    
}
