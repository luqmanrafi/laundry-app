import { useState, useEffect } from 'react';
import client from '../api/client';
import StatusBadge from '../components/StatusBadge';
import { Search, Edit, X, Trash2 } from 'lucide-react';
import './Pesanan.css';

const statusOptions = [
  { value: '', label: 'Semua Status' },
  { value: 'menunggu_kurir', label: 'Menunggu Pickup' },
  { value: 'kurir_menuju_lokasi', label: 'Sedang Dijemput' },
  { value: 'dibawa_kurir_ke_laundry', label: 'Diantar ke Laundry' },
  { value: 'sedang_dicuci', label: 'Diproses Laundry' },
  { value: 'siap_dikirim', label: 'Siap Diantar' },
  { value: 'proses_pengantaran', label: 'Diantar' },
  { value: 'selesai', label: 'Selesai' },
];

export default function Pesanan() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Modal State
  const [editModal, setEditModal] = useState({ isOpen: false, order: null, status: '' });
  const [updating, setUpdating] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [filterStatus, page]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (filterStatus) params.status = filterStatus;
      if (search) params.search = search;
      const res = await client.get('/orders/all', { params });
      setOrders(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Gagal mengambil data pesanan:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!editModal.order || !editModal.status) return;
    
    setUpdating(true);
    try {
      await client.put(`/orders/${editModal.order.id}/status`, { status: editModal.status });
      setEditModal({ isOpen: false, order: null, status: '' });
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengubah status pesanan');
    } finally {
      setUpdating(false);
    }
  }
  const getNextStatusAction = (currentStatus) => {
    switch (currentStatus) {
      case 'menunggu_kurir': return { status: 'kurir_menuju_lokasi', label: 'Terima (Override)' };
      case 'kurir_menuju_lokasi': return { status: 'dibawa_kurir_ke_laundry', label: 'Barang Tiba' };
      case 'dibawa_kurir_ke_laundry': return { status: 'sedang_dicuci', label: 'Mulai Cuci' };
      case 'sedang_dicuci': return { status: 'siap_dikirim', label: 'Selesai Cuci' };
      case 'siap_dikirim': return { status: 'proses_pengantaran', label: 'Kirim Barang' };
      case 'proses_pengantaran': return { status: 'selesai', label: 'Selesaikan' };
      default: return null;
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    if (!confirm(`Apakah Anda yakin ingin memperbarui status menjadi: ${statusOptions.find(o => o.value === newStatus)?.label || newStatus}?`)) return;
    setUpdatingStatus(orderId);
    try {
      await client.put(`/orders/${orderId}/status`, { status: newStatus });
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal memperbarui status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDelete = async (orderId) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus pesanan #${orderId}? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      await client.delete(`/orders/${orderId}`);
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus pesanan');
    }
  };

  const formatRupiah = (num) => {
    if (!num) return '-';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="pesanan">
      <div className="pesanan__header">
        <div>
          <h2 className="pesanan__title">Manajemen Pesanan</h2>
          <p className="pesanan__subtitle">Total {total} pesanan ditemukan</p>
        </div>
      </div>

      <div className="pesanan__filters">
        <form className="pesanan__search-form" onSubmit={handleSearch}>
          <div className="pesanan__search-wrap">
            <Search size={16} className="pesanan__search-icon" color="#94a3b8" />
            <input
              type="text"
              className="pesanan__search"
              placeholder="Cari berdasarkan ID pesanan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </form>
        <div className="pesanan__status-filters">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              className={`pesanan__filter-btn ${filterStatus === opt.value ? 'pesanan__filter-btn--active' : ''}`}
              onClick={() => { setFilterStatus(opt.value); setPage(1); }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pesanan__card">
        {loading ? (
          <div className="pesanan__loading">
            <div className="pesanan__spinner"></div>
            <p>Memuat pesanan...</p>
          </div>
        ) : (
          <>
            <div className="pesanan__table-wrap">
              <table className="pesanan__table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Layanan</th>
                    <th>Berat</th>
                    <th>Ongkir</th>
                    <th>Total Biaya</th>
                    <th>Status</th>
                    <th>Pembayaran</th>
                    <th>Tanggal Dibuat</th>
                    <th>Estimasi Selesai</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td className="pesanan__id">#{order.id}</td>
                      <td>{order.layanan?.namaLayanan || '-'}</td>
                      <td>{order.berat ? `${order.berat} kg` : '-'}</td>
                      <td>{formatRupiah(order.ongkir)}</td>
                      <td className="pesanan__amount">{formatRupiah(order.totalBiaya)}</td>
                      <td><StatusBadge status={order.status} /></td>
                      <td><StatusBadge status={order.paymentStatus} /></td>
                      <td className="pesanan__date">{formatDate(order.createdAt)}</td>
                      <td className="pesanan__date">{order.estimasiSelesai ? formatDate(order.estimasiSelesai) : '-'}</td>
                      <td>
                        <div className="pesanan__actions-wrapper">
                          <div className="pesanan__actions-top">
                            <button 
                              className="pesanan__edit-btn"
                              onClick={() => setEditModal({ isOpen: true, order, status: order.status })}
                              title="Edit Status"
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              className="pesanan__delete-btn"
                              onClick={() => handleDelete(order.id)}
                              title="Hapus Pesanan"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          {getNextStatusAction(order.status) ? (
                            <button
                              className="pesanan__action-btn"
                              disabled={updatingStatus === order.id}
                              onClick={() => handleUpdateStatus(order.id, getNextStatusAction(order.status).status)}
                            >
                              {updatingStatus === order.id ? 'Loading...' : getNextStatusAction(order.status).label}
                            </button>
                          ) : (
                            <span className="pesanan__action-none">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan="10" className="pesanan__empty">Tidak ada pesanan ditemukan</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pesanan__pagination">
                <button
                  className="pesanan__page-btn"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  ← Prev
                </button>
                <span className="pesanan__page-info">
                  Halaman {page} dari {totalPages}
                </span>
                <button
                  className="pesanan__page-btn"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Edit Status */}
      {editModal.isOpen && (
        <div className="pesanan__modal-overlay">
          <div className="pesanan__modal">
            <div className="pesanan__modal-header">
              <h3>Update Status Pesanan #{editModal.order?.id}</h3>
              <button 
                className="pesanan__modal-close" 
                onClick={() => setEditModal({ isOpen: false, order: null, status: '' })}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleModalSubmit}>
              <div className="pesanan__modal-body">
                <div className="pesanan__form-group">
                  <label>Status Baru</label>
                  <select 
                    value={editModal.status} 
                    onChange={(e) => setEditModal({...editModal, status: e.target.value})}
                    required
                  >
                    {statusOptions.filter(opt => opt.value !== '').map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="pesanan__modal-footer">
                <button 
                  type="button" 
                  className="pesanan__btn-cancel"
                  onClick={() => setEditModal({ isOpen: false, order: null, status: '' })}
                >
                  Batal
                </button>
                <button type="submit" className="pesanan__btn-save" disabled={updating}>
                  {updating ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
