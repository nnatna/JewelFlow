import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { DashboardView } from './components/dashboard/DashboardView';
import { PosTerminal } from './components/pos/PosTerminal';
import { SalesHistoryView } from './components/sales/SalesHistoryView';
import { ProductList } from './components/inventory/ProductList';
import { GoldRatesView } from './components/goldrates/GoldRatesView';
import { BuybackView } from './components/buyback/BuybackView';
import { GemstonesView } from './components/gemstones/GemstonesView';
import { CustomersView } from './components/customers/CustomersView';
import { SuppliersView } from './components/suppliers/SuppliersView';
import { PurchasesView } from './components/purchases/PurchasesView';
import { PromotionsView } from './components/promotions/PromotionsView';
import { ReportsView } from './components/reports/ReportsView';
import { CategoriesView } from './components/categories/CategoriesView';
import { SettingsView } from './components/settings/SettingsView';
import { LoginView } from './components/auth/LoginView';
import { ToastContainer } from './components/common/ToastContainer';
import './App.css';

const MainLayout = () => {
  const { activeTab, currentUser } = useApp();

  if (!currentUser) {
    return (
      <>
        <LoginView />
        <ToastContainer />
      </>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'pos':
        return <PosTerminal />;
      case 'sales':
      case 'sales_history':
        return <SalesHistoryView />;
      case 'products':
        return <ProductList />;
      case 'categories':
        return <CategoriesView />;
      case 'goldrates':
        return <GoldRatesView />;
      case 'buyback':
        return <BuybackView />;
      case 'gemstones':
        return <GemstonesView />;
      case 'customers':
        return <CustomersView />;
      case 'promotions':
        return <PromotionsView />;
      case 'reports':
        return <ReportsView />;
      case 'purchases':
        return <PurchasesView />;
      case 'suppliers':
        return <SuppliersView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 text-slate-900 font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Pinned Sidebar Navigation */}
      <Sidebar />

      {/* Main App Canvas */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        {/* Pinned Navbar */}
        <Navbar />

        {/* Content View */}
        <main className={`flex-1 min-h-0 w-full ${activeTab === 'pos' || activeTab === 'settings' ? 'overflow-hidden p-3 sm:p-4 lg:p-5' : 'overflow-y-auto p-6 lg:p-8'}`}>
          {renderContent()}
        </main>
      </div>

      {/* Floating UI Toast & Alert Stack */}
      <ToastContainer />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

export default App;
