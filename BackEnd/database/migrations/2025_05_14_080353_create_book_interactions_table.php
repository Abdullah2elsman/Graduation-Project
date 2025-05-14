<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
        public function up(): void
        {
            Schema::create('book_interactions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
                $table->foreignId('course_id')->constrained('courses')->onDelete('cascade');
                $table->string('type')->default('view'); // we can use it to expansion idea
                $table->date('interacted_date');
        });
            DB::statement('
                ALTER TABLE book_interactions
                ADD CONSTRAINT unique_student_course_date
                UNIQUE (student_id, course_id, interacted_date)
            ');        
        }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('book_interactions');
    }
};
