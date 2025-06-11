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

// ========== Auth Routes ==========
Route::prefix('auth')->group(function () {
    //Login
    Route::post('login/admin', [AuthController::class, 'adminLogin']);
    Route::post('login/student', [AuthController::class, 'studentLogin']);
    Route::post('login/instructor', [AuthController::class, 'instructorLogin']);
    
    // Protected Auth APIs
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('validate-token', [AuthController::class, 'validateToken']);
        Route::post('logout', [AuthController::class, 'logout']);
    });
});



// ========== Admin Routes ==========
Route::prefix('admin')->middleware(['auth:admin'])->group(function () {
    Route::put('update/{id}', [AdminController::class, 'update']);
    Route::delete('delete/{id}', [AdminController::class, 'delete']);
    Route::get('get/{id}', [AdminController::class, 'getAdmin']);
    Route::get('users/count', [AdminController::class, 'getNumOfUsers']);
    Route::get('courses', [AdminController::class, 'getAllCourses']);
    Route::get('users/data', [AdminController::class, 'getAllUsersData']);
    Route::get('reports', [AdminController::class, 'getReports']);
});


// ========== Instructor Routes ==========
Route::prefix('instructor')->middleware(['auth:instructor'])->group(function () {
    Route::post('read', [InstructorController::class, 'read']);
    Route::put('update', [InstructorController::class, 'update']);
    Route::delete('delete/{id}', [InstructorController::class, 'delete']);
    Route::get('all', [InstructorController::class, 'getAllInstructors']);
    Route::get('get/{id}', [InstructorController::class, 'getInstructor']);
    Route::post('upload-image/{id}', [InstructorController::class, 'uploadImage']);
    Route::get('{id}/courses', [InstructorController::class, 'getCourses']);
    Route::get('{id}/today-exams', [InstructorController::class, 'getTodayExams']);
    Route::get('{id}/course-interaction', [CourseController::class, 'coursesInteraction']);
    Route::get('{id}/courses-average-grades', [CourseController::class, 'coursesAverageGrades']);
    Route::get('{id}/students-missed-all-exams', [CourseController::class, 'studentsMissedAllExams']);
    Route::get('reports/students-exam-data', [ReportsController::class, 'studentsExamData']);
    Route::get('course/{courseId}/get-exams', [ExamController::class, 'getExams']);
    Route::get('course/{courseId}/get-finished-exams', [ExamController::class, 'getFinishedExamsForInstructor']);
    Route::post('exam/store', [ExamController::class, 'store']);
    Route::put('exam/update-questions', [ExamController::class, 'updateQuestions']);
    Route::put('exam/regrade-exam', [ExamController::class, 'regradeExam']);
    Route::post('exam/submit-exam', [ExamController::class, 'submitExam']);
    Route::get('exam/exam-grades-distribution', [ExamController::class, 'examGradesDistribution']);
    Route::get('course/{courseId}/exams/get-exam-questions', [ExamController::class, 'getExamQuestions']); // This to instructors
    Route::get('course/book', [CourseController::class, 'getBook']);
    Route::get('course/book/get-single-page', [CourseController::class, 'getPdfSinglePage']);
    Route::delete('exam/delete', [ExamController::class, 'deleteExam']);
    Route::put('exam/update-available', [ExamController::class, 'UpdateAvailable']);
    Route::put('exam/update-available', [ExamController::class, 'UpdateAvailable']);
});
Route::get('course/book', [CourseController::class, 'getBook']);
Route::get('course/book/get-single-page', [CourseController::class, 'getPdfSinglePage']);
Route::get('course/book/get-pdf-page-text', [CourseController::class, 'getPdfPageText']);

// ========== Student Routes ==========
Route::prefix('student')->middleware(['auth:student'])->group(function () {
    Route::post('read', [StudentController::class, 'read']);
    Route::put('update', [StudentController::class, 'update']);
    Route::delete('delete/{id}', [StudentController::class, 'delete']);
    Route::get('all', [StudentController::class, 'getAllStudents']);
    Route::get('get/{id}', [StudentController::class, 'getStudent']);
    Route::post('upload-image/{id}', [StudentController::class, 'uploadImage']);
    Route::get('{id}/today-exams', [StudentController::class, 'getTodayExams']);
    Route::get('course/{courseId}/get-exams', [ExamController::class, 'getExams']);
    Route::get('course/{courseId}/student/{studentId}/get-finished-exams', [ExamController::class, 'getFinishedExamsForStudent']);
});
Route::get('course/{courseId}/student/{studentId}/get-finished-exams', [ExamController::class, 'getFinishedExamsForStudent']);
Route::get('student/{id}/courses', [StudentController::class, 'getCourses']);

// Google Sheets API
Route::get('sheets/read', [GoogleSheetsController::class, 'readSheet']);
Route::post('sheets/write', [GoogleSheetsController::class, 'writeSheet']);

// Course API
Route::post('readCourse', [CourseController::class, 'readCourse']);
Route::put('updateCourse', [CourseController::class, 'updateCourse']);
Route::delete('deleteCourse/{id}', [CourseController::class, 'deleteCourse']);
Route::post('course/store', [CourseController::class, 'storeBook']);
Route::get('getAllCourses', [CourseController::class, 'getAllCourses']);
Route::get('instructor/{id}/getAllCoursesExamAttempts', [CourseController::class, 'getAllCoursesExamAttempts']);
Route::get('getCourseEnrollments', [CourseController::class, 'getCourseEnrollments']);
Route::post('course/uploadImage', [CourseController::class, 'uploadImage']);
// Route::get('course/book/get-single-page', function () {
//     return "test";
// });

// Exam API
// This to instructors
// This to students
Route::get('student/course/{courseId}/exams/getExamQuestions', function (Request $request, $courseId) {
    return (new ExamController)->getExamQuestions($request, $courseId, false);
});


// Reports API
Route::get('reports/course', [ReportsController::class, 'reportsOfCourse']);
Route::get('reports/topStudents', [ReportsController::class, 'topStudents']);
Route::get('reports/topStudentsMissedAllExams', [ReportsController::class, 'topStudentsMissedAllExams']);
Route::get('reports/averageGrades', [ReportsController::class, 'averageGrades']);
Route::get('reports/studentsInteraction', [ReportsController::class, 'studentsInteraction']);
Route::get('reports/downloadStudentReport', [ReportsController::class, 'downloadStudentReport']);

// Test
Route::get('course/book/{id}', [CourseController::class, 'show']);
Route::get('books/pdf/{id}/page', [CourseController::class, 'getBookPage']);
Route::get('books/pdf-content/{id}', [CourseController::class, 'getBookContent']);
