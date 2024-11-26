<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Str;
use ReflectionClass;
use ReflectionException;

class ApiController extends Controller
{
  /**
   * 国際化のためのキーをリフレクションを使って生成する
   */
  protected function generateI18nKey(string $method, int $statusCode): string
  {
    $resourceName = Str::snake(class_basename($this));
    $resourceName = str_replace('_api_controller', '', $resourceName);

    return "api.{$resourceName}.{$method}.{$statusCode}";
  }
}
