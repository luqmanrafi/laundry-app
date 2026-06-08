import { Router } from "express";
import { buatPesanan, getOrderTerdekat, antarOrder, takeOrder, inputBeratOrder, getOrderHistory, updateStatusOrder, getOrderDetail, getAllOrders, getDashboardStats, deleteOrder } from "../controllers/orderController.js";
import { verifyToken, authorizeRole } from "../authMiddleware.js";

const router = Router();

// Route Admin Dashboard (diletakkan di atas agar tidak bertabrakan dengan /orders/:id)
router.get('/orders/all', verifyToken, authorizeRole(['admin']), getAllOrders);
router.get('/orders/stats', verifyToken, authorizeRole(['admin']), getDashboardStats);
router.delete('/orders/:id', verifyToken, authorizeRole(['admin']), deleteOrder);

// Route App (Flutter)
router.post("/orders", verifyToken, authorizeRole(['pelanggan']), buatPesanan);
router.get("/pickup", verifyToken, authorizeRole(['kurir']), getOrderTerdekat);
router.get('/history', verifyToken, authorizeRole(['pelanggan']), getOrderHistory);
router.get('/orders/:id', verifyToken, authorizeRole(['kurir', 'pelanggan']), getOrderDetail);
router.put("/orders/:id/antar", verifyToken, authorizeRole(['kurir']), antarOrder);
router.put("/orders/:id/take", verifyToken, authorizeRole(['kurir']), takeOrder);
router.put("/orders/:id/input-berat", verifyToken, authorizeRole(['kurir']), inputBeratOrder);
router.put("/orders/:id/status", verifyToken, authorizeRole(['admin', 'kurir']), updateStatusOrder);

export default router;