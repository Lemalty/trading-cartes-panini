import { Entity, PrimaryGeneratedColumn, ManyToOne, OneToMany, CreateDateColumn, JoinColumn } from 'typeorm';
import { Member } from './Member.entity.js';
import { Card } from './Card.entity.js';
import { Interest } from './Interest.entity.js';

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

    @OneToMany(() => Interest, interest => interest.duplicate, { cascade: true })
    interests!: Interest[];

    @CreateDateColumn()
    createdAt!: Date;
}