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
        Schema::create('student_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quiz_attempt_id');
            $table->foreignId('question_id');
            $table->text('question_text_snapshot');
            $table->string('question_type_snapshot', 16);
            $table->decimal('max_points_snapshot', 8, 2);
            $table->decimal('points_awarded', 8, 2)->default(0.00);
            $table->boolean('is_correct')->nullable();
            $table->timestamp('answered_at')->nullable();
            $table->timestamps();

            $table->unique(['quiz_attempt_id', 'question_id']);
            $table->index('question_id');

            $table->foreign('quiz_attempt_id')->references('id')->on('quiz_attempts')->restrictOnDelete()->cascadeOnUpdate();
            $table->foreign('question_id')->references('id')->on('questions')->restrictOnDelete()->cascadeOnUpdate();
        });

        DB::statement("ALTER TABLE student_answers ADD CONSTRAINT student_answers_type_snapshot_check CHECK (question_type_snapshot IN ('SINGLE_CHOICE','MULTI_SELECT'))");
        DB::statement("ALTER TABLE student_answers ADD CONSTRAINT student_answers_points_bounds_check CHECK (points_awarded BETWEEN 0 AND max_points_snapshot)");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_answers');
    }
};