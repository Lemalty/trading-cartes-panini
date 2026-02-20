import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Duplicate } from './Duplicate.entity.js';
import { Wanted } from './Wanted.entity.js';
import { Interest } from './Interest.entity.js';

@Entity('members')
export class Member {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'varchar', length: 100 })
    displayName!: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    passwordHash!: string | null;

    @Column({ type: 'varchar', length: 100, nullable: true })
    team!: string | null;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @OneToMany(() => Duplicate, duplicate => duplicate.member, { cascade: true })
    duplicates!: Duplicate[];

    @OneToMany(() => Wanted, wanted => wanted.member, { cascade: true })
    wanted!: Wanted[];

    @OneToMany(() => Interest, interest => interest.interestedMember, { cascade: true })
    interests!: Interest[];
}
