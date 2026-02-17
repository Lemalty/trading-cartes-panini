import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Member } from './Member.entity.js';
import { Card } from './Card.entity.js';

@Entity('wanted')
export class Wanted {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Member, member => member.wanted, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'memberId' })
    member!: Member;

    @ManyToOne(() => Card, card => card.wanted, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'cardId' })
    card!: Card;

    @CreateDateColumn()
    createdAt!: Date;
}
