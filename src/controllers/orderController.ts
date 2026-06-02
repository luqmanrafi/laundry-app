import { type Response } from "express";
import { type authRequest } from "../authMiddleware.js";
import { Order } from "../entities/Order.js";
import { AppDataSource } from "../../data-source.js";
import { Service } from "../entities/Service.js";
import { User } from "../entities/User.js";

export const buatPesanan = async (req: authRequest, res: Response): Promise<void> => {
    try {
        const { serviceId, latitude, longitude, deskripsi } = req.body || {};
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

        const queryJarak = await AppDataSource.manager.query(
            `SELECT ST_DistanceSphere(
                ST_MakePoint($1, $2),
                ST_MakePoint($3, $4)
            ) as jarak_meter`,
            [longitude,latitude,process.env.LAUNDRY_LNG,process.env.LAUNDRY_LAT]
        )
        const jarakKm = queryJarak[0].jarak_meter/1000;
        const ongkir = Math.round(jarakKm * serviceData.tarifOngkir);

        const orderRepository = AppDataSource.getRepository(Order);
        const orderBaru = orderRepository.create({
            userId: userId,
            layanan: serviceData,
            hargaPerkg: serviceData.hargaPerKg,
            deskripsi: deskripsi || 'null',
            ongkir: ongkir,
            lokasiPenjemputan: {
                type: 'Point',
                coordinates: [longitude, latitude]
            }
        });
        await orderRepository.save(orderBaru);
        res.status(201).json({
            message: 'Pesanan berhasil dibuat. Menunggu kurir menjemput pesanan Anda.',
            data: {
                id: orderBaru.id,
                jarak: `${jarakKm.toFixed(2)} KM`,
                ongkir: ongkir,
                totalEstimasi: 'Akan dihitung setelah kurir input berat',
                lokasiPenjemputan: orderBaru.lokasiPenjemputan
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi error pada server. Harap coba lagi.' });
    }
}

export const getOrderDetail = async (req: authRequest, res: Response): Promise<void> => {
    try{
        const id = req.params;
        if (!id) {
            res.status(400).json({ message: 'ID pesanan tidak ditemukan.' });
            return;
        }
        const orderRepository = AppDataSource.getRepository(Order);
        const order = await orderRepository.findOne({
            where: { id: parseInt(id.id as string) },
            relations: ['layanan', 'kurir']
        });
        if (!order) {
            res.status(404).json({ message: 'Pesanan tidak ditemukan.' });
            return;
        }
        res.status(200).json({
            message: 'Pesanan ditemukan.',
            data: order
        });
    } catch (error) {
        console.error('Error ketika mencari detail pesanan : ', error);
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

export const takeOrder = async (req: authRequest, res: Response): Promise<void> => {
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
        const totalBiaya = order.hargaPerkg * berat + order.ongkir;

        const updateResult = await orderRepository.update(
            { id: orderId, status: 'menunggu_kurir' },
            {
                berat: berat,
                totalBiaya: totalBiaya,
                kurirId: kurirId as string,
                status: 'dibawa_kurir_ke_laundry'
            }
        );

        if (updateResult.affected === 0) {
            res.status(400).json({
                message: 'Pesanan gagal diproses, kemungkinan pesanan baru saja diambil oleh kurir lain.',
            });
            return;
        }

        res.status(200).json({
            message: 'Berat sudah ditambahkan. memproses pesanan',
            data: {
                orderId: order.id,
                berat: berat,
                totalBiaya: totalBiaya,
                status: 'dibawa_kurir_ke_laundry'
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
        const updateResult = await orderRepository.update(orderId, { status });

        if(updateResult.affected === 0){
            res.status(404).json({message: 'ID order tidak dapat ditemukan.'});
            return;
        }

        const updatedOrder = await orderRepository.findOne({where: {id: orderId}});
        res.status(200).json({
            message: `Status pesanan berhasil diubah menjadi: ${status}`,
            data: updatedOrder 
        });
    } catch (error) {
        console.error('Error ketika mengupdate status order : ', error);
        res.status(500).json({ message: 'Terjadi error pada server. Harap coba lagi.' });
    }
}

export const getAllOrders = async (req: authRequest, res: Response): Promise<void> => {
    try {
        const { status, search, page = '1', limit = '20' } = req.query;
        const orderRepository = AppDataSource.getRepository(Order);

        const queryBuilder = orderRepository
            .createQueryBuilder('order')
            .leftJoinAndSelect('order.layanan', 'layanan')
            .orderBy('order.createdAt', 'DESC');

        if (status && typeof status === 'string') {
            queryBuilder.andWhere('order.status = :status', { status });
        }

        if (search && typeof search === 'string') {
            const searchNum = parseInt(search);
            if (!isNaN(searchNum)) {
                queryBuilder.andWhere('order.id = :searchId', { searchId: searchNum });
            }
        }

        const pageNum = parseInt(page as string) || 1;
        const limitNum = parseInt(limit as string) || 20;
        const skip = (pageNum - 1) * limitNum;

        const [orders, total] = await queryBuilder
            .skip(skip)
            .take(limitNum)
            .getManyAndCount();

        res.status(200).json({
            message: 'Berhasil mendapatkan semua pesanan',
            data: orders,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum)
        });
    } catch (error) {
        console.error('Error getAllOrders:', error);
        res.status(500).json({ message: 'Terjadi error pada server. Harap coba lagi.' });
    }
}

export const getDashboardStats = async (req: authRequest, res: Response): Promise<void> => {
    try {
        const orderRepository = AppDataSource.getRepository(Order);
        const userRepository = AppDataSource.getRepository(User);

        // Total pesanan
        const totalOrders = await orderRepository.count();

        // Pesanan aktif (belum selesai)
        const activeOrders = await orderRepository
            .createQueryBuilder('order')
            .where('order.status != :status', { status: 'selesai' })
            .getCount();

        // Pesanan selesai
        const completedOrders = await orderRepository
            .createQueryBuilder('order')
            .where('order.status = :status', { status: 'selesai' })
            .getCount();

        // Total pendapatan (dari pesanan yang sudah selesai / paid)
        const revenueResult = await orderRepository
            .createQueryBuilder('order')
            .select('COALESCE(SUM(order.totalBiaya), 0)', 'total')
            .where('order.paymentStatus = :ps', { ps: 'paid' })
            .getRawOne();
        const totalRevenue = parseFloat(revenueResult?.total || '0');

        // Total pelanggan
        const totalCustomers = await userRepository.count({ where: { role: 'pelanggan' } });

        // Total kurir
        const totalCouriers = await userRepository.count({ where: { role: 'kurir' } });

        // Status breakdown
        const statusBreakdown = await orderRepository
            .createQueryBuilder('order')
            .select('order.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .groupBy('order.status')
            .getRawMany();

        // Pendapatan 7 hari terakhir
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const revenueByDay = await orderRepository
            .createQueryBuilder('order')
            .select("DATE(order.createdAt)", 'date')
            .addSelect('COALESCE(SUM(order.totalBiaya), 0)', 'total')
            .where('order.createdAt >= :startDate', { startDate: sevenDaysAgo })
            .andWhere('order.paymentStatus = :ps', { ps: 'paid' })
            .groupBy("DATE(order.createdAt)")
            .orderBy("DATE(order.createdAt)", 'ASC')
            .getRawMany();

        // Pesanan terbaru (5 terakhir)
        const recentOrders = await orderRepository.find({
            relations: ['layanan'],
            order: { createdAt: 'DESC' },
            take: 5
        });

        res.status(200).json({
            message: 'Berhasil mendapatkan statistik dashboard',
            data: {
                totalOrders,
                activeOrders,
                completedOrders,
                totalRevenue,
                totalCustomers,
                totalCouriers,
                statusBreakdown,
                revenueByDay,
                recentOrders
            }
        });
    } catch (error) {
        console.error('Error getDashboardStats:', error);
        res.status(500).json({ message: 'Terjadi error pada server. Harap coba lagi.' });
    }
}