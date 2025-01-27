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
        Schema::table('students', function (Blueprint $table) {
            $table->foreign('instructor_id')->references('id')->on('instructors')->onDelete('cascade'); // Add foreign key
        });

        Schema::table('instructors', function (Blueprint $table) {
            $table->foreign('admin_id')->references('id')->on('admins')->onDelete('cascade'); // Add foreign key
        });

        Schema::table('enrollments', function (Blueprint $table) {
            $table->foreign('student_id')->references('id')->on('students')->onDelete('cascade'); // Add foreign key
            $table->foreign('course_id')->references('id')->on('courses')->onDelete('cascade'); // Add foreign key
        });

        Schema::table('courses', function (Blueprint $table) {
            $table->foreign('instructor_id')->references('id')->on('instructors')->onDelete('cascade'); // Add foreign key
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropForeign(['admin_id']); // Drop foreign key
            $table->dropColumn('admin_id'); // Drop the column if necessary
        });
    }
};
