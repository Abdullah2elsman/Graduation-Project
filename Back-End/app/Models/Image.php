<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
  protected $fillable = [
    'file_name',
    'file_path'
  ];
}
