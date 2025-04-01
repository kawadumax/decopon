<?php

use Illuminate\Support\Facades\Log;

if (! function_exists('debug_log')) {
    /**
     * 任意のメッセージと可変長引数でログを出力する
     *
     * @param string $message
     * @param mixed ...$context
     * @return void
     */
    function debug_log(string $message, ...$context)
    {
        Log::channel('stderr')->debug($message, $context);
    }
}
