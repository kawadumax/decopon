<?php

namespace App\Enums;

enum Locale: string
{
    case JAPANESE = 'ja';
    case ENGLISH = 'en';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
