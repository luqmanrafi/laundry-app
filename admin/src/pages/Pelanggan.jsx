import { useState, useEffect } from 'react';
import client from '../api/client';
import { Search, Trash2 } from 'lucide-react';
import './Pelanggan.css';

export default function Pelanggan() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await client.get('/admin/users', { params: { role: 'pelanggan' } });
      setCustomers(res.data.data || []);
    } catch (err) {
      console.error('Gagal mengambil data pelanggan:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus pelanggan ini? Semua data terkait akan ikut terhapus.')) return;
    try {
      await client.delete(`/admin/users/${id}`);
      fetchCustomers();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus pelanggan');
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  const filtered = customers.filter(c =>
    c.nama?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="pelanggan">
      <div className="pelanggan__header">
        <div>
          <h2 className="pelanggan__title">Manajemen Pelanggan</h2>
          <p className="pelanggan__subtitle">Total {customers.length} pelanggan terdaftar</p>
        </div>
      </div>

      <div className="pelanggan__search-wrap">
        <Search size={16} className="pelanggan__search-icon" color="#94a3b8" />
        <input
          type="text"
          className="pelanggan__search"
          placeholder="Cari nama atau email pelanggan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="pelanggan__card">
        {loading ? (
          <div className="pelanggan__loading">
            <div className="pelanggan__spinner"></div>
            <p>Memuat data pelanggan...</p>
          </div>
        ) : (
          <div className="pelanggan__table-wrap">
            <table className="pelanggan__table">
              <thead>
                <tr>
                  <th>Pelanggan</th>
                  <th>Email</th>
                  <th>No. HP</th>
                  <th>Terdaftar</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <div className="pelanggan__user">
                        <div className="pelanggan__avatar">
                          {customer.nama?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <span className="pelanggan__name">{customer.nama}</span>
                      </div>
                    </td>
                    <td>{customer.email}</td>
                    <td>{customer.nomorHp || '-'}</td>
                    <td className="pelanggan__date">{formatDate(customer.created_at)}</td>
                    <td>
                      <button 
                        className="pelanggan__delete-btn"
                        onClick={() => handleDelete(customer.id)}
                        title="Hapus Pelanggan"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="5" className="pelanggan__empty">Tidak ada pelanggan ditemukan</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
