import { Calendar, Bell, Menu, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState, useRef, useEffect } from 'react';
import './Header.css';

export default function Header({ title, subtitle, onMenuClick }) {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const getInitials = (name) => {
    if (!name) return 'A';
    return name.charAt(0).toUpperCase();
  };

  return (
    <header className="header">
      <div className="header__left">
        <button className="header__menu-btn" onClick={onMenuClick}>
          <Menu size={22} />
        </button>
        <div className="header__title-wrap">
          <h2 className="header__title">{title}</h2>
          {subtitle && <p className="header__subtitle">{subtitle}</p>}
        </div>
      </div>
      <div className="header__right">
        <div className="header__date">
          <Calendar size={14} className="header__date-icon" />
          <span>{today}</span>
        </div>
        <button className="header__notif" title="Notifikasi">
          <Bell size={18} />
          <span className="header__notif-badge">3</span>
        </button>
        <div className="header__profile-wrap" ref={profileRef}>
          <div 
            className="header__profile"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <div className="header__profile-avatar">
              {getInitials(user?.nama)}
            </div>
            <span className="header__profile-name">{user?.nama || 'Admin Utama'}</span>
          </div>
          
          {isProfileOpen && (
            <div className="header__dropdown">
              <div className="header__dropdown-info">
                <strong>{user?.nama || 'Admin Utama'}</strong>
                <span>{user?.email || 'admin@washweswos.com'}</span>
              </div>
              <div className="header__dropdown-divider"></div>
              <button className="header__dropdown-logout" onClick={logout}>
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
