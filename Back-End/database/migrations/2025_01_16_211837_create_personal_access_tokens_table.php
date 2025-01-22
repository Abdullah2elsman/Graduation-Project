<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreatePersonalAccessTokensTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->morphs('tokenable'); // Polymorphic relation to models like Admin, Student, etc.
            $table->string('name'); // Name of the token
            $table->string('token', 64)->unique(); // Token value (hashed)
            $table->text('abilities')->nullable(); // Permissions for the token
            $table->timestamp('last_used_at')->nullable(); // Last usage timestamp
            $table->timestamp('expires_at')->nullable(); // Expiry timestamp
            $table->timestamps(); // Created and updated timestamps
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('personal_access_tokens');
    }
}
