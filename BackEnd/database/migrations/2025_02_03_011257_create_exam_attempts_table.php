<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('exam_attempts', function (Blueprint $table) {
            $table->id(); // Auto-increment primary key (bigint)
            $table->foreignId('exam_id')->constrained('exams')->onDelete('cascade'); // Foreign key to exams
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade'); // Foreign key to students
            $table->double('grade'); // Grade column
            $table->timestamps(); // Created_at and updated_at columns
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exam_attempts');
    }
};
