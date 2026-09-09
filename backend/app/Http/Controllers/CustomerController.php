<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $search=$request->input('search');
        $sort=$request->input('sort','created_at');
        $direction=$request->input('direction','desc');
        $customers=Customer::query()
            ->when($search,function($query,$search){
                return $query->where('name','like',"%{$search}%")
                    ->orWhere('email','like',"%{$search}%")
                    ->orWhere('phone','like',"%{$search}%");
            })
            ->orderBy($sort,$direction)
            ->paginate(10);
        return view('customers.index',compact('customers'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return view('customers.create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated=$request->validate([
            'name'=>'required|string|max:255',
            'email'=>'required|email|unique:customers,email',
            'phone'=>'required|string|max:20',
            'address'=>'required|string|max:255',
            'loyalty_points'=>'nullable|integer|min:0',
        ]);
        Customer::create($validated);
        return redirect()->route('customers.index')->with('success','Customer created successfully');
    }

    /**
     * Display the specified resource.
     */
    public function show(Customer $customer)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Customer $customer)
    {
        return view('customers.edit',compact('customer'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Customer $customer)
    {
        $validated=$request->validate([
            'name'=>'required|string|max:255',
            'email'=>'required|email|unique:customers,email,'.$customer->id,
            'phone'=>'required|string|max:20',
            'address'=>'required|string|max:255',
            'loyalty_points'=>'nullable|integer|min:0',
        ]);
        $customer->update($validated);
        return redirect()->route('customers.index')->with('success','Customer updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Customer $customer)
    {
        $customer->delete();
        return redirect()->route('customers.index')->with('success','Customer deleted successfully');
    }
}
