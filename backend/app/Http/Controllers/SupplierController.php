<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $search=$request->input('search');
        $sort=$request->input('sort','created_at');
        $direction=$request->input('direction','desc');
        $suppliers=Supplier::query()
            ->when($search,function($query,$search){
                return $query->where('name','like',"%{$search}%")
                    ->orWhere('email','like',"%{$search}%")
                    ->orWhere('phone','like',"%{$search}%");
            })
            ->orderBy($sort,$direction)
            ->paginate(10);
        return view('suppliers.index',compact('suppliers'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return view('suppliers.create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated=$request->validate([
            'company_name'=>'required|string|max:255',
            'contact_name'=>'required|string|max:255',
            'phone'=>'required|string|max:20',
            'address'=>'required|string|max:255',
        ]);
        Supplier::create($validated);
        return redirect()->route('suppliers.index')->with('success','Supplier created successfully');
    }

    /**
     * Display the specified resource.
     */
    public function show(Supplier $supplier)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Supplier $supplier)
    {
        return view('suppliers.edit',compact('supplier'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Supplier $supplier)
    {
        $validated=$request->validate([
            'company_name'=>'required|string|max:255',
            'contact_name'=>'required|string|max:255',
            'phone'=>'required|string|max:20',
            'address'=>'required|string|max:255',
        ]);
        $supplier->update($validated);
        return redirect()->route('suppliers.index')->with('success','Supplier updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Supplier $supplier)
    {
        $supplier->delete();
        return redirect()->route('suppliers.index')->with('success','Supplier deleted successfully');
    }
}
