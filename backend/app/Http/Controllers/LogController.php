<?php

namespace App\Http\Controllers;

use App\Models\Log;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class LogController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        if (!Auth::check()) {
            return redirect()->route('/');
        }

        $user = Auth::user();

        return Inertia::render('Log/Index', [
            'logs' => Log::where('user_id', $user->id)->get()
        ]);
    }
}
