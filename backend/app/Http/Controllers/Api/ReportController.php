<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Buyback;
use App\Models\Category;
use App\Models\GoldRate;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\SaleItem;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /**
     * Helper to parse date range from request.
     */
    private function getDateRange(Request $request): array
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        if (! $startDate) {
            // Default to start of current month or 30 days ago
            $startDate = Carbon::now()->startOfMonth()->toDateString();
        }

        if (! $endDate) {
            $endDate = Carbon::now()->endOfDay()->toDateString();
        }

        // Format dates safely
        $start = Carbon::parse($startDate)->startOfDay();
        $end = Carbon::parse($endDate)->endOfDay();

        return [$start, $end];
    }

    /**
     * Helper to convert grams to Cambodian gold units (Chi, Damlung, Hun)
     */
    private function formatKhmerGoldUnits(float $grams): array
    {
        $chi = $grams / 3.75;
        $damlung = $grams / 37.5;
        $hun = $grams / 0.375;

        return [
            'grams' => round($grams, 2),
            'chi' => round($chi, 2),
            'damlung' => round($damlung, 3),
            'hun' => round($hun, 1),
            'display_kh' => round($chi, 2).' ជី ('.round($grams, 2).' ក្រាម)',
        ];
    }

    /**
     * 1. Overview / Summary KPI Report
     * GET /api/reports/summary
     */
    public function getSummary(Request $request): JsonResponse
    {
        [$startDate, $endDate] = $this->getDateRange($request);

        // --- Sales Aggregates in Date Range ---
        $salesQuery = Sale::whereBetween('sale_date', [$startDate, $endDate]);
        $totalSalesCount = (clone $salesQuery)->count();
        $grossSales = (clone $salesQuery)->sum('total_amount') ?? 0;
        $totalDiscount = (clone $salesQuery)->sum('discount') ?? 0;
        $totalTax = (clone $salesQuery)->sum('tax') ?? 0;
        $netSales = (float) ((clone $salesQuery)->sum('grand_total_usd') ?? 0);

        // Sale items totals (Weight sold, labor fee, gemstone sales)
        $saleItemsInPeriod = SaleItem::whereHas('sale', function ($q) use ($startDate, $endDate) {
            $q->whereBetween('sale_date', [$startDate, $endDate]);
        });

        $totalWeightSoldGrams = (float) (clone $saleItemsInPeriod)->sum('weight_sold') ?? 0;
        $totalLaborFeeCollected = (float) (clone $saleItemsInPeriod)->sum('labor_fee') ?? 0;
        $totalGemstoneRevenue = (float) (clone $saleItemsInPeriod)->sum('gemstone_price') ?? 0;

        // --- Buybacks (Scrap Trade-ins) in Date Range ---
        $buybacksQuery = Buyback::whereBetween('buyback_date', [$startDate, $endDate]);
        $totalBuybacksCount = (clone $buybacksQuery)->count();
        $totalBuybacksPayout = (float) (clone $buybacksQuery)->sum('total_refund') ?? 0;
        $totalScrapWeightGrams = (float) (clone $buybacksQuery)->sum('weight') ?? 0;
        $totalDeductions = (float) (clone $buybacksQuery)->sum(DB::raw('COALESCE(deduction_rate, 0) + COALESCE(labor_deduction, 0)')) ?? 0;

        // --- Supplier Purchases in Date Range ---
        $purchasesQuery = Purchase::whereBetween('purchase_date', [$startDate, $endDate]);
        $totalPurchasesCount = (clone $purchasesQuery)->count();
        $totalPurchasesAmount = (float) (clone $purchasesQuery)->sum('total_amount') ?? 0;

        // --- Live Vault / Stock Snapshot ---
        $products = Product::with('metalType')->get();
        $totalProductsCount = $products->count();
        $totalStockUnits = $products->sum('stock_qty');
        $totalVaultWeightGrams = 0;
        $estimatedRetailValuation = 0;
        $estimatedCostValuation = 0;
        $lowStockCount = 0;

        // Fetch latest gold rates for valuation
        $latestRates = GoldRate::orderBy('effective_date', 'desc')
            ->get()
            ->groupBy('metal_type_id')
            ->map(fn ($rates) => $rates->first());

        foreach ($products as $p) {
            $qty = (int) $p->stock_qty;
            $netWt = (float) $p->net_weight;
            $labor = (float) $p->labor_cost;
            $markup = (float) $p->markup_rate;

            $totalVaultWeightGrams += ($netWt * $qty);

            if ($qty <= 3) {
                $lowStockCount++;
            }

            $rateObj = $latestRates->get($p->metal_type_id);
            $sellRate = $rateObj ? (float) $rateObj->sell_rate : 85.50;
            $buyRate = $rateObj ? (float) $rateObj->buy_rate : 80.00;

            // Estimated retail valuation: (weight * sell_rate + labor_cost) * (1 + markup%)
            $itemRetail = (($netWt * $sellRate) + $labor) * (1 + ($markup / 100));
            $estimatedRetailValuation += ($itemRetail * $qty);

            // Estimated metal cost value
            $estimatedCostValuation += (($netWt * $buyRate + $labor) * $qty);
        }

        // --- Cash Flow Summary ---
        $cashIn = $netSales;
        $cashOut = $totalBuybacksPayout + $totalPurchasesAmount;
        $netCashFlow = $cashIn - $cashOut;

        return response()->json([
            'date_range' => [
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
            ],
            'sales' => [
                'count' => $totalSalesCount,
                'gross_total' => round($grossSales, 2),
                'discount' => round($totalDiscount, 2),
                'tax' => round($totalTax, 2),
                'grand_total' => round($netSales, 2),
                'average_ticket' => $totalSalesCount > 0 ? round($netSales / $totalSalesCount, 2) : 0,
                'weight_sold' => $this->formatKhmerGoldUnits($totalWeightSoldGrams),
                'labor_fee_collected' => round($totalLaborFeeCollected, 2),
                'gemstone_revenue' => round($totalGemstoneRevenue, 2),
            ],
            'buybacks' => [
                'count' => $totalBuybacksCount,
                'total_payout' => round($totalBuybacksPayout, 2),
                'total_deductions_profit' => round($totalDeductions, 2),
                'scrap_weight' => $this->formatKhmerGoldUnits($totalScrapWeightGrams),
                'average_payout' => $totalBuybacksCount > 0 ? round($totalBuybacksPayout / $totalBuybacksCount, 2) : 0,
            ],
            'purchases' => [
                'count' => $totalPurchasesCount,
                'total_amount' => round($totalPurchasesAmount, 2),
            ],
            'vault_inventory' => [
                'total_products' => $totalProductsCount,
                'total_units_in_stock' => $totalStockUnits,
                'low_stock_items' => $lowStockCount,
                'total_gold_weight' => $this->formatKhmerGoldUnits($totalVaultWeightGrams),
                'estimated_retail_valuation' => round($estimatedRetailValuation, 2),
                'estimated_cost_valuation' => round($estimatedCostValuation, 2),
            ],
            'financial' => [
                'cash_in' => round($cashIn, 2),
                'cash_out' => round($cashOut, 2),
                'net_cash_flow' => round($netCashFlow, 2),
            ],
        ]);
    }

    /**
     * 2. Comprehensive Sales Report
     * GET /api/reports/sales
     */
    public function getSalesReport(Request $request): JsonResponse
    {
        [$startDate, $endDate] = $this->getDateRange($request);

        $query = Sale::with(['customer', 'user', 'saleItems.product.metalType', 'saleItems.product.category'])
            ->whereBetween('sale_date', [$startDate, $endDate]);

        // Optional filters
        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        $allSales = (clone $query)->latest('sale_date')->get();

        // 1. Overall Summary
        $totalInvoices = $allSales->count();
        $grossTotal = (float) $allSales->sum('total_amount');
        $totalDiscount = (float) $allSales->sum('discount');
        $totalTax = (float) $allSales->sum('tax');
        $grandTotal = (float) $allSales->sum('grand_total_usd');
        $avgTicket = $totalInvoices > 0 ? ($grandTotal / $totalInvoices) : 0;

        // Sale items aggregates
        $allSaleItems = $allSales->flatMap->saleItems;
        $totalWeightSoldGrams = (float) $allSaleItems->sum('weight_sold');
        $totalLaborFee = (float) $allSaleItems->sum('labor_fee');
        $totalGemstoneRevenue = (float) $allSaleItems->sum('gemstone_price');

        // 2. Daily Sales Trend for Charts
        $salesByDate = $allSales->groupBy(function ($sale) {
            return Carbon::parse($sale->sale_date)->toDateString();
        })->map(function ($daySales, $date) {
            $dayItems = $daySales->flatMap->saleItems;

            return [
                'date' => $date,
                'invoices_count' => $daySales->count(),
                'grand_total' => round($daySales->sum('grand_total_usd'), 2),
                'grand_total_usd' => round($daySales->sum('grand_total_usd'), 2),
                'grand_total_khr' => round($daySales->sum('grand_total_khr'), 2),
                'gross_total' => round($daySales->sum('total_amount'), 2),
                'weight_sold_g' => round($dayItems->sum('weight_sold'), 2),
                'weight_sold_chi' => round($dayItems->sum('weight_sold') / 3.75, 2),
            ];
        })->values();

        // 3. Sales Breakdown by Metal Type (Purity: 24K, 18K, 14K, Platinum...)
        $salesByMetalType = $allSaleItems->groupBy(function ($item) {
            return $item->product?->metalType?->name ?? 'Other Metal';
        })->map(function ($items, $metalName) {
            $weightG = (float) $items->sum('weight_sold');

            return [
                'metal_type' => $metalName,
                'items_sold_count' => $items->count(),
                'total_weight' => $this->formatKhmerGoldUnits($weightG),
                'total_revenue' => round($items->sum('subtotal'), 2),
                'labor_fee' => round($items->sum('labor_fee'), 2),
            ];
        })->values();

        // 4. Sales Breakdown by Category (Ring, Necklace, Bracelet, etc.)
        $salesByCategory = $allSaleItems->groupBy(function ($item) {
            return $item->product?->category?->name ?? 'Uncategorized';
        })->map(function ($items, $categoryName) {
            return [
                'category' => $categoryName,
                'items_sold_count' => $items->count(),
                'total_weight_g' => round($items->sum('weight_sold'), 2),
                'total_revenue' => round($items->sum('subtotal'), 2),
            ];
        })->sortByDesc('total_revenue')->values();

        // 5. Top Selling Products
        $topProducts = $allSaleItems->groupBy('product_id')->map(function ($items) {
            $firstItem = $items->first();
            $product = $firstItem->product;
            $qtySold = $items->sum('quantity') ?: $items->count();
            $totalRev = $items->sum('subtotal');
            $totalWt = $items->sum('weight_sold');

            return [
                'product_id' => $firstItem->product_id,
                'code_sku' => $product?->code_sku ?? ('SKU-'.$firstItem->product_id),
                'name' => $product?->name ?? ('Product #'.$firstItem->product_id),
                'metal_type' => $product?->metalType?->name ?? 'Gold',
                'category' => $product?->category?->name ?? 'Jewelry',
                'quantity_sold' => (int) $qtySold,
                'total_weight_g' => round($totalWt, 2),
                'total_weight_chi' => round($totalWt / 3.75, 2),
                'total_revenue' => round($totalRev, 2),
            ];
        })->sortByDesc('total_revenue')->take(10)->values();

        // 6. Sales by Staff/Cashier
        $salesByStaff = $allSales->groupBy('user_id')->map(function ($staffSales) {
            $user = $staffSales->first()->user;

            return [
                'user_id' => $user?->id ?? 0,
                'name' => $user?->name ?? 'Cashier Staff',
                'invoices_count' => $staffSales->count(),
                'total_revenue' => round($staffSales->sum('grand_total_usd'), 2),
            ];
        })->values();

        // Paginated sales list for the report table
        $perPage = (int) $request->query('per_page', 15);
        $paginatedSales = $query->latest('sale_date')->paginate($perPage);

        return response()->json([
            'summary' => [
                'date_range' => [
                    'start_date' => $startDate->toDateString(),
                    'end_date' => $endDate->toDateString(),
                ],
                'total_invoices' => $totalInvoices,
                'gross_total' => round($grossTotal, 2),
                'total_discount' => round($totalDiscount, 2),
                'total_tax' => round($totalTax, 2),
                'grand_total' => round($grandTotal, 2),
                'average_order_value' => round($avgTicket, 2),
                'weight_sold' => $this->formatKhmerGoldUnits($totalWeightSoldGrams),
                'labor_revenue' => round($totalLaborFee, 2),
                'gemstone_revenue' => round($totalGemstoneRevenue, 2),
            ],
            'sales_by_date' => $salesByDate,
            'sales_by_metal_type' => $salesByMetalType,
            'sales_by_category' => $salesByCategory,
            'top_products' => $topProducts,
            'sales_by_staff' => $salesByStaff,
            'sales_list' => $paginatedSales,
        ]);
    }

    /**
     * 3. Buybacks & Scrap Trade-ins Report
     * GET /api/reports/buybacks
     */
    public function getBuybackReport(Request $request): JsonResponse
    {
        [$startDate, $endDate] = $this->getDateRange($request);

        $query = Buyback::with(['customer', 'metalType'])
            ->whereBetween('buyback_date', [$startDate, $endDate]);

        if ($request->filled('metal_type_id')) {
            $query->where('metal_type_id', $request->metal_type_id);
        }
        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        $allBuybacks = (clone $query)->latest('buyback_date')->get();

        $totalTickets = $allBuybacks->count();
        $totalWeightG = (float) $allBuybacks->sum('weight');
        $totalRefund = (float) $allBuybacks->sum('total_refund');
        $totalDeductionAmount = (float) $allBuybacks->sum(function ($b) {
            return (float) ($b->deduction_rate + $b->labor_deduction);
        });

        // 1. Buybacks by Date Trend
        $buybacksByDate = $allBuybacks->groupBy(function ($b) {
            return Carbon::parse($b->buyback_date)->toDateString();
        })->map(function ($dayBuybacks, $date) {
            return [
                'date' => $date,
                'tickets_count' => $dayBuybacks->count(),
                'total_refund' => round($dayBuybacks->sum('total_refund'), 2),
                'weight_g' => round($dayBuybacks->sum('weight'), 2),
                'weight_chi' => round($dayBuybacks->sum('weight') / 3.75, 2),
            ];
        })->values();

        // 2. Buybacks by Metal Purity
        $buybacksByMetal = $allBuybacks->groupBy('metal_type_id')->map(function ($items) {
            $metal = $items->first()->metalType;
            $weightG = (float) $items->sum('weight');

            return [
                'metal_type_id' => $metal?->id ?? 0,
                'metal_name' => $metal?->name ?? 'Scrap Gold',
                'tickets_count' => $items->count(),
                'weight' => $this->formatKhmerGoldUnits($weightG),
                'total_payout' => round($items->sum('total_refund'), 2),
                'average_rate' => $items->count() > 0 ? round($items->avg('buyback_rate'), 2) : 0,
            ];
        })->values();

        $perPage = (int) $request->query('per_page', 15);
        $paginatedBuybacks = $query->latest('buyback_date')->paginate($perPage);

        return response()->json([
            'summary' => [
                'date_range' => [
                    'start_date' => $startDate->toDateString(),
                    'end_date' => $endDate->toDateString(),
                ],
                'total_tickets' => $totalTickets,
                'total_payout' => round($totalRefund, 2),
                'total_deductions_profit' => round($totalDeductionAmount, 2),
                'average_payout' => $totalTickets > 0 ? round($totalRefund / $totalTickets, 2) : 0,
                'scrap_weight' => $this->formatKhmerGoldUnits($totalWeightG),
            ],
            'buybacks_by_date' => $buybacksByDate,
            'buybacks_by_metal_type' => $buybacksByMetal,
            'buybacks_list' => $paginatedBuybacks,
        ]);
    }

    /**
     * 4. Live Inventory & Vault Valuation Report
     * GET /api/reports/inventory
     */
    public function getInventoryReport(Request $request): JsonResponse
    {
        $query = Product::with(['category', 'metalType', 'image']);

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }
        if ($request->filled('metal_type_id')) {
            $query->where('metal_type_id', $request->metal_type_id);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->boolean('low_stock_only')) {
            $query->where('stock_qty', '<=', 3);
        }

        $allProducts = (clone $query)->get();

        // Latest Gold Rates
        $latestRates = GoldRate::orderBy('effective_date', 'desc')
            ->get()
            ->groupBy('metal_type_id')
            ->map(fn ($rates) => $rates->first());

        $totalUnits = 0;
        $totalNetWeightG = 0;
        $totalGrossWeightG = 0;
        $totalLaborCost = 0;
        $totalRetailValuation = 0;
        $totalCostValuation = 0;
        $lowStockCount = 0;
        $outOfStockCount = 0;

        foreach ($allProducts as $p) {
            $qty = (int) $p->stock_qty;
            $netWt = (float) $p->net_weight;
            $grossWt = (float) $p->gross_weight;
            $labor = (float) $p->labor_cost;
            $markup = (float) $p->markup_rate;

            $totalUnits += $qty;
            $totalNetWeightG += ($netWt * $qty);
            $totalGrossWeightG += ($grossWt * $qty);
            $totalLaborCost += ($labor * $qty);

            if ($qty === 0) {
                $outOfStockCount++;
            } elseif ($qty <= 3) {
                $lowStockCount++;
            }

            $rateObj = $latestRates->get($p->metal_type_id);
            $sellRate = $rateObj ? (float) $rateObj->sell_rate : 85.50;
            $buyRate = $rateObj ? (float) $rateObj->buy_rate : 80.00;

            $retailPrice = (($netWt * $sellRate) + $labor) * (1 + ($markup / 100));
            $totalRetailValuation += ($retailPrice * $qty);
            $totalCostValuation += (($netWt * $buyRate + $labor) * $qty);
        }

        // 1. Grouped by Metal Type
        $stockByMetal = $allProducts->groupBy('metal_type_id')->map(function ($items) use ($latestRates) {
            $metal = $items->first()->metalType;
            $qty = $items->sum('stock_qty');
            $weightG = $items->reduce(fn ($acc, $p) => $acc + ($p->net_weight * $p->stock_qty), 0);

            $rateObj = $latestRates->get($metal?->id);
            $sellRate = $rateObj ? (float) $rateObj->sell_rate : 85.50;
            $metalVal = $weightG * $sellRate;

            return [
                'metal_type_id' => $metal?->id ?? 0,
                'metal_name' => $metal?->name ?? 'Gold',
                'product_count' => $items->count(),
                'stock_qty' => (int) $qty,
                'weight' => $this->formatKhmerGoldUnits($weightG),
                'current_rate_per_gram' => $sellRate,
                'metal_valuation' => round($metalVal, 2),
            ];
        })->values();

        // 2. Grouped by Category
        $stockByCategory = $allProducts->groupBy('category_id')->map(function ($items) use ($latestRates) {
            $category = $items->first()->category;
            $qty = $items->sum('stock_qty');
            $weightG = $items->reduce(fn ($acc, $p) => $acc + ($p->net_weight * $p->stock_qty), 0);
            $categoryValuation = 0;

            foreach ($items as $p) {
                $pQty = (int) $p->stock_qty;
                $rateObj = $latestRates->get($p->metal_type_id);
                $sellRate = $rateObj ? (float) $rateObj->sell_rate : 85.50;
                $price = (($p->net_weight * $sellRate) + $p->labor_cost) * (1 + ($p->markup_rate / 100));
                $categoryValuation += ($price * $pQty);
            }

            return [
                'category_id' => $category?->id ?? 0,
                'category_name' => $category?->name ?? 'General Jewelry',
                'product_count' => $items->count(),
                'stock_qty' => (int) $qty,
                'total_weight_g' => round($weightG, 2),
                'total_weight_chi' => round($weightG / 3.75, 2),
                'retail_valuation' => round($categoryValuation, 2),
            ];
        })->values();

        // 3. Low stock alerts
        $lowStockItems = $allProducts->filter(fn ($p) => $p->stock_qty <= 3)->map(function ($p) {
            return [
                'id' => $p->id,
                'name' => $p->name,
                'code_sku' => $p->code_sku,
                'barcode' => $p->barcode,
                'stock_qty' => $p->stock_qty,
                'category' => $p->category?->name,
                'metal_type' => $p->metalType?->name,
                'net_weight' => (float) $p->net_weight,
            ];
        })->values();

        $perPage = (int) $request->query('per_page', 15);
        $paginatedProducts = $query->latest()->paginate($perPage);

        return response()->json([
            'summary' => [
                'total_products_registered' => $allProducts->count(),
                'total_stock_units' => $totalUnits,
                'low_stock_items_count' => $lowStockCount,
                'out_of_stock_count' => $outOfStockCount,
                'net_gold_weight' => $this->formatKhmerGoldUnits($totalNetWeightG),
                'gross_weight_grams' => round($totalGrossWeightG, 2),
                'total_labor_cost_invested' => round($totalLaborCost, 2),
                'estimated_retail_valuation' => round($totalRetailValuation, 2),
                'estimated_cost_valuation' => round($totalCostValuation, 2),
            ],
            'stock_by_metal_type' => $stockByMetal,
            'stock_by_category' => $stockByCategory,
            'low_stock_alerts' => $lowStockItems,
            'products_list' => $paginatedProducts,
        ]);
    }

    /**
     * 5. Financial & Cash Flow Report
     * GET /api/reports/cashflow
     */
    public function getCashFlowReport(Request $request): JsonResponse
    {
        [$startDate, $endDate] = $this->getDateRange($request);

        // Inflows (Sales)
        $sales = Sale::whereBetween('sale_date', [$startDate, $endDate])->get();
        $totalInflow = (float) $sales->sum('grand_total_usd');

        // Outflows (Buybacks + Purchases)
        $buybacks = Buyback::whereBetween('buyback_date', [$startDate, $endDate])->get();
        $totalBuybackOutflow = (float) $buybacks->sum('total_refund');

        $purchases = Purchase::whereBetween('purchase_date', [$startDate, $endDate])->get();
        $totalPurchaseOutflow = (float) $purchases->sum('total_amount');

        $totalOutflow = $totalBuybackOutflow + $totalPurchaseOutflow;
        $netCashFlow = $totalInflow - $totalOutflow;

        // Payments Table grouping (if recorded)
        $payments = Payment::whereBetween('payment_date', [$startDate, $endDate])->get();
        $paymentMethodBreakdown = $payments->groupBy('payment_method')->map(function ($methodPayments, $method) {
            return [
                'method' => $method,
                'transactions_count' => $methodPayments->count(),
                'total_amount' => round($methodPayments->sum('amount'), 2),
            ];
        })->values();

        // Build Daily Timeline of Inflow vs Outflow
        $allDates = collect();

        foreach ($sales as $s) {
            $d = Carbon::parse($s->sale_date)->toDateString();
            $allDates->push($d);
        }
        foreach ($buybacks as $b) {
            $d = Carbon::parse($b->buyback_date)->toDateString();
            $allDates->push($d);
        }
        foreach ($purchases as $p) {
            $d = Carbon::parse($p->purchase_date)->toDateString();
            $allDates->push($d);
        }

        $uniqueDates = $allDates->unique()->sort()->values();

        $dailyTimeline = $uniqueDates->map(function ($date) use ($sales, $buybacks, $purchases) {
            $daySales = $sales->filter(fn ($s) => Carbon::parse($s->sale_date)->toDateString() === $date);
            $dayBuybacks = $buybacks->filter(fn ($b) => Carbon::parse($b->buyback_date)->toDateString() === $date);
            $dayPurchases = $purchases->filter(fn ($p) => Carbon::parse($p->purchase_date)->toDateString() === $date);

            $inflow = (float) $daySales->sum('grand_total_usd');
            $outflow = (float) ($dayBuybacks->sum('total_refund') + $dayPurchases->sum('total_amount'));

            return [
                'date' => $date,
                'inflow' => round($inflow, 2),
                'outflow' => round($outflow, 2),
                'net' => round($inflow - $outflow, 2),
                'sales_count' => $daySales->count(),
                'buybacks_count' => $dayBuybacks->count(),
                'purchases_count' => $dayPurchases->count(),
            ];
        })->values();

        return response()->json([
            'summary' => [
                'date_range' => [
                    'start_date' => $startDate->toDateString(),
                    'end_date' => $endDate->toDateString(),
                ],
                'total_inflow' => round($totalInflow, 2),
                'total_outflow' => round($totalOutflow, 2),
                'total_buybacks_payout' => round($totalBuybackOutflow, 2),
                'total_purchases_payout' => round($totalPurchaseOutflow, 2),
                'net_cash_flow' => round($netCashFlow, 2),
            ],
            'payment_methods' => $paymentMethodBreakdown,
            'daily_timeline' => $dailyTimeline,
        ]);
    }

    /**
     * 6. Gold Rates History & Spread Report
     * GET /api/reports/gold-rates-history
     */
    public function getGoldRateHistoryReport(Request $request): JsonResponse
    {
        [$startDate, $endDate] = $this->getDateRange($request);

        $query = GoldRate::with('metalType')
            ->whereBetween('effective_date', [$startDate, $endDate]);

        if ($request->filled('metal_type_id')) {
            $query->where('metal_type_id', $request->metal_type_id);
        }

        $rates = (clone $query)->orderBy('effective_date', 'asc')->get();

        $ratesHistory = $rates->map(function ($r) {
            $sell = (float) $r->sell_rate;
            $buy = (float) $r->buy_rate;
            $spread = $sell - $buy;

            return [
                'id' => $r->id,
                'metal_type_id' => $r->metal_type_id,
                'metal_name' => $r->metalType?->name ?? ('Metal #'.$r->metal_type_id),
                'sell_rate' => $sell,
                'buy_rate' => $buy,
                'spread' => round($spread, 2),
                'spread_percentage' => $sell > 0 ? round(($spread / $sell) * 100, 2) : 0,
                'effective_date' => Carbon::parse($r->effective_date)->toDateString(),
                'price_per_chi' => round($sell * 3.75, 2),
                'price_per_damlung' => round($sell * 37.5, 2),
            ];
        });

        return response()->json([
            'date_range' => [
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
            ],
            'rates' => $ratesHistory,
        ]);
    }
}
