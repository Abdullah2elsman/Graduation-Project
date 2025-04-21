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
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->string('title')->nullable(false);
            $table->text('description');
            $table->unsignedBigInteger('instructor_id');
            $table->unsignedBigInteger('admin_id');
            $table->smallInteger('number_of_exams')->unsigned()->default(4);
            $table->smallInteger('completed_exams')->unsigned()->default(0);
            $table->string('file_path')->nullable();
            $table->string('file_type')->nullable();
            $table->foreign('admin_id')->references('id')->on('admins')->onDelete('cascade'); // Add foreign key
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('courses');
    }
};
