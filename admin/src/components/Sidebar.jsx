import { NavLink, useLocation } from 'react-router-dom';
import { WashingMachine, LayoutDashboard, Package, Truck, Users, ReceiptText, Tag, Settings, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const menuUtama = [
  { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { path: '/pesanan', label: 'Pesanan', icon: <Package size={18} /> },
  { path: '/kurir', label: 'Kurir', icon: <Truck size={18} /> },
  { path: '/pelanggan', label: 'Pelanggan', icon: <Users size={18} /> },
  { path: '/invoice', label: 'Invoice & Pembayaran', icon: <ReceiptText size={18} /> },
  { path: '/layanan', label: 'Layanan & Tarif', icon: <Tag size={18} /> },
];

const menuSistem = [
  { path: '/pengaturan', label: 'Pengaturan', icon: <Settings size={18} /> },
];

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const { user, logout } = useAuth();

  const getInitials = (name) => {
    if (!name) return 'A';
    return name.charAt(0).toUpperCase();
  };

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      <div className="sidebar__brand">
        <div className="sidebar__logo">
          <span className="sidebar__logo-icon"><WashingMachine size={24} color="#fff" /></span>
          {!collapsed && (
            <div className="sidebar__brand-text">
              <h1 className="sidebar__title">WashWeswos</h1>
              <p className="sidebar__subtitle">Laundry Antar Jemput</p>
            </div>
          )}
        </div>
        <button className="sidebar__close-btn" onClick={onToggle}>
          <X size={20} />
        </button>
      </div>

      <nav className="sidebar__nav">
        <div className="sidebar__section">
          {!collapsed && <span className="sidebar__section-label">MENU UTAMA</span>}
          <ul className="sidebar__menu">
            {menuUtama.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
                  }
                  end={item.path === '/'}
                >
                  <span className="sidebar__link-icon">{item.icon}</span>
                  {!collapsed && <span className="sidebar__link-text">{item.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        <div className="sidebar__section">
          {!collapsed && <span className="sidebar__section-label">SISTEM</span>}
          <ul className="sidebar__menu">
            {menuSistem.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
                  }
                >
                  <span className="sidebar__link-icon">{item.icon}</span>
                  {!collapsed && <span className="sidebar__link-text">{item.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__user">
          <div className="sidebar__avatar">
            {getInitials(user?.nama)}
          </div>
          {!collapsed && (
            <div className="sidebar__user-info">
              <span className="sidebar__user-name">{user?.nama || 'Admin Utama'}</span>
              <span className="sidebar__user-role">Administrator</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
