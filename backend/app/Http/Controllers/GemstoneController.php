<?php

namespace App\Http\Controllers;

use App\Models\Gemstone;
use Illuminate\Http\Request;

class GemstoneController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $search = request()->query('search');

        $sort = request()->query('sort', 'created_at');
        $direction = request()->query('direction', 'desc');

        $genstones = Gemstone::query()
            ->when($search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->orderBy($sort, $direction)
            ->paginate(10);

        return view('gemstones.index', compact('gemstones', 'search', 'sort', 'direction'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return view('gemstones.create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $gemstone = new Gemstone();
        $gemstone->name = $validatedData['name'];
        $gemstone->save();

        return redirect()->route('gemstones.index')->with('success', 'Gemstone created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Gemstone $gemstone)
    {
        return view('gemstones.show', compact('gemstone'));
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Gemstone $gemstone)
    {
        return view('gemstones.edit', compact('gemstone'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Gemstone $gemstone)
    {
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $gemstone->name = $validatedData['name'];
        $gemstone->save();

        return redirect()->route('gemstones.index')->with('success', 'Gemstone updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Gemstone $gemstone)
    {
        $gemstone->delete();

        return redirect()->route('gemstones.index')->with('success', 'Gemstone deleted successfully.');
    }
}
