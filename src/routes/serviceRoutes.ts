import { Router } from 'express';
import { getAllService, addService, updateService, deleteService } from '../controllers/serviceController.js';
import { verifyToken, authorizeRole } from '../authMiddleware.js';

const router = Router();

router.get('/services', getAllService);
router.post('/services', verifyToken, authorizeRole(['admin']),
    (req, res, next) => {
        const allowedFields = ['namaLayanan', 'hargaPerKg', 'keterangan', 'tarifOngkir'];
        const invalidFields = Object.keys(req.body).filter(field => !allowedFields.includes(field));

        if (invalidFields.length > 0) {
            return res.status(400).json({
                message: `Field tidak diizinkan: ${invalidFields.join(', ')}`
            });
        }
        next();
    },
    addService
);
router.put('/services/:id', verifyToken, authorizeRole(['admin']),
    (req, res, next) => {
        const allowedFields = ['namaLayanan', 'hargaPerKg', 'keterangan', 'tarifOngkir'];
        const invalidFields = Object.keys(req.body).filter(field => !allowedFields.includes(field));

        if (invalidFields.length > 0) {
            return res.status(400).json({
                message: `Field tidak diizinkan: ${invalidFields.join(', ')}`
            });
        }
        next();
    },
    updateService
);
router.delete('/services/:id', verifyToken, authorizeRole(['admin']), deleteService);

export default router;
