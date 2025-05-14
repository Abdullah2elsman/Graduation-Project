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
        Schema::table('enrollments', function (Blueprint $table) {
            // Create a generated column that only reflects active enrollments
            $table->boolean('is_active')->storedAs('IF(cancelled = 0, 1, 0)');
        });

        // Add unique constraint to student + course where is_active = 1
        Schema::table('enrollments', function (Blueprint $table) {
            $table->unique(['student_id', 'course_id', 'is_active'], 'unique_active_enrollment');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropUnique('unique_active_enrollment');
            $table->dropColumn('is_active');
        });
    }
};
