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
        Schema::create('course_books', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id');
            $table->foreignId('uploaded_by_user_id');
            $table->string('title');
            $table->string('original_name');
            $table->string('storage_path', 500)->unique();
            $table->string('mime_type', 100);
            $table->unsignedBigInteger('file_size');
            $table->char('checksum_sha256', 64)->nullable();
            $table->unsignedInteger('page_count')->nullable();
            $table->string('status', 16)->default('ACTIVE');
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();

            $table->index(['course_id', 'status']);

            $table->foreign('course_id')->references('id')->on('courses')->restrictOnDelete()->cascadeOnUpdate();
            $table->foreign('uploaded_by_user_id')->references('id')->on('users')->restrictOnDelete()->cascadeOnUpdate();
        });

        DB::statement("ALTER TABLE course_books ADD CONSTRAINT course_books_status_check CHECK (status IN ('ACTIVE','ARCHIVED'))");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('course_books');
    }
};