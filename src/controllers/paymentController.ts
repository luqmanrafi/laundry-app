import type { Request, Response } from 'express';
import { paymentService } from '../services/paymentService.js';
import { AppDataSource } from '../../data-source.js';
import { Order } from '../entities/Order.js';

export const payOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const { orderId } = req.params;
        // In a real app, calculate amount from order.totalBiaya or similar, ensuring it is correct
        // For demonstration, we assume body has amount or we calculate it.
        const orderRepository = AppDataSource.getRepository(Order);
        const order = await orderRepository.findOne({ where: { id: parseInt(orderId as string) } });

        if (!order) {
            res.status(404).json({ message: "Order not found" });
            return;
        }
        
        // Ensure totalBiaya is set, fallback to 10000 for test
        const amount = order.totalBiaya || 10000;

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
