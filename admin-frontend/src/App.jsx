import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { DashboardView } from './components/dashboard/DashboardView';
import { PosTerminal } from './components/pos/PosTerminal';
import { ProductList } from './components/inventory/ProductList';
import { GoldRatesView } from './components/goldrates/GoldRatesView';
import { BuybackView } from './components/buyback/BuybackView';
import { GemstonesView } from './components/gemstones/GemstonesView';
import { CustomersView } from './components/customers/CustomersView';
import { SuppliersView } from './components/suppliers/SuppliersView';
import './App.css';

const MainLayout = () => {
  const { activeTab } = useApp();

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'pos':
        return <PosTerminal />;
      case 'products':
        return <ProductList />;
      case 'goldrates':
        return <GoldRatesView />;
      case 'buyback':
        return <BuybackView />;
      case 'gemstones':
        return <GemstonesView />;
      case 'customers':
        return <CustomersView />;
      case 'suppliers':
        return <SuppliersView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-slate-50 text-slate-900 font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main App Canvas */}
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <Navbar />

        <main className="flex-1 p-6 lg:p-8 w-full">
          {renderContent()}
        </main>
      </div>
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
