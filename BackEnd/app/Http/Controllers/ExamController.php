<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use Illuminate\Http\Request;
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
}
