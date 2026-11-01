import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar.js';
import { Footer } from './components/Footer.js';
import { SplashScreen } from './pages/SplashScreen.js';
import { HomePage } from './pages/HomePage.js';
import { NormalShoppingPage } from './pages/NormalShoppingPage.js';
import { ProtectedShoppingPage } from './pages/ProtectedShoppingPage.js';
import { ShoppingCatalogPage } from './pages/ShoppingCatalogPage.js';
import { SecurityLabPage } from './pages/SecurityLabPage.js';
import { TransactionHistoryPage } from './pages/TransactionHistoryPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { PocketPayPage } from './pages/PocketPayPage.js';

const AppLayout: React.FC = () => {
  const location = useLocation();
  const isSplash = location.pathname === '/';

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center items-start sm:py-6 selection:bg-blue-100 selection:text-blue-900">
      {/* Mobile App Container — Max Width 540px, Centered on Desktop */}
      <div className="w-full max-w-[540px] min-h-screen sm:min-h-[92vh] bg-[#F8FAFC] sm:rounded-[28px] sm:shadow-md sm:border sm:border-slate-200 flex flex-col relative overflow-x-hidden">
        {!isSplash && <Navbar />}
        <main className={`flex-1 ${!isSplash ? 'pb-24' : ''}`}>
          <Routes>
            <Route path="/" element={<SplashScreen />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/shop" element={<ProtectedShoppingPage />} />
            <Route path="/protected-mode" element={<ProtectedShoppingPage />} />
            <Route path="/explore" element={<ShoppingCatalogPage />} />
            <Route path="/catalog" element={<ShoppingCatalogPage />} />
            <Route path="/orders" element={<TransactionHistoryPage />} />
            <Route path="/transactions" element={<TransactionHistoryPage />} />
            <Route path="/security" element={<SecurityLabPage />} />
            <Route path="/security-lab" element={<SecurityLabPage />} />
            <Route path="/profile" element={<SettingsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/wallet" element={<PocketPayPage />} />
            <Route path="/pocket-pay" element={<PocketPayPage />} />
            <Route path="/normal-mode" element={<NormalShoppingPage />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </main>
        {!isSplash && <Footer />}
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
};

export default App;
