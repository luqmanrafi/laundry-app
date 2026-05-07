import { type Request, type Response, type NextFunction } from "express";
import  jwt  from "jsonwebtoken";

export interface authRequest extends Request{
    user?: {
        id: number;
        role: string;
    };
}

export const verifyToken = (req: authRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if(!authHeader || !authHeader.startsWith('Bearer ')){
        res.status(401).json({message: 'Akses ditolak. silahkan login terlebih dahulu.'});
        return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({ message: 'Token tidak valid.' });
        return;
    }
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        res.status(500).json({ message: 'Server error: JWT_SECRET tidak dikonfigurasi.' });
        return;
    }
    try{
        const decoded = jwt.verify(token, secret) as unknown as { id: number; role: string };
        req.user = decoded;
        next();
    } catch(error){
        res.status(403).json({message: 'Sesi sudah habis. Silahkan login kembali.'});
    }
}

export const authorizeRole = (roles: string[]) => {
    return (req: authRequest, res: Response, next: NextFunction): void => {
        if(!req.user){
            res.status(401).json({message: 'Akses ditolak! anda belum ter-autentikasi.'});
            return;
        }
        if(!roles.includes(req.user.role)){
            res.status(403).json({message: 'Anda tidak memiliki akses untuk halaman ini.'});
            return;
        }
        next();
    }
}