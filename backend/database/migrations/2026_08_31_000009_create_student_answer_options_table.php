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
        Schema::create('student_answer_options', function (Blueprint $table) {
            $table->foreignId('student_answer_id');
            $table->foreignId('option_id');

            $table->primary(['student_answer_id', 'option_id']);
            $table->index('option_id');

            $table->foreign('student_answer_id')->references('id')->on('student_answers')->restrictOnDelete()->cascadeOnUpdate();
            $table->foreign('option_id')->references('id')->on('options')->restrictOnDelete()->cascadeOnUpdate();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_answer_options');
    }
};