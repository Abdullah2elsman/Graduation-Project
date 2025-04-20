<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Instructor;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class InstructorController extends Controller
{
    // ----------------------- Create Instructor -----------------------
    public function create(Request $request)
    {
        $request->validate([
            'name' => ['required', 'max:255'],
            'email' => ['required', 'email', 'unique:users'],
            'password' => ['required', 'min:8'],
            'age' => ['required', 'integer']
        ]);

        $instructor = new Instructor();

        $instructor->name = strip_tags($request->input('name'));
        $instructor->email = strip_tags($request->input('email'));
        $instructor->password = Hash::make(strip_tags($request->input('password')));
        $instructor->age = strip_tags($request->input('age'));

        // Check If Email Is Exist Or Not
        $userExists = Instructor::where('email', $instructor->email)->exists();

        if ($userExists) {
            // Email Exist
            return response()->json(['message' => 'Email already exists'], 400);
        } else {
            // Email Does Not Exist
            $instructor->save();
        }
        return redirect()->route('login');
    }

    // ----------------------- Read Instructor -----------------------
    function read(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $instructor = Instructor::where('email', $request->email)->first();

        // Check if student exists and password matches
        if ($instructor && Hash::check($request->password, $instructor->password)) {
            return redirect()->route('home', ['id' => $instructor->id]);
        }

        if (!$instructor) {
            return redirect()->route('login')->with('email_error', 'The email does not exist.');
        }

        return redirect()->route('login', ['password' => 'The password is incorrect.']);
    }
    // ----------------------- Update Instructor -----------------------

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
            $updated = DB::table('instructors')->where('id', $id)->update($data);

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
    // ----------------------- Delete Instructor -----------------------
    function delete(Request $request)
    {
        $email = $request->input('email');

        $instructor = Instructor::where('email', $email)->first();
        if ($instructor) {
            $instructor->delete();
            return response()->json(['message' => 'Record deleted successfully.'], 200);
        }

        return response()->json(['message' => 'No record found with the given email.'], 404);
    }

    // ----------------------- Get All Instructors Data -----------------------
    function getAllInstructorsData()
    {
        $instructors = Instructor::all();
        $numberOfInstructors = Instructor::count();
        return ["Instructors Data" => $instructors, "Number Of Instructors" => $numberOfInstructors];
    }

    // ----------------------- Get Instructor Data -----------------------
    function getInstructor($id)
    {
        $instructor = Instructor::find($id);
        return $instructor;
    }

    // ----------------------- Upload Instructor Image -----------------------
    function uploadImage(Request $request, $id)
    {

        $student = Instructor::find($id);  // Assuming the user is a student and logged in

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
        $updated = DB::table('instructors')->where('id', $id)->update(['image' => $path . '/' . $fileName]);

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

    public function getCourses($instructorId)
    {
        // Validate the instructor ID
        $instructor = Instructor::find($instructorId);
        if (!$instructor) {
            return response()->json(['error' => 'Instructor not found'], 404);
        }

        $courses = Course::where('instructor_id', $instructorId)->get();

        return response()->json($courses);
    }
}
