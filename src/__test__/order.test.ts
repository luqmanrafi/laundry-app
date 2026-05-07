import request from "supertest";
import app from "../index.js";
import { AppDataSource } from "../../data-source.js";
import jwt from "jsonwebtoken";

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

describe('Skenario Pemesanan Laundry', () => {
    const secret = process.env.JWT_SECRET;
    const tokenPelanggan = jwt.sign({id: 99, role: 'pelanggan'},secret as string, {expiresIn: '1h'})
    const tokenKurir = jwt.sign({id: 98, role: 'kurir'},secret as string, {expiresIn: '1h'});
    it('1. Harus bisa membuat order baru', async () => {
        const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${tokenPelanggan}`)
        .send({
            layanan: 'Cuci Komplit',
            latitude: -7.1123,
            longitude: 110.3838,
        });
        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty('message', 'Pesanan berhasil dibuat. Menunggu kurir menjemput pesanan Anda.');

        expect(response.body.data.lokasiPenjemputan).toHaveProperty('type', 'Point');
        expect(response.body.data.lokasiPenjemputan.coordinates).toEqual([110.3838, -7.1123]);
    });
    it('2. Tidak Bisa membuat order tanpa token', async () => {
        const response = await request(app)
        .post('/api/orders')
        .send({
            layanan: 'Cuci Komplit',
            latitude: -7.1123,
            longitude: 110.3838,
        });
        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty('message', 'Akses ditolak. silahkan login terlebih dahulu.');
    });
    it('3. Tidak Bisa membuat order tanpa data lengkap', async () => {
        const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${tokenPelanggan}`)
        .send({
            layanan: 'Cuci Komplit',
        });
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('message', 'Layanan dan lokasi wajib diisi');
    });
    it('4. Kurir tidak bisa membuat order.', async()=>{
        const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${tokenKurir}`)
        .send({
            layanan: 'Setrika saja',
            latitude: -7.1123,
            longitude: 110.3838,
        });
        expect(response.statusCode).toBe(403);
        expect(response.body.message).toMatch(/tidak memiliki akses/i);
    })
})