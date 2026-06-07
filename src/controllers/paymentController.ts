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
        
        const amount = order.totalBiaya;

        const transaction = await paymentService.createTransaction(order, amount);
        
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
