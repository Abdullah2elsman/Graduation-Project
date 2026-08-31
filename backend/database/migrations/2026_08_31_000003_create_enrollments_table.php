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
        Schema::create('enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id');
            $table->foreignId('student_id');
            $table->string('status', 16)->default('ACTIVE');
            $table->foreignId('enrolled_by_admin_id');
            $table->timestamp('enrolled_at');
            $table->foreignId('cancelled_by_admin_id')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->timestamps();

            $table->unique(['course_id', 'student_id']);
            $table->index(['course_id', 'status']);
            $table->index(['student_id', 'status']);

            $table->foreign('course_id')->references('id')->on('courses')->restrictOnDelete()->cascadeOnUpdate();
            $table->foreign('student_id')->references('id')->on('users')->restrictOnDelete()->cascadeOnUpdate();
            $table->foreign('enrolled_by_admin_id')->references('id')->on('users')->restrictOnDelete()->cascadeOnUpdate();
            $table->foreign('cancelled_by_admin_id')->references('id')->on('users')->restrictOnDelete()->cascadeOnUpdate();
        });

        DB::statement("ALTER TABLE enrollments ADD CONSTRAINT enrollments_status_check CHECK (status IN ('ACTIVE','CANCELLED'))");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('enrollments');
    }
};