import { Order } from '../entities/Order.js';
import { Transaction } from '../entities/Transaction.js';
import { AppDataSource } from '../../data-source.js';
// @ts-ignore
import midtransClient from 'midtrans-client';

export class PaymentService {
    private snap: any;

    constructor() {
        this.snap = new midtransClient.Snap({
            isProduction : process.env.MIDTRANS_IS_PRODUCTION === 'true',
            serverKey : process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-DUMMY',
            clientKey : process.env.MIDTRANS_CLIENT_KEY || 'SB-Mid-client-DUMMY'
        });
    }

    async createTransaction(order: Order, amount: number): Promise<Transaction> {
        const transactionRepository = AppDataSource.getRepository(Transaction);
        
        let transaction = new Transaction();
        transaction.order = order;
        transaction.amount = amount;
        transaction.status = 'pending';
        transaction = await transactionRepository.save(transaction);
        
        let parameter = {
            "transaction_details": {
                "order_id": transaction.id, // using UUID for unique midtrans order_id
                "gross_amount": amount
            },
            "customer_details": {
                "first_name": "Customer", 
                "id": order.userId.toString()
            }
        };

        const midtransTransaction = await this.snap.createTransaction(parameter);
        
        transaction.paymentUrl = midtransTransaction.redirect_url;
        await transactionRepository.save(transaction);
        
        return transaction;
    }
    
    async handleWebhook(notificationData: any): Promise<Transaction> {
        const statusResponse = await this.snap.transaction.notification(notificationData);
        
        let midtransOrderId = statusResponse.order_id;
        let transactionStatus = statusResponse.transaction_status;
        let fraudStatus = statusResponse.fraud_status;

        const transactionRepository = AppDataSource.getRepository(Transaction);
        const orderRepository = AppDataSource.getRepository(Order);
        
        const transaction = await transactionRepository.findOne({ 
            where: { id: midtransOrderId },
            relations: ['order']
        });
        
        if (!transaction) throw new Error("Transaction not found");

        if (transactionStatus == 'capture'){
            if (fraudStatus == 'accept'){
                transaction.status = 'settlement';
            }
        } else if (transactionStatus == 'settlement'){
            transaction.status = 'settlement';
        } else if (transactionStatus == 'cancel' || transactionStatus == 'deny' || transactionStatus == 'expire'){
            transaction.status = 'failed';
        } else if (transactionStatus == 'pending'){
            transaction.status = 'pending';
        }

        await transactionRepository.save(transaction);
        
        if (transaction.status === 'settlement') {
            const order = transaction.order;
            order.paymentStatus = 'paid';
            await orderRepository.save(order);
        }
        
        return transaction;
    }
}

export const paymentService = new PaymentService();
