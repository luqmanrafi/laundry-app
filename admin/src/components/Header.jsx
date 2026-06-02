import { Calendar, Bell } from 'lucide-react';
import './Header.css';

export default function Header({ title, subtitle }) {
  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

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
            A
          </div>
          <span className="header__profile-name">Admin Utama</span>
        </div>
      </div>
    </header>
  );
}
