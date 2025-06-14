<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\Option;
use App\Models\Question;
use App\Models\StudentAnswer;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class ExamController extends Controller
{

    // Store exam that come from the request (Front-End)
    public function store(Request $request){
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
            'questions.*.question' => 'required|string',
            'questions.*.score' => 'required|numeric',
            'questions.*.options' => 'required|array|min:2',
            'questions.*.options.*.option' => 'required|string',
            'questions.*.options.*.is_correct' => 'required|boolean',
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
                'question' => $q['question'],
                'score' => $q['score']
            ]);


            foreach ($q['options'] as $optionData) {
                $question->options()->create([
                    'option' => $optionData['option'],
                    'is_correct' => filter_var($optionData['is_correct'], FILTER_VALIDATE_BOOLEAN) ? 1 : 0,
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

        $now = Carbon::now('Africa/Cairo');

        $exams = Exam::where('course_id', $courseId)
            ->select('id', 'name', 'date', 'time', 'total_score', 'duration', 'instructions', 'number_of_attempts', 'available_review')
            ->get()
            ->map(function ($exam) use ($now) {
                $startDateTime = Carbon::parse($exam->date . ' ' . $exam->time, 'Africa/Cairo');
                $endDateTime = $startDateTime->copy()->addMinutes($exam->duration);

                // available: true
                $available = $now->greaterThanOrEqualTo($startDateTime) && $now->lessThan($endDateTime);
                return [
                    'id' => $exam->id,
                    'name' => $exam->name,
                    'date' => $exam->date,
                    'time' => $exam->time,
                    'total_score' => $exam->total_score,
                    'duration' => $exam->duration,
                    'instructions' => $exam->instructions,
                    'number_of_attempts' => $exam->number_of_attempts,
                    'available_review' => $exam->available_review,
                    'available' => $available, 
                ];
            })
            // لو لسه عايز ترجع بس الامتحانات اللي معاد نهايتها مجاش
            ->filter(function ($exam) use ($now) {
                $startDateTime = Carbon::parse($exam['date'] . ' ' . $exam['time'], 'Africa/Cairo');
                $endDateTime = $startDateTime->copy()->addMinutes($exam['duration']);
                return $endDateTime->greaterThan($now);
            })
            ->values();
            
        return response()->json([
            'success' => true,
            'data' => $exams
        ]);
    }


    public function getFinishedExamsForInstructor($courseId){
        $exams = Exam::where('course_id', $courseId)->get();
        // return $exams;

        if ($exams->isEmpty()) {
            return response()->json(['message' => 'No exams found'], 404);
        }

        $now = Carbon::now();

        $finishedExams = $exams->filter(function ($exam) use ($now) {
            $startDateTime = Carbon::parse($exam->date . ' ' . $exam->time, 'Africa/Cairo');
            $endDateTime = $startDateTime->copy()->addMinutes($exam->duration);
            return $now->greaterThan($endDateTime);
        })->map(function ($exam) {
            $questionCount = $exam->questions()->count();
            $averageGrade = $exam->attempts()->avg('grade');
            $numberOfAttempts = $exam->attempts()->count();

            $percentage = ($exam->total_score > 0 && $averageGrade !== null)
                ? round(($averageGrade / $exam->total_score) * 100, 2) . '%'
                : 'N/A';

            return [
                'id' => $exam->id,
                'name' => $exam->name,
                'number_of_questions' => $questionCount,
                'number_of_attempts' => $numberOfAttempts,
                'average_grade_percentage' => $percentage,
                'available_review' => $exam->available_review,
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data' => $finishedExams
        ]);
    }

    public function getFinishedExamsForStudent($courseId, $studentId){
        $exams = Exam::with(['questions', 'attempts' => function ($q) use ($studentId) {
            $q->where('student_id', $studentId);
        }])
            ->where('course_id', $courseId)
            ->get();

        if ($exams->isEmpty()) {
            return response()->json(['message' => 'No exams found'], 404);
        }

        $now = Carbon::now();

        $finishedExams = $exams->filter(function ($exam) use ($now) {
            $startDateTime = Carbon::parse($exam->date . ' ' . $exam->time, 'Africa/Cairo');
            $endDateTime = $startDateTime->copy()->addMinutes($exam->duration);
            return $now->greaterThan($endDateTime);
        })->map(function ($exam) use ($studentId) {
            $questionCount = $exam->questions->count();
            $studentAttempt = $exam->attempts->first();
            $studentGrade = $studentAttempt ? $studentAttempt->grade : null;

            return [
                'exam_id' => $exam->id,
                'name' => $exam->name,
                'number_of_questions' => $questionCount,
                'grade' => $studentGrade,
                'available_review' => $exam->available_review,
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data' => $finishedExams
        ]);
    }

    public function getExamQuestions(Request $request, $courseId, $includeCorrect = true){
        
        $validator = Validator::make($request->all(), [
            'exam_id' => 'required|exists:exams,id'
        ]);
        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }
        $examId = $request->input('exam_id');

        if (!$examId) {
            return response()->json(['message' => 'Exam ID is required'], 400);
        }
        $exam = Exam::where('course_id', $courseId)
            ->where('id', $examId)
            ->with(['questions.options' => function ($query) use ($includeCorrect) {
                if ($includeCorrect) {
                    $query->select('id', 'question_id', 'option', 'is_correct');
                } else {
                    $query->select('id', 'question_id', 'option');
                }
            }])
            ->with(['questions' => function ($query) {
                $query->select('id', 'exam_id', 'question', 'score');
            }])
            ->first();

        if (!$exam) {
            return response()->json(['message' => 'Exam not found'], 404);
        }

        $numberOfQuestions = $exam->questions ? $exam->questions->count() : 0;


        return response()->json([
            'success' => true,
            'data'=> $exam,
            'number_of_questions' => $numberOfQuestions
        ]);
    }

    public function updateQuestions(Request $request){
        // Validate the request
        $data = $request->validate([
            'updated_questions' => 'nullable|array',
            'updated_questions.*.id' => 'required|exists:questions,id',
            'updated_questions.*.question' => 'required|string',
            'updated_questions.*.score' => 'required|numeric',
            'updated_questions.*.options' => 'nullable|array',
            'updated_questions.*.options.*.id' => 'nullable|integer|exists:options,id',
            'updated_questions.*.options.*.option' => 'required|string',
            'updated_questions.*.options.*.is_correct' => 'required|boolean',

            'new_questions' => 'nullable|array',
            'new_questions.*.question' => 'required|string',
            'new_questions.*.score' => 'required|numeric',
            'new_questions.*.exam_id' => 'required|integer|exists:exams,id',
            'new_questions.*.options' => 'nullable|array',
            'new_questions.*.options.*.option' => 'required|string',
            'new_questions.*.options.*.is_correct' => 'required|boolean',

            'deleted_question_ids' => 'nullable|array',
            'deleted_question_ids.*' => 'integer|exists:questions,id',
            'deleted_option_ids' => 'nullable|array',
            'deleted_option_ids.*' => 'integer|exists:options,id',
        ]);

        // 1. Delete questions (and their options if cascade is enabled)
        if (!empty($data['deleted_question_ids'])) {
            Question::whereIn('id', $data['deleted_question_ids'])->delete();
        }

        // 2. Delete specific options
        if (!empty($data['deleted_option_ids'])) {
            Option::whereIn('id', $data['deleted_option_ids'])->delete();
        }

        // 3. Update existing questions and their options
        if (!empty($data['updated_questions'])) {
            foreach ($data['updated_questions'] as $q) {
                $question = Question::find($q['id']);
                $question->question = $q['question'];
                $question->score = $q['score'];
                $question->save();

                // Delete all old options and recreate them
                $question->options()->delete();

                if (!empty($q['options'])) {
                    foreach ($q['options'] as $opt) {
                        $question->options()->create([
                            'option' => $opt['option'],
                            'is_correct' => $opt['is_correct']
                        ]);
                    }
                }
            }
        }

        // 4. Add new questions and their options
        if (!empty($data['new_questions'])) {
            foreach ($data['new_questions'] as $q) {
                $question = Question::create([
                    'question' => $q['question'],
                    'score' => $q['score'],
                    'exam_id' => $q['exam_id'],
                ]);

                if (!empty($q['options'])) {
                    foreach ($q['options'] as $opt) {
                        $question->options()->create([
                            'option' => $opt['option'],
                            'is_correct' => $opt['is_correct'],
                        ]);
                    }
                }
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Questions and options updated/deleted/created successfully.'
        ]);
    }


    public function submitExam(Request $request){
        $request->validate([
            'exam_id' => 'required|integer|exists:exams,id',
            'student_id' => 'required|integer|exists:students,id',
            'answers' => 'required|array',
            'answers.*.question_id' => 'required|integer|exists:questions,id',
            'answers.*.option_id' => 'required|integer|exists:options,id',
        ]);

        // 1. save each attempt in (ExamAttempt)
        $attempt = ExamAttempt::create([
            'exam_id' => $request->exam_id,
            'student_id' => $request->student_id,
            'grade' => 0, // will calculate after
        ]);

        // 2. save each answer in student_answers
        foreach ($request->answers as $answer) {
            StudentAnswer::create([
                'exam_attempt_id' => $attempt->id,
                'question_id' => $answer['question_id'],
                'option_id' => $answer['option_id'],
            ]);
        }

        // 3. Calculate the grade immediately
        $grade = 0;
        foreach ($request->answers as $answer) {
            $option = Option::find($answer['option_id']);
            $question = Question::find($answer['question_id']);
            if ($option && $option->is_correct && $question) {
                $grade += $question->score;
            }
        }
        $attempt->grade = $grade;
        $attempt->save();

        return response()->json([
            'success' => true,
            'message' => 'Exam submitted successfully!',
            'attempt_id' => $attempt->id,
            'grade' => $grade
        ]);
    }

    public function regradeExam(Request $request){
        $request->validate([
            'exam_id' => 'required|integer|exists:exams,id'
        ]);

        $examId = $request->exam_id;
        // Get all questions for the exam
        $questions = Question::where('exam_id', $examId)->get();

        // Get all attempts for this exam
        $attempts = ExamAttempt::where('exam_id', $examId)->get();

        foreach ($attempts as $attempt) {
            $totalGrade = 0;

            foreach ($questions as $question) {
                // Get the student's answer for this question in this attempt
                $studentAnswer = StudentAnswer::where('exam_attempt_id', $attempt->id)
                    ->where('question_id', $question->id)
                    ->first();

                if ($studentAnswer) {
                    // Get the option chosen by the student
                    $chosenOption = Option::find($studentAnswer->option_id);

                    // If the chosen option is currently correct, add the question's score
                    if ($chosenOption && $chosenOption->is_correct) {
                        $totalGrade += $question->score;
                    }
                }
            }

            // Update the student's grade
            $attempt->grade = $totalGrade;
            $attempt->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'Exam regraded for all students!',
        ]);
    }

    public function examGradesDistribution(Request $request){
        $request->validate([
            'exam_id' => 'required|integer|exists:exams,id'
        ]);
        $examId = $request->exam_id;
        $exam = Exam::find($examId);

        $attempts = ExamAttempt::where('exam_id', $examId)->pluck('grade');
        $now = Carbon::now();
        $startDateTime = Carbon::parse($exam->date . ' ' . $exam->time, 'Africa/Cairo');
        $endDateTime = $startDateTime->copy()->addMinutes($exam->duration);


        $available = $now->greaterThan($endDateTime);


        if ($attempts->isEmpty()) {
            return response()->json([
                'success' => true,
                'distribution' => []
            ]);
        }

        $min = $attempts->min();
        $max = $attempts->max();

        $distribution = [];
        for ($i = $min; $i <= $max; $i++) {
            $distribution[$i] = 0;
        }

        foreach ($attempts as $grade) {
            if (isset($distribution[$grade])) {
                $distribution[$grade]++;
            }
        }

        $distributionArray = [];
        foreach ($distribution as $degree => $count) {
            if ($count > 0) {
                $distributionArray[] = [
                    'degree' => (int)$degree,
                    'count' => $count
                ];
            }
        }

        return response()->json([
            'success' => true,
            'available' => $available,
            'distribution' => $distributionArray
        ]);
    }

    public function deleteExam(Request $request){

        $request->validate([
            'exam_id' => 'required|integer|exists:exams,id'
        ]);

        $examId = $request->exam_id;

        $exam = Exam::find($examId);
        if (!$exam) {
            return response()->json(['message' => 'Exam not found'], 404);
        }

        // Delete all questions and their options
        foreach ($exam->questions as $question) {
            $question->options()->delete();
            $question->delete();
        }

        // Delete the exam itself
        $exam->delete();

        return response()->json(['message' => 'Exam deleted successfully']);
    }

    public function UpdateAvailable(Request $request){
        $request->validate([
            'exam_id' => 'required|integer|exists:exams,id',
            'available_review' => 'required|boolean'
        ]);
        
        $exam = Exam::find($request->exam_id);
        if (!$exam) {
            return response()->json(['message' => 'Exam not found'], 404);
        }
        
        $exam->available_review = $request->available_review; 
        $exam->save();
        
        return response()->json(['message' => 'Exam availability updated successfully']);
    }

    public function finishExam(Request $request){
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'exam_id' => 'required|exists:exams,id',
            'answers' => 'required|array',
            'answers.*.question_id' => 'required|exists:questions,id',
            'answers.*.option_id' => 'required|exists:options,id',
        ]);


        $examAttempt = ExamAttempt::create([
            'student_id' => $request->student_id,
            'exam_id' => $request->exam_id,
            'grade' => 0, // This will be calculated later
        ]);

        foreach ($request->answers as $answer) {
            StudentAnswer::create([
                'exam_attempt_id' => $examAttempt->id,
                'question_id' => $answer['question_id'],
                'option_id' => $answer['option_id'], // Assuming the answer is an option ID
            ]);
        }

        return response()->json([
            'success' => true,
            'exam_attempt_id' => $examAttempt->id,
            'message' => 'Exam attempt and answers saved successfully'
        ]);
    }

}

