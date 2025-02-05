<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\Course;
use App\Models\ExamAttempt;
use App\Models\Instructor;
use App\Models\Student;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminController extends Controller
{

    // ----------------------- Update Admin -----------------------

    function update(Request $request, $id)
    {
        $request->validate([
            'name' => ['required', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email,' . $id], // Exclude the current record from the unique check
            'password' => ['nullable', 'min:8'],
            'age' => ['required', 'integer']
        ]);

        // Prepare data for update
        $data = [
            'name' => strip_tags($request->input('name')),
            'email' => strip_tags($request->input('email')),
            'age' => strip_tags($request->input('age')),
        ];

        if ($request->filled('password')) {
            $data['password'] = Hash::make(strip_tags($request->input('password')));
        }

        try {
            // Perform the update query
            $updated = DB::table('admins')->where('id', $id)->update($data);

            if ($updated) {
                // Return success response in JSON format
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
    // ----------------------- Delete Admin -----------------------
    function delete(Request $request)
    {
        $email = $request->input('email');

        $admin = Admin::where('email', $email)->first();
        if ($admin) {
            $admin->delete();
            return response()->json(['message' => 'Record deleted successfully.'], 200);
        }

        return response()->json(['message' => 'No record found with the given email.'], 404);
    }    

    // ----------------------- Get Admin Data -----------------------
    function getAdmin($id)
    {
        $admin = Admin::find($id);
        return $admin;
    }

    // ----------------------- Upload Admin Image -----------------------

    function uploadImage(Request $request, $id)
    {

        $student = Admin::find($id);  // Assuming the user is a student and logged in

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
        $path = 'storage/uploads/Images/Admin Images';

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

    // ----------------------- Get Numbers Of Users -----------------------

    function getNumOfUsers()
    {
        $numberOfStudents = Student::count();
        $numberOfAdmins = Admin::count();
        $numberOfInstructors = Instructor::count();
        return response()->json([
            'numberOfAdmins' => $numberOfAdmins,
            'numberOfInstructors' => $numberOfInstructors,
            'numberOfStudents' => $numberOfStudents,
        ]);
    }

    // ----------------------- Get All Courses -----------------------
    function getAllCourses()
    {
        $courses = Course::all();
        if ($courses->isEmpty()) {
            return response()->json(['message' => 'No courses found'], 404);
        }
        return response()->json($courses, 200);
    }

    // ----------------------- Get All Users Data -----------------------

    function getAllUsersData(){
        // Fetch all students, instructors, and admins separately
        $students = DB::table('students')->get();
        $instructors = DB::table('instructors')->get();
        $admins = DB::table('admins')->get();

        // Combine all into one response
        return response()->json([
            'admins' => $admins,
            'instructors' => $instructors,
            'students' => $students
        ]);
    }

    // ----------------------- Get Reports -----------------------

    function getReports(){
        $examAttempts = ExamAttempt::with([
            'student:id,name,email',
            'exam:id,exam,course_id',
            'exam.course:id,title,description' // Fetch course details
        ])
            ->select('id', 'exam_id', 'student_id', 'grade') // Select only needed columns
            ->get();

        return response()->json([
            'data' => $examAttempts
        ],200);
    }
}
