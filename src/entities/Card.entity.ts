import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Duplicate } from './Duplicate.entity.js';
import { Wanted } from './Wanted.entity.js';

@Entity('cards')
export class Card {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'varchar', length: 10, unique: true })
    cardNumber!: string;

    @Column({ type: 'varchar', length: 20 })
    cardType!: 'numeric' | 'letter';

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @OneToMany(() => Duplicate, duplicate => duplicate.card)
    duplicates!: Duplicate[];

    @OneToMany(() => Wanted, wanted => wanted.card)
    wanted!: Wanted[];
}
