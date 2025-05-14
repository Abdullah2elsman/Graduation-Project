<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Exam;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class ExamController extends Controller
{

    // Store exam that come from the request (Front-End)
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'metadata.course_id' => 'required|exists:courses,id',
            'metadata.name' => 'required|string',
            'metadata.instructions' => 'nullable|string',
            'metadata.date' => 'required|date',
            'metadata.time' => 'required',
            'metadata.totalScore' => 'required|numeric',
            'metadata.duration' => 'required|numeric',
            'metadata.creationMethod' => 'required|string|in:AI,Manual',
            'questions' => 'required|array|min:1',
            'questions.*.text' => 'required|string',
            'questions.*.score' => 'required|numeric',
            'questions.*.options' => 'required|array|min:2',
            'questions.*.options.*' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        // Save quiz
        $quiz = Exam::create([
            'course_id' => $request->input('metadata.course_id'),
            'name' => $request->input('metadata.name'),
            'instructions' => $request->input('metadata.instructions'),
            'date' => $request->input('metadata.date'),
            'time' => $request->input('metadata.time'),
            'total_score' => $request->input('metadata.totalScore'),
            'duration' => $request->input('metadata.duration'),
            'creation_method' => $request->input('metadata.creationMethod')
        ]);

        // Save questions and options
        foreach ($request->input('questions') as $q) {
            $question = $quiz->questions()->create([
                'text' => $q['text'],
                'score' => $q['score']
            ]);

            foreach ($q['options'] as $optionText) {
                $question->options()->create([
                    'text' => $optionText
                ]);
            }
        }

        return response()->json([
            'message' => 'Quiz and questions saved successfully',
            'quiz_id' => $quiz->id
        ], 201);
    }

    public function getExams($courseId): JsonResponse
    {
        if (!Course::find($courseId)) {
            return response()->json(['error' => 'Course not found'], 404);
        }

        $now = Carbon::now();

        $exams = Exam::where('course_id', $courseId)
            ->select('id', 'name', 'date', 'time', 'total_score', 'duration', 'instructions')
            ->get()
            ->filter(function ($exam) use ($now) {
                $startDateTime = Carbon::parse($exam->date . ' ' . $exam->time);
                $endDateTime = $startDateTime->copy()->addMinutes($exam->duration);
                return $now->lessThan($endDateTime); // quiz not over
            })
            ->values(); // reset keys

        return response()->json([
            'success' => true,
            'data' => $exams
        ]);
    }


    public function getFinishedExams($courseId)
    {
        $exams = Exam::where('course_id', $courseId)->get();

        if ($exams->isEmpty()) {
            return response()->json(['message' => 'No exams found'], 404);
        }

        $now = Carbon::now();

        $exams = $exams->filter(function ($exam) use ($now) {
            // Combine date and time into a single Carbon instance
            $startDateTime = Carbon::parse($exam->date . ' ' . $exam->time);
            $endDateTime = $startDateTime->copy()->addMinutes($exam->duration);

            return $now->greaterThan($endDateTime);
        })->map(function ($exam) {
            $questionCount = DB::table('questions')->where('exam_id', $exam->id)->count();
            $averageGrade = DB::table('exam_attempts')->where('exam_id', $exam->id)->avg('grade');
            $numberOfAttempts = DB::table('exam_attempts')->where('exam_id', $exam->id)->count();

            $percentage = ($exam->total_score > 0 && $averageGrade !== null)
                ? round(($averageGrade / $exam->total_score) * 100, 2) . '%'
                : 'N/A';

            return [
                'exam_id' => $exam->id,
                'name' => $exam->name,
                'number_of_questions' => $questionCount,
                'number_of_attempts' => $numberOfAttempts,
                'average_grade_percentage' => $percentage,
            ];
        })->values(); // Reset array keys after filter

        return response()->json([
            'success' => true,
            'data' => $exams
        ]);
    }
}
