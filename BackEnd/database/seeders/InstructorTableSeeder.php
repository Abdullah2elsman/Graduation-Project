<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class InstructorTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {

        DB::table('instructors')->insert([
            [
                'id' => 201,
                'name' => 'John Smith',
                'email' => 'john.smith@example.com',
                'birth_date' => '1980-05-15',
                'password' => Hash::make('password123'),
                'admin_id' => 101,
            ],
            [
                'id' => 202,
                'name' => 'Jane Doe',
                'email' => 'jane.doe@example.com',
                'birth_date' => '1985-08-20',
                'password' => Hash::make('password123'),
                'admin_id' => 101,
            ],
            [
                'id' => 203,
                'name' => 'Michael Johnson',
                'email' => 'michael.johnson@example.com',
                'birth_date' => '1978-02-10',
                'password' => Hash::make('password123'),
                'admin_id' => 101,
            ],
            [
                'id' => 204,
                'name' => 'Emily Brown',
                'email' => 'emily.brown@example.com',
                'birth_date' => '1990-11-25',
                'password' => Hash::make('password123'),
                'admin_id' => 102,
            ],
            [
                'id' => 205,
                'name' => 'Chris Wilson',
                'email' => 'chris.wilson@example.com',
                'birth_date' => '1982-04-30',
                'password' => Hash::make('password123'),
                'admin_id' => 102,
            ],
            [
                'id' => 206,
                'name' => 'Patricia Davis',
                'email' => 'patricia.davis@example.com',
                'birth_date' => '1987-03-12',
                'password' => Hash::make('password123'),
                'admin_id' => 102,
            ],
            [
                'id' => 207,
                'name' => 'Robert Martinez',
                'email' => 'robert.martinez@example.com',
                'birth_date' => '1975-07-08',
                'password' => Hash::make('password123'),
                'admin_id' => 103,
            ],
            [
                'id' => 208,
                'name' => 'Linda Garcia',
                'email' => 'linda.garcia@example.com',
                'birth_date' => '1992-10-14',
                'password' => Hash::make('password123'),
                'admin_id' => 103,
            ],
            [
                'id' => 209,
                'name' => 'James Hernandez',
                'email' => 'james.hernandez@example.com',
                'birth_date' => '1983-06-22',
                'password' => Hash::make('password123'),
                'admin_id' => 103,
            ],
            [
                'id' => 210,
                'name' => 'Barbara Clark',
                'email' => 'barbara.clark@example.com',
                'birth_date' => '1989-01-18',
                'password' => Hash::make('password123'),
                'admin_id' => 103,
            ],
        ]);
    
    }
}
