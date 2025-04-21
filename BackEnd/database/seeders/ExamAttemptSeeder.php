<?php

namespace Database\Seeders;

use App\Models\ExamAttempt;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ExamAttemptSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $examAttempts = [];

        for ($i = 1; $i <= 20; $i++) {
            $examAttempts[] = [
                'exam_id' => rand(1, 3), // Assuming there are 10 exams
                'student_id' => rand(301, 320), // Assuming there are 50 students
                'grade' => round(mt_rand(50, 100) + (mt_rand(0, 99) / 100), 2), // Generates grades between 50.00 - 100.00
            ];
        }

        DB::table('exam_attempts')->insert($examAttempts);
    }
}
