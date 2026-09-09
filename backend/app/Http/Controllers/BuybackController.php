<?php

namespace App\Http\Controllers;

use App\Models\Buyback;
use App\Models\Customer;
use App\Models\MetalType;
use Illuminate\Http\Request;

class BuybackController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $search=$request->input('search');
        $sort=$request->input('sort','buyback_date');
        $direction=$request->input('direction','desc');
        $buybacks=Buyback::query()
            ->when($search,function($query,$search){
                return $query->whereHas('customer',function($query) use ($search){
                    $query->where('name','like',"%{$search}%");
                })->orWhereHas('metalType',function($query) use ($search){
                    $query->where('name','like',"%{$search}%");
                })->orwhere('buyback_rate','like',"%{$search}%")
                ->orwhere('deduction_rate','like',"%{$search}%")
                ->orwhere('labor_deduction','like',"%{$search}%")
                ->orwhere('total_refund','like',"%{$search}%");
            })
            ->orderBy($sort,$direction)
            ->paginate(10);
        return view('buybacks.index',compact('buybacks'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $customers=Customer::all();
        $metalTypes=MetalType::all();
        return view('buybacks.create',compact('customers','metalTypes'));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated=$request->validate([
            'customer_id'=>'required|exists:customers,id',
            'metal_type_id'=>'required|exists:metal_types,id',
            'weight'=>'required|numeric|min:0',
            'buyback_rate'=>'required|numeric|min:0',
            'deduction_rate'=>'required|numeric|min:0',
            'labor_deduction'=>'required|numeric|min:0',
            'total_refund'=>'required|numeric|min:0',
            'buyback_date'=>'required|date',
        ]);
        Buyback::create($validated);
        return redirect()->route('buybacks.index')->with('success','Buyback created successfully');
    }

    /**
     * Display the specified resource.
     */
    public function show(Buyback $buyback)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Buyback $buyback)
    {
        $customers=Customer::all();
        $metalTypes=MetalType::all();
        return view('buybacks.edit',compact('buyback','customers','metalTypes'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Buyback $buyback)
    {
        $validated=$request->validate([
            'customer_id'=>'required|exists:customers,id',
            'metal_type_id'=>'required|exists:metal_types,id',
            'weight'=>'required|numeric|min:0',
            'buyback_rate'=>'required|numeric|min:0',
            'deduction_rate'=>'required|numeric|min:0',
            'labor_deduction'=>'required|numeric|min:0',
            'total_refund'=>'required|numeric|min:0',
            'buyback_date'=>'required|date',
        ]);
        $buyback->update($validated);
        return redirect()->route('buybacks.index')->with('success','Buyback updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Buyback $buyback)
    {
        $buyback->delete();
        return redirect()->route('buybacks.index')->with('success','Buyback deleted successfully');
    }
}
