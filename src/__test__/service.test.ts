import request from "supertest";
import app from "../index.js";
import { AppDataSource } from "../../data-source.js";
import jwt from "jsonwebtoken";
import { Service } from "../entities/Service.js";

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

describe('Skenario Service / Layanan API', () => {
    const secret = process.env.JWT_SECRET || 'secret';
    const tokenAdmin = jwt.sign({id: '123e4567-e89b-12d3-a456-426614174001', role: 'admin'}, secret as string, {expiresIn: '1h'})
    const tokenPelanggan = jwt.sign({id: '123e4567-e89b-12d3-a456-426614174002', role: 'pelanggan'}, secret as string, {expiresIn: '1h'})
    
    let serviceId: number;

    beforeEach(async () => {
        const serviceRepo = AppDataSource.getRepository(Service);
        await serviceRepo.query('DELETE FROM services');
    });

    afterAll(async () => {
        const serviceRepo = AppDataSource.getRepository(Service);
        await serviceRepo.query('DELETE FROM services');
    });

    it('1. GET /api/services harus bisa mendapatkan semua layanan (tanpa login)', async () => {
        const serviceRepo = AppDataSource.getRepository(Service);
        await serviceRepo.save(serviceRepo.create({
            namaLayanan: 'Cuci Biasa Test',
            hargaPerKg: 5000,
            keterangan: 'Biasa saja',
            tarifOngkir: 1000,
            estimasiHari: 2
        }));

        const response = await request(app).get('/api/services');
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('message', 'Berhasil mendapatkan semua layanan');
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBe(1);
        expect(response.body.data[0].namaLayanan).toBe('Cuci Biasa Test');
    });

    it('2. POST /api/services harus bisa membuat layanan baru jika login sebagai admin', async () => {
        const response = await request(app)
            .post('/api/services')
            .set('Authorization', `Bearer ${tokenAdmin}`)
            .send({
                namaLayanan: 'Cuci Express',
                hargaPerKg: 10000,
                keterangan: 'Sehari jadi',
                tarifOngkir: 2000,
                estimasiHari: 1
            });
        
        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty('message', 'Layanan berhasil ditambahkan');
        expect(response.body.data.namaLayanan).toBe('Cuci Express');

        serviceId = response.body.data.id;
    });

    it('3. POST /api/services tidak boleh membuat layanan jika bukan admin', async () => {
        const response = await request(app)
            .post('/api/services')
            .set('Authorization', `Bearer ${tokenPelanggan}`)
            .send({
                namaLayanan: 'Cuci Haram',
                hargaPerKg: 5000,
                keterangan: '...',
                tarifOngkir: 1000,
                estimasiHari: 3
            });
        
        expect(response.statusCode).toBe(403); // as defined in authorizeRole middleware
    });

    it('4. POST /api/services harus gagal jika data tidak lengkap', async () => {
        const response = await request(app)
            .post('/api/services')
            .set('Authorization', `Bearer ${tokenAdmin}`)
            .send({
                namaLayanan: 'Layanan Kosong',
                // hargaPerKg missing
            });
        
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toMatch(/wajib diisi/i);
    });

    it('5. PUT /api/services/:id harus bisa update layanan oleh admin', async () => {
        // Buat layanan dulu
        const serviceRepo = AppDataSource.getRepository(Service);
        const service = await serviceRepo.save(serviceRepo.create({
            namaLayanan: 'Layanan A',
            hargaPerKg: 6000,
            keterangan: '-',
            tarifOngkir: 0,
            estimasiHari: 3
        }));

        const response = await request(app)
            .put(`/api/services/${service.id}`)
            .set('Authorization', `Bearer ${tokenAdmin}`)
            .send({
                namaLayanan: 'Layanan A Updated',
                hargaPerKg: 7500,
                keterangan: 'Updated',
                tarifOngkir: 500,
                estimasiHari: 2
            });
        
        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe('Layanan berhasil diupdate');
        expect(response.body.data.namaLayanan).toBe('Layanan A Updated');
        expect(response.body.data.hargaPerKg).toBe(7500);
    });

    it('6. DELETE /api/services/:id harus bisa hapus layanan oleh admin', async () => {
        // Buat layanan dulu
        const serviceRepo = AppDataSource.getRepository(Service);
        const service = await serviceRepo.save(serviceRepo.create({
            namaLayanan: 'Layanan Hapus',
            hargaPerKg: 6000,
            keterangan: '-',
            tarifOngkir: 0,
            estimasiHari: 1
        }));

        const response = await request(app)
            .delete(`/api/services/${service.id}`)
            .set('Authorization', `Bearer ${tokenAdmin}`);
        
        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe('Data berhasil dihapus.');

        // Verifikasi terhapus
        const check = await serviceRepo.findOne({where: {id: service.id}});
        expect(check).toBeNull();
    });
});
