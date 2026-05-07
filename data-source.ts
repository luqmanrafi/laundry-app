import 'reflect-metadata';
import dotenv from 'dotenv';
import path from 'path';
import { DataSource } from 'typeorm';
import { User} from './src/entities/User.js';
import { Order } from './src/entities/Order.js';
import { Service } from './src/entities/Service.js';

const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

const {DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME} = process.env;
if (!DB_HOST || !DB_PORT || !DB_USER || !DB_PASSWORD || !DB_NAME){
    throw new Error("Fatal ERROR! Pastikan konfigurasi pada .env terisi semua.")
}
export const AppDataSource = new DataSource({
    type: 'postgres',
    host: DB_HOST,
    port: parseInt(DB_PORT || '5432'),
    username: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    synchronize: true, 
    logging: false,
    entities: [User, Order, Service], 
    subscribers: [],
    migrations: [],
});