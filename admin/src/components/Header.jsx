import { Calendar, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Header.css';

export default function Header({ title, subtitle }) {
  const { user } = useAuth();
  
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
        <h2 className="header__title">{title}</h2>
        {subtitle && <p className="header__subtitle">{subtitle}</p>}
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
        <div className="header__profile">
          <div className="header__profile-avatar">
            {getInitials(user?.nama)}
          </div>
          <span className="header__profile-name">{user?.nama || 'Admin Utama'}</span>
        </div>
      </div>
    </header>
  );
}
