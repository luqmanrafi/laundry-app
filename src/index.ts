import 'reflect-metadata';
import express, { type Request, type Response } from 'express';
import {Pool} from 'pg';
import dotenv from 'dotenv';
import { AppDataSource } from '../data-source.js';
import authRoutes from './routes/authRoutes.js'
import orderRoutes from './routes/orderRoutes.js'

dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api', orderRoutes);
app.get('/', (req: Request, res: Response)=>{
    res.json({
        message: 'sukses',
        status: 'Running',
        time: new Date().toISOString()
    });
});

if(process.env.NODE_ENV !== 'test'){
    AppDataSource.initialize().then(()=>{
        console.log('Sukses menghubungkan ORM!')
    })
    .catch((error)=>console.log('Error! gagal menyambungkan ORM', error))

    const pool = new Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: parseInt(process.env.DB_PORT || '5432'),
    });

    pool.connect((err, client, release) => {
        if(err){
            return console.error('Koneksi error. Pastikan docker menyala',err.stack)
        }
        console.log('Koneksi sukses!');
        release();
    });

    app.listen(port, '0.0.0.0', ()=>{
        console.log(`Server running pada port : ${port}`);
    }); 
}

export default app;
