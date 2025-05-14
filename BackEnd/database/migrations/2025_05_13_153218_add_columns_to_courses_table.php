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
        Schema::table('courses', function (Blueprint $table) {
            $table->unsignedInteger('number_of_chapters')->default(0);
            $table->string('academic_year')->nullable();
        });
        DB::statement("ALTER TABLE courses ADD CONSTRAINT chk_academic_year CHECK (academic_year >= 1 AND academic_year <= 4)");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->dropColumn('number_of_chapters');
            $table->dropColumn('academic_year');
        });
        DB::statement("ALTER TABLE courses DROP CHECK chk_academic_year");
    }
};
