import { useState, useEffect } from 'react';
import client from '../api/client';
import { Truck } from 'lucide-react';
import './Kurir.css';

export default function Kurir() {
  const [couriers, setCouriers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCouriers();
  }, []);

  const fetchCouriers = async () => {
    try {
      const res = await client.get('/admin/users', { params: { role: 'kurir' } });
      setCouriers(res.data.data || []);
    } catch (err) {
      console.error('Gagal mengambil data kurir:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  return (
    <div className="kurir">
      <div className="kurir__header">
        <div>
          <h2 className="kurir__title">Manajemen Kurir</h2>
          <p className="kurir__subtitle">Total {couriers.length} kurir terdaftar</p>
        </div>
      </div>

      <div className="kurir__grid">
        {loading ? (
          <div className="kurir__loading">
            <div className="kurir__spinner"></div>
            <p>Memuat data kurir...</p>
          </div>
        ) : couriers.length === 0 ? (
          <div className="kurir__empty">
            <Truck size={48} className="kurir__empty-icon" color="#64748b" />
            <p>Belum ada kurir terdaftar</p>
          </div>
        ) : (
          couriers.map((courier) => (
            <div key={courier.id} className="kurir__card">
              <div className="kurir__card-top">
                <div className="kurir__avatar">
                  {courier.nama?.charAt(0)?.toUpperCase() || 'K'}
                </div>
                <div className="kurir__info">
                  <h3 className="kurir__name">{courier.nama}</h3>
                  <p className="kurir__email">{courier.email}</p>
                </div>
                <span className="kurir__status-badge">
                  <span className="kurir__status-dot"></span>
                  Aktif
                </span>
              </div>
              <div className="kurir__details">
                <div className="kurir__detail-item">
                  <span className="kurir__detail-label">No. HP</span>
                  <span className="kurir__detail-value">{courier.nomorHp || '-'}</span>
                </div>
                <div className="kurir__detail-item">
                  <span className="kurir__detail-label">Bergabung</span>
                  <span className="kurir__detail-value">{formatDate(courier.created_at)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
