import { useState, useEffect } from 'react';
import StatsCard from '../components/StatsCard';
import StatusBadge from '../components/StatusBadge';
import client from '../api/client';
import { Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Package, Zap, CheckCircle2, Wallet, Users } from 'lucide-react';
import './Dashboard.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await client.get('/orders/stats');
      setStats(res.data.data);
    } catch (err) {
      console.error('Gagal mengambil statistik:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  const formatTimeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Baru saja';
    if (mins < 60) return `${mins} menit lalu`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} jam lalu`;
    return `${Math.floor(hours / 24)} hari lalu`;
  };

  if (loading) {
    return (
      <div className="dashboard__loading">
        <div className="dashboard__loading-spinner"></div>
        <p>Memuat data dashboard...</p>
      </div>
    );
  }

  // Doughnut chart data
  const statusColors = {
    menunggu_kurir: '#f97316',
    dibawa_kurir_ke_laundry: '#3b82f6',
    sedang_dicuci: '#8b5cf6',
    siap_dikirim: '#14b8a6',
    proses_pengantaran: '#6366f1',
    selesai: '#10b981',
  };

  const statusLabels = {
    menunggu_kurir: 'Menunggu Pickup',
    dibawa_kurir_ke_laundry: 'Sedang Dijemput',
    sedang_dicuci: 'Diproses Laundry',
    siap_dikirim: 'Siap Diantar',
    proses_pengantaran: 'Diantar',
    selesai: 'Selesai',
  };

  const hasData = stats?.statusBreakdown && stats.statusBreakdown.length > 0;

  const doughnutData = {
    labels: hasData 
      ? stats.statusBreakdown.map(s => statusLabels[s.status] || s.status) 
      : ['Belum ada pesanan'],
    datasets: [{
      data: hasData 
        ? stats.statusBreakdown.map(s => parseInt(s.count)) 
        : [1],
      backgroundColor: hasData 
        ? stats.statusBreakdown.map(s => statusColors[s.status] || '#6b7280') 
        : ['rgba(255, 255, 255, 0.05)'],
      borderWidth: 0,
      hoverOffset: hasData ? 8 : 0,
    }],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#94a3b8',
          font: { size: 12, family: 'Inter' },
          padding: 16,
          usePointStyle: true,
          pointStyleWidth: 10,
        },
      },
    },
  };

  // Revenue line chart
  const lineData = {
    labels: stats?.revenueByDay?.map(r => {
      const d = new Date(r.date);
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    }) || [],
    datasets: [{
      label: 'Pendapatan',
      data: stats?.revenueByDay?.map(r => parseFloat(r.total)) || [],
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderWidth: 2.5,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#3b82f6',
      pointBorderColor: '#1a2744',
      pointBorderWidth: 2,
      pointRadius: 5,
      pointHoverRadius: 7,
    }],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1a2744',
        borderColor: 'rgba(59, 130, 246, 0.3)',
        borderWidth: 1,
        titleFont: { family: 'Inter' },
        bodyFont: { family: 'Inter' },
        callbacks: {
          label: (ctx) => formatRupiah(ctx.parsed.y),
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 11, family: 'Inter' } },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: {
          color: '#64748b',
          font: { size: 11, family: 'Inter' },
          callback: (val) => {
            if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(1)} jt`;
            if (val >= 1000) return `Rp ${(val / 1000).toFixed(0)} rb`;
            return `Rp ${val}`;
          },
        },
      },
    },
  };

  // Calculate total for doughnut center
  const totalOrders = stats?.totalOrders || 0;

  // Latest revenue
  const latestRevenue = stats?.revenueByDay?.length > 0
    ? stats.revenueByDay[stats.revenueByDay.length - 1]
    : null;

  return (
    <div className="dashboard">
      <div className="dashboard__greeting">
        <h2>Selamat datang, Admin 👋</h2>
        <p>Berikut ringkasan aktivitas WashWeswos hari ini.</p>
      </div>

      {/* Stats Row */}
      <div className="dashboard__stats">
        <StatsCard
          icon={Package}
          iconColor="blue"
          label="Total Pesanan"
          value={stats?.totalOrders || 0}
          change="18% dari kemarin"
          changeType="up"
          sparkData={[3, 7, 5, 9, 6, 8, 12]}
        />
        <StatsCard
          icon={Zap}
          iconColor="yellow"
          label="Pesanan Aktif"
          value={stats?.activeOrders || 0}
          change="12% dari kemarin"
          changeType="up"
          sparkData={[4, 6, 3, 8, 5, 7, 9]}
        />
        <StatsCard
          icon={CheckCircle2}
          iconColor="green"
          label="Pesanan Selesai"
          value={stats?.completedOrders || 0}
          change="22% dari kemarin"
          changeType="up"
          sparkData={[5, 8, 6, 10, 7, 11, 14]}
        />
        <StatsCard
          icon={Wallet}
          iconColor="purple"
          label="Total Pendapatan"
          value={formatRupiah(stats?.totalRevenue || 0)}
          change="15% dari kemarin"
          changeType="up"
          sparkData={[2, 5, 3, 7, 4, 8, 10]}
        />
        <StatsCard
          icon={Users}
          iconColor="orange"
          label="Total Pelanggan"
          value={stats?.totalCustomers || 0}
        />
      </div>

      {/* Middle Row: Chart + Recent Orders */}
      <div className="dashboard__middle">
        <div className="dashboard__chart-card">
          <h3 className="dashboard__card-title">Status Pesanan</h3>
          <div className="dashboard__doughnut-wrap">
            <div className="dashboard__doughnut-center">
              <span className="dashboard__doughnut-total">{totalOrders}</span>
              <span className="dashboard__doughnut-label">Total</span>
            </div>
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </div>

        <div className="dashboard__recent-card">
          <div className="dashboard__recent-header">
            <h3 className="dashboard__card-title">Pesanan Terbaru</h3>
            <a href="/pesanan" className="dashboard__link">Lihat Semua</a>
          </div>
          <div className="dashboard__recent-list">
            {stats?.recentOrders?.map((order) => (
              <div key={order.id} className="dashboard__recent-item">
                <div className="dashboard__recent-info">
                  <span className="dashboard__recent-id">#{order.id}</span>
                  <span className="dashboard__recent-service">
                    {order.layanan?.namaLayanan || '-'} • {order.berat ? `${order.berat} kg` : '-'}
                  </span>
                </div>
                <div className="dashboard__recent-right">
                  <StatusBadge status={order.status} />
                  <span className="dashboard__recent-time">{formatTimeAgo(order.createdAt)}</span>
                </div>
              </div>
            ))}
            {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
              <div className="dashboard__empty">Belum ada pesanan</div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Active Orders Table + Revenue Chart */}
      <div className="dashboard__bottom">
        <div className="dashboard__table-card">
          <div className="dashboard__table-header">
            <h3 className="dashboard__card-title">Pesanan Aktif</h3>
            <a href="/pesanan" className="dashboard__link">Lihat Semua</a>
          </div>
          <div className="dashboard__table-wrap">
            <table className="dashboard__table">
              <thead>
                <tr>
                  <th>ID Pesanan</th>
                  <th>Layanan</th>
                  <th>Berat</th>
                  <th>Status</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentOrders?.filter(o => o.status !== 'selesai').map((order) => (
                  <tr key={order.id}>
                    <td className="dashboard__table-id">#{order.id}</td>
                    <td>{order.layanan?.namaLayanan || '-'}</td>
                    <td>{order.berat ? `${order.berat} kg` : '-'}</td>
                    <td><StatusBadge status={order.status} /></td>
                    <td>{order.totalBiaya ? formatRupiah(order.totalBiaya) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="dashboard__revenue-card">
          <div className="dashboard__revenue-header">
            <h3 className="dashboard__card-title">Pendapatan (7 Hari Terakhir)</h3>
            {latestRevenue && (
              <div className="dashboard__revenue-latest">
                <span className="dashboard__revenue-date">
                  {new Date(latestRevenue.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                <span className="dashboard__revenue-amount">{formatRupiah(parseFloat(latestRevenue.total))}</span>
              </div>
            )}
          </div>
          <div className="dashboard__line-wrap">
            <Line data={lineData} options={lineOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
