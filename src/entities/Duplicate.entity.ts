import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Member } from './Member.entity.js';
import { Card } from './Card.entity.js';

@Entity('duplicates')
export class Duplicate {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Member, member => member.duplicates, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'memberId' })
    member!: Member;

    @ManyToOne(() => Card, card => card.duplicates, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'cardId' })
    card!: Card;

    @CreateDateColumn()
    createdAt!: Date;
}