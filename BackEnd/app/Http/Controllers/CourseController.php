<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Course;
use Illuminate\Http\JsonResponse;

class CourseController extends Controller
{
    
    public function storeBook(Request $request){
        
        // return $request;
        $request->validate([
            'title' => 'required|string',
            'file' => 'required|file|mimes:pdf,epub,doc,docx,txt|max:102400',
        ]);
        $file = $request->file('file');
        $originalName = $file->getClientOriginalName();
        $timestamp = now()->format('Y_m_d_His');
        $filename = $timestamp . '_' . $originalName;
        
        $file->storeAs('books', $filename, 'public');

        $book = Course::create([
            'title' => $request->title,
            'instructor_id' => $request->instructor_id,
            'admin_id' => $request->admin_id,
            'description' => $request->description,
            'file_path' => 'books/' . $filename,
            'file_type' => $file->getClientOriginalExtension(),
        ]);
        

        return response()->json($book);
    }

    public function show($id){
        $book = Course::findOrFail($id);

        $fileUrl = asset('storage/', $book->file_path);
        

        return response()->json([
            'id' => $book->id,
            'title' => $book->title,
            'description' => $book->description,
            'file_type' => $book->file_type,
            'file_url' => $fileUrl,
        ]);
    }

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
