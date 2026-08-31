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
        Schema::create('ai_generation_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_book_id');
            $table->foreignId('requested_by_instructor_id');
            $table->foreignId('quiz_id')->nullable();
            $table->unsignedInteger('start_page');
            $table->unsignedInteger('end_page');
            $table->unsignedInteger('question_count');
            $table->string('difficulty', 16)->default('medium');
            $table->string('provider', 64);
            $table->string('model', 128)->nullable();
            $table->string('status', 16)->default('PENDING');
            $table->json('draft_payload')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['course_book_id', 'status'], 'ai_generation_requests_book_status_idx');
            $table->index(['requested_by_instructor_id', 'created_at'], 'ai_generation_requests_instructor_created_idx');

            $table->foreign('course_book_id')->references('id')->on('course_books')->restrictOnDelete()->cascadeOnUpdate();
            $table->foreign('requested_by_instructor_id')->references('id')->on('users')->restrictOnDelete()->cascadeOnUpdate();
            $table->foreign('quiz_id')->references('id')->on('quizzes')->restrictOnDelete()->cascadeOnUpdate();
        });

        DB::statement("ALTER TABLE ai_generation_requests ADD CONSTRAINT ai_generation_requests_status_check CHECK (status IN ('PENDING','PROCESSING','COMPLETED','FAILED'))");
        DB::statement("ALTER TABLE ai_generation_requests ADD CONSTRAINT ai_generation_requests_start_page_check CHECK (start_page >= 1)");
        DB::statement("ALTER TABLE ai_generation_requests ADD CONSTRAINT ai_generation_requests_end_page_check CHECK (end_page >= start_page)");
        DB::statement("ALTER TABLE ai_generation_requests ADD CONSTRAINT ai_generation_requests_question_count_check CHECK (question_count >= 1)");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ai_generation_requests');
    }
};