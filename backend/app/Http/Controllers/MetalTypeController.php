<?php

namespace App\Http\Controllers;

use App\Models\MetalType;
use Illuminate\Http\Request;

class MetalTypeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $search = request()->query('search');

        $sort = request()->query('sort', 'created_at');
        $direction = request()->query('direction', 'desc');

        $metalTypes = MetalType::query()
            ->when($search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->orderBy($sort, $direction)
            ->paginate(10);
        
        return view('metal_types.index', compact('metalTypes', 'search', 'sort', 'direction'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return view('metal_types.create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $metalType = new MetalType();
        $metalType->name = $validatedData['name'];
        $metalType->save();

        return redirect()->route('metal_types.index')->with('success', 'Metal type created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(MetalType $metalType)
    {
        return view('metal_types.show', compact('metalType'));
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(MetalType $metalType)
    {
        return view('metal_types.edit', compact('metalType'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, MetalType $metalType)
    {
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $metalType->name = $validatedData['name'];
        $metalType->save();

        return redirect()->route('metal_types.index')->with('success', 'Metal type updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(MetalType $metalType)
    {
        $metalType->delete();

        return redirect()->route('metal_types.index')->with('success', 'Metal type deleted successfully.');
    }
}
