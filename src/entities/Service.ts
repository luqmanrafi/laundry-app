import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm"
import { Order } from "./Order.js";

@Entity('services')
export class Service {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'varchar' })
    namaLayanan!: string;

    @Column({ type: 'float' })
    hargaPerKg!: number;

    @Column({ type: 'varchar', nullable: true })
    keterangan?: string;

    @Column({ type: 'float'})
    tarifOngkir!: number;

    @Column({ type: 'int', default: 3 })
    estimasiHari!: number;
    
    @OneToMany(() => Order, (order) => order.layanan)
    order!: Order[];

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;
}
