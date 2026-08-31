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
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quiz_id');
            $table->string('type', 16)->default('SINGLE_CHOICE');
            $table->text('text');
            $table->decimal('points', 8, 2)->default(1.00);
            $table->unsignedInteger('position');
            $table->timestamps();

            $table->unique(['quiz_id', 'position']);

            $table->foreign('quiz_id')->references('id')->on('quizzes')->restrictOnDelete()->cascadeOnUpdate();
        });

        DB::statement("ALTER TABLE questions ADD CONSTRAINT questions_type_check CHECK (type IN ('SINGLE_CHOICE','MULTI_SELECT'))");
        DB::statement("ALTER TABLE questions ADD CONSTRAINT questions_points_positive_check CHECK (points > 0)");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('questions');
    }
};