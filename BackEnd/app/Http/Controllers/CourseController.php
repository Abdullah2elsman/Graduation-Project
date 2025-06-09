<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Course;
use Carbon\Carbon;
use Illuminate\Support\Str;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use setasign\Fpdi\Fpdi;
use Smalot\PdfParser\Parser;


class CourseController extends Controller
{

    public function storeBook(Request $request)
    {
        $request->validate([
            'title' => 'required|string',
            'file' => 'required|file|mimetypes:application/pdf,application/octet-stream|max:102400',
            'instructor_id' => 'required|exists:instructors,id',
            'admin_id' => 'required|exists:admins,id',
            'description' => 'nullable|string',
        ]);

        $file = $request->file('file');
        $originalName = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME));
        $extension = $file->getClientOriginalExtension();
        $timestamp = now()->format('Y_m_d_His');
        $filename = $timestamp . '_' . $originalName . '.' . $extension;

        // تخزين ملف الكتاب PDF
        $file->storeAs('books', $filename, 'public');

        // إنشاء الكورس في الداتا بيز
        $book = Course::create([
            'title' => $request->title,
            'instructor_id' => $request->instructor_id,
            'admin_id' => $request->admin_id,
            'description' => $request->description,
            'file_path' => 'books/' . $filename,
            'file_type' => $file->getClientOriginalExtension(),
        ]);

        $popplerBin = base_path('poppler/library/bin/pdftoppm.exe');
        $pdfPath = storage_path('app/public/books/' . $filename);
        $outputBase = storage_path('app/public/course/images/' . pathinfo($filename, PATHINFO_FILENAME) . '_cover');

        exec("\"$popplerBin\" -f 1 -l 1 -png -scale-to-x 275 -scale-to-y 375 \"$pdfPath\" \"$outputBase\"");

        $imagesPath = storage_path('app/public/course/images/');
        $filenameBase = pathinfo($filename, PATHINFO_FILENAME) . '_cover';

        $files = glob($imagesPath . $filenameBase . '*');

        if (!empty($files)) {
            $existingImageName = basename($files[0]);
            $book->image_path = 'course/images/' . $existingImageName;
            $book->save();
        }
    }



    public function uploadBackground(Request $request){
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

        if (!$pdf->setSourceFile($path, $password)) {
            return response()->json(['error' => 'Unable to decrypt PDF'], 400);
        }

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

        $pages = $pdf->getPages();

        $pageTexts = [];
        foreach ($pages as $index => $page) {
            $pageTexts[$index + 1] = $page->getText();
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

    public function getAllCoursesExamAttempts($instructorId)
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

    public function coursesInteraction($instructorId)
    {
        // Get all course IDs for this instructor
        $courseIds = DB::table('courses')
            ->where('instructor_id', $instructorId)
            ->pluck('id')
            ->toArray();

        if (empty($courseIds)) {
            return response()->json([
                'success' => true,
                'number_of_students' => 0,
                'data' => []
            ]);
        }

        // Aggregate interactions for all these courses
        $rawData = DB::table('book_interactions')
            ->selectRaw('YEAR(interacted_date) as year, MONTH(interacted_date) as month, DAY(interacted_date) as day, COUNT(*) as total')
            ->whereIn('course_id', $courseIds)
            ->groupBy('year', 'month', 'day')
            ->orderBy('year')
            ->orderBy('month')
            ->orderBy('day')
            ->get();

        $data = [];

        foreach ($rawData as $item) {
            $monthName = Carbon::createFromDate($item->year, $item->month, 1)->format('F');
            $data[$monthName][$item->day] = $item->total;
        }

        // Count enrolled students across all courses (excluding cancelled)
        $enrolledStudents = DB::table('enrollments')
            ->whereIn('course_id', $courseIds)
            ->where('cancelled', 0)
            ->count();

        return response()->json([
            'success' => true,
            'number_of_students' => $enrolledStudents,
            'data' => $data
        ]);
    }

    public function coursesAverageGrades($instructorId)
    {
        $averageGradesPerExam = DB::table('exam_attempts')
            ->join('exams', 'exam_attempts.exam_id', '=', 'exams.id')
            ->join('courses', 'exams.course_id', '=', 'courses.id')
            ->where('courses.instructor_id', $instructorId)
            ->select(
                'exams.id as exam_id',
                'exams.name as exam_name',
                'exams.total_score',
                'courses.id as course_id',
                'courses.title as course_title',
                DB::raw('AVG(exam_attempts.grade) as average_grade'),
                DB::raw('AVG((exam_attempts.grade / exams.total_score) * 100) as average_percentage')
            )
            ->groupBy('exams.id', 'exams.name', 'exams.total_score', 'courses.id', 'courses.title')
            ->orderBy('courses.id')
            ->orderBy('exams.id')
            ->get();

        // Group exams by course title
        $grouped = [];
        foreach ($averageGradesPerExam as $exam) {
            $grouped[$exam->course_title][] = [
                'exam_id' => $exam->exam_id,
                'exam_name' => $exam->exam_name,
                'total_score' => $exam->total_score,
                'average_grade' => $exam->average_grade,
                'average_percentage' => $exam->average_percentage
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $grouped
        ]);
    }

    public function studentsMissedAllExams($instructorId)
    {
        // Get all courses for the instructor
        $courses = DB::table('courses')
            ->where('instructor_id', $instructorId)
            ->select('id', 'title')
            ->get();

        $result = [];

        foreach ($courses as $course) {
            // Get all enrolled students in this course
            $enrolledStudentIds = DB::table('enrollments')
                ->where('cancelled', 0)
                ->where('course_id', $course->id)
                ->pluck('student_id');

            // Get all exams for this course
            $exams = DB::table('exams')
                ->where('course_id', $course->id)
                ->select('id', 'name')
                ->get();

            $examsList = [];

            foreach ($exams as $exam) {
                // Students who attended this exam
                $attendedStudentIds = DB::table('exam_attempts')
                    ->where('exam_id', $exam->id)
                    ->distinct()
                    ->pluck('student_id');

                // Students who missed this exam
                $missedStudentIds = $enrolledStudentIds->diff($attendedStudentIds);

                // Get student info (replace 'full_name' with your actual column)
                $missedStudents = DB::table('students')
                    ->whereIn('id', $missedStudentIds)
                    ->select('id', 'name')
                    ->orderBy('name')
                    ->get();

                $examsList[] = [
                    'exam_id' => $exam->id,
                    'exam_name' => $exam->name,
                    'missed_students' => $missedStudents
                ];
            }

            $result[$course->title] = $examsList;
        }

        return response()->json([
            'success' => true,
            'data' => $result
        ]);
    }
}
