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
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('instructor_id')->nullable();
            $table->foreignId('created_by_admin_id')->nullable();
            $table->foreignId('instructor_assigned_by_id')->nullable();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('status', 16)->default('DRAFT');
            $table->timestamp('instructor_assigned_at')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();

            $table->index(['instructor_id', 'status']);
            $table->index('status');

            $table->foreign('instructor_id')->references('id')->on('users')->restrictOnDelete()->restrictOnUpdate();
            $table->foreign('created_by_admin_id')->references('id')->on('users')->restrictOnDelete()->cascadeOnUpdate();
            $table->foreign('instructor_assigned_by_id')->references('id')->on('users')->restrictOnDelete()->cascadeOnUpdate();
        });

        DB::statement("ALTER TABLE courses ADD CONSTRAINT courses_status_check CHECK (status IN ('DRAFT','ACTIVE','ARCHIVED'))");
        DB::statement("ALTER TABLE courses ADD CONSTRAINT courses_assignment_consistency_check CHECK (instructor_id IS NULL OR instructor_assigned_at IS NOT NULL)");
        DB::statement("ALTER TABLE courses ADD CONSTRAINT courses_requires_instructor_check CHECK (status <> 'ACTIVE' OR instructor_id IS NOT NULL)");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('courses');
    }
};