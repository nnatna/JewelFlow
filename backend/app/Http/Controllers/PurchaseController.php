<?php

namespace App\Http\Controllers;

use App\Models\Purchase;
use App\Models\Supplier;
use Illuminate\Http\Request;

class PurchaseController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $search=$request->input('search');
        $sort=$request->input('sort','created_at');
        $direction=$request->input('direction','desc');
        $purchases=Purchase::query()
            ->when($search,function($query,$search){
                return $query->where('invoice_no','like',"%{$search}%")
                    ->orWhereHas('supplier',function($query) use ($search){
                        $query->where('name','like',"%{$search}%");
                    })
                    ->orWhere('total_amount','like',"%{$search}%");
            })
            ->orderBy($sort,$direction)
            ->paginate(10);
        return view('purchases.index',compact('purchases'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $suppliers=Supplier::all();
        return view('purchases.create',compact('suppliers'));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validatedData=$request->validate([
            'supplier_id'=>'required|exists:suppliers,id',
            'invoice_no'=>'required|string|max:255',
            'total_amount'=>'required|numeric|min:0',
            'purchase_date'=>'required|date',
            'status'=>'required|in:pending,completed,cancelled',
        ]);
        Purchase::create($validatedData);
        return redirect()->route('purchases.index')->with('success','created purchase successfully');
    }

    /**
     * Display the specified resource.
     */
    public function show(Purchase $purchase)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Purchase $purchase)
    {
        $suppliers=Supplier::all();
        return view('purchases.edit',compact('purchase','suppliers'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Purchase $purchase)
    {
        $validatedData=$request->validate([
            'supplier_id'=>'required|exists:suppliers,id',
            'invoice_no'=>'required|string|max:255',
            'total_amount'=>'required|numeric|min:0',
            'purchase_date'=>'required|date',
            'status'=>'required|in:pending,completed,cancelled',
        ]);
        $purchase->update($validatedData);
        return redirect()->route('purchases.index')->with('success','updated purchase successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Purchase $purchase)
    {
        $purchase->delete();
        return redirect()->route('purchases.index')->with('success','deleted purchase successfully');
    }
}
