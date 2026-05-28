import { Router } from 'express';
import { payOrder, handleMidtransWebhook } from '../controllers/paymentController.js';

const router = Router();

router.post('/orders/:orderId/pay', payOrder);
router.post('/webhooks/payment', handleMidtransWebhook);

export default router;
