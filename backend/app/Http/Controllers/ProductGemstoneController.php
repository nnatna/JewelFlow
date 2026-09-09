<?php

namespace App\Http\Controllers;

use App\Models\Gemstone;
use App\Models\Product;
use App\Models\ProductGemstone;
use Illuminate\Http\Request;

class ProductGemstoneController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $search = $request->input('search');
        $sort=$request->input('sort', 'created_at');
        $direction=$request->input('direction','desc');
        $productGemstones = ProductGemstone::query()
            ->when($search, function ($query, $search) {
                return $query->whereHas('product', function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%");
                })->orWhereHas('gemstone', function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%");
                })->orWhere('quantity', 'like', "%{$search}%");
            })
            ->orderBy($sort, $direction)
            ->paginate(10);
       return view('product_gemstones.index',compact('productGemstones'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $products=Product::all();
        $gemstones=Gemstone::all();
        return view('product_gemstones.create',compact('products','gemstones'));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validatedData=$request->validate([
            'product_id'=>'required|exists:products,id',
            'gemstone_id'=>'required|exists:gemstones,id',
            'quantity'=>'required|integer|min:1',
            'total_carat'=>'required|numeric|min:0',
            'setting_cost'=>'required|numeric|min:0',
        ]);
        ProductGemstone::create($validatedData);
        return redirect()->route('product_gemstones.index')->with('success','created product gemstone successfully');

    }

    /**
     * Display the specified resource.
     */
    public function show(ProductGemstone $productGemstone)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(ProductGemstone $productGemstone)
    {
        $products=Product::all();
        $gemstones=Gemstone::all();
        return view('product_gemstones.edit',compact('productGemstone','products','gemstones'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, ProductGemstone $productGemstone)
    {
        $validatedData=$request->validate([
            'product_id'=>'required|exists:products,id',
            'gemstone_id'=>'required|exists:gemstones,id',
            'quantity'=>'required|integer|min:1',
            'total_carat'=>'required|numeric|min:0',
            'setting_cost'=>'required|numeric|min:0',
        ]);
        $productGemstone->update($validatedData);
        return redirect()->route('product_gemstones.index')->with('success','updated product gemstone successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ProductGemstone $productGemstone)
    {
        $productGemstone->delete();
        return redirect()->route('product_gemstones.index')->with('success','deleted product gemstone successfully');
    }
}
