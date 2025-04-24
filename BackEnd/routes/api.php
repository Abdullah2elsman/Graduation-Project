<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\InstructorController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\GoogleSheetsController;
use App\Models\Admin;
use App\Models\Course;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Authentication And Authorization API
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::middleware('auth:sanctum')->get('/validateToken', [AuthController::class, 'validateToken']);
Route::middleware('auth:sanctum')->post('/logout', [AuthController::class, 'logout']);



// Student API
Route::post('/readStudent', [StudentController::class, 'read'])->name('student.read');
Route::put('/updateStudent', [StudentController::class, 'update'])->name('student.update');
Route::delete('deleteStudent/{id}', [StudentController::class, 'delete'])->name('student.delete');
Route::get('/getAllStudents', [StudentController::class, 'getAllStudents']);
Route::get('/getStudent/{id}', [StudentController::class, 'getStudent']);
Route::post('/uploadImage/{id}', [StudentController::class, 'uploadImage'])->name('student.uploadImage');

// Admin API
Route::middleware(['auth:sanctum'])->group(function () {
    Route::put('/updateAdmin/{id}', [AdminController::class, 'update'])->name('admin.update');
    Route::post('/deleteAdmin/{id}', [AdminController::class, 'delete'])->name('admin.delete');
    Route::post('/getAdmin/{id}', [AdminController::class, 'getAdmin']);
    Route::post('/getNumOfUsers', [AdminController::class, 'getNumOfUsers']);
    Route::post('/getAllCourses', [AdminController::class, 'getAllCourses']);
    Route::post('/getAllUsersData', [AdminController::class, 'getAllUsersData']);
    Route::post('/getReports', [AdminController::class, 'getReports']);
});


// Instructor API
Route::post('/readInstructor', [InstructorController::class, 'read'])->name('instructor.read');
Route::put('/updateInstructor', [InstructorController::class, 'update'])->name('instructor.update');
Route::delete('deleteInstructor/{id}', [InstructorController::class, 'delete'])->name('instructor.delete');
Route::get('/getAllInstructors', [InstructorController::class, 'getAllInstructors']);
Route::get('/getInstructor/{id}', [InstructorController::class, 'getInstructor']);
Route::post('/uploadImage/{id}', [InstructorController::class, 'uploadImage'])->name('instructor.uploadImage');
Route::get('instructor/{id}/courses', [InstructorController::class, 'getCourses']);


// Google Sheets API
Route::get('/sheets/read', [GoogleSheetsController::class, 'readSheet']);
Route::post('/sheets/write', [GoogleSheetsController::class, 'writeSheet']);

// Course API

Route::post('/createCourse', [CourseController::class, 'createCourse']);
Route::post('/readCourse', [CourseController::class, 'readCourse']);
Route::put('/updateCourse', [CourseController::class, 'updateCourse']);
Route::delete('deleteCourse/{id}', [CourseController::class, 'deleteCourse']);
Route::get('/getAllCourses', [CourseController::class, 'getAllCourses']);
Route::get('/getCourse/{id}', [CourseController::class, 'getCourse']);
Route::get('instructor/{id}/getCourseExamAttempts', [CourseController::class, 'getCourseExamAttempts']);
Route::get('/getCourseEnrollments', [CourseController::class, 'getCourseEnrollments']);
Route::post('/course/store', [CourseController::class, 'storeBook']);


// Test
Route::get('/course/book/{id}', [CourseController::class,'show']);

Route::get('/books/pdf/{id}', function ($id) {
    
    $book = Course::find($id);
    
    if (!$book) {
        return response()->json(['error' => 'Book not found'], 404);
    }

    $path = storage_path('app/public/' . $book->file_path);

    if (!file_exists($path)) {
        return response()->json(['error' => 'PDF file not found'], 404);
    }

    return response()->file($path);
});