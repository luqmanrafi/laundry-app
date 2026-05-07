import { Router } from "express";
import { buatPesanan, getOrderTerdekat, inputBerat, getOrderHistory, updateStatusOrder } from "../controllers/orderController.js";
import { verifyToken, authorizeRole } from "../authMiddleware.js";

const router = Router();

router.post("/orders", verifyToken, authorizeRole(['pelanggan']), buatPesanan);
router.get("/pickup", verifyToken, authorizeRole(['kurir']), getOrderTerdekat);
router.get('/history', verifyToken, authorizeRole(['pelanggan']), getOrderHistory);
router.put("/orders/:id/berat", verifyToken, authorizeRole(['kurir']), inputBerat);
router.put("/orders/:id/status", verifyToken, authorizeRole(['kurir']), updateStatusOrder);

export default router;