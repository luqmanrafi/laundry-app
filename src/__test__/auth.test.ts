import  request  from "supertest";
import app from '../index.js';
import { AppDataSource } from "../../data-source.js";

const randomEmail = `tester_${Date.now()}@gmail.com`;
const dummyPassword = 'password123';

beforeAll(async()=>{
    if(!AppDataSource.isInitialized){
        await AppDataSource.initialize();
    }
});

afterAll(async()=>{
    if(AppDataSource.isInitialized){
        await AppDataSource.destroy();
    }
});

describe('Skenario Auth(Login & Register)',()=>{
    describe('POST /api/auth/register', ()=>{
        it('1. Sukses mendaftarkan user baru (Status 201)', async() => {
            const response = await request(app).post('/api/auth/register').send({
                nama:'Tester',
                email: randomEmail,
                password: dummyPassword,
                role: 'pelanggan'
            });

            expect(response.statusCode).toBe(201);
            expect(response.body).toHaveProperty('message', 'Registrasi berhasil')
            expect(response.body.user).toHaveProperty('email', randomEmail);
        })

        it('2. Gagal mendaftarkan user baru (Status 400)', async() => {
            const response = await request(app).post('/api/auth/register').send({
                nama:'Tester clone',
                email: randomEmail,
                password: dummyPassword,
            });

            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty('message', 'Email sudah terdaftar');
        })
    });

    describe('POST /api/auth/login', ()=>{
        it('3. Sukses login user (Status 200)', async() => {
            const response = await request(app).post('/api/auth/login').send({
                email: randomEmail,
                password: dummyPassword,
            });

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('message', 'Login berhasil');
            expect(response.body).toHaveProperty('token');
            expect(response.body.user).toHaveProperty('email', randomEmail);
        })

        it('4. Login gagal ketika password salah (Status 401)', async() => {
            const response = await request(app).post('/api/auth/login').send({
                email: randomEmail,
                password: 'blabla',
            });

            expect(response.statusCode).toBe(401);
            expect(response.body).toHaveProperty('message', 'Email atau password salah');
        })
    })
})
