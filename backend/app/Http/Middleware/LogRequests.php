<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class LogRequests
{
  public function handle(Request $request, Closure $next): Response
  {
    $startTime = microtime(true);
    $response = $next($request);
    $duration = round((microtime(true) - $startTime) * 1000, 2);

    // 一時的にOPTIONSも表示するため、この条件文を外す
    $message = sprintf(
      "[%s] %s %s (%.2fms) [%s]",
      $request->method(),
      $request->path(),
      $response->getStatusCode(),
      $duration,
      $request->header('X-Request-ID') ?? 'no-id'
    );

    Log::info($message, [
      'user_id' => $request->user()?->id,
    ]);

    return $response;
  }
}
