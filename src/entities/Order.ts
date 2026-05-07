import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from "typeorm";
import { Service } from "./Service.js";

@Entity('orders')
export class Order {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'int' })
    userId!: number;

    @Column({ type: 'int', nullable: true })
    kurirId!: number;

    @ManyToOne(() => Service, (service) => service.order)
    layanan!: Service;

    @Column({type: 'float', default: 0})
    hargaPerkg!: number;
    
    @Column({
        type: 'geometry',
        spatialFeatureType: 'Point',
        srid: 4326
    })
    lokasiPenjemputan!: { type: string; coordinates: number[] };

    @Column({
        type: 'varchar',
        default: 'menunggu_kurir'
    })
    status!: string;

    @Column({
        type: 'float',
        nullable: true
    })
    berat!: number;

    @Column({
        type: 'float',
        nullable: true
    })
    totalBiaya!: number;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;
}
