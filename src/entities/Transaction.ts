import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import type { Order } from "./Order.js";

@Entity('transactions')
export class Transaction {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne('Order', (order: Order) => order.transactions)
    @JoinColumn({ name: 'orderId' })
    order!: Order;

    @Column({ type: 'int' })
    orderId!: number;

    @Column({ type: 'float' })
    amount!: number;

    @Column({ type: 'varchar', nullable: true })
    paymentMethod!: string;

    @Column({ type: 'varchar', nullable: true })
    paymentUrl!: string;

    @Column({ type: 'varchar', unique: true, nullable: true })
    midtransTransactionId!: string;

    @Column({
        type: 'varchar',
        default: 'pending' // pending, settlement, expire, cancel, deny
    })
    status!: string;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;
}
