<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Laravel\Sanctum\HasApiTokens;
class Admin extends Model
{
    use HasApiTokens;
    protected $fillable = [
        'name',
        'email',
        'password'
    ];

    public function enrollments(){
        return $this->hasMany(Enrollment::class);
    }
}
