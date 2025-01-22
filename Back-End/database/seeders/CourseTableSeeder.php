<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CourseTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('courses')->insert([
            [
                'id' => 1,
                'title' => 'Introduction to Laravel',
                'description' => 'A beginner-level course to understand the basics of Laravel framework.',
                'instructor_id' => 201,
                'admin_id' => 101,
            ],
            [
                'id' => 2,
                'title' => 'Advanced PHP',
                'description' => 'Deep dive into advanced PHP concepts and practices.',
                'instructor_id' => 202,
                'admin_id' => 101,
            ],
            [
                'id' => 3,
                'title' => 'Database Design',
                'description' => 'Learn how to design robust databases for modern applications.',
                'instructor_id' => 203,
                'admin_id' => 101,
            ],
        ]);
    }
}
