import { type Request, type Response } from "express";
import { AppDataSource } from "../../data-source.js";
import { User } from "../entities/User.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const userRepository = AppDataSource.getRepository(User);

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { nama, email, password, role } = req.body;

        // Cek apakah email sudah terdaftar
        const existingUser = await userRepository.findOneBy({ email });
        if (existingUser) {
            res.status(400).json({ message: "Email sudah terdaftar" });
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Buat user baru
        const user = userRepository.create({
            nama,
            email,
            password: hashedPassword,
            role: role || 'pelanggan',
        });

        await userRepository.save(user);

        res.status(201).json({
            message: "Registrasi berhasil",
            user: { id: user.id, nama: user.nama, email: user.email, role: user.role },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        // Cari user berdasarkan email
        const user = await userRepository.findOneBy({ email });
        if (!user) {
            res.status(401).json({ message: "Email atau password salah" });
            return;
        }

        // Verifikasi password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({ message: "Email atau password salah" });
            return;
        }

        // Buat JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'secret-key',
            { expiresIn: '1d' }
        );

        res.status(200).json({
            message: "Login berhasil",
            token,
            user: { id: user.id, nama: user.nama, email: user.email, role: user.role },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}