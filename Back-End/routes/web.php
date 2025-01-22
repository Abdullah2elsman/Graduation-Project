<?php

use App\Http\Controllers\FileController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\StudentController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    // return view('welcome');
    return "helloworld";
});
// Registration
Route::post('/registration', [AuthController::class, 'registration'])->name('registration');
// Login
Route::get('/login', [AuthController::class, 'login'])->name('login');
// Home
Route::get('/home/{id}', [AuthController::class, 'home'])->name('home');

Route::get('/photo', [FileController::class, "index"])->name("photo");
Route::post('/photo/upload', [StudentController::class, "upload"])->name("photo.upload");
//html
Route::get('/html', function () {
    return view('instructor');
});

Route::get('/test',[AuthController::class, 'test']);



