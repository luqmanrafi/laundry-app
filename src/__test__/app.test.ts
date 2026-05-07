import request from 'supertest';
import app from '../index.js';

describe('Sanity check API', ()=>{
    it('menampilkan status running pada saat menjalankan endpoint /', async () =>{
        const response = await request(app).get('/');

        expect(response.statusCode).toBe(200);
        expect(response.body.status).toBe('Running');
    })
})