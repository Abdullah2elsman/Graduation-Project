<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\InstructorController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\GoogleSheetsController;
use App\Models\Course;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Authentication API
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Authorization API
Route::middleware('auth:sanctum')->get('/validateToken', [AuthController::class, 'validateToken']);

// Student API
Route::post('/readStudent', [StudentController::class, 'read'])->name('student.read');
Route::put('/updateStudent', [StudentController::class, 'update'])->name('student.update');
Route::delete('deleteStudent/{id}', [StudentController::class, 'delete'])->name('student.delete');
Route::get('/getAllStudents', [StudentController::class, 'getAllStudents']);
Route::get('/getStudent/{id}' , [StudentController::class, 'getStudent']);
Route::post('/uploadImage/{id}', [StudentController::class, 'uploadImage'])->name('student.uploadImage');

// Admin API
Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/readAdmin', [AdminController::class, 'read'])->name('admin.read');
    Route::put('/updateAdmin/{id}', [AdminController::class, 'update'])->name('admin.update');
    Route::post('/deleteAdmin/{id}', [AdminController::class, 'delete'])->name('admin.delete');
    Route::post('/getAllAdmins', [AdminController::class, 'getAllAdmins']);
    Route::post('/getAdmin/{id}', [AdminController::class, 'getAdmin']);
    Route::post('/getNumOfUsers', [AdminController::class, 'getNumOfUsers']);
});


// Instructor API
Route::post('/readInstructor', [InstructorController::class, 'read'])->name('instructor.read');
Route::put('/updateInstructor', [InstructorController::class, 'update'])->name('instructor.update');
Route::delete('deleteInstructor/{id}', [InstructorController::class, 'delete'])->name('instructor.delete');
Route::get('/getAllInstructors', [InstructorController::class, 'getAllInstructors']);
Route::get('/getInstructor/{id}', [InstructorController::class, 'getInstructor']);
Route::post('/uploadImage/{id}', [InstructorController::class, 'uploadImage'])->name('instructor.uploadImage');

// Course API
Route::post('/getAllCourses', [CourseController::class, 'getAllCourses']);

// Google Sheets API
Route::get('/sheets/read', [GoogleSheetsController::class, 'readSheet']);
Route::post('/sheets/write', [GoogleSheetsController::class, 'writeSheet']);


Route::post('/test', function (Request $request){
    $data = Course::all(); // Replace 'YourModel' with your model name
    return response()->json($data);
});