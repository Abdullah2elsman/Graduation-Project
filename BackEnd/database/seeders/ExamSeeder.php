<?php

namespace Database\Seeders;

use App\Models\Exam;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ExamSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Exam::insert([
            [
                'course_id' => 1,
                'exam' => 'Quiz 1',
                'time' => '09:00:00',
                'date' => '2025-06-10',
            ],
            [
                'course_id' => 2,
                'exam' => 'Quiz 1',
                'time' => '14:30:00',
                'date' => '2025-06-15',
            ],
            [
                'course_id' => 3,
                'exam' => 'Quiz 1',
                'time' => '11:00:00',
                'date' => '2025-06-20',
            ],
        ]);
    }
}
