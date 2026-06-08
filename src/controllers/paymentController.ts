import type { Request, Response } from 'express';
import { paymentService } from '../services/paymentService.js';
import { AppDataSource } from '../../data-source.js';
import { Order } from '../entities/Order.js';
import { User } from '../entities/User.js';

import { type authRequest } from '../authMiddleware.js';

export const payOrder = async (req: authRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const orderRepository = AppDataSource.getRepository(Order);
        const order = await orderRepository.findOne({ where: { id: parseInt(id as string) } });
        
        if (!order) {
            res.status(404).json({ message: "Order not found" });
            return;
        }

        if (order.userId !== req.user?.id) {
            res.status(403).json({ message: "Akses ditolak. Anda tidak dapat membayar pesanan milik pengguna lain." });
            return;
        }

        const isPaymentValid = order.paymentStatus === 'paid' || order.paymentStatus === 'settlement';
        
        if (order.status === 'menunggu_kurir' || order.status === 'kurir_menuju_lokasi' || order.totalBiaya === null || order.status === 'selesai' || order.status === 'diterima_pelanggan') {
            res.status(400).json({ message: "Order tidak dapat dibayar. Tunggu kurir selesai memasukkan berat." });
            return;
        }

        if (isPaymentValid) {
            res.status(400).json({ message: "Order tidak dapat dibayar. Payment sudah berhasil." }); 
            return;
        }
        
        const requestAmount = req.body.amount || req.body.gross_amount;
        const finalAmount = requestAmount ? parseFloat(requestAmount) : (order.totalBiaya || 10000);

        // Simpan total biaya ke database jika dikirim dari Flutter (agar Dashboard Admin ikut update)
        if (requestAmount && order.totalBiaya !== finalAmount) {
            order.totalBiaya = finalAmount;
            await orderRepository.save(order);
        }

        const transaction = await paymentService.createTransaction(order, finalAmount);
        
        res.status(200).json({
            status: "success",
            message: "Payment created successfully",
            data: {
                payment_url: transaction.paymentUrl,
                transaction_id: transaction.id
            }
        });
    } catch (error: any) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const handleMidtransWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
        const notificationData = req.body;
        await paymentService.handleWebhook(notificationData);
        
        res.status(200).json({ status: "ok" });
    } catch (error: any) {
        console.error("Webhook Error:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updatePaymentStatusManual = async (req: authRequest, res: Response): Promise<void> => {
    try {
        const id = req.params.id;
        if (!id || typeof id !== 'string') {
            res.status(400).json({ message: 'ID order tidak valid.' });
            return;
        }
        
        const orderId = parseInt(id);
        const orderRepository = AppDataSource.getRepository(Order);
        const order = await orderRepository.findOne({ where: { id: orderId } });
        
        if (!order) {
            res.status(404).json({ message: 'ID order tidak dapat ditemukan.' });
            return;
        }

        // Hanya izinkan admin yang bisa update manual
        if (req.user?.role !== 'admin') {
            res.status(403).json({ message: 'Akses ditolak. Hanya admin yang dapat melakukan aksi ini.' });
            return;
        }

        // Update paymentStatus jadi paid
        await orderRepository.update(orderId, { paymentStatus: 'paid' });

        const updatedOrder = await orderRepository.findOne({ where: { id: orderId } });
        res.status(200).json({
            message: 'Status pembayaran berhasil diubah menjadi Lunas',
            data: updatedOrder 
        });
    } catch (error) {
        console.error('Error update payment manual:', error);
        res.status(500).json({ message: 'Terjadi error pada server. Harap coba lagi.' });
    }
};
