import { Router } from "express";
import { getAllUsers, getUserById, deleteUser } from "../controllers/adminController.js";
import { verifyToken, authorizeRole } from "../authMiddleware.js";
import * as adminController from "../controllers/adminController.js";

const router = Router();

router.get('/users', verifyToken, authorizeRole(['admin']), adminController.getAllUsers);
router.get('/users/:id', verifyToken, authorizeRole(['admin']), adminController.getUserById);
router.delete('/users/:id', verifyToken, authorizeRole(['admin']), adminController.deleteUser);

export default router;
