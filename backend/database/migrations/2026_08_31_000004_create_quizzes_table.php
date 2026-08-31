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
        Schema::create('quizzes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id');
            $table->foreignId('created_by_instructor_id');
            $table->string('title');
            $table->text('instructions')->nullable();
            $table->string('creation_method', 16)->default('MANUAL');
            $table->string('status', 16)->default('DRAFT');
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->unsignedInteger('max_attempts')->default(1);
            $table->timestamp('published_at')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();

            $table->index(['course_id', 'status']);
            $table->index(['status', 'starts_at', 'ends_at']);

            $table->foreign('course_id')->references('id')->on('courses')->restrictOnDelete()->cascadeOnUpdate();
            $table->foreign('created_by_instructor_id')->references('id')->on('users')->restrictOnDelete()->cascadeOnUpdate();
        });

        DB::statement("ALTER TABLE quizzes ADD CONSTRAINT quizzes_creation_method_check CHECK (creation_method IN ('MANUAL','AI'))");
        DB::statement("ALTER TABLE quizzes ADD CONSTRAINT quizzes_status_check CHECK (status IN ('DRAFT','PUBLISHED','ARCHIVED'))");
        DB::statement("ALTER TABLE quizzes ADD CONSTRAINT quizzes_max_attempts_check CHECK (max_attempts >= 1)");
        DB::statement("ALTER TABLE quizzes ADD CONSTRAINT quizzes_schedule_range_check CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)");
        DB::statement("ALTER TABLE quizzes ADD CONSTRAINT quizzes_published_requires_schedule_check CHECK (status <> 'PUBLISHED' OR (starts_at IS NOT NULL AND ends_at IS NOT NULL))");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quizzes');
    }
};