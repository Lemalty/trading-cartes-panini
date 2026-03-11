import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { User } from './User.entity.js';

@Entity('clubs')
export class Club {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  clubName!: string;

  @Column({ type: 'varchar', length: 100 })
  sport!: string;

  @Column({ type: 'varchar', length: 100 })
  division!: string;

  @OneToMany(() => User, user => user.club)
  users!: User[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
