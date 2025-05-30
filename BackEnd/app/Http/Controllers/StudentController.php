<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Exam;
use App\Models\Student;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class StudentController extends Controller
{
    // ----------------------- Create Student -----------------------
    public function create(Request $request)
    {
        // Validate input data
        $validatedData = $request->validate([
            'name' => ['required', 'max:255'],
            'email' => ['required', 'email', 'unique:users'],
            'password' => ['required', 'min:8'],
            'age' => ['required', 'integer']
        ]);

        try {
            // Sanitize inputs and create a new student record
            $student = new Student();
            $student->name = strip_tags($validatedData['name']);
            $student->email = strip_tags($validatedData['email']);
            $student->password = Hash::make(strip_tags($validatedData['password']));
            $student->age = strip_tags($validatedData['age']);

            // Save student to the database
            $student->save();

            // Return success response
            return response()->json(['message' => 'Student created successfully'], 201);
        } catch (\Exception $e) {
            // Catch and log exceptions for debugging
            Log::error('Error creating student: ' . $e->getMessage());

            // Return error response
            return response()->json([
                'message' => 'Failed to create student',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ----------------------- Read Student -----------------------
    public function read(Request $request)
    {
        // Validate input
        $validatedData = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        try {
            // Find the student by email
            $student = Student::where('email', strip_tags($validatedData['email']))->first();

            // Check if student exists and password is correct
            if (!$student || !Hash::check(strip_tags($validatedData['password']), $student->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid email or password.',
                ], 401);
            }

            // Generate the access token
            $token = $student->createToken('auth_token')->plainTextToken;

            // Return success response
            return response()->json([
                'success' => true,
                'message' => 'Login successful',
                'student' => [
                    'id' => $student->id,
                    'name' => $student->name,
                    'email' => $student->email,
                ],
                'access_token' => $token,
                'token_type' => 'Bearer',
            ], 200);
        } catch (\Exception $e) {
            // Catch unexpected errors
            Log::error('Login error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while processing your request.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // ----------------------- Update Student -----------------------
    function update(Request $request){
        $studentId = $request->input('id');
        if (!$studentId) {
            return response()->json(['Error' => "Enter the Id"], 404);
        }

        $request->validate([
            'name' => ['required', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'], // Exclude the current record from the unique check
            'oldPassword' => ['required', 'min:8'],
            'newPassword' => ['required', 'min:8'],
            'id' => ['required'],
            'age' => ['required', 'integer']
        ]);

        // Prepare data for update
        $data = [
            'name' => strip_tags($request->input('name')),
            'email' => strip_tags($request->input('email')),
        ];
        $currentPassword = DB:: table('students')->where('id', $studentId)->first()->password;
        if(Hash::check($request->oldPassword,$currentPassword)){
            return response()->json(['Error' => "The old password don't match with current password"]);
        }

        if ($request->filled('password')) {
            $data['password'] = Hash::make(strip_tags($request->input('password')));
        }

        try {
            // Perform the update query
            $updated = DB::table('students')->where('id', $studentId)->update($data);

            if ($updated) {
                return response()->json(['message' => 'Student updated successfully'], 200);
            } else {
                // If no record is updated, the student might not be found or no changes made
                return response()->json(['message' => 'Student not found or no changes made'], 404);
            }
        } catch (Exception $e) {
            // Catch any exceptions and return a 500 error with the exception message
            return response()->json(['message' => 'The email has already been taken.', 'error' => $e->getMessage()], 500);
        }
    }

    // ----------------------- Delete Student -----------------------
    function delete(Request $request){
        $email = $request->input('email');
        $student = Student::where('email', $email)->first();
        if ($student) {
            $student->delete();
            return response()->json(['message' => 'Record deleted successfully.'], 200);
        }
        return response()->json(['message' => 'No record found with the given email.'], 404);
    }

    // ----------------------- Get All Data Students -----------------------
    function getAllStudents(){
        $students = Student::all();
        $count = Student::count();
        return response()->json(["Students Data" => $students, "Number Of Student" => $count]);
    }

    // ----------------------- Get Data Student -----------------------
    function getStudent($id)
    {
        $student = Student::find($id);
        return $student;
    }

    // ----------------------- Upload Student Image -----------------------
    function uploadImage(Request $request, $id)
    {
        $student = Student::find($id);  // Assuming the user is a student and logged in

        if (!$student) {
            return response()->json(["message" => "student not found"]);
        }

        // Validate that an image is uploaded
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:10240', // Max size 10MB
        ]);

        // Get the uploaded file's original name
        $fileExtension = $request->image->getClientOriginalName();

        // Get the current year, month, and day for naming the file
        $year = date('Y');
        $month = date('m');
        $day = date('d');

        // Create a unique file name
        $fileName = $id  . '_' . $year . '_' . $month . '_' . $day . "_" . $fileExtension;

        // Define the path where the image will be stored
        $path = 'storage/uploads/Images/Student Images';

        // Move the uploaded image to the specified path
        $request->image->move($path, $fileName);

        // Update the image path in the students table
        $updated = DB::table('students')->where('id', $id)->update(['image' => $path . '/' . $fileName]);

        // Check if the update was successful
        if ($updated) {
            return response()->json([
                'success' => 'File Uploaded and Image Path Updated Successfully',
                'image' => $fileName
            ]);
        } else {
            return response()->json(['error' => 'Failed to update image path in the database'], 500);
        }
    }

    public function getCourses($studentId){
        // Validate the student ID
        $student = Student::find($studentId);
        if (!$student) {
            return response()->json(['error' => 'Student not found'], 404);
        }

        // Get all enrollments for this student (not cancelled) with course data
        $enrollments = Enrollment::with('course')
            ->where('student_id', $studentId)
            ->where('cancelled', 0)
            ->get();

        // Extract course data from enrollments
        $courses = $enrollments->pluck('course')
            ->filter() // remove nulls if any enrollment has no course
            ->map(function($course) {
                return [
                    'id' => $course->id,
                    'image_path' => $course->image_path,
                    'file_type' => $course->file_type,
                    'title' => $course->title,
                    'description' => $course->description,
                    'admin_id' => $course->admin_id,
                    'file_path' => $course->file_path,
                    'number_of_exams' => $course->number_of_exams,
                    'completed_exams' => $course->completed_exams,
                ];
            })
            ->values();

        return response()->json([
            'success' => true,
            'data' => $courses
        ]);
    }

    public function getTodayExams($studentId){
        // Check if student exists
        $student = Student::find($studentId);
        if (!$student) {
            return response()->json(['success' => false, 'message' => 'Student not found'], 404);
        }

        // Get all course IDs the student is enrolled in and not cancelled
        $enrolledCourseIds = Enrollment::where('student_id', $studentId)
            ->where('cancelled', 0)
            ->pluck('course_id');

        // Get today's date
        $today = Carbon::today()->toDateString();
        $now = Carbon::now();

        // Get exams for today for these courses
        $exams = Exam::whereIn('course_id', $enrolledCourseIds)
            ->where('date', $today)
            ->get()
            ->filter(function ($exam) use ($now) {
                $startDateTime = \Carbon\Carbon::parse($exam->date . ' ' . $exam->time);
                $endDateTime = $startDateTime->copy()->addMinutes($exam->duration);
                return $now->lessThan($endDateTime);
            })
            ->values();

        return response()->json([
            'success' => true,
            'count' => $exams->count(),
            'data' => $exams
        ]);
    }
}
