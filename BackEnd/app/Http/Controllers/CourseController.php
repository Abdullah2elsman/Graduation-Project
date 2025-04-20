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
    
    public function getCourseExamAttempts($instructorId)
    {
        $courses = Course::with(['exams.attempts'])
            ->where('instructor_id', $instructorId)
            ->get();

        $data = $courses->map(function ($course) {
            return [
                'course_id' => $course->id,
                'course_name' => $course->title, // Change to 'title' or whatever your DB uses
                'exams' => $course->exams->map(function ($exam) {
                    return [
                        'exam_id' => $exam->id,
                        'exam_name' => $exam->exam,
                        'attempts_count' => $exam->attempts->count(),
                    ];
                }),
            ];
        });

        return response()->json($data);
    }

    public function getCourseEnrollments()
    {
        $courses = Course::withCount(['enrollments' => function ($query) {
            $query->where('cancelled', false); // only active enrollments
        }])->get();

        $data = $courses->map(function ($course) {
            return [
                'course_id' => $course->id,
                'course_name' => $course->title, // or title
                'students_enrolled' => $course->enrollments_count,
            ];
        });

        return response()->json($data);
    }
}
