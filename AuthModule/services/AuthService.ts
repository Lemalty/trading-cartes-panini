import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Repository } from 'typeorm';
import { RegisterDto } from '../dto/auth/RegisterDto.js';
import { LoginDto } from '../dto/auth/LoginDto.js';

import { User } from '../entities/User.entity.js';
import { Club } from '../entities/Club.entity.js';
import { PasswordReset } from '../entities/PasswordReset.entity.js';
import { TokenBlacklist } from '../entities/TokenBlacklist.entity.js';

// Import your project's DataSource — adjust path to match your project structure
import { getDataSource } from '../config/Database.js';

const JWT_SECRET = process.env.JWT_SECRET || '';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const SALT_ROUNDS = 12;

const DUMMY_HASH = '$2b$12$LJ3m4ys3Lk0TSwHjfT6PaOTFnSQiSf0sR5g1N8IiR.YMLzpV3rKi';

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{10,}$/;

export class AuthService {
  private userRepo: Repository<User>;
  private clubRepo: Repository<Club>;
  private passwordResetRepo: Repository<PasswordReset>;
  private tokenBlacklistRepo: Repository<TokenBlacklist>;

  constructor() {
    const dataSource = getDataSource();
    this.userRepo = dataSource.getRepository(User);
    this.clubRepo = dataSource.getRepository(Club);
    this.passwordResetRepo = dataSource.getRepository(PasswordReset);
    this.tokenBlacklistRepo = dataSource.getRepository(TokenBlacklist);
  }

  private validatePassword(password: string): boolean {
    return PASSWORD_REGEX.test(password);
  }

  async register(dto: RegisterDto): Promise<void> {
    if (!dto.email || !dto.password || !dto.clubName || !dto.sport || !dto.division) {
      throw new Error('All fields are required.');
    }

    if (!this.validatePassword(dto.password)) {
      throw new Error('Password must be at least 10 characters with 1 uppercase, 1 digit, and 1 special character.');
    }

    const existingUser = await this.findUserByEmail(dto.email);
    if (existingUser) {
      // Generic error — do not reveal if email is already taken
      throw new Error('Registration failed. Please try again.');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const club = this.clubRepo.create({
      clubName: dto.clubName.trim(),
      sport: dto.sport.trim(),
      division: dto.division.trim(),
    });
    const savedClub = await this.clubRepo.save(club);

    const user = this.userRepo.create({
      email: dto.email.trim().toLowerCase(),
      passwordHash,
      clubId: savedClub.id,
    });
    await this.userRepo.save(user);

    // Generate email verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const resetEntry = this.passwordResetRepo.create({
      userId: user.id,
      token,
      expiresAt,
    });
    await this.passwordResetRepo.save(resetEntry);

    // TODO: Send verification email via MailerService
    // await this.mailerService.sendVerificationEmail(user.email, token);
  }

  async verifyEmail(token: string): Promise<void> {
    const entry = await this.passwordResetRepo.findOne({
      where: { token },
    });

    if (!entry || entry.usedAt || entry.expiresAt < new Date()) {
      throw new Error('Invalid or expired verification link.');
    }

    await this.userRepo.update(entry.userId, { emailVerified: true });
    await this.passwordResetRepo.update(entry.id, { usedAt: new Date() });
  }

  async login(dto: LoginDto): Promise<string> {
    if (!dto.email || !dto.password) {
      throw new Error('Email and password are required.');
    }

    const user = await this.findUserByEmail(dto.email);

    if (!user) {
      // Timing attack prevention — compare against dummy hash
      await bcrypt.compare(dto.password, DUMMY_HASH);
      throw new Error('Invalid credentials.');
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid credentials.');
    }

    if (!user.emailVerified) {
      throw new Error('Please verify your email before logging in.');
    }

    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured.');
    }

    const token = jwt.sign(
      { userId: user.id, clubId: user.clubId },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return token;
  }

  async logout(token: string, userId: string): Promise<void> {
    const decoded = jwt.decode(token) as { exp: number } | null;
    if (!decoded?.exp) {
      return;
    }

    const expiresAt = new Date(decoded.exp * 1000);

    const entry = this.tokenBlacklistRepo.create({
      userId,
      token,
      expiresAt,
    });
    await this.tokenBlacklistRepo.save(entry);
  }

  async forgotPassword(email: string): Promise<void> {
    // Always return silently — do not reveal if email exists
    const user = await this.findUserByEmail(email);
    if (!user) {
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h

    const entry = this.passwordResetRepo.create({
      userId: user.id,
      token,
      expiresAt,
    });
    await this.passwordResetRepo.save(entry);

    // TODO: Send reset email via MailerService
    // await this.mailerService.sendPasswordResetEmail(user.email, token);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const entry = await this.passwordResetRepo.findOne({
      where: { token },
    });

    if (!entry || entry.usedAt || entry.expiresAt < new Date()) {
      throw new Error('Invalid or expired reset link.');
    }

    if (!this.validatePassword(newPassword)) {
      throw new Error('Password must be at least 10 characters with 1 uppercase, 1 digit, and 1 special character.');
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await this.userRepo.update(entry.userId, { passwordHash });
    await this.passwordResetRepo.update(entry.id, { usedAt: new Date() });
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const entry = await this.tokenBlacklistRepo.findOne({
      where: { token },
    });
    return !!entry;
  }

  private async findUserByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { email: email.trim().toLowerCase() },
    });
  }
}
