import { Router } from "express";
import { getAllUsers, getUserById, deleteUser } from "../controllers/adminController.js";
import { verifyToken, authorizeRole } from "../authMiddleware.js";
import * as adminController from "../controllers/adminController.js";

const router = Router();

router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.delete('/users/:id', adminController.deleteUser);

export default router;
