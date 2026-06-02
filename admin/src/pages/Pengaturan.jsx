import { Building, Bell, Lock, Smartphone } from 'lucide-react';
import './Pengaturan.css';

export default function Pengaturan() {
  return (
    <div className="pengaturan">
      <h2 className="pengaturan__title">Pengaturan</h2>
      <p className="pengaturan__subtitle">Konfigurasi sistem WashWeswos</p>
      <div className="pengaturan__grid">
        <div className="pengaturan__card">
          <div className="pengaturan__card-icon"><Building size={24} color="#3b82f6" /></div>
          <h3>Profil Bisnis</h3>
          <p>Kelola informasi bisnis seperti nama, alamat, dan kontak</p>
          <span className="pengaturan__badge">Segera Hadir</span>
        </div>
        <div className="pengaturan__card">
          <div className="pengaturan__card-icon"><Bell size={24} color="#f59e0b" /></div>
          <h3>Notifikasi</h3>
          <p>Atur preferensi notifikasi dan pemberitahuan</p>
          <span className="pengaturan__badge">Segera Hadir</span>
        </div>
        <div className="pengaturan__card">
          <div className="pengaturan__card-icon"><Lock size={24} color="#10b981" /></div>
          <h3>Keamanan</h3>
          <p>Kelola password dan pengaturan keamanan akun</p>
          <span className="pengaturan__badge">Segera Hadir</span>
        </div>
        <div className="pengaturan__card">
          <div className="pengaturan__card-icon"><Smartphone size={24} color="#8b5cf6" /></div>
          <h3>Integrasi</h3>
          <p>Kelola integrasi dengan Midtrans dan layanan pihak ketiga</p>
          <span className="pengaturan__badge">Segera Hadir</span>
        </div>
      </div>
    </div>
  );
}
