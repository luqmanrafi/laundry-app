import { Router } from 'express';
import { getAllService, addService, updateService, deleteService } from '../controllers/serviceController.js';

const router = Router();

router.get('/services', getAllService);
router.post('/services',
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
router.put('/services/:id',
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
router.delete('/services/:id', deleteService);

export default router;