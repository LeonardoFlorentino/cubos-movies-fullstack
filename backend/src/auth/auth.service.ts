import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { StringValue } from 'ms';
import * as bcrypt from 'bcryptjs';
import { getAppErrorDefinition } from '../common/errors/app-error-catalog';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

interface JwtPayload {
  sub: string;
  email: string;
}

interface PasswordResetPayload {
  sub: string;
  email: string;
  purpose: 'password-reset';
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException(
        getAppErrorDefinition('AUTH_EMAIL_ALREADY_IN_USE'),
      );
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = await this.usersService.create({
      name: registerDto.name,
      email: registerDto.email,
      password: hashedPassword,
    });

    return this.buildAuthResponse(user);
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findPasswordByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException(
        getAppErrorDefinition('AUTH_INVALID_CREDENTIALS'),
      );
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        getAppErrorDefinition('AUTH_INVALID_CREDENTIALS'),
      );
    }

    return this.buildAuthResponse(user);
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);

    if (!user) {
      throw new NotFoundException(
        getAppErrorDefinition('AUTH_EMAIL_NOT_FOUND'),
      );
    }

    const token = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        purpose: 'password-reset',
      } satisfies PasswordResetPayload,
      {
        secret: this.getPasswordResetSecret(),
        expiresIn: this.configService.get<string>(
          'JWT_RESET_EXPIRES_IN',
          '30m',
        ) as StringValue,
      },
    );

    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:5173',
    );
    const resetUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;

    await this.mailService.sendPasswordResetEmail({
      to: user.email,
      userName: user.name,
      resetUrl,
    });

    return {
      message:
        'E-mail de recuperação enviado com sucesso. Verifique sua caixa de entrada.',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    let payload: PasswordResetPayload;

    try {
      payload = await this.jwtService.verifyAsync<PasswordResetPayload>(
        resetPasswordDto.token,
        {
          secret: this.getPasswordResetSecret(),
        },
      );
    } catch {
      throw new UnauthorizedException(
        getAppErrorDefinition('AUTH_RESET_TOKEN_INVALID'),
      );
    }

    if (payload.purpose !== 'password-reset') {
      throw new UnauthorizedException(
        getAppErrorDefinition('AUTH_RESET_TOKEN_INVALID'),
      );
    }

    const user = await this.usersService.findPasswordById(payload.sub);
    if (!user) {
      throw new UnauthorizedException(
        getAppErrorDefinition('AUTH_RESET_TOKEN_INVALID'),
      );
    }

    const hashedPassword = await bcrypt.hash(resetPasswordDto.password, 10);
    await this.usersService.updatePasswordById(user.id, hashedPassword);

    return { message: 'Senha atualizada com sucesso.' };
  }

  private async buildAuthResponse(user: User) {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  private getPasswordResetSecret(): string {
    return this.configService.get<string>(
      'JWT_RESET_SECRET',
      this.configService.get<string>('JWT_SECRET', 'dev-secret'),
    );
  }
}
