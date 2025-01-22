<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminsTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('admins')->insert([
            [
            'id' => 101,
            'name' => 'John Doe',
            'email' => 'john.doe@example.com',
            'birth_date' => '1990-01-01',
            'password' => Hash::make('password123'),
            ],
            [
                'id' => 102,
                'name' => 'Mike Alex',
                'email' => 'Mike.Alex@example.com',
                'birth_date' => '1990-01-01',
                'password' => Hash::make('password123'),
            ],
            [
                'id' => 103,
                'name' => 'Tom Cruse',
                'email' => 'tom.cruse@example.com',
                'birth_date' => '1990-01-01',
                'password' => Hash::make('password123'),
            ],
        ]);
    }

}
