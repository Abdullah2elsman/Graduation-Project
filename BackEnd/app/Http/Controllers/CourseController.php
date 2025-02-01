<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Course;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    function getAllCourses()
    {
        $courses = Course::all();
        if ($courses->isEmpty()) {
            return response()->json(['message' => 'No courses found'], 404);
        }
        return response()->json($courses, 200);
    }
}
