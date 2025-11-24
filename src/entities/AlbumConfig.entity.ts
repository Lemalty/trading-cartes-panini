import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('album_config')
export class AlbumConfig {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'int', default: 400 })
    maxNumericCard!: number;

    @Column({ type: 'varchar', length: 1, default: 'K' })
    maxLetterPrefix!: string;

    @Column({ type: 'int', default: 4 })
    maxLetterNumber!: number;

    @UpdateDateColumn()
    updatedAt!: Date;
}