import { type Request, type Response } from "express";
import { AppDataSource } from "../../data-source.js";
import { User } from "../entities/User.js";

const userRepository = AppDataSource.getRepository(User);

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const { role } = req.query;
        
        let whereClause: any = {};
        if (role && typeof role === 'string') {
            whereClause.role = role;
        }

        const users = await userRepository.find({
            where: whereClause,
            order: { created_at: 'DESC' },
            select: ['id', 'nama', 'email', 'nomorHp', 'role', 'created_at', 'updated_at']
        });

        res.status(200).json({
            message: "Berhasil mendapatkan daftar pengguna",
            data: users,
            total: users.length
        });
    } catch (error) {
        console.error('Error getAllUsers:', error);
        res.status(500).json({ message: "Gagal mendapatkan daftar pengguna" });
    }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        
        const user = await userRepository.findOne({
            where: { id },
            select: ['id', 'nama', 'email', 'nomorHp', 'role', 'created_at', 'updated_at']
        });

        if (!user) {
            res.status(404).json({ message: "Pengguna tidak ditemukan" });
            return;
        }

        res.status(200).json({
            message: "Berhasil mendapatkan data pengguna",
            data: user
        });
    } catch (error) {
        console.error('Error getUserById:', error);
        res.status(500).json({ message: "Gagal mendapatkan data pengguna" });
    }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const user = await userRepository.findOne({ where: { id } });
        if (!user) {
            res.status(404).json({ message: "Pengguna tidak ditemukan" });
            return;
        }

        if (user.role === 'admin') {
            res.status(403).json({ message: "Tidak dapat menghapus akun admin" });
            return;
        }

        await userRepository.remove(user);
        res.status(200).json({ message: "Pengguna berhasil dihapus" });
    } catch (error) {
        console.error('Error deleteUser:', error);
        res.status(500).json({ message: "Gagal menghapus pengguna" });
    }
};
