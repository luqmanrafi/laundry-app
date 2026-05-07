import request from "supertest";
import app from "../index.js";
import { AppDataSource } from "../../data-source.js";
import jwt from "jsonwebtoken";
import { Service } from "../entities/Service.js";
import { Order } from "../entities/Order.js";

beforeAll(async () => {
    if(!AppDataSource.isInitialized){
        await AppDataSource.initialize();
    }
});

afterAll(async () =>{
    if(AppDataSource.isInitialized){
        await AppDataSource.destroy();
    }
});

describe('Skenario Pemesanan Laundry Lengkap', () => {
    const secret = process.env.JWT_SECRET || 'secret';
    const tokenPelanggan = jwt.sign({id: 99, role: 'pelanggan'}, secret as string, {expiresIn: '1h'})
    const tokenKurir = jwt.sign({id: 98, role: 'kurir'}, secret as string, {expiresIn: '1h'});
    
    let serviceId: number;
    let orderId: number;

    beforeAll(async () => {
        // Cleanup existing data to avoid conflicts during testing
        const orderRepo = AppDataSource.getRepository(Order);
        await orderRepo.query('DELETE FROM orders');
        const serviceRepo = AppDataSource.getRepository(Service);
        await serviceRepo.query('DELETE FROM services');

        // Create a test service
        const service = serviceRepo.create({
            namaLayanan: 'Cuci Kilat Test',
            hargaPerKg: 7000,
            keterangan: 'Cepat selesai'
        });
        await serviceRepo.save(service);
        serviceId = service.id;
    });

    afterAll(async () => {
        // Cleanup test data
        const orderRepo = AppDataSource.getRepository(Order);
        await orderRepo.query('DELETE FROM orders');
        const serviceRepo = AppDataSource.getRepository(Service);
        await serviceRepo.query('DELETE FROM services');
    });

    it('1. Harus bisa membuat order baru (Pelanggan)', async () => {
        const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${tokenPelanggan}`)
        .send({
            serviceId: serviceId, // Uses serviceId instead of string literal 'layanan'
            latitude: -7.1123,
            longitude: 110.3838,
        });
        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty('message', 'Pesanan berhasil dibuat. Menunggu kurir menjemput pesanan Anda.');
        expect(response.body.data.lokasiPenjemputan).toHaveProperty('type', 'Point');
        
        orderId = response.body.data.id; // Save for next tests
    });

    it('2. Tidak Bisa membuat order tanpa data lengkap', async () => {
        const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${tokenPelanggan}`)
        .send({
            serviceId: serviceId,
        });
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('message', 'Layanan dan lokasi wajib diisi');
    });

    it('3. Kurir tidak bisa membuat order', async()=>{
        const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${tokenKurir}`)
        .send({
            serviceId: serviceId,
            latitude: -7.1123,
            longitude: 110.3838,
        });
        expect(response.statusCode).toBe(403);
        expect(response.body.message).toMatch(/tidak memiliki akses/i);
    });

    it('4. Kurir bisa melihat pesanan terdekat', async () => {
        const response = await request(app)
        .get('/api/pickup?latitude=-7.1120&longitude=110.3830')
        .set('Authorization', `Bearer ${tokenKurir}`);
        
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('message', 'Berhasil mendapatkan pesanan terdekat');
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
        expect(response.body.data[0]).toHaveProperty('order_id', orderId);
    });

    it('5. Kurir bisa menginput berat pesanan', async () => {
        const response = await request(app)
        .put(`/api/orders/${orderId}/berat`)
        .set('Authorization', `Bearer ${tokenKurir}`)
        .send({ berat: 3 });

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('message', 'Berat sudah ditambahkan. memproses pesanan');
        expect(response.body.data.berat).toBe(3);
        expect(response.body.data.totalBiaya).toBe(3 * 7000); // berat * hargaPerKg
        expect(response.body.data.status).toBe('dibawa_kurir_ke_laundry');
    });

    it('6. Kurir bisa mengubah status pesanan', async () => {
        const response = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${tokenKurir}`)
        .send({ status: 'sedang_dicuci' });

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('message', 'Status pesanan berhasil diubah menjadi: sedang_dicuci');
        expect(response.body.data.status).toBe('sedang_dicuci');
    });

    it('7. Pelanggan bisa melihat riwayat pesanannya', async () => {
        const response = await request(app)
        .get('/api/history')
        .set('Authorization', `Bearer ${tokenPelanggan}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('message', 'Berhasil mendapatkan riwayat order.');
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
        expect(response.body.data[0].id).toBe(orderId);
        expect(response.body.data[0].status).toBe('sedang_dicuci');
    });
});