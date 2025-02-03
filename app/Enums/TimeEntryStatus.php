<?php

namespace App\Enums;

enum TimeEntryStatus: string
{
    case InProgress = 'In_Progress';
    case Completed = 'Completed';
    case Interrupted = 'Interrupted';
    case Abandoned = 'Abandoned';
    case Extended = 'Extended';
}
