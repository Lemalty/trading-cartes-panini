import { getDataSource } from '../config/Database.js';
import { Repository } from 'typeorm';
import bcrypt from 'bcrypt';
import { Member } from '../entities/Member.entity.js';

export class AuthService {
    private memberRepository: Repository<Member>;
    private readonly saltRounds = 10;

    constructor() {
        const dataSource = getDataSource();
        this.memberRepository = dataSource.getRepository(Member);
    }

    /**
     * Inscrit un nouveau membre avec un mot de passe
     */
    async register(displayName: string, password: string): Promise<Member> {
        const passwordHash = await bcrypt.hash(password, this.saltRounds);

        const member = this.memberRepository.create({
            displayName: displayName.trim(),
            passwordHash
        });

        return await this.memberRepository.save(member);
    }

    /**
     * Vérifie les identifiants d'un membre
     */
    async login(displayName: string, password: string): Promise<Member | null> {
        const member = await this.memberRepository.findOne({
            where: { displayName: displayName.trim() }
        });

        if (!member || !member.passwordHash) {
            return null;
        }

        const isValid = await bcrypt.compare(password, member.passwordHash);
        return isValid ? member : null;
    }

    /**
     * Vérifie si un nom est déjà pris
     */
    async isDisplayNameTaken(displayName: string): Promise<boolean> {
        const member = await this.memberRepository.findOne({
            where: { displayName: displayName.trim() }
        });
        return !!member;
    }

    /**
     * Récupère un membre par son ID
     */
    async getMemberById(id: number): Promise<Member | null> {
        return await this.memberRepository.findOne({
            where: { id }
        });
    }
}
