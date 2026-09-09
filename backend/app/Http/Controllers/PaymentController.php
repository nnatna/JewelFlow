<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $search=$request->input('search');
        $sort=$request->input('sort','payment_date');
        $direction=$request->input('direction','desc');
        $payments=Payment::query()
            ->when($search,function($query,$search){
                return $query->where('reference_no','like',"%{$search}%")
                    ->orWhere('payment_method','like',"%{$search}%");
            })
            ->orderBy($sort,$direction)
            ->paginate(10);
        return view('payments.index',compact('payments'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return view('payments.create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated=$request->validate([
            'payable_type'=>'required|string|max:255',
            'payable_id'=>'required|integer',
            'amount'=>'required|numeric|min:0',
            'payment_method'=>'required|string|max:255',
            'payment_date'=>'required|date',
            'reference_no'=>'nullable|string|max:255',
        ]);
        Payment::create($validated);
        return redirect()->route('payments.index')->with('success','Payment created successfully');
    }

    /**
     * Display the specified resource.
     */
    public function show(Payment $payment)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Payment $payment)
    {
        return view('payments.edit',compact('payment'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Payment $payment)
    {
        $validated=$request->validate([
            'payable_type'=>'required|string|max:255',
            'payable_id'=>'required|integer',
            'amount'=>'required|numeric|min:0',
            'payment_method'=>'required|string|max:255',
            'payment_date'=>'required|date',
            'reference_no'=>'nullable|string|max:255',
        ]);
        $payment->update($validated);
        return redirect()->route('payments.index')->with('success','Payment updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Payment $payment)
    {
        $payment->delete();
        return redirect()->route('payments.index')->with('success','Payment deleted successfully');
    }
}
