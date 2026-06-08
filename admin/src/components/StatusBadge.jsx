import './StatusBadge.css';

const statusConfig = {
  menunggu_kurir: { label: 'Menunggu Pickup', color: 'orange' },
  kurir_menuju_lokasi: { label: 'Sedang Dijemput', color: 'blue' },
  dibawa_kurir_ke_laundry: { label: 'Diantar ke Laundry', color: 'indigo' },
  sedang_dicuci: { label: 'Diproses Laundry', color: 'purple' },
  siap_dikirim: { label: 'Siap Diantar', color: 'teal' },
  proses_pengantaran: { label: 'Diantar', color: 'indigo' },
  selesai: { label: 'Selesai', color: 'green' },
  // payment status
  unpaid: { label: 'Belum Bayar', color: 'orange' },
  paid: { label: 'Lunas', color: 'green' },
  pending: { label: 'Pending', color: 'yellow' },
  settlement: { label: 'Settlement', color: 'green' },
  failed: { label: 'Gagal', color: 'red' },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || { label: status, color: 'gray' };

  return (
    <span className={`status-badge status-badge--${config.color}`}>
      {config.label}
    </span>
  );
}
