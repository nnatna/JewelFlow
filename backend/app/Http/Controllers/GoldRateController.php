<?php

namespace App\Http\Controllers;

use App\Models\GoldRate;
use Illuminate\Http\Request;

class GoldRateController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $search = request()->query('search');

        $sort = request()->query('sort', 'created_at');
        $direction = request()->query('direction', 'desc');

        $goldRates = GoldRate::query()
            ->when($search, function ($query, $search) {
                $query->where('rate', 'like', "%{$search}%");
            })
            ->orderBy($sort, $direction)
            ->paginate(10);

        return view('gold_rates.index', compact('goldRates', 'search', 'sort', 'direction'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return view('gold_rates.create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'rate' => 'required|numeric',
        ]);

        $goldRate = new GoldRate();
        $goldRate->rate = $validatedData['rate'];
        $goldRate->save();

        return redirect()->route('gold_rates.index')->with('success', 'Gold rate created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(GoldRate $goldRate)
    {
        return view('gold_rates.show', compact('goldRate'));
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(GoldRate $goldRate)
    {
        return view('gold_rates.edit', compact('goldRate'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, GoldRate $goldRate)
    {
        $validatedData = $request->validate([
            'rate' => 'required|numeric',
        ]);

        $goldRate->rate = $validatedData['rate'];
        $goldRate->save();

        return redirect()->route('gold_rates.index')->with('success', 'Gold rate updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(GoldRate $goldRate)
    {
        $goldRate->delete();

        return redirect()->route('gold_rates.index')->with('success', 'Gold rate deleted successfully.');
    }
}
