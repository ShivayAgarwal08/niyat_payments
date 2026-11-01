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

const AppLayout: React.FC = () => {
  const location = useLocation();
  const isSplash = location.pathname === '/';

  return (
    <div className="min-h-screen bg-[#ECE8F4] flex justify-center items-start sm:py-6 selection:bg-[#F3EDF9] selection:text-[#663A91]">
      {/* Mobile App Shell — Max Width 540px, Centered with Subtle Shadow on Larger Displays */}
      <div className="w-full max-w-[540px] min-h-screen sm:min-h-[92vh] bg-[#F3F1F8] sm:rounded-[32px] sm:shadow-plum sm:border sm:border-[#E8E2EF] flex flex-col relative overflow-x-hidden">
        {!isSplash && <Navbar />}
        <main className={`flex-1 ${!isSplash ? 'pb-24' : ''}`}>
          <Routes>
            <Route path="/" element={<SplashScreen />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/normal-mode" element={<NormalShoppingPage />} />
            <Route path="/protected-mode" element={<ProtectedShoppingPage />} />
            <Route path="/catalog" element={<ShoppingCatalogPage />} />
            <Route path="/security-lab" element={<SecurityLabPage />} />
            <Route path="/transactions" element={<TransactionHistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
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
