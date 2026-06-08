import { useState, useEffect } from 'react';
import client from '../api/client';
import { Gem, Pencil, Trash2 } from 'lucide-react';
import './Layanan.css';

export default function Layanan() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [form, setForm] = useState({ namaLayanan: '', hargaPerKg: '', keterangan: '', tarifOngkir: '', estimasiHari: '3' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await client.get('/services');
      setServices(res.data.data || []);
    } catch (err) {
      console.error('Gagal mengambil data layanan:', err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingService(null);
    setForm({ namaLayanan: '', hargaPerKg: '', keterangan: '', tarifOngkir: '', estimasiHari: '3' });
    setError('');
    setShowModal(true);
  };

  const openEditModal = (service) => {
    setEditingService(service);
    setForm({
      namaLayanan: service.namaLayanan,
      hargaPerKg: service.hargaPerKg.toString(),
      keterangan: service.keterangan || '',
      tarifOngkir: service.tarifOngkir.toString(),
      estimasiHari: service.estimasiHari ? service.estimasiHari.toString() : '3',
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const payload = {
      namaLayanan: form.namaLayanan,
      hargaPerKg: parseFloat(form.hargaPerKg),
      keterangan: form.keterangan || null,
      tarifOngkir: parseFloat(form.tarifOngkir),
      estimasiHari: parseInt(form.estimasiHari),
    };

    try {
      if (editingService) {
        await client.put(`/services/${editingService.id}`, payload);
      } else {
        await client.post('/services', payload);
      }
      setShowModal(false);
      fetchServices();
    } catch (err) {
      setError(err.response?.data?.message || 'Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus layanan ini?')) return;
    try {
      await client.delete(`/services/${id}`);
      fetchServices();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus layanan');
    }
  };

  const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="layanan">
      <div className="layanan__header">
        <div>
          <h2 className="layanan__title">Layanan & Tarif</h2>
          <p className="layanan__subtitle">Kelola daftar layanan laundry dan tarif harga</p>
        </div>
        <button className="layanan__add-btn" onClick={openAddModal}>
          <span>+</span> Tambah Layanan
        </button>
      </div>

      <div className="layanan__grid">
        {loading ? (
          <div className="layanan__loading">
            <div className="layanan__spinner"></div>
            <p>Memuat data layanan...</p>
          </div>
        ) : services.length === 0 ? (
          <div className="layanan__empty">
            <Gem size={48} className="layanan__empty-icon" color="#8b5cf6" />
            <p>Belum ada layanan. Klik "Tambah Layanan" untuk membuat yang baru.</p>
          </div>
        ) : (
          services.map((service) => (
            <div key={service.id} className="layanan__card">
              <div className="layanan__card-header">
                <div className="layanan__card-icon"><Gem size={20} color="#8b5cf6" /></div>
                <div className="layanan__card-actions">
                  <button className="layanan__edit-btn" onClick={() => openEditModal(service)} title="Edit"><Pencil size={14} /></button>
                  <button className="layanan__delete-btn" onClick={() => handleDelete(service.id)} title="Hapus"><Trash2 size={14} /></button>
                </div>
              </div>
              <h3 className="layanan__card-name">{service.namaLayanan}</h3>
              {service.keterangan && (
                <p className="layanan__card-desc">{service.keterangan}</p>
              )}
              <div className="layanan__card-prices">
                <div className="layanan__price-item">
                  <span className="layanan__price-label">Harga/kg</span>
                  <span className="layanan__price-value">{formatRupiah(service.hargaPerKg)}</span>
                </div>
                <div className="layanan__price-item">
                  <span className="layanan__price-label">Tarif Ongkir/km</span>
                  <span className="layanan__price-value">{formatRupiah(service.tarifOngkir)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="layanan__overlay" onClick={() => setShowModal(false)}>
          <div className="layanan__modal" onClick={(e) => e.stopPropagation()}>
            <div className="layanan__modal-header">
              <h3>{editingService ? 'Edit Layanan' : 'Tambah Layanan Baru'}</h3>
              <button className="layanan__modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            {error && (
              <div className="layanan__modal-error">⚠️ {error}</div>
            )}

            <form onSubmit={handleSubmit} className="layanan__form">
              <div className="layanan__field">
                <label>Nama Layanan</label>
                <input
                  type="text"
                  value={form.namaLayanan}
                  onChange={(e) => setForm({ ...form, namaLayanan: e.target.value })}
                  placeholder="Contoh: Cuci Kering"
                  required
                />
              </div>
              <div className="layanan__field-row">
                <div className="layanan__field">
                  <label>Harga per Kg (Rp)</label>
                  <input
                    type="number"
                    value={form.hargaPerKg}
                    onChange={(e) => setForm({ ...form, hargaPerKg: e.target.value })}
                    placeholder="7000"
                    required
                    min="0"
                  />
                </div>
                <div className="layanan__field">
                  <label>Tarif Ongkir per Km (Rp)</label>
                  <input
                    type="number"
                    value={form.tarifOngkir}
                    onChange={(e) => setForm({ ...form, tarifOngkir: e.target.value })}
                    placeholder="3000"
                    required
                    min="0"
                  />
                </div>
              </div>
              <div className="layanan__field">
                <label>Estimasi Hari Pengerjaan</label>
                <input
                  type="number"
                  value={form.estimasiHari}
                  onChange={(e) => setForm({ ...form, estimasiHari: e.target.value })}
                  placeholder="3"
                  required
                  min="1"
                />
              </div>
              <div className="layanan__field">
                <label>Keterangan (opsional)</label>
                <textarea
                  value={form.keterangan}
                  onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                  placeholder="Deskripsi singkat layanan..."
                  rows="3"
                />
              </div>
              <div className="layanan__form-actions">
                <button type="button" className="layanan__cancel-btn" onClick={() => setShowModal(false)}>
                  Batal
                </button>
                <button type="submit" className="layanan__submit-btn" disabled={submitting}>
                  {submitting ? 'Menyimpan...' : editingService ? 'Simpan Perubahan' : 'Tambah Layanan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
