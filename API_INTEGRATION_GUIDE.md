# Panduan Integrasi API Laundry

Dokumen ini berisi panduan untuk (1) mengonsumsi API backend pada aplikasi mobile Flutter (untuk Pelanggan dan Kurir) serta (2) petunjuk pengembangan website dashboard untuk Admin.

---

## Bagian 1: Panduan Integrasi pada Aplikasi Flutter

Untuk menghubungkan aplikasi Flutter Anda dengan backend Node.js, ikuti standar arsitektur dan HTTP client berikut.

### 1. Konfigurasi HTTP Client (Dio / HTTP)
Direkomendasikan menggunakan package `dio` atau `http`. Gunakan *Interceptor* untuk otomatis menyisipkan token JWT pada setiap request.

```dart
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  final Dio dio = Dio(BaseOptions(
    baseUrl: 'http://<IP_SERVER_ANDA>:3000/api', // Ganti dengan URL server/IP komputer Anda (bukan localhost jika di emulator/device fisik)
    connectTimeout: const Duration(seconds: 10),
  ));

  ApiClient() {
    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final prefs = await SharedPreferences.getInstance();
        final token = prefs.getString('jwt_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
    ));
  }
}
```

### 2. Autentikasi (Login & Simpan Token)
**Endpoint:** `POST /api/auth/login`

```dart
Future<void> login(String noHp, String password) async {
  try {
    final response = await ApiClient().dio.post('/auth/login', data: {
      'noHp': noHp,
      'password': password,
    });
    
    // Simpan token untuk request selanjutnya
    final token = response.data['data']['token'];
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('jwt_token', token);
    
  } on DioException catch (e) {
    print(e.response?.data['message'] ?? 'Login gagal');
  }
}
```

### 3. Daftar Endpoint Utama untuk Flutter

**A. Role Pelanggan:**
- `GET /api/services` : Menampilkan daftar layanan (cuci basah, kering, dll). Token tidak wajib, tapi direkomendasikan.
- `POST /api/orders` : Membuat pesanan baru. Wajib mengirimkan `serviceId`, `latitude`, `longitude`, dan `deskripsi` (opsional).
- `GET /api/history` : Melihat riwayat pesanan pelanggan yang sedang login.
- `POST /api/orders/:orderId/pay` : Mendapatkan link pembayaran Midtrans (`payment_url`).

**B. Role Kurir:**
- `GET /api/pickup?latitude=x&longitude=y` : Menampilkan daftar order dengan status `menunggu_kurir` terdekat dari lokasi kurir. Wajib menyertakan lokasi kurir saat ini.
- `PUT /api/orders/:id/take` : Mengambil pesanan (merubah status menjadi `dibawa_kurir_ke_laundry`). Wajib mengirim body `{ "berat": 3 }` (dalam Kg).
- `PUT /api/orders/:id/status` : Mengubah status secara manual (cth: `sedang_dicuci`, `siap_dikirim`, `selesai`).

---

## Bagian 2: Petunjuk Penerapan Website Admin

Website admin dirancang untuk mengelola data master (seperti Layanan) dan memantau keseluruhan pesanan. 

### 1. Rekomendasi Teknologi (Tech Stack)
- **Framework Utama:** React (dengan Vite/Next.js) atau Vue (dengan Vite/Nuxt.js) karena memiliki ekosistem tabel dan dashboard yang kaya.
- **Styling / UI Library:** Tailwind CSS dipadukan dengan komponen seperti Shadcn UI, Ant Design, atau Chakra UI untuk pembuatan dashboard dengan cepat.
- **State Management & Fetching:** React Query (TanStack Query) / SWR. Sangat direkomendasikan untuk fetching REST API karena fitur *caching* dan re-fetching data yang otomatis.

### 2. Halaman-Halaman yang Dibutuhkan

#### A. Halaman Login
Hanya pengguna dengan role `admin` yang dapat masuk ke dashboard. 
- Arahkan form login ke `POST /api/auth/login`.
- Simpan JWT token di `localStorage` atau `HttpOnly Cookies` untuk digunakan di halaman lain.

#### B. Halaman Kelola Layanan (Services)
Halaman master data untuk layanan laundry (CRUD).
- **Tampil Data (Table):** Panggil `GET /api/services`. Tampilkan nama layanan, harga/kg, ongkir, dll.
- **Tambah Layanan:** Gunakan modal form dan kirim `POST /api/services` (Body: `namaLayanan`, `hargaPerKg`, `keterangan`, `tarifOngkir`).
- **Edit Layanan:** `PUT /api/services/:id` 
- **Hapus Layanan:** `DELETE /api/services/:id` 

> **Catatan Penting:** Semua aksi POST, PUT, dan DELETE pada `/api/services` wajib menyertakan token JWT Admin pada header `Authorization: Bearer <token>`.

#### C. Halaman Pantau Pesanan (Orders)
Halaman ini berupa **Tabel Data (Data Table)** yang memantau transaksi dari semua pelanggan.
*(Catatan: Saat ini di controller backend Anda belum ada endpoint `GET /api/orders/all` khusus admin. Anda perlu menambahkan 1 fungsi get all orders pada `orderController.ts` agar admin bisa menarik semua data).*
- Fitur yang dibutuhkan: Filter berdasarkan `status` (menunggu kurir, sedang dicuci, selesai) dan pencarian berdasarkan ID pesanan.

### 3. Tips Integrasi Real-Time dengan Socket.io
Backend Anda sudah dikonfigurasi menggunakan `socket.io` (berjalan di port yang sama).
Pada website React/Vue Admin, Anda bisa me-*listen* event WebSocket untuk mendapatkan update setiap ada order baru atau perubahan status. Hal ini membuat dashboard lebih *live* tanpa perlu me-refresh halaman (F5).

Contoh integrasi pada klien JS:
```javascript
import { io } from "socket.io-client";

// Inisialisasi koneksi socket
const socket = io("http://<IP_SERVER_ANDA>:3000");

socket.on("connect", () => {
  console.log("Admin terhubung ke real-time server!");
});

// Dengarkan event notifikasi (sesuaikan dengan nama event di backend)
socket.on("order_status_updated", (data) => {
  // Tampilkan notifikasi (toast/alert) atau panggil ulang API (refetch data)
  alert(`Pesanan #${data.orderId} berubah status menjadi ${data.status}`);
});
```
