<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class InteractionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Student IDs from 301 to 320
        $studentIds = range(301, 320);

        // Course IDs (2, 3, 5, 6, 9)
        $courseIds = [2, 3, 5, 6, 9];

        // Fixed date range: From 2025-04-01 to 2025-05-14
        $startDate = Carbon::createFromDate(2025, 4, 1);
        $endDate = Carbon::createFromDate(2025, 5, 14);

        $types = ['view', 'click', 'download'];

        for ($date = $startDate->copy(); $date <= $endDate; $date->addDay()) {
            $interactedDate = $date->format('Y-m-d');

            foreach ($courseIds as $courseId) {
                // Random number of interactions for this course and date
                $interactionCount = rand(10, 20);

                // Shuffle student IDs and pick unique ones
                $selectedStudents = collect($studentIds)->shuffle()->take($interactionCount);

                foreach ($selectedStudents as $studentId) {
                    // Check if interaction already exists for student, course, and date
                    $exists = DB::table('book_interactions')
                        ->where('student_id', $studentId)
                        ->where('course_id', $courseId)
                        ->whereDate('interacted_date', $interactedDate)
                        ->exists();

                    if (!$exists) {
                        DB::table('book_interactions')->insert([
                            'student_id' => $studentId,
                            'course_id' => $courseId,
                            'type' => $types[array_rand($types)],
                            'interacted_date' => $interactedDate,
                        ]);
                    }
                }
            }
        }

        $this->command->info('Book interactions seeded successfully from 2025-04-01 to 2025-05-14!');
    }
}
