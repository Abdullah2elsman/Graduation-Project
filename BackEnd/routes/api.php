<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\ExamController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\InstructorController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\GoogleSheetsController;
use App\Http\Controllers\ReportsController;
use Illuminate\Http\Request;

// Authentication And Authorization API
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/validateToken', [AuthController::class, 'validateToken']);
    Route::post('/logout', [AuthController::class, 'logout']);
});
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);



// Admin API
// Route::middleware(['auth:sanctum'])->group(function () {
    Route::put('admin/update/{id}', [AdminController::class, 'update']);
    Route::delete('admin/delete/{id}', [AdminController::class, 'delete']);
    Route::get('admin/getAdmin/{id}', [AdminController::class, 'getAdmin']);
    Route::get('admin/getNumOfUsers', [AdminController::class, 'getNumOfUsers']);
    Route::get('admin/getAllCourses', [AdminController::class, 'getAllCourses']);
    Route::get('admin/getAllUsersData', [AdminController::class, 'getAllUsersData']);
    Route::get('admin/getReports', [AdminController::class, 'getReports']);
    // });

// Instructor API
Route::post('/readInstructor', [InstructorController::class, 'read'])->name('instructor.read');
Route::put('/updateInstructor', [InstructorController::class, 'update'])->name('instructor.update');
Route::delete('deleteInstructor/{id}', [InstructorController::class, 'delete'])->name('instructor.delete');
Route::get('/getAllInstructors', [InstructorController::class, 'getAllInstructors']);
Route::get('/getInstructor/{id}', [InstructorController::class, 'getInstructor']);
Route::post('/uploadImage/{id}', [InstructorController::class, 'uploadImage'])->name('instructor.uploadImage');
Route::get('instructor/{id}/courses', [InstructorController::class, 'getCourses']);
Route::get('instructor/{instructorId}/getTodayExams', [InstructorController::class, 'getTodayExams']);


// Student API
Route::post('/readStudent', [StudentController::class, 'read'])->name('student.read');
Route::put('/updateStudent', [StudentController::class, 'update'])->name('student.update');
Route::delete('deleteStudent/{id}', [StudentController::class, 'delete'])->name('student.delete');
Route::get('/getAllStudents', [StudentController::class, 'getAllStudents']);
Route::get('/getStudent/{id}', [StudentController::class, 'getStudent']);
Route::post('/uploadImage/{id}', [StudentController::class, 'uploadImage'])->name('student.uploadImage');
Route::get('student/{id}/courses', [StudentController::class, 'getCourses']);
Route::get('student/{studentId}/getTodayExams', [StudentController::class, 'getTodayExams']);

// Google Sheets API
Route::get('/sheets/read', [GoogleSheetsController::class, 'readSheet']);
Route::post('/sheets/write', [GoogleSheetsController::class, 'writeSheet']);

// Course API
Route::post('/readCourse', [CourseController::class, 'readCourse']);
Route::put('/updateCourse', [CourseController::class, 'updateCourse']);
Route::delete('deleteCourse/{id}', [CourseController::class, 'deleteCourse']);
Route::post('/course/store', [CourseController::class, 'storeBook']);
Route::get('/books/pdf/{id}', [CourseController::class, 'getBook']);
Route::get('/getAllCourses', [CourseController::class, 'getAllCourses']);
Route::get('instructor/{id}/getAllCoursesExamAttempts', [CourseController::class, 'getAllCoursesExamAttempts']);
Route::get('/getCourseEnrollments', [CourseController::class, 'getCourseEnrollments']);
Route::post('/course/uploadImage', [CourseController::class, 'uploadImage']);
Route::get('instructor/{id}/coursesInteraction', [CourseController::class, 'coursesInteraction']);
Route::get('instructor/{id}/coursesAverageGrades', [CourseController::class, 'coursesAverageGrades']);
Route::get('instructor/{id}/studentsMissedAllExams', [CourseController::class, 'studentsMissedAllExams']);


// Exam API
Route::post('exam/store', [ExamController::class, 'store']);
Route::get('course/{courseId}/getExams', [ExamController::class, 'getExams']);
Route::get('course/{courseId}/getFinishedExams', [ExamController::class, 'getFinishedExamsForInstructor']);
Route::get('course/{courseId}/student/{studentId}/getFinishedExams', [ExamController::class, 'getFinishedExamsForStudent']);

// This to instructors
Route::get('/instructor/course/{courseId}/exams/getExamQuestions', [ExamController::class, 'getExamQuestions']); // This to instructors
// This to students
Route::get('/student/course/{courseId}/exams/getExamQuestions', function (Request $request, $courseId) {
    return (new ExamController)->getExamQuestions($request, $courseId, false);}); 

Route::put('exam/updateQuestions' , [ExamController::class, 'updateQuestions']);
Route::post('exam/submitExam', [ExamController::class, 'submitExam']);
Route::put('exam/regradeExam', [ExamController::class, 'regradeExam']);
Route::get('exam/examGradesDistribution', [ExamController::class, 'examGradesDistribution']);

// Reports API
Route::get('/reports/course', [ReportsController::class, 'reportsOfCourse']);
Route::get('/reports/topStudents', [ReportsController::class, 'topStudents']);
Route::get('/reports/topStudentsMissedAllExams', [ReportsController::class, 'topStudentsMissedAllExams']);
Route::get('/reports/averageGrades', [ReportsController::class, 'averageGrades']);
Route::get('/reports/studentsInteraction', [ReportsController::class, 'studentsInteraction']);
Route::get('/reports/studentsExamData', [ReportsController::class, 'studentsExamData']);
Route::get('/reports/downloadStudentReport', [ReportsController::class, 'downloadStudentReport']);

// Test
Route::get('/course/book/{id}', [CourseController::class,'show']);
Route::get('/books/pdf/{id}/page', [CourseController::class, 'getBookPage']);
Route::get('/books/pdf-content/{id}', [CourseController::class, 'getBookContent']);
