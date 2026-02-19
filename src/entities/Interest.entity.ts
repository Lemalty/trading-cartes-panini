import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, JoinColumn, Unique } from 'typeorm';
import { Member } from './Member.entity.js';
import { Duplicate } from './Duplicate.entity.js';

@Entity('interests')
@Unique(['interestedMember', 'duplicate'])
export class Interest {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Member, member => member.interests, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'interestedMemberId' })
    interestedMember!: Member;

    @ManyToOne(() => Duplicate, duplicate => duplicate.interests, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'duplicateId' })
    duplicate!: Duplicate;

    @CreateDateColumn()
    createdAt!: Date;
}
