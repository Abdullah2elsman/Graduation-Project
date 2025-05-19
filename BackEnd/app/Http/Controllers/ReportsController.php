<?php

namespace App\Http\Controllers;

use App\Models\Course;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class ReportsController extends Controller
{
    public function reportsOfCourse(Request $request)
    {
        $request->validate([
            'course_id' => 'required|integer',
        ]);

        $courseId = $request->input('course_id');

        $course = Course::withCount(['exams', 'enrollments' => function ($query) {
            $query->where('cancelled', 0); //   only count non-cancelled enrollments 
        }])
            ->where('id', $courseId)
            ->first(['id', 'name', 'number_of_chapters', 'academic_year']);

        if (!$course) {
            return response()->json(['error' => 'Course not found'], 404);
        }

        $averagePercentage = DB::table('exam_attempts')
            ->join('exams', 'exam_attempts.exam_id', '=', 'exams.id')
            ->where('exams.course_id', $courseId)
            ->select(DB::raw('AVG((exam_attempts.grade / exams.total_score) * 100) as avg_percentage'))
            ->value('avg_percentage');

        $allStudentIds = DB::table('enrollments')
            ->where('cancelled', 0)
            ->where('course_id', $courseId)
            ->pluck('student_id')
            ->toArray();

        $attendedStudentIds = DB::table('exam_attempts')
            ->join('exams', 'exam_attempts.exam_id', '=', 'exams.id')
            ->where('exams.course_id', $courseId)
            ->distinct()
            ->pluck('exam_attempts.student_id')
            ->toArray();

        $missedAllExamCount = count(array_diff($allStudentIds, $attendedStudentIds));


        return response()->json([
            'success' => true,
            'data' => [
                'name' => $course->title,
                'number_of_chapters' => $course->number_of_chapters,
                'academic_year' => $course->academic_year,
                'number_of_exams' => $course->number_of_exams,
                'number_of_students' => $course->enrollments_count,
                'students_attended_exams' => count($attendedStudentIds),
                'students_missed_all_exams' => $missedAllExamCount,
                'average_percentage_grades' => $averagePercentage === null ? "N/A" : number_format($averagePercentage, 2) . '%',
            ]
        ]);
    }

    public function topStudents(Request $request)
    {
        $request->validate([
            'course_id' => 'required|integer',
        ]);

        $courseId = $request->input('course_id');

        $topStudents = DB::table('exam_attempts')
            ->join('exams', 'exams.id', '=', 'exam_attempts.exam_id')
            ->join('students', 'students.id', '=', 'exam_attempts.student_id')
            ->where('exams.course_id', $courseId)
            ->select(
                'students.id',
                'students.name',
                DB::raw('SUM(exam_attempts.grade) as scored_grades'),
                DB::raw('SUM(exams.total_score) as total_grades')
            )
            ->groupBy('students.id', 'students.name')
            ->orderByDesc('scored_grades')
            ->limit(20)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $topStudents
        ]);


        return response()->json([
            'success' => true,
            'data' => $topStudents
        ]);
    }

    public function topStudentsMissedAllExams(Request $request)
    {
        $request->validate([
            'course_id' => 'required|integer',
        ]);

        $courseId = $request->input('course_id');

        $enrolledStudentIds = DB::table('enrollments')
            ->where('cancelled', 0)
            ->where('course_id', $courseId)
            ->pluck('student_id');

        $attendedStudentIds = DB::table('exam_attempts')
            ->join('exams', 'exam_attempts.exam_id', '=', 'exams.id')
            ->where('exams.course_id', $courseId)
            ->distinct()
            ->pluck('exam_attempts.student_id');

        $missedStudentIds = $enrolledStudentIds->diff($attendedStudentIds);

        $students = DB::table('students')
            ->whereIn('id', $missedStudentIds)
            ->select('id', 'name')
            ->orderBy('name')
            ->limit(20)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $students
        ]);
    }

    public function averageGrades(Request $request)
    {
        $request->validate([
            'course_id' => 'required|integer'
        ]);

        $courseId = $request->input('course_id');

        $averageGradesPerExam = DB::table('exam_attempts')
            ->join('exams', 'exam_attempts.exam_id', '=', 'exams.id')
            ->where('exams.course_id', $courseId)
            ->select(
                'exams.id as exam_id',
                'exams.name as name',
                'exams.total_score',
                DB::raw('AVG(exam_attempts.grade) as average_grade'),
                DB::raw('AVG((exam_attempts.grade / exams.total_score) * 100) as average_percentage')
            )
            ->groupBy('exams.id', 'exams.name', 'exams.total_score')
            ->orderBy('exams.id')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $averageGradesPerExam
        ]);
    }

    public function studentsInteraction(Request $request)
    {
        $request->validate([
            'course_id' => 'required|integer',
        ]);

        $courseId = $request->input('course_id');

        $rawData = DB::table('book_interactions')
            ->selectRaw('YEAR(interacted_date) as year, MONTH(interacted_date) as month, DAY(interacted_date) as day, COUNT(*) as total')
            ->where('course_id', $courseId)
            ->groupBy('year', 'month', 'day')
            ->orderBy('year')
            ->orderBy('month')
            ->orderBy('day')
            ->get();

        $data = [];

        foreach ($rawData as $item) {
            $monthName = Carbon::createFromDate($item->year, $item->month, 1)->format('F'); // مثل "April"
            $data[$monthName][$item->day] = $item->total;
        }

        $enrolledStudents = DB::table('enrollments')
            ->where('course_id', $courseId)
            ->where('cancelled', 0)
            ->count();

        return response()->json([
            'success' => true,
            'number_of_students' => $enrolledStudents,
            'data' => $data
        ]);
    }

    protected function getStudentsExamData($instructorId)
    {
        return DB::table('exam_attempts')
            ->join('exams', 'exam_attempts.exam_id', '=', 'exams.id')
            ->join('courses', 'exams.course_id', '=', 'courses.id')
            ->join('students', 'exam_attempts.student_id', '=', 'students.id')
            ->where('courses.instructor_id', $instructorId)
            ->select(
                'students.id as student_id',
                'students.name as student_name',
                'courses.title as course_title',
                'exams.name as exam_name',
                'exam_attempts.grade',
                'exams.total_score'
            )
            ->get();
    }

    public function studentsExamData(Request $request)
    {
        $request->validate([
            'instructor_id' => 'required|integer'
        ]);

        $instructorId = $request->input('instructor_id');
        $attempts = $this->getStudentsExamData($instructorId);

        return response()->json([
            'success' => true,
            'data' => $attempts
        ]);
    }

    public function downloadStudentReport(Request $request)
    {
        $request->validate([
            'instructor_id' => 'required|integer'
        ]);

        $instructorId = $request->input('instructor_id');

        // 1. Get the data using your existing query
        $attempts = DB::table('exam_attempts')
            ->join('exams', 'exam_attempts.exam_id', '=', 'exams.id')
            ->join('courses', 'exams.course_id', '=', 'courses.id')
            ->join('students', 'exam_attempts.student_id', '=', 'students.id')
            ->where('courses.instructor_id', $instructorId)
            ->select(
                'students.id as student_id',
                'students.name as student_name',
                'courses.title as course_title',
                'exams.name as exam_name',
                'exam_attempts.grade',
                'exams.total_score'
            )
            ->get();

        // 2. Prepare data with headers
        $data = collect([
            ['Student ID', 'Student Name', 'Course Title', 'Exam Name', 'Grade', 'Total Score']
        ])->merge(
            $attempts->map(function ($row) {
                return [
                    $row->student_id,
                    $row->student_name,
                    $row->course_title,
                    $row->exam_name,
                    $row->grade,
                    $row->total_score
                ];
            })
        );

        // 3. Export directly using an anonymous class
        return Excel::download(
            new class($attempts) implements FromCollection, WithHeadings {
                private $data;

                public function __construct($attempts)
                {
                    $this->data = $attempts;
                }

                public function collection()
                {
                    return collect($this->data)->map(function ($row) {
                        return [
                            $row->student_id,
                            $row->student_name,
                            $row->course_title,
                            $row->exam_name,
                            $row->grade,
                            $row->total_score,
                        ];
                    });
                }

                public function headings(): array
                {
                    return [
                        'Student ID',
                        'Student Name',
                        'Course Title',
                        'Exam Name',
                        'Grade',
                        'Total Score',
                    ];
                }
            },
            'students_exam_report.xlsx'
        );
    }
}
