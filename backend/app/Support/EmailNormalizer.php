<?php

namespace App\Support;

use Illuminate\Support\Str;

final class EmailNormalizer
{
    public static function normalize(mixed $email): string
    {
        return is_string($email) ? Str::lower(trim($email)) : '';
    }
}
