import React from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGem,
  faReceipt,
  faChartPie,
  faArrowsRotate,
  faScaleBalanced,
  faMoneyBillTransfer,
  faArrowTrendUp
} from '@fortawesome/free-solid-svg-icons';

export const ReportPrintDocument = ({
  reportTab,
  startDate,
  endDate,
  selectedPreset,
  filterCustomer,
  filterUser,
  filterMetal,
  filterCategory,
  filterStatus,
  searchQuery,
  customers = [],
  users = [],
  metalTypes = [],
  categories = [],
  summaryData,
  salesData,
  buybackData,
  inventoryData,
  cashFlowData,
  goldRateData,
  exchangeRate,
  settings
}) => {
  const { t, i18n } = useTranslation();
  const isKhmer = (i18n.language || 'km').startsWith('km');

  const fxRate = Number(exchangeRate?.rate) || 4100;

  // Helper names from IDs
  const activeCustomer = customers.find(c => String(c.id) === String(filterCustomer));
  const activeUser = users.find(u => String(u.id) === String(filterUser));
  const activeMetal = metalTypes.find(m => String(m.id) === String(filterMetal));
  const activeCategory = categories.find(c => String(c.id) === String(filterCategory));

  // Current timestamp formatted
  const now = new Date();
  const printTimestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const reportDocId = `JF-REP-${(reportTab || 'SALES').toUpperCase()}-${now.getTime().toString().slice(-6)}`;

  // Tab Titles
  const tabTitles = {
    sales: {
      km: 'របាយការណ៍ប្រតិបត្តិការលក់គ្រឿងអលង្ការ',
      en: 'Official Jewelry Sales & Revenue Ledger Table',
      icon: faReceipt
    },
    summary: {
      km: 'របាយការណ៍សង្ខេបហិរញ្ញវត្ថុ និងប្រតិបត្តិការទូទៅ',
      en: 'Executive Financial & Operations Master Summary Table',
      icon: faChartPie
    },
    buybacks: {
      km: 'របាយការណ៍កំណត់ត្រាទិញមាសចាស់ចូល',
      en: 'Precious Metal Scrap Buybacks Activity Ledger',
      icon: faArrowsRotate
    },
    inventory: {
      km: 'របាយការណ៍សន្និធិ និងតម្លៃគ្រឿងអលង្ការក្នុងឃ្លាំង',
      en: 'Live Vault Inventory & Asset Valuation Report',
      icon: faScaleBalanced
    },
    cashflow: {
      km: 'របាយការណ៍កំណត់ហេតុលំហូរសាច់ប្រាក់ប្រចាំថ្ងៃ',
      en: 'Daily Cash Flow & Liquidity Movement Ledger',
      icon: faMoneyBillTransfer
    },
    goldrates: {
      km: 'របាយការណ៍ប្រវត្តិតម្លៃហាងឆេងមាសប្រចាំថ្ងៃ',
      en: 'Historical Daily Gold Fix & Market Spread Table',
      icon: faArrowTrendUp
    }
  };

  const currentTabInfo = tabTitles[reportTab] || tabTitles.sales;

  // Render Table Content directly without detail cards
  const renderTableContent = () => {
    switch (reportTab) {
      case 'sales': {
        const list = salesData?.sales_list?.data || [];
        const totalItemsCount = list.reduce((acc, s) => acc + (s.sale_items?.length || 1), 0);
        const totalGross = list.reduce((acc, s) => acc + Number(s.total_amount || 0), 0);
        const totalDiscount = list.reduce((acc, s) => acc + Number(s.discount || 0), 0);
        const totalGrandUSD = list.reduce((acc, s) => acc + Number(s.grand_total_usd || 0), 0);
        const totalGrandKHR = Math.round(totalGrandUSD * fxRate);

        return (
          <table className="w-full text-left text-[11px] border-collapse report-print-table">
            <thead>
              <tr className="bg-amber-100/60 text-amber-950 border-b-2 border-amber-500 font-bold">
                <th className="py-2 px-2.5 w-8 text-center">#</th>
                <th className="py-2 px-3">{isKhmer ? 'លេខវិក្កយបត្រ' : 'Invoice #'}</th>
                <th className="py-2 px-2.5">{isKhmer ? 'កាលបរិច្ឆេទ' : 'Date'}</th>
                <th className="py-2 px-3">{isKhmer ? 'អតិថិជន' : 'Customer'}</th>
                <th className="py-2 px-2.5">{isKhmer ? 'អ្នកគិតលុយ' : 'Cashier'}</th>
                <th className="py-2 px-2 text-center">{isKhmer ? 'ចំនួនមុខ' : 'Items'}</th>
                <th className="py-2 px-2.5 text-right">{isKhmer ? 'លក់ដុល ($)' : 'Gross ($)'}</th>
                <th className="py-2 px-2.5 text-right">{isKhmer ? 'បញ្ចុះ ($)' : 'Discount ($)'}</th>
                <th className="py-2 px-3 text-right">{isKhmer ? 'សរុបសុទ្ធ (USD)' : 'Grand Total ($)'}</th>
                <th className="py-2 px-3 text-right">{isKhmer ? 'សរុប (KHR)' : 'Total (KHR)'}</th>
                <th className="py-2 px-2 text-center">{isKhmer ? 'ស្ថានភាព' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    {isKhmer ? 'មិនមានទិន្នន័យលក់ក្នុងចន្លោះពេលនេះទេ' : 'No sales records found for this period'}
                  </td>
                </tr>
              ) : (
                list.map((sale, idx) => {
                  const grandUSD = Number(sale.grand_total_usd || 0);
                  const grandKHR = Number(sale.grand_total_khr || Math.round(grandUSD * fxRate));
                  return (
                    <tr key={sale.id} className="hover:bg-slate-50/80">
                      <td className="py-1.5 px-2.5 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-1.5 px-3 font-mono font-bold text-amber-900">{sale.invoice_no || `INV-${sale.id}`}</td>
                      <td className="py-1.5 px-2.5 font-mono text-slate-600">{String(sale.sale_date).slice(0, 10)}</td>
                      <td className="py-1.5 px-3 font-bold text-slate-900">
                        {sale.customer?.name || 'Walk-in Guest'}
                      </td>
                      <td className="py-1.5 px-2.5 text-slate-700">{sale.user?.name || 'Staff'}</td>
                      <td className="py-1.5 px-2 text-center font-mono">{sale.sale_items?.length || 1}</td>
                      <td className="py-1.5 px-2.5 text-right font-mono text-slate-700">${Number(sale.total_amount || 0).toFixed(2)}</td>
                      <td className="py-1.5 px-2.5 text-right font-mono text-rose-700">-${Number(sale.discount || 0).toFixed(2)}</td>
                      <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-950">${grandUSD.toFixed(2)}</td>
                      <td className="py-1.5 px-3 text-right font-mono text-slate-700">៛ {grandKHR.toLocaleString()}</td>
                      <td className="py-1.5 px-2 text-center">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                          {sale.status || 'completed'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr className="bg-amber-50/90 font-bold border-t-2 border-amber-400 text-slate-900">
                <td colSpan={5} className="py-2.5 px-3 text-right uppercase tracking-wider text-xs font-bold text-amber-950">
                  {isKhmer ? 'សរុបរួមទាំងអស់ (Grand Totals):' : 'Grand Totals:'}
                </td>
                <td className="py-2.5 px-2 text-center font-mono font-bold text-xs">{totalItemsCount}</td>
                <td className="py-2.5 px-2.5 text-right font-mono font-bold text-xs">${totalGross.toFixed(2)}</td>
                <td className="py-2.5 px-2.5 text-right font-mono font-bold text-rose-700 text-xs">-${totalDiscount.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-right font-mono font-extrabold text-sm text-emerald-800">${totalGrandUSD.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-xs text-slate-800">៛ {totalGrandKHR.toLocaleString()}</td>
                <td className="py-2.5 px-2 text-center font-mono text-xs">{list.length} inv</td>
              </tr>
            </tfoot>
          </table>
        );
      }

      case 'summary': {
        const s = summaryData || {};
        return (
          <table className="w-full text-left text-[11px] border-collapse report-print-table">
            <thead>
              <tr className="bg-amber-100/60 text-amber-950 border-b-2 border-amber-500 font-bold">
                <th className="py-2 px-3 w-40">{isKhmer ? 'ផ្នែក / ប្រភេទ' : 'Category'}</th>
                <th className="py-2 px-3">{isKhmer ? 'ឈ្មោះទិន្នន័យ (Metric Description)' : 'Metric Description'}</th>
                <th className="py-2 px-3 text-center">{isKhmer ? 'ចំនួន / បរិមាណ' : 'Count / Qty'}</th>
                <th className="py-2 px-3 text-right">{isKhmer ? 'ទម្ងន់មាស (ជី / ក្រាម)' : 'Gold Weight'}</th>
                <th className="py-2 px-3 text-right">{isKhmer ? 'ទឹកប្រាក់ (USD)' : 'Amount (USD)'}</th>
                <th className="py-2 px-3 text-center">{isKhmer ? 'ស្ថានភាព' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {/* Sales Group */}
              <tr>
                <td className="py-2.5 px-3 font-bold text-slate-800 bg-slate-50" rowSpan={4}>
                  {isKhmer ? 'ការលក់ចេញ' : 'Sales Revenue'}
                </td>
                <td className="py-2 px-3 text-slate-900">{isKhmer ? 'ការលក់ដុលសរុប (Gross Sales)' : 'Gross Sales Amount'}</td>
                <td className="py-2 px-3 text-center font-mono">{s.sales?.count || 0}</td>
                <td className="py-2 px-3 text-right font-mono font-bold text-amber-900">{s.sales?.weight_sold?.chi || 0} Chi</td>
                <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">${(s.sales?.gross_total || 0).toFixed(2)}</td>
                <td className="py-2 px-3 text-center"><span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700">Gross</span></td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-slate-600">{isKhmer ? 'ការបញ្ចុះតម្លៃសរុប (Promotions & VIP Discounts)' : 'Discounts & VIP Reductions'}</td>
                <td className="py-2 px-3 text-center font-mono text-slate-400">-</td>
                <td className="py-2 px-3 text-right font-mono text-slate-400">-</td>
                <td className="py-2 px-3 text-right font-mono font-bold text-rose-700">-${(s.sales?.discount || 0).toFixed(2)}</td>
                <td className="py-2 px-3 text-center"><span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-700">Discount</span></td>
              </tr>
              <tr className="bg-emerald-50/40">
                <td className="py-2 px-3 font-bold text-emerald-900">{isKhmer ? 'ចំណូលលក់សុទ្ធ (Net Sales Revenue)' : 'Net Sales Revenue (USD)'}</td>
                <td className="py-2 px-3 text-center font-mono font-bold text-emerald-800">{s.sales?.count || 0} inv</td>
                <td className="py-2 px-3 text-right font-mono font-bold text-amber-900">{s.sales?.weight_sold?.chi || 0} Chi ({s.sales?.weight_sold?.grams || 0}g)</td>
                <td className="py-2 px-3 text-right font-mono font-extrabold text-emerald-800 text-xs">${(s.sales?.grand_total || 0).toFixed(2)}</td>
                <td className="py-2 px-3 text-center"><span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">Net Active</span></td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-slate-600">{isKhmer ? 'កម្រៃឈ្នួលកែច្នៃ & ត្បូងពេជ្រ' : 'Labor Fees & Gemstone Margin'}</td>
                <td className="py-2 px-3 text-center font-mono text-slate-400">-</td>
                <td className="py-2 px-3 text-right font-mono text-slate-400">-</td>
                <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">${((s.sales?.labor_fee_collected || 0) + (s.sales?.gemstone_revenue || 0)).toFixed(2)}</td>
                <td className="py-2 px-3 text-center text-[10px] text-slate-500">{isKhmer ? 'សេវាកម្ម' : 'Services'}</td>
              </tr>

              {/* Scrap Buybacks Group */}
              <tr>
                <td className="py-2.5 px-3 font-bold text-slate-800 bg-slate-50" rowSpan={2}>
                  {isKhmer ? 'ទិញមាសចាស់' : 'Scrap Buybacks'}
                </td>
                <td className="py-2 px-3 text-slate-900">{isKhmer ? 'ទឹកប្រាក់ទិញមាសអេតចាយសរុប (Payout)' : 'Scrap Metal Trade-in Payout'}</td>
                <td className="py-2 px-3 text-center font-mono">{s.buybacks?.count || 0}</td>
                <td className="py-2 px-3 text-right font-mono font-bold text-amber-900">{s.buybacks?.scrap_weight?.chi || 0} Chi ({s.buybacks?.scrap_weight?.grams || 0}g)</td>
                <td className="py-2 px-3 text-right font-mono font-bold text-rose-700">${(s.buybacks?.total_payout || 0).toFixed(2)}</td>
                <td className="py-2 px-3 text-center"><span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-700">Outflow</span></td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-slate-600">{isKhmer ? 'ប្រាក់ចំណេញពីការកាត់កាកសំណល់' : 'Trade-in Deduction Profit'}</td>
                <td className="py-2 px-3 text-center font-mono text-slate-400">-</td>
                <td className="py-2 px-3 text-right font-mono text-slate-400">-</td>
                <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">+${(s.buybacks?.total_deductions_profit || 0).toFixed(2)}</td>
                <td className="py-2 px-3 text-center text-[10px] text-slate-500">{isKhmer ? 'កម្រៃកាត់' : 'Retention'}</td>
              </tr>

              {/* Vault Inventory Group */}
              <tr>
                <td className="py-2.5 px-3 font-bold text-slate-800 bg-slate-50" rowSpan={2}>
                  {isKhmer ? 'ស្តុកក្នុងឃ្លាំង' : 'Vault Inventory'}
                </td>
                <td className="py-2 px-3 text-slate-900">{isKhmer ? 'តម្លៃប៉ាន់ស្មានលក់រាយ (Retail Valuation)' : 'Estimated Retail Valuation (Spot Rate)'}</td>
                <td className="py-2 px-3 text-center font-mono font-bold text-slate-800">{s.vault_inventory?.total_units_in_stock || 0} pcs</td>
                <td className="py-2 px-3 text-right font-mono font-bold text-amber-900">{s.vault_inventory?.total_gold_weight?.chi || 0} Chi ({s.vault_inventory?.total_gold_weight?.grams || 0}g)</td>
                <td className="py-2 px-3 text-right font-mono font-bold text-violet-800">${(s.vault_inventory?.estimated_retail_valuation || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="py-2 px-3 text-center"><span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-violet-50 text-violet-700">Live Asset</span></td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-slate-600">{isKhmer ? 'តម្លៃថ្លៃដើមប៉ាន់ស្មាន (Cost Valuation)' : 'Estimated Raw Metal Cost'}</td>
                <td className="py-2 px-3 text-center font-mono text-slate-500">{s.vault_inventory?.total_products || 0} SKUs</td>
                <td className="py-2 px-3 text-right font-mono text-slate-400">-</td>
                <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">${(s.vault_inventory?.estimated_cost_valuation || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="py-2 px-3 text-center text-[10px] text-slate-500">{isKhmer ? 'ថ្លៃដើម' : 'Cost'}</td>
              </tr>

              {/* Cash Flow Position Group */}
              <tr className="bg-amber-50/70 font-bold border-t-2 border-amber-300">
                <td className="py-2.5 px-3 font-bold text-slate-900 bg-amber-100/50">
                  {isKhmer ? 'លំហូរសាច់ប្រាក់' : 'Net Liquidity'}
                </td>
                <td className="py-2.5 px-3 font-bold text-slate-900">{isKhmer ? 'លំហូរសាច់ប្រាក់សុទ្ធ (Inflow - Outflow)' : 'Net Cash Position (Sales - Payouts)'}</td>
                <td className="py-2.5 px-3 text-center font-mono text-slate-400">-</td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-400">-</td>
                <td className={`py-2.5 px-3 text-right font-mono font-extrabold text-xs ${(s.financial?.net_cash_flow || 0) >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
                  ${(s.financial?.net_cash_flow || 0).toFixed(2)}
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${(s.financial?.net_cash_flow || 0) >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {(s.financial?.net_cash_flow || 0) >= 0 ? 'Surplus' : 'Deficit'}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        );
      }

      case 'buybacks': {
        const list = buybackData?.buybacks_list?.data || [];
        const totalPayoutUSD = list.reduce((acc, b) => acc + Number(b.total_refund || 0), 0);
        const totalPayoutKHR = Math.round(totalPayoutUSD * fxRate);
        const totalGrams = list.reduce((acc, b) => acc + Number(b.weight || 0), 0);
        const totalChi = totalGrams / 3.75;

        return (
          <table className="w-full text-left text-[11px] border-collapse report-print-table">
            <thead>
              <tr className="bg-amber-100/60 text-amber-950 border-b-2 border-amber-500 font-bold">
                <th className="py-2 px-2.5 w-8 text-center">#</th>
                <th className="py-2 px-3">{isKhmer ? 'ប័ណ្ណ #' : 'Ticket #'}</th>
                <th className="py-2 px-2.5">{isKhmer ? 'កាលបរិច្ឆេទ' : 'Date'}</th>
                <th className="py-2 px-3">{isKhmer ? 'អតិថិជន' : 'Customer'}</th>
                <th className="py-2 px-2.5">{isKhmer ? 'ប្រភេទមាស' : 'Metal Karat'}</th>
                <th className="py-2 px-2 text-center">{isKhmer ? 'ទម្ងន់ (g)' : 'Weight (g)'}</th>
                <th className="py-2 px-2 text-center">{isKhmer ? 'ទម្ងន់ (ជី)' : 'Weight (Chi)'}</th>
                <th className="py-2 px-2.5 text-right">{isKhmer ? 'តម្លៃ ($/g)' : 'Rate ($/g)'}</th>
                <th className="py-2 px-3 text-right">{isKhmer ? 'ទឹកប្រាក់ ($)' : 'Payout ($)'}</th>
                <th className="py-2 px-3 text-right">{isKhmer ? 'ទឹកប្រាក់ (KHR)' : 'Payout (KHR)'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    {isKhmer ? 'មិនមានទិន្នន័យទិញមាសចាស់ចូលទេ' : 'No scrap buyback records found'}
                  </td>
                </tr>
              ) : (
                list.map((b, idx) => {
                  const refundUSD = Number(b.total_refund || 0);
                  const refundKHR = Math.round(refundUSD * fxRate);
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/80">
                      <td className="py-1.5 px-2.5 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-1.5 px-3 font-mono font-bold text-amber-900">#{b.id}</td>
                      <td className="py-1.5 px-2.5 font-mono text-slate-600">{String(b.buyback_date).slice(0, 10)}</td>
                      <td className="py-1.5 px-3 font-bold text-slate-900">{b.customer?.name || 'Walk-in Client'}</td>
                      <td className="py-1.5 px-2.5 font-semibold text-amber-800">{b.metal_type?.name || 'Gold Scrap'}</td>
                      <td className="py-1.5 px-2 text-center font-mono">{b.weight} g</td>
                      <td className="py-1.5 px-2 text-center font-mono font-bold text-amber-900">{((b.weight || 0) / 3.75).toFixed(2)} ជី</td>
                      <td className="py-1.5 px-2.5 text-right font-mono text-slate-700">${b.buyback_rate || 0}</td>
                      <td className="py-1.5 px-3 text-right font-mono font-bold text-rose-700">${refundUSD.toFixed(2)}</td>
                      <td className="py-1.5 px-3 text-right font-mono text-slate-700">៛ {refundKHR.toLocaleString()}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr className="bg-amber-50/90 font-bold border-t-2 border-amber-400 text-slate-900">
                <td colSpan={5} className="py-2.5 px-3 text-right uppercase tracking-wider text-xs font-bold text-amber-950">
                  {isKhmer ? 'សរុបការទិញចូល (Total Buybacks):' : 'Total Buybacks:'}
                </td>
                <td className="py-2.5 px-2 text-center font-mono font-bold text-xs">{totalGrams.toFixed(2)} g</td>
                <td className="py-2.5 px-2 text-center font-mono font-bold text-xs text-amber-900">{totalChi.toFixed(2)} ជី</td>
                <td className="py-2.5 px-2.5 text-right font-mono font-bold text-xs">-</td>
                <td className="py-2.5 px-3 text-right font-mono font-extrabold text-sm text-rose-800">${totalPayoutUSD.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-xs text-slate-800">៛ {totalPayoutKHR.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        );
      }

      case 'inventory': {
        const list = inventoryData?.products_list?.data || [];
        const totalUnits = list.reduce((acc, p) => acc + Number(p.stock_qty || 0), 0);
        const totalGoldGrams = list.reduce((acc, p) => acc + (Number(p.net_weight || 0) * Number(p.stock_qty || 0)), 0);
        const totalGoldChi = totalGoldGrams / 3.75;
        const totalValuationUSD = list.reduce((acc, p) => {
          const qty = Number(p.stock_qty || 0);
          const netWt = Number(p.net_weight || 0);
          const labor = Number(p.labor_cost || 0);
          const markup = Number(p.markup_rate || 0);
          const estItemRetail = ((netWt * 85.50) + labor) * (1 + (markup / 100));
          return acc + (estItemRetail * qty);
        }, 0);

        return (
          <table className="w-full text-left text-[11px] border-collapse report-print-table">
            <thead>
              <tr className="bg-amber-100/60 text-amber-950 border-b-2 border-amber-500 font-bold">
                <th className="py-2 px-2.5 w-8 text-center">#</th>
                <th className="py-2 px-3">{isKhmer ? 'កូដ SKU' : 'SKU'}</th>
                <th className="py-2 px-3">{isKhmer ? 'ឈ្មោះគ្រឿងអលង្ការ' : 'Jewelry Piece'}</th>
                <th className="py-2 px-2.5">{isKhmer ? 'ប្រភេទ' : 'Category'}</th>
                <th className="py-2 px-2.5">{isKhmer ? 'កម្រិតទឹកមាស' : 'Metal Karat'}</th>
                <th className="py-2 px-2.5 text-center">{isKhmer ? 'ទម្ងន់/គ្រឿង' : 'Unit Wt'}</th>
                <th className="py-2 px-2 text-center">{isKhmer ? 'ក្នុងស្តុក' : 'Stock Qty'}</th>
                <th className="py-2 px-3 text-right">{isKhmer ? 'តម្លៃលក់សរុប ($)' : 'Total Est. Value ($)'}</th>
                <th className="py-2 px-2 text-center">{isKhmer ? 'ស្ថានភាព' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    {isKhmer ? 'មិនមានផលិតផលក្នុងស្តុកទេ' : 'No inventory items found'}
                  </td>
                </tr>
              ) : (
                list.map((p, idx) => {
                  const qty = Number(p.stock_qty || 0);
                  const netWt = Number(p.net_weight || 0);
                  const labor = Number(p.labor_cost || 0);
                  const markup = Number(p.markup_rate || 0);
                  const estItemRetail = ((netWt * 85.50) + labor) * (1 + (markup / 100));
                  const estTotalRetail = estItemRetail * qty;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80">
                      <td className="py-1.5 px-2.5 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-1.5 px-3 font-mono font-bold text-amber-900">{p.code_sku || `SKU-${p.id}`}</td>
                      <td className="py-1.5 px-3 font-bold text-slate-900">{p.name}</td>
                      <td className="py-1.5 px-2.5 text-slate-600">{p.category?.name || 'Jewelry'}</td>
                      <td className="py-1.5 px-2.5 font-semibold text-amber-800">{p.material?.metal_type?.name || p.material?.metalType?.name || p.metal_type?.name || p.metalType?.name || 'Gold'}</td>
                      <td className="py-1.5 px-2.5 text-center font-mono">{netWt}g ({(netWt / 3.75).toFixed(2)} ជី)</td>
                      <td className="py-1.5 px-2 text-center font-mono font-bold text-slate-900">{qty} pcs</td>
                      <td className="py-1.5 px-3 text-right font-mono font-bold text-emerald-800">${estTotalRetail.toFixed(2)}</td>
                      <td className="py-1.5 px-2 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${qty === 0 ? 'bg-rose-50 text-rose-700' : qty <= 3 ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'}`}>
                          {qty === 0 ? (isKhmer ? 'អស់ស្តុក' : 'Out') : qty <= 3 ? (isKhmer ? 'ជិតអស់' : 'Low') : (isKhmer ? 'មាន' : 'In Stock')}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr className="bg-amber-50/90 font-bold border-t-2 border-amber-400 text-slate-900">
                <td colSpan={5} className="py-2.5 px-3 text-right uppercase tracking-wider text-xs font-bold text-amber-950">
                  {isKhmer ? 'សរុបតម្លៃស្តុកក្នុងឃ្លាំង (Total Vault Inventory):' : 'Total Vault Inventory:'}
                </td>
                <td className="py-2.5 px-2.5 text-center font-mono font-bold text-xs text-amber-900">{totalGoldChi.toFixed(2)} ជី</td>
                <td className="py-2.5 px-2 text-center font-mono font-bold text-xs">{totalUnits} pcs</td>
                <td className="py-2.5 px-3 text-right font-mono font-extrabold text-sm text-emerald-800">${totalValuationUSD.toFixed(2)}</td>
                <td className="py-2.5 px-2 text-center font-mono text-xs">{list.length} SKUs</td>
              </tr>
            </tfoot>
          </table>
        );
      }

      case 'cashflow': {
        const list = cashFlowData?.daily_timeline || [];
        const summary = cashFlowData?.summary || {};
        return (
          <table className="w-full text-left text-[11px] border-collapse report-print-table">
            <thead>
              <tr className="bg-amber-100/60 text-amber-950 border-b-2 border-amber-500 font-bold">
                <th className="py-2 px-2.5 w-8 text-center">#</th>
                <th className="py-2 px-3">{isKhmer ? 'កាលបរិច្ឆេទ' : 'Date'}</th>
                <th className="py-2 px-3 text-right">{isKhmer ? 'សាច់ប្រាក់ចូល (+)' : 'Inflow (+)'}</th>
                <th className="py-2 px-3 text-right">{isKhmer ? 'សាច់ប្រាក់ចេញ (-)' : 'Outflow (-)'}</th>
                <th className="py-2 px-3 text-right">{isKhmer ? 'សមតុល្យសុទ្ធប្រចាំថ្ងៃ' : 'Daily Net Balance'}</th>
                <th className="py-2 px-2 text-center">{isKhmer ? 'ស្ថានភាព' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    {isKhmer ? 'មិនមានទិន្នន័យលំហូរសាច់ប្រាក់ទេ' : 'No cash flow records found'}
                  </td>
                </tr>
              ) : (
                list.map((t, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80">
                    <td className="py-1.5 px-2.5 text-center font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-1.5 px-3 font-mono font-bold text-slate-800">{t.date}</td>
                    <td className="py-1.5 px-3 text-right font-mono text-emerald-700 font-bold">+${t.inflow.toFixed(2)}</td>
                    <td className="py-1.5 px-3 text-right font-mono text-rose-700 font-bold">-${t.outflow.toFixed(2)}</td>
                    <td className="py-1.5 px-3 text-right font-mono font-extrabold text-slate-900">${t.net.toFixed(2)}</td>
                    <td className="py-1.5 px-2 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${t.net >= 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                        {t.net >= 0 ? '+ Inflow' : '- Outflow'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="bg-amber-50/90 font-bold border-t-2 border-amber-400 text-slate-900">
                <td colSpan={2} className="py-2.5 px-3 text-right uppercase tracking-wider text-xs font-bold text-amber-950">
                  {isKhmer ? 'សរុបលំហូរសាច់ប្រាក់ (Net Liquidity):' : 'Net Liquidity Position:'}
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-xs text-emerald-800">+${(summary.total_inflow || 0).toFixed(2)}</td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-xs text-rose-800">-${(summary.total_outflow || 0).toFixed(2)}</td>
                <td className={`py-2.5 px-3 text-right font-mono font-extrabold text-sm ${(summary.net_cash_flow || 0) >= 0 ? 'text-emerald-900' : 'text-rose-900'}`}>
                  ${(summary.net_cash_flow || 0).toFixed(2)}
                </td>
                <td className="py-2.5 px-2 text-center font-mono text-xs">{list.length} days</td>
              </tr>
            </tfoot>
          </table>
        );
      }

      case 'goldrates': {
        const list = goldRateData?.rates || [];
        return (
          <table className="w-full text-left text-[11px] border-collapse report-print-table">
            <thead>
              <tr className="bg-amber-100/60 text-amber-950 border-b-2 border-amber-500 font-bold">
                <th className="py-2 px-2.5 w-8 text-center">#</th>
                <th className="py-2 px-3">{isKhmer ? 'កាលបរិច្ឆេទ' : 'Effective Date'}</th>
                <th className="py-2 px-3">{isKhmer ? 'ប្រភេទទឹកមាស' : 'Metal Karat'}</th>
                <th className="py-2 px-3 text-right">{isKhmer ? 'តម្លៃលក់ចេញ ($/g)' : 'Sell Rate ($/g)'}</th>
                <th className="py-2 px-3 text-right">{isKhmer ? 'តម្លៃទិញចូល ($/g)' : 'Buy Rate ($/g)'}</th>
                <th className="py-2 px-3 text-right">{isKhmer ? 'គម្លាតចំណេញ (Spread)' : 'Spread Margin'}</th>
                <th className="py-2 px-3 text-right">{isKhmer ? 'តម្លៃក្នុង ១ ជី ($)' : 'Price / Chi ($)'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    {isKhmer ? 'មិនមានប្រវត្តិតម្លៃមាសទេ' : 'No gold rates history records found'}
                  </td>
                </tr>
              ) : (
                list.map((r, idx) => (
                  <tr key={r.id || idx} className="hover:bg-slate-50/80">
                    <td className="py-1.5 px-2.5 text-center font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-1.5 px-3 font-mono text-slate-700">{r.effective_date}</td>
                    <td className="py-1.5 px-3 font-bold text-slate-900">{r.metal_name}</td>
                    <td className="py-1.5 px-3 text-right font-mono font-bold text-amber-900">${Number(r.sell_rate || 0).toFixed(2)}</td>
                    <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-700">${Number(r.buy_rate || 0).toFixed(2)}</td>
                    <td className="py-1.5 px-3 text-right font-mono text-emerald-800 font-bold">${Number(r.spread || 0).toFixed(2)} ({r.spread_percentage}%)</td>
                    <td className="py-1.5 px-3 text-right font-mono font-extrabold text-amber-950">${Number(r.price_per_chi || 0).toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="printable-report-sheet p-6 sm:p-8 bg-white text-slate-900 font-sans select-text">
      
      {/* 1. Official Store Letterhead */}
      <div className="border-b-2 border-amber-500 pb-3 flex flex-row items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 font-bold shadow-md print:rounded-lg print:w-10 print:h-10 shrink-0 overflow-hidden">
            {settings?.store_logo ? (
              <img src={settings.store_logo} alt="Store Logo" className="w-full h-full object-contain p-1" />
            ) : (
              <FontAwesomeIcon icon={faGem} className="w-6 h-6 print:w-5 print:h-5 text-white" />
            )}
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-950 font-serif leading-tight">
              {settings?.store_name || (isKhmer ? 'ហាងមាស & គ្រឿងអលង្ការ ជេវែលផ្លូវ' : 'JEWELFLOW LUXURY ATELIER & ERP')}
            </h1>
            <p className="text-[11px] font-bold text-amber-800 tracking-wide uppercase">
              {isKhmer ? 'JEWELFLOW LUXURY ATELIER • GOLD & FINE JEWELRY' : 'Official Gold Bullion & Fine Jewelry Management'}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {settings?.store_address || '#88 Preah Norodom Blvd, Phnom Penh, Cambodia'} • Tel: {settings?.store_phone || '+855 (0) 23 999 888'} • VAT TIN: {settings?.vat_tin || 'K002-901823901'}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
            OFFICIAL REPORT
          </span>
          <p className="text-[10px] font-mono text-slate-500 mt-1">Doc ID: {reportDocId}</p>
          <p className="text-[10px] font-mono text-slate-400">{printTimestamp}</p>
        </div>
      </div>

      {/* 2. Report Document Title & Parameters Metadata */}
      <div className="my-4 p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-row items-center justify-between gap-3 text-xs">
        <div>
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={currentTabInfo.icon} className="text-amber-600 w-3.5 h-3.5" />
            <h2 className="text-sm font-bold text-slate-950">
              {isKhmer ? currentTabInfo.km : currentTabInfo.en}
            </h2>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
            {isKhmer ? 'ចន្លោះកាលបរិច្ឆេទ:' : 'Date Range:'} <span className="font-mono font-bold text-slate-800">{startDate} → {endDate}</span>
            {selectedPreset && <span className="ml-1 text-slate-400">({selectedPreset})</span>}
          </p>
        </div>

        {/* Filter Criteria Tags */}
        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
          {activeCustomer && (
            <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-medium">
              {isKhmer ? 'អតិថិជន:' : 'Client:'} <strong className="text-slate-900">{activeCustomer.name}</strong>
            </span>
          )}
          {activeUser && (
            <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-medium">
              {isKhmer ? 'បុគ្គលិក:' : 'Staff:'} <strong className="text-slate-900">{activeUser.name}</strong>
            </span>
          )}
          {activeMetal && (
            <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-medium">
              {isKhmer ? 'កម្រិតទឹក:' : 'Metal:'} <strong className="text-amber-800">{activeMetal.name}</strong>
            </span>
          )}
          {activeCategory && (
            <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-medium">
              {isKhmer ? 'ប្រភេទ:' : 'Category:'} <strong className="text-slate-900">{activeCategory.name}</strong>
            </span>
          )}
          {filterStatus && (
            <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-medium">
              {isKhmer ? 'ស្ថានភាព:' : 'Status:'} <strong className="text-emerald-700">{filterStatus}</strong>
            </span>
          )}
          <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-900 font-mono font-semibold">
            USD / KHR (1: {fxRate})
          </span>
        </div>
      </div>

      {/* 3. Primary Table Data Presentation directly */}
      <div className="my-4">
        {renderTableContent()}
      </div>

      {/* 4. Official Signatures & Verification Block */}
      <div className="mt-8 pt-4 border-t-2 border-slate-200 page-break-inside-avoid">
        <div className="grid grid-cols-3 gap-6 text-center text-xs">
          
          {/* Prepared By */}
          <div className="flex flex-col items-center">
            <p className="font-bold text-slate-900">{isKhmer ? 'អ្នករៀបចំរបាយការណ៍' : 'Prepared By'}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{isKhmer ? 'ហត្ថលេខា & ឈ្មោះអ្នកគិតលុយ' : 'Cashier / Accountant Sign'}</p>
            <div className="w-36 border-b border-dashed border-slate-300 h-16 mb-1"></div>
            <p className="text-[11px] font-medium text-slate-600 font-mono">{activeUser?.name || 'Authorized Staff'}</p>
            <p className="text-[9px] text-slate-400 font-mono">{startDate}</p>
          </div>

          {/* Verified By */}
          <div className="flex flex-col items-center">
            <p className="font-bold text-slate-900">{isKhmer ? 'អ្នកត្រួតពិនិត្យគណនេយ្យ' : 'Audited & Verified By'}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{isKhmer ? 'ហត្ថលេខាប្រធានផ្នែកគណនេយ្យ' : 'Chief Auditor Sign'}</p>
            <div className="w-36 border-b border-dashed border-slate-300 h-16 mb-1"></div>
            <p className="text-[11px] font-medium text-slate-600">{isKhmer ? 'ផ្នែកសវនកម្មផ្ទៃក្នុង' : 'Internal Audit Dept.'}</p>
            <p className="text-[9px] text-slate-400 font-mono">{printTimestamp.split(' ')[0]}</p>
          </div>

          {/* Approved By & Official Seal Box */}
          <div className="flex flex-col items-center">
            <p className="font-bold text-slate-900">{isKhmer ? 'ប្រធានគ្រប់គ្រងអនុម័ត' : 'Approved By (Store Manager)'}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{isKhmer ? 'ហត្ថលេខា & ត្រាផ្លូវការ' : 'Signature & Official Atelier Seal'}</p>
            <div className="w-36 border border-dashed border-amber-300 bg-amber-50/40 rounded-lg h-16 mb-1 flex items-center justify-center">
              <span className="text-[9px] text-amber-700/60 font-semibold">{isKhmer ? 'ទីតាំងបោះត្រា' : 'Official Stamp'}</span>
            </div>
            <p className="text-[11px] font-bold text-slate-900 font-serif">JewelFlow Atelier Ltd.</p>
            <p className="text-[9px] text-slate-400 font-mono">{printTimestamp.split(' ')[0]}</p>
          </div>

        </div>
      </div>

      {/* 5. Document Security Watermark / Footer */}
      <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400 font-mono">
        <span>JewelFlow Jewelry Atelier ERP • Certified Business Report</span>
        <span>Document ID: {reportDocId}</span>
        <span>Page 1 of 1</span>
      </div>

    </div>
  );
};

export default ReportPrintDocument;
