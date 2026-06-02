import { useState, useEffect } from 'react';
import client from '../api/client';
import StatusBadge from '../components/StatusBadge';
import { Banknote, Hourglass, BarChart2 } from 'lucide-react';
import './Invoice.css';

export default function Invoice() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const res = await client.get('/orders/all', { params: { limit: 100 } });
      setOrders(res.data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fmt = (n) => n ? new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',minimumFractionDigits:0}).format(n) : '-';
  const fmtDate = (d) => new Date(d).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'});
  const filtered = filter ? orders.filter(o => o.paymentStatus === filter) : orders;
  const totalPaid = orders.filter(o=>o.paymentStatus==='paid').reduce((s,o)=>s+(o.totalBiaya||0),0);
  const totalUnpaid = orders.filter(o=>o.paymentStatus==='unpaid').reduce((s,o)=>s+(o.totalBiaya||0),0);

  return (
    <div className="invoice">
      <div className="invoice__header">
        <h2 className="invoice__title">Invoice & Pembayaran</h2>
        <p className="invoice__subtitle">Pantau status pembayaran dari seluruh pesanan</p>
      </div>
      <div className="invoice__summary">
        <div className="invoice__summary-card invoice__summary-card--green">
          <span className="invoice__summary-icon"><Banknote size={24} color="#10b981" /></span>
          <div><span className="invoice__summary-label">Total Sudah Dibayar</span><span className="invoice__summary-value">{fmt(totalPaid)}</span></div>
        </div>
        <div className="invoice__summary-card invoice__summary-card--orange">
          <span className="invoice__summary-icon"><Hourglass size={24} color="#f97316" /></span>
          <div><span className="invoice__summary-label">Total Belum Dibayar</span><span className="invoice__summary-value">{fmt(totalUnpaid)}</span></div>
        </div>
        <div className="invoice__summary-card invoice__summary-card--blue">
          <span className="invoice__summary-icon"><BarChart2 size={24} color="#3b82f6" /></span>
          <div><span className="invoice__summary-label">Total Transaksi</span><span className="invoice__summary-value">{orders.length}</span></div>
        </div>
      </div>
      <div className="invoice__filters">
        {[{value:'',label:'Semua'},{value:'paid',label:'Lunas'},{value:'unpaid',label:'Belum Bayar'}].map(opt=>(
          <button key={opt.value} className={`invoice__filter-btn ${filter===opt.value?'invoice__filter-btn--active':''}`} onClick={()=>setFilter(opt.value)}>{opt.label}</button>
        ))}
      </div>
      <div className="invoice__card">
        {loading ? <div className="invoice__loading"><div className="invoice__spinner"></div><p>Memuat...</p></div> : (
          <div className="invoice__table-wrap"><table className="invoice__table"><thead><tr>
            <th>ID</th><th>Layanan</th><th>Berat</th><th>Ongkir</th><th>Total</th><th>Status</th><th>Bayar</th><th>Tanggal</th>
          </tr></thead><tbody>
            {filtered.map(o=><tr key={o.id}>
              <td className="invoice__id">INV-{String(o.id).padStart(5,'0')}</td>
              <td>{o.layanan?.namaLayanan||'-'}</td><td>{o.berat?`${o.berat} kg`:'-'}</td>
              <td>{fmt(o.ongkir)}</td><td className="invoice__amount">{fmt(o.totalBiaya)}</td>
              <td><StatusBadge status={o.status}/></td><td><StatusBadge status={o.paymentStatus}/></td>
              <td className="invoice__date">{fmtDate(o.createdAt)}</td>
            </tr>)}
            {filtered.length===0&&<tr><td colSpan="8" className="invoice__empty">Tidak ada data</td></tr>}
          </tbody></table></div>
        )}
      </div>
    </div>
  );
}
