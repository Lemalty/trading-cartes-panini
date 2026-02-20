import { getDataSource } from '../config/Database.js';
import { Repository } from 'typeorm';
import bcrypt from 'bcrypt';
import {AdminConfig} from "../entities/AdminConfig.entity.js";
import { Member } from '../entities/Member.entity.js';

export class AdminService {
    private adminConfigRepository: Repository<AdminConfig>;
    private memberRepository: Repository<Member>;
    private readonly saltRounds = 10;

    constructor() {
        const dataSource = getDataSource();
        this.adminConfigRepository = dataSource.getRepository(AdminConfig);
        this.memberRepository = dataSource.getRepository(Member);
    }

    /**
     * Initialise le mot de passe admin depuis les variables d'environnement
     */
    async initializeAdminPassword(): Promise<void> {
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminPassword) {
            throw new Error('ADMIN_PASSWORD not set in environment variables');
        }

        let adminConfig = await this.adminConfigRepository.findOne({
            where: { id: 1 }
        });

        const passwordHash = await bcrypt.hash(adminPassword, this.saltRounds);

        if (!adminConfig) {
            adminConfig = this.adminConfigRepository.create({
                passwordHash
            });
        } else {
            adminConfig.passwordHash = passwordHash;
        }

        await this.adminConfigRepository.save(adminConfig);
    }

    /**
     * Vérifie le mot de passe admin
     */
    async verifyPassword(password: string): Promise<boolean> {
        const adminConfig = await this.adminConfigRepository.findOne({
            where: { id: 1 }
        });

        if (!adminConfig) {
            // Si pas de config, on initialise
            await this.initializeAdminPassword();
            return this.verifyPassword(password);
        }

        return await bcrypt.compare(password, adminConfig.passwordHash);
    }

    /**
     * Récupère la liste de tous les membres
     */
    async getMembers(): Promise<{ id: number; displayName: string; team: string | null; createdAt: Date }[]> {
        return this.memberRepository.find({
            select: ['id', 'displayName', 'team', 'createdAt'],
            order: { createdAt: 'DESC' }
        });
    }

    /**
     * Change le mot de passe admin
     */
    async changePassword(newPassword: string): Promise<void> {
        let adminConfig = await this.adminConfigRepository.findOne({
            where: { id: 1 }
        });

        const passwordHash = await bcrypt.hash(newPassword, this.saltRounds);

        if (!adminConfig) {
            adminConfig = this.adminConfigRepository.create({
                passwordHash
            });
        } else {
            adminConfig.passwordHash = passwordHash;
        }

        await this.adminConfigRepository.save(adminConfig);
    }
}