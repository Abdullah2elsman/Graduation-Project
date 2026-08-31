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
        Schema::create('quiz_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quiz_id');
            $table->foreignId('student_id');
            $table->unsignedInteger('attempt_number');
            $table->string('status', 16)->default('IN_PROGRESS');
            $table->string('submission_reason', 16)->nullable();
            $table->timestamp('started_at');
            $table->timestamp('submitted_at')->nullable();
            $table->decimal('score', 8, 2)->nullable();
            $table->decimal('max_score_snapshot', 8, 2);
            $table->timestamp('graded_at')->nullable();
            $table->timestamps();

            $table->unique(['quiz_id', 'student_id', 'attempt_number']);
            $table->index(['student_id', 'quiz_id', 'status']);
            $table->index(['quiz_id', 'status']);

            $table->foreign('quiz_id')->references('id')->on('quizzes')->restrictOnDelete()->cascadeOnUpdate();
            $table->foreign('student_id')->references('id')->on('users')->restrictOnDelete()->cascadeOnUpdate();
        });

        DB::statement("ALTER TABLE quiz_attempts ADD CONSTRAINT quiz_attempts_status_check CHECK (status IN ('IN_PROGRESS','SUBMITTED'))");
        DB::statement("ALTER TABLE quiz_attempts ADD CONSTRAINT quiz_attempts_submission_reason_check CHECK (submission_reason IS NULL OR submission_reason IN ('MANUAL','TIME_EXPIRED'))");
        DB::statement("ALTER TABLE quiz_attempts ADD CONSTRAINT quiz_attempts_max_score_non_negative_check CHECK (max_score_snapshot >= 0)");
        DB::statement("ALTER TABLE quiz_attempts ADD CONSTRAINT quiz_attempts_lifecycle_check CHECK ((status = 'IN_PROGRESS' AND submitted_at IS NULL AND graded_at IS NULL AND score IS NULL AND submission_reason IS NULL) OR (status = 'SUBMITTED' AND submitted_at IS NOT NULL AND graded_at IS NOT NULL AND score IS NOT NULL AND submission_reason IS NOT NULL))");
        DB::statement("ALTER TABLE quiz_attempts ADD CONSTRAINT quiz_attempts_score_bounds_check CHECK (status = 'IN_PROGRESS' OR score BETWEEN 0 AND max_score_snapshot)");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quiz_attempts');
    }
};