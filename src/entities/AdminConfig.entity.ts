import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('admin_config')
export class AdminConfig {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'varchar', length: 255 })
    passwordHash!: string;

    @UpdateDateColumn()
    updatedAt!: Date;
}