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
        Schema::table('exams', function (Blueprint $table) {
            // Rename column
            $table->renameColumn('exam', 'name');

            // Add new columns
            $table->text('instructions')->nullable();
            $table->string('creation_method');
            $table->integer('duration'); // in minutes
            $table->integer('total_score');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('quizzes', function (Blueprint $table) {
            // Revert changes
            $table->renameColumn('name', 'exam');
            $table->dropColumn(['instructions', 'creation_method', 'duration', 'total_score', 'time']);
        });
    }
};
