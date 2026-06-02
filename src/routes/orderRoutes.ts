import { Router } from "express";
import { buatPesanan, getOrderTerdekat, takeOrder, getOrderHistory, updateStatusOrder, getOrderDetail, getAllOrders, getDashboardStats } from "../controllers/orderController.js";
import { verifyToken, authorizeRole } from "../authMiddleware.js";

const router = Router();

router.post("/orders", verifyToken, authorizeRole(['pelanggan']), buatPesanan);
router.get("/pickup", verifyToken, authorizeRole(['kurir']), getOrderTerdekat);
router.get('/history', verifyToken, authorizeRole(['pelanggan']), getOrderHistory);
router.get('/orders/:id', verifyToken, authorizeRole(['kurir', 'pelanggan']), getOrderDetail);
router.put("/orders/:id/take", verifyToken, authorizeRole(['kurir']), takeOrder);
router.put("/orders/:id/status", verifyToken, authorizeRole(['kurir']), updateStatusOrder);

// Route Admin Dashboard (tanpa auth sementara)
router.get('/orders/all', getAllOrders);
router.get('/orders/stats', getDashboardStats);

export default router;