<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class StudentTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('students')->insert([
            [
                'id' => 301,
                'name' => 'John Doe',
                'email' => 'john.doe@example.com',
                'birth_date' => '2000-01-01',
                'password' => Hash::make('password123'),
                'instructor_id' => 201,
            ],
            [
                'id' => 302,
                'name' => 'Jane Smith',
                'email' => 'jane.smith@example.com',
                'birth_date' => '1999-02-15',
                'password' => Hash::make('password123'),
                'instructor_id' => 202,
            ],
            [
                'id' => 303,
                'name' => 'Michael Brown',
                'email' => 'michael.brown@example.com',
                'birth_date' => '2001-03-20',
                'password' => Hash::make('password123'),
                'instructor_id' => 203,
            ],
            [
                'id' => 304,
                'name' => 'Emily Davis',
                'email' => 'emily.davis@example.com',
                'birth_date' => '2000-06-10',
                'password' => Hash::make('password123'),
                'instructor_id' => 204,
            ],
            [
                'id' => 305,
                'name' => 'Chris Wilson',
                'email' => 'chris.wilson@example.com',
                'birth_date' => '1998-12-05',
                'password' => Hash::make('password123'),
                'instructor_id' => 205,
            ],
            [
                'id' => 306,
                'name' => 'Patricia Johnson',
                'email' => 'patricia.johnson@example.com',
                'birth_date' => '1997-11-20',
                'password' => Hash::make('password123'),
                'instructor_id' => 206,
            ],
            [
                'id' => 307,
                'name' => 'Robert Garcia',
                'email' => 'robert.garcia@example.com',
                'birth_date' => '2002-04-18',
                'password' => Hash::make('password123'),
                'instructor_id' => 207,
            ],
            [
                'id' => 308,
                'name' => 'Linda Martinez',
                'email' => 'linda.martinez@example.com',
                'birth_date' => '1995-08-09',
                'password' => Hash::make('password123'),
                'instructor_id' => 208,
            ],
            [
                'id' => 309,
                'name' => 'James Anderson',
                'email' => 'james.anderson@example.com',
                'birth_date' => '1996-10-25',
                'password' => Hash::make('password123'),
                'instructor_id' => 209,
            ],
            [
                'id' => 310,
                'name' => 'Barbara Thomas',
                'email' => 'barbara.thomas@example.com',
                'birth_date' => '1994-05-14',
                'password' => Hash::make('password123'),
                'instructor_id' => 210,
            ],
            [
                'id' => 311,
                'name' => 'David Harris',
                'email' => 'david.harris@example.com',
                'birth_date' => '2001-07-23',
                'password' => Hash::make('password123'),
                'instructor_id' => 201,
            ],
            [
                'id' => 312,
                'name' => 'Susan Clark',
                'email' => 'susan.clark@example.com',
                'birth_date' => '2000-09-30',
                'password' => Hash::make('password123'),
                'instructor_id' => 202,
            ],
            [
                'id' => 313,
                'name' => 'Steven Rodriguez',
                'email' => 'steven.rodriguez@example.com',
                'birth_date' => '1993-02-12',
                'password' => Hash::make('password123'),
                'instructor_id' => 203,
            ],
            [
                'id' => 314,
                'name' => 'Karen Lewis',
                'email' => 'karen.lewis@example.com',
                'birth_date' => '1997-06-17',
                'password' => Hash::make('password123'),
                'instructor_id' => 204,
            ],
            [
                'id' => 315,
                'name' => 'Daniel Walker',
                'email' => 'daniel.walker@example.com',
                'birth_date' => '1995-03-03',
                'password' => Hash::make('password123'),
                'instructor_id' => 205,
            ],
            [
                'id' => 316,
                'name' => 'Sarah Hall',
                'email' => 'sarah.hall@example.com',
                'birth_date' => '1992-08-19',
                'password' => Hash::make('password123'),
                'instructor_id' => 206,
            ],
            [
                'id' => 317,
                'name' => 'Mark Allen',
                'email' => 'mark.allen@example.com',
                'birth_date' => '1999-11-08',
                'password' => Hash::make('password123'),
                'instructor_id' => 207,
            ],
            [
                'id' => 318,
                'name' => 'Betty Young',
                'email' => 'betty.young@example.com',
                'birth_date' => '1998-01-16',
                'password' => Hash::make('password123'),
                'instructor_id' => 208,
            ],
            [
                'id' => 319,
                'name' => 'Paul King',
                'email' => 'paul.king@example.com',
                'birth_date' => '1996-05-29',
                'password' => Hash::make('password123'),
                'instructor_id' => 209,
            ],
            [
                'id' => 320,
                'name' => 'Nancy Wright',
                'email' => 'nancy.wright@example.com',
                'birth_date' => '1993-12-04',
                'password' => Hash::make('password123'),
                'instructor_id' => 210,
            ],
        ]);
    }
}
