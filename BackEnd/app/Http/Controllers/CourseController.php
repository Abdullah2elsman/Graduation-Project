<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Course;
use Illuminate\Http\JsonResponse;

class CourseController extends Controller
{
    /**
     * Create a new course.
     */
    public function createCourse(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|unique:courses,name',
            'description' => 'required|string',
        ]);

        $course = Course::create([
            'name' => $request->name,
            'description' => $request->description,
        ]);

        return response()->json(['message' => 'Course created successfully', 'course' => $course], 201);
    }

    /**
     * Read course details by name.
     */
    public function readCourse(Request $request): JsonResponse
    {
        $name = $request->query('name');

        $course = Course::where('name', $name)->first();

        if (!$course) {
            return response()->json(['error' => 'Course not found'], 404);
        }

        return response()->json($course);
    }

    /**
     * Update an existing course.
     */
    public function updateCourse(Request $request): JsonResponse
    {
        $request->validate([
            'id' => 'required|exists:courses,id',
            'name' => 'sometimes|string|unique:courses,name,' . $request->id,
            'description' => 'sometimes|string',
        ]);

        $course = Course::findOrFail($request->id);
        $course->update($request->only(['name', 'description']));

        return response()->json(['message' => 'Course updated successfully', 'course' => $course]);
    }

    /**
     * Delete a course by ID.
     */
    public function deleteCourse($id): JsonResponse
    {
        $course = Course::find($id);

        if (!$course) {
            return response()->json(['error' => 'Course not found'], 404);
        }

        $course->delete();

        return response()->json(['message' => 'Course deleted successfully']);
    }

    /**
     * Get all courses.
     */
    public function getAllCourses(): JsonResponse
    {
        $courses = Course::all();
        return response()->json($courses);
    }

    /**
     * Get course details by ID.
     */
    public function getCourse($id): JsonResponse
    {
        $course = Course::find($id);

        if (!$course) {
            return response()->json(['error' => 'Course not found'], 404);
        }

        return response()->json($course);
    }
}
