<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EnrollmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // // You can use existing student and course IDs, or use factories if you have them
        // $studentIds = DB::table('students')->pluck('id')->toArray(); // adjust table name if needed
        // $courseIds = DB::table('courses')->pluck('id')->toArray();

        // foreach (range(1, 50) as $i) {
        //     DB::table('enrollments')->insert([
        //         'student_id' => $studentIds[array_rand($studentIds)],
        //         'course_id' => $courseIds[array_rand($courseIds)],
        //         'enrollment_date' => Carbon::now()->subDays(rand(0, 365)),
        //         'cancelled' => (bool)rand(0, 1),
        //         'cancelled_reason' => rand(0, 1) ? 'Scheduling conflict' : null,
        //     ]);
        // }

        $students = range(301, 320);
        $courses = [2, 3, 5, 6, 9];

        $enrollments = [];

        foreach ($students as $student_id) {
            foreach ($courses as $course_id) {
                $enrollments[] = [
                    'student_id' => $student_id,
                    'course_id' => $course_id,
                    'enrollment_date' => Carbon::now()->subDays(rand(1, 30)),
                    'cancelled' => false,
                    'cancelled_reason' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }

        DB::table('enrollments')->insert($enrollments);
        
    }
    
}
