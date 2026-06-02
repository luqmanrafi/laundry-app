import 'reflect-metadata';
import express, { type Request, type Response } from 'express';
import {Pool} from 'pg';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import { AppDataSource } from '../data-source.js';
import authRoutes from './routes/authRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { connectRedis } from './config/redisClient.js';
import { setupTrackingSockets } from './sockets/trackingSockets.js';

dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);
const server = http.createServer(app);

const io = new Server(server, {
    cors: {origin: '*', methods: ['GET', 'POST']}
})

// CORS middleware untuk admin frontend
app.use((req: Request, res: Response, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
    }
    next();
});

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api', orderRoutes);
app.use('/api', serviceRoutes);
app.use('/api', paymentRoutes);
app.use('/api/admin', adminRoutes);
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
    .catch((error)=>console.log('Error! gagal menyambungkan ORM', error));
    
    await connectRedis();
    setupTrackingSockets(io);

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
