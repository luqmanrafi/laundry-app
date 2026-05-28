import { type Request, type Response } from "express";
import { AppDataSource } from "../../data-source.js";
import { Service } from "../entities/Service.js";

const serviceRepository = AppDataSource.getRepository(Service);

export const getAllService = async (req: Request, res: Response)=>{
    try{
        const services = await serviceRepository.find();
        return res.status(200).json({
            message: "Berhasil mendapatkan semua layanan",
            data: services
        });
    } catch(error){
        return res.status(500).json({
            message: "Gagal mendapatkan semua layanan",
        });
    }
}

export const addService = async (req: Request, res: Response)=>{
    try{
        const { namaLayanan, hargaPerKg, keterangan, tarifOngkir } = req.body;
        if(!namaLayanan || !hargaPerKg || tarifOngkir === undefined){
            return res.status(400).json({
                message: "Nama layanan, harga per kg, dan tarif ongkir wajib diisi",
            });
        }
        const existingService = await serviceRepository.findOne({
            where: { namaLayanan }
        });
        if(existingService){
            return res.status(400).json({
                message: "Layanan sudah ada",
            });
        }
        const newService = serviceRepository.create({
            namaLayanan,
            hargaPerKg,
            keterangan,
            tarifOngkir
        });
        await serviceRepository.save(newService);
        return res.status(201).json({
            message: "Layanan berhasil ditambahkan",
            data: newService
        });
    } catch (errror){
        console.error(errror);
        return res.status(500).json({
            message: "Gagal menambahkan layanan",
        });
    }
}

export const updateService = async (req: Request, res: Response)=>{
    try{
        const idParam = req.params.id;
        if (!idParam || typeof idParam !== 'string') {
            return res.status(400).json({ message: 'ID layanan tidak valid.' });
        }
        const id = parseInt(idParam);
        if (isNaN(id)) {
            return res.status(400).json({ message: 'ID layanan harus berupa angka.' });
        }
        const { namaLayanan, hargaPerKg, keterangan, tarifOngkir } = req.body;
        if(!namaLayanan || !hargaPerKg || tarifOngkir === undefined){
            return res.status(400).json({
                message: "Nama layanan, harga per kg, dan tarif ongkir wajib diisi",
            });
        }
        const updateResult = await serviceRepository.update(id, {
            namaLayanan,
            hargaPerKg,
            keterangan,
            tarifOngkir
        });

        if(updateResult.affected === 0){
            return res.status(404).json({
                message: "Layanan tidak ditemukan",
            });
        }
        
        return res.status(200).json({
            message: "Layanan berhasil diupdate",
            data: { id, namaLayanan, hargaPerKg, keterangan, tarifOngkir }
        });
    } catch (errror){
        console.error(errror);
        return res.status(500).json({
            message: "Gagal mengupdate layanan",
        });
    }
}

export const deleteService = async (req: Request, res: Response) =>{
    try{
        const idParam = req.params.id;
        if (!idParam || typeof idParam !== 'string') {
            return res.status(400).json({ message: 'ID layanan tidak valid.' });
        }
        const id = parseInt(idParam);
        if (isNaN(id)) {
            return res.status(400).json({ message: 'ID layanan harus berupa angka.' });
        }
        const existingService = await serviceRepository.findOne({
            where: {id}
        });
        if(!existingService){
            return res.status(404).json({
                message: 'Layanan tidak ditemukan',
            });
        }

        await serviceRepository.remove(existingService);
        res.status(200).json({
            message: 'Data berhasil dihapus.'
        })
    } catch(error){
        res.status(500).json({
            message: 'Gagal menghapus layanan.'
        })
    }
}