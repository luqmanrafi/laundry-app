import { useState, useEffect } from 'react';
import client from '../api/client';
import { Truck, Plus, Trash2, X } from 'lucide-react';
import './Kurir.css';

export default function Kurir() {
  const [couriers, setCouriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState({ isOpen: false, nama: '', email: '', nomorHp: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

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

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus kurir ini? Tindakan ini tidak dapat dibatalkan.')) return;
    try {
      await client.delete(`/admin/users/${id}`);
      fetchCouriers();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus kurir');
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await client.post('/auth/register', { 
        nama: addModal.nama, 
        email: addModal.email, 
        nomorHp: addModal.nomorHp, 
        password: addModal.password, 
        role: 'kurir' 
      });
      setAddModal({ isOpen: false, nama: '', email: '', nomorHp: '', password: '' });
      fetchCouriers();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menambahkan kurir');
    } finally {
      setSubmitting(false);
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
        <button 
          className="kurir__add-btn"
          onClick={() => setAddModal({ ...addModal, isOpen: true })}
        >
          <Plus size={16} /> Tambah Kurir
        </button>
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
                <div className="kurir__actions">
                  <span className="kurir__status-badge">
                    <span className="kurir__status-dot"></span>
                    Aktif
                  </span>
                  <button 
                    className="kurir__delete-btn"
                    onClick={() => handleDelete(courier.id)}
                    title="Hapus Kurir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
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

      {/* Modal Tambah Kurir */}
      {addModal.isOpen && (
        <div className="kurir__modal-overlay">
          <div className="kurir__modal">
            <div className="kurir__modal-header">
              <h3>Tambah Kurir Baru</h3>
              <button 
                className="kurir__modal-close" 
                onClick={() => setAddModal({ isOpen: false, nama: '', email: '', nomorHp: '', password: '' })}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="kurir__modal-body">
                <div className="kurir__form-group">
                  <label>Nama Lengkap</label>
                  <input 
                    type="text" 
                    value={addModal.nama} 
                    onChange={(e) => setAddModal({...addModal, nama: e.target.value})}
                    required
                    placeholder="Masukkan nama kurir"
                  />
                </div>
                <div className="kurir__form-group">
                  <label>Email</label>
                  <input 
                    type="email" 
                    value={addModal.email} 
                    onChange={(e) => setAddModal({...addModal, email: e.target.value})}
                    required
                    placeholder="kurir@laundry.com"
                  />
                </div>
                <div className="kurir__form-group">
                  <label>Nomor HP</label>
                  <input 
                    type="text" 
                    value={addModal.nomorHp} 
                    onChange={(e) => setAddModal({...addModal, nomorHp: e.target.value})}
                    required
                    placeholder="0812xxxxxx"
                  />
                </div>
                <div className="kurir__form-group">
                  <label>Password</label>
                  <input 
                    type="password" 
                    value={addModal.password} 
                    onChange={(e) => setAddModal({...addModal, password: e.target.value})}
                    required
                    placeholder="Minimal 6 karakter"
                  />
                </div>
              </div>
              <div className="kurir__modal-footer">
                <button 
                  type="button" 
                  className="kurir__btn-cancel"
                  onClick={() => setAddModal({ isOpen: false, nama: '', email: '', nomorHp: '', password: '' })}
                >
                  Batal
                </button>
                <button type="submit" className="kurir__btn-save" disabled={submitting}>
                  {submitting ? 'Menyimpan...' : 'Simpan Kurir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
