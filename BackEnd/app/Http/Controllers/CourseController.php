<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Course;
use Illuminate\Support\Str;
use Illuminate\Http\JsonResponse;
use setasign\Fpdi\Fpdi;
use Smalot\PdfParser\Parser;


class CourseController extends Controller
{
    
    public function storeBook(Request $request){
        
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

        $fileUrl = asset('storage/'. $book->file_path);

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

    public function getBook($id) {
    
        $book = Course::find($id);
        
        if (!$book) {
            return response()->json(['error' => 'Book not found'], 404);
        }

        $path = storage_path('app/public/' . $book->file_path);

        if (!file_exists($path)) {
            return response()->json(['error' => 'PDF file not found'], 404);
        }

        return response()->file($path);
    }
    
    public function getBookPage(Request $request, $id)
    {
        
        $pageNumber = $request->query('pageNumber'); 
        
        $book = Course::find($id);
        
        if (!$book) {
            return response()->json(['error' => 'Book not found'], 404);
        }

        $path = storage_path('app/public/' . $book->file_path);
        
        if (!file_exists($path)) {
            return response()->json(['error' => 'PDF file not found'], 404);
        }

        // preparing a new pdf file
        $pdf = new Fpdi();

        // Download the  original file
        $pageCount = $pdf->setSourceFile($path);

        if ($pageNumber < 1 || $pageNumber > $pageCount) {
            return response()->json(['error' => 'Invalid page number'], 400);
        }


        $templateId = $pdf->importPage($pageNumber);
        $size = $pdf->getTemplateSize($templateId);

        $pdf->AddPage($size['orientation'], [$size['width'], $size['height']]);
        $pdf->useTemplate($templateId);

        // Save the page temporarily
        $tmpFile = tempnam(sys_get_temp_dir(), 'pdf_page_') . '.pdf';
        $pdf->Output($tmpFile, 'F');

        // Sent the page to user
        $response = response()->file($tmpFile, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="page-' . $pageNumber . '.pdf"',
        ]);
        
        // Clean up the temporary file after sending the response
        register_shutdown_function(function () use ($tmpFile) {
            @unlink($tmpFile);
        });

        return $response;
    }

    function decryptAndProcessPdf($path, $password)
    {
        $pdf = new Fpdi();

        // فك تشفير الملف
        if (!$pdf->setSourceFile($path, $password)) {
            return response()->json(['error' => 'Unable to decrypt PDF'], 400);
        }

        // معالجة الملف كما هو
        $pageCount = $pdf->setSourceFile($path);
        $templateId = $pdf->importPage(1);
        $size = $pdf->getTemplateSize($templateId);

        $pdf->AddPage($size['orientation'], [$size['width'], $size['height']]);
        $pdf->useTemplate($templateId);

        $tmpFile = tempnam(sys_get_temp_dir(), 'pdf_page_') . '.pdf';
        $pdf->Output($tmpFile, 'F');

        return response()->file($tmpFile, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="page-1.pdf"',
        ]);
    }


    public function getBookContent($id)
    {
        $book = Course::find($id);

        if (!$book) {
            return response()->json(['error' => 'Book not found'], 404);
        }

        $path = storage_path('app/public/' . $book->file_path);

        if (!file_exists($path)) {
            return response()->json(['error' => 'PDF file not found'], 404);
        }

        $parser = new Parser();
        $pdf = $parser->parseFile($path);

        $pages = $pdf->getPages(); // يقسمه لصفحات

        $pageTexts = [];
        foreach ($pages as $index => $page) {
            $pageTexts[$index + 1] = $page->getText(); // النص في كل صفحة
        }

        return response()->json([
            'pages' => $pageTexts,
        ]);
    }


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

    public function uploadImage(Request $request)
    {
        $request->validate([
            'course_id' => 'required|exists:courses,id',
            'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);

        $file = $request->file('image');

        // Generate timestamp and sanitize original filename
        $timestamp = now()->format('Y_m_d_His');
        $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $sanitizedOriginal = Str::slug($originalName); // replaces spaces & symbols with dashes
        $extension = $file->getClientOriginalExtension();

        // Final filename: 2025_05_11_143212_original-name.jpg
        $filename = "{$timestamp}_{$sanitizedOriginal}.{$extension}";

        // Store file
        $path = $file->storeAs('course/images', $filename, 'public');

        // Save to course
        $course = Course::findOrFail($request->course_id);
        $course->image_path = $path;
        $course->save();

        return response()->json([
            'message' => 'Image uploaded and saved',
            'course_id' => $course->id,
            'image_url' => asset('storage/' . $path),
        ]);
    }
}
