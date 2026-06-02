import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Pesanan from './pages/Pesanan';
import Kurir from './pages/Kurir';
import Pelanggan from './pages/Pelanggan';
import Layanan from './pages/Layanan';
import Invoice from './pages/Invoice';
import Pengaturan from './pages/Pengaturan';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import './App.css';

const pageTitles = {
  '/': { title: 'Dashboard', subtitle: 'Ringkasan aktivitas WashWeswos' },
  '/pesanan': { title: 'Pesanan', subtitle: 'Kelola semua pesanan' },
  '/kurir': { title: 'Kurir', subtitle: 'Kelola kurir' },
  '/pelanggan': { title: 'Pelanggan', subtitle: 'Kelola pelanggan' },
  '/layanan': { title: 'Layanan & Tarif', subtitle: 'Kelola layanan' },
  '/invoice': { title: 'Invoice & Pembayaran', subtitle: 'Pantau pembayaran' },
  '/pengaturan': { title: 'Pengaturan', subtitle: 'Konfigurasi sistem' },
};

function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const pageInfo = pageTitles[location.pathname] || { title: 'WashWeswos', subtitle: '' };

  return (
    <div className="app-layout">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className={`app-content ${collapsed ? 'app-content--collapsed' : ''}`}>
        <Header title={pageInfo.title} subtitle={pageInfo.subtitle} />
        <div className="app-page">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pesanan" element={<Pesanan />} />
            <Route path="/kurir" element={<Kurir />} />
            <Route path="/pelanggan" element={<Pelanggan />} />
            <Route path="/layanan" element={<Layanan />} />
            <Route path="/invoice" element={<Invoice />} />
            <Route path="/pengaturan" element={<Pengaturan />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/*" 
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
