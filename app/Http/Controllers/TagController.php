<?php

namespace App\Http\Controllers;

use App\Models\Tag;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class TagController extends Controller
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

        return Inertia::render('Tag/Index', [
            'tags' => Tag::with("tasks")->where('user_id', $user->id)->get()
        ]);
    }
}
