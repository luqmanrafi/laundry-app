import { type Response } from "express";
import { type authRequest } from "../authMiddleware.js";
import { Order } from "../entities/Order.js";
import { AppDataSource } from "../../data-source.js";
import { Service } from "../entities/Service.js";

export const buatPesanan = async (req: authRequest, res: Response): Promise<void> => {
    try {
        const { serviceId, latitude, longitude } = req.body;
        const userId = req.user?.id;
        if (!userId || !serviceId || !latitude || !longitude) {
            res.status(400).json({ message: 'Layanan dan lokasi wajib diisi' });
            return;
        }

        const serviceRepository = AppDataSource.getRepository(Service);
        const serviceData = await serviceRepository.findOne({ where: { id: serviceId } });
        if (!serviceData) {
            res.status(404).json({ message: 'Layanan tidak ditemukan.' });
            return;
        }

        const orderRepository = AppDataSource.getRepository(Order);
        const orderBaru = orderRepository.create({
            userId: userId,
            layanan: serviceData,
            hargaPerkg: serviceData.hargaPerKg,
            lokasiPenjemputan: {
                type: 'Point',
                coordinates: [longitude, latitude]
            }
        });
        await orderRepository.save(orderBaru);
        res.status(201).json({
            message: 'Pesanan berhasil dibuat. Menunggu kurir menjemput pesanan Anda.',
            data: orderBaru
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi error pada server. Harap coba lagi.' });
    }
}

export const getOrderTerdekat = async (req: authRequest, res: Response): Promise<void> => {
    try {
        const { latitude, longitude } = req.query;
        if (!latitude || !longitude) {
            res.status(400).json({ message: 'Lokasi kurir tidak dapat ditemukan.' });
            return;
        }

        const orderRepository = AppDataSource.getRepository(Order);
        const orderTerdekat = await orderRepository
            .createQueryBuilder('order')
            .where('order.status = :status', { status: 'menunggu_kurir' })
            .addSelect(
                `ST_DistanceSphere(
                    order.lokasiPenjemputan,
                    ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)
                )`,
                'jarak_meter'
            )
            .setParameters({
                longitude: parseFloat(longitude as string),
                latitude: parseFloat(latitude as string)
            })
            .orderBy('jarak_meter', 'ASC')
            .getRawMany();

        res.status(200).json({
            message: 'Berhasil mendapatkan pesanan terdekat',
            data: orderTerdekat
        });
    } catch (error) {
        console.error('Error ketika mencari pesanan terdekat: ', error);
        res.status(500).json({ message: 'Terjadi error pada server. Harap coba lagi.' });
    }
}

export const inputBerat = async (req: authRequest, res: Response): Promise<void> => {
    try {
        const id = req.params.id;
        if (!id || Array.isArray(id)) {
            res.status(400).json({ message: 'ID pesanan tidak valid.' });
            return;
        }
        const orderId = parseInt(id);
        const { berat } = req.body;
        const kurirId = req.user?.id;

        if (!kurirId) {
            res.status(401).json({ message: 'Akses ditolak. Kurir tidak terautentikasi.' });
            return;
        }

        if (!berat || berat <= 0) {
            res.status(400).json({ message: 'Berat harus diisi harus lebih dari 0kg.' });
            return;
        }

        const orderRepository = AppDataSource.getRepository(Order);
        const order = await orderRepository.findOne({ where: { id: orderId } });
        if (!order) {
            res.status(404).json({ message: 'Pesanan tidak ditemukan.' });
            return;
        }
        if (order.status !== 'menunggu_kurir') {
            res.status(400).json({
                message: 'Pesanan sudah diproses atau sudah diambil oleh kurir lain.',
            });
            return;
        }
        const totalBiaya = order.hargaPerkg * berat;

        order.berat = berat;
        order.totalBiaya = totalBiaya;
        order.kurirId = kurirId as number;
        order.status = 'dibawa_kurir_ke_laundry';

        await orderRepository.save(order);
        res.status(200).json({
            message: 'Berat sudah ditambahkan. memproses pesanan',
            data: {
                orderId: order.id,
                berat: order.berat,
                totalBiaya: order.totalBiaya,
                status: order.status
            }
        });
    } catch (error) {
        console.error('Error ketika menambahkan berat pesanan : ', error);
        res.status(500).json({ message: 'Terjadi error pada server. Harap coba lagi.' });
    }
}

export const getOrderHistory = async (req: authRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Akses ditolak. Silahkan login terlebih dahulu.' });
            return;
        }
        const orderRepository = AppDataSource.getRepository(Order);
        const riwayat = await orderRepository.find({
            where: { userId: userId },
            relations: ['layanan'],
            order: {
                createdAt: 'DESC'
            }
        });
        if (riwayat.length === 0) {
            res.status(200).json({ message: 'Anda belum pernah melakukan order.', data: [] });
            return;
        }

        res.status(200).json({
            message: 'Berhasil mendapatkan riwayat order.',
            data: riwayat
        });
    } catch (error) {
        console.error('Error ketika mendapatkan riwayat order : ', error);
        res.status(500).json({ message: 'Terjadi error pada server. Harap coba lagi.' });
    }
}

export const updateStatusOrder = async (req: authRequest, res: Response): Promise<void> => {
    try {
        const id = req.params.id;
        if (!id || typeof id !== 'string') {
            res.status(400).json({ message: 'ID order tidak valid.' });
            return;
        }
        const orderId = parseInt(id);
        if (isNaN(orderId)) {
            res.status(400).json({ message: 'ID order harus berupa angka.' });
            return;
        }
        const { status } = req.body;

        const statusValid = [
            'dibawa_kurir_ke_laundry',
            'sedang_dicuci',
            'siap_dikirim',
            'proses_pengantaran',
            'selesai'
        ];
        if (!statusValid.includes(status)) {
            res.status(400).json({ message: 'Status tidak valid.' });
            return;
        }

        const orderRepository = AppDataSource.getRepository(Order);
        const order = await orderRepository.findOne({where: {id: orderId}});
        if(!order){
            res.status(404).json({message: 'ID order tidak dapat ditemukan.'});
            return;
        }

        order.status = status;
        await orderRepository.save(order);
        res.status(200).json({
            message: `Status pesanan berhasil diubah menjadi: ${status}`,
            data: order 
        });
    } catch (error) {
        console.error('Error ketika mengupdate status order : ', error);
        res.status(500).json({ message: 'Terjadi error pada server. Harap coba lagi.' });
    }
}