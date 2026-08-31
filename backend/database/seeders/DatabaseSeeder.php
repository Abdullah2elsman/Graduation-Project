<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $now = now();
        $quizStartsAt = $now->copy()->subDays(2);
        $quizEndsAt = $now->copy()->addDays(7);
        $password = Hash::make('password');

        $adminId = DB::table('users')->insertGetId([
            'name' => 'Seed Admin',
            'email' => 'admin@smartbook.test',
            'password' => $password,
            'remember_token' => null,
            'role' => 'ADMIN',
            'status' => 'ACTIVE',
            'email_verified_at' => $now,
            'approved_at' => $now,
            'approved_by_user_id' => null,
            'status_changed_at' => $now,
            'status_changed_by_user_id' => null,
            'status_reason' => null,
            'created_by_user_id' => null,
            'last_login_at' => null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $instructorId = DB::table('users')->insertGetId([
            'name' => 'Seed Instructor',
            'email' => 'instructor@smartbook.test',
            'password' => $password,
            'remember_token' => null,
            'role' => 'INSTRUCTOR',
            'status' => 'ACTIVE',
            'email_verified_at' => $now,
            'approved_at' => $now,
            'approved_by_user_id' => $adminId,
            'status_changed_at' => $now,
            'status_changed_by_user_id' => $adminId,
            'status_reason' => null,
            'created_by_user_id' => $adminId,
            'last_login_at' => null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $activeStudentId = DB::table('users')->insertGetId([
            'name' => 'Seed Active Student',
            'email' => 'active.student@smartbook.test',
            'password' => $password,
            'remember_token' => null,
            'role' => 'STUDENT',
            'status' => 'ACTIVE',
            'email_verified_at' => $now,
            'approved_at' => $now,
            'approved_by_user_id' => $adminId,
            'status_changed_at' => $now,
            'status_changed_by_user_id' => $adminId,
            'status_reason' => null,
            'created_by_user_id' => null,
            'last_login_at' => null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        DB::table('users')->insert([
            'name' => 'Seed Pending Student',
            'email' => 'pending.student@smartbook.test',
            'password' => $password,
            'remember_token' => null,
            'role' => 'STUDENT',
            'status' => 'PENDING',
            'email_verified_at' => $now,
            'approved_at' => null,
            'approved_by_user_id' => null,
            'status_changed_at' => null,
            'status_changed_by_user_id' => null,
            'status_reason' => null,
            'created_by_user_id' => null,
            'last_login_at' => null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $courseId = DB::table('courses')->insertGetId([
            'instructor_id' => $instructorId,
            'created_by_admin_id' => $adminId,
            'instructor_assigned_by_id' => $adminId,
            'title' => 'Seed Course',
            'description' => 'Deterministic fixture course demonstrating the canonical Phase 1B schema.',
            'status' => 'ACTIVE',
            'instructor_assigned_at' => $now,
            'archived_at' => null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        DB::table('enrollments')->insert([
            'course_id' => $courseId,
            'student_id' => $activeStudentId,
            'status' => 'ACTIVE',
            'enrolled_by_admin_id' => $adminId,
            'enrolled_at' => $now,
            'cancelled_by_admin_id' => null,
            'cancelled_at' => null,
            'cancellation_reason' => null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $quizId = DB::table('quizzes')->insertGetId([
            'course_id' => $courseId,
            'created_by_instructor_id' => $instructorId,
            'title' => 'Seed Quiz',
            'instructions' => 'Deterministic fixture quiz with one SINGLE_CHOICE and one MULTI_SELECT question.',
            'creation_method' => 'MANUAL',
            'status' => 'PUBLISHED',
            'starts_at' => $quizStartsAt,
            'ends_at' => $quizEndsAt,
            'max_attempts' => 3,
            'published_at' => $now,
            'archived_at' => null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $singleChoiceId = DB::table('questions')->insertGetId([
            'quiz_id' => $quizId,
            'type' => 'SINGLE_CHOICE',
            'text' => 'Which storage engine does the canonical Smart Book schema mandate for every table?',
            'points' => 1.00,
            'position' => 1,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $options = [
            ['text' => 'MyISAM', 'is_correct' => false],
            ['text' => 'CSV', 'is_correct' => false],
            ['text' => 'InnoDB', 'is_correct' => true],
            ['text' => 'MEMORY', 'is_correct' => false],
        ];

        foreach ($options as $position => $option) {
            DB::table('options')->insert([
                'question_id' => $singleChoiceId,
                'text' => $option['text'],
                'is_correct' => $option['is_correct'],
                'position' => $position + 1,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        $multiSelectId = DB::table('questions')->insertGetId([
            'quiz_id' => $quizId,
            'type' => 'MULTI_SELECT',
            'text' => 'Which of the following are valid Smart Book user roles?',
            'points' => 2.00,
            'position' => 2,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $options = [
            ['text' => 'ADMIN', 'is_correct' => true],
            ['text' => 'INSTRUCTOR', 'is_correct' => true],
            ['text' => 'STUDENT', 'is_correct' => true],
            ['text' => 'GUEST', 'is_correct' => false],
        ];

        foreach ($options as $position => $option) {
            DB::table('options')->insert([
                'question_id' => $multiSelectId,
                'text' => $option['text'],
                'is_correct' => $option['is_correct'],
                'position' => $position + 1,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }
}