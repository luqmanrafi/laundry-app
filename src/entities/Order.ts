import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from "typeorm";
import type { Service } from "./Service.js";
import type { Transaction } from "./Transaction.js";

@Entity('orders')
export class Order {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'uuid' })
    userId!: string;

    @Column({ type: 'uuid', nullable: true })
    kurirId!: string;

    @ManyToOne('Service', (service: Service) => service.order)
    layanan!: Service;

    @Column({type: 'float', default: 0})
    hargaPerkg!: number;
    
    @Column({
        type: 'geometry',
        spatialFeatureType: 'Point',
        srid: 4326
    })
    lokasiPenjemputan!: { type: string; coordinates: number[] };

    @Column({type: 'varchar', nullable: true})
    deskripsi?: string;
    
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
        default: '0'
    })
    ongkir!: number;

    @Column({
        type: 'float',
        nullable: true
    })
    totalBiaya!: number;

    @Column({ type: 'timestamp', nullable: true })
    estimasiSelesai!: Date;

    @Column({ type: 'timestamp', nullable: true })
    waktuSelesai!: Date;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;
    @OneToMany('Transaction', (transaction: Transaction) => transaction.order)
    transactions!: Transaction[];

    @Column({
        type: 'varchar',
        default: 'unpaid'
    })
    paymentStatus!: string;
}
