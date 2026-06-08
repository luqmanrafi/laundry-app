import { Router } from 'express';
import { payOrder, handleMidtransWebhook, updatePaymentStatusManual } from '../controllers/paymentController.js';
import { verifyToken, authorizeRole } from '../authMiddleware.js';

const router = Router();

router.post('/orders/:id/pay', verifyToken, payOrder);
router.put('/orders/:id/payment-status', verifyToken, authorizeRole(['admin']), updatePaymentStatusManual);
router.post('/webhooks/payment', handleMidtransWebhook);

export default router;
