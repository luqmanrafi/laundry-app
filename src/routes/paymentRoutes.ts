import { Router } from 'express';
import { payOrder, handleMidtransWebhook } from '../controllers/paymentController.js';
import { verifyToken } from '../authMiddleware.js';

const router = Router();

router.post('/orders/:id/pay', verifyToken, payOrder);
router.post('/webhooks/payment', handleMidtransWebhook);

export default router;
