<?php

namespace App\Support;

use Illuminate\Validation\Rules\Password;

final class PasswordRules
{
    /**
     * @return array<int, mixed>
     */
    public static function confirmed(): array
    {
        return [
            'required',
            'confirmed',
            Password::min(8)->letters()->numbers(),
        ];
    }
}
