import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let authService: AuthService;

  const usersServiceMock = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    findPasswordByEmail: jest.fn(),
    findPasswordById: jest.fn(),
    updatePasswordById: jest.fn(),
  };

  const jwtServiceMock = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const configServiceMock = {
    get: jest.fn((key: string, defaultValue?: string) => {
      if (key === 'JWT_SECRET') {
        return 'dev-secret';
      }
      if (key === 'MAIL_FROM') {
        return 'no-reply@test.dev';
      }
      if (key === 'FRONTEND_URL') {
        return 'http://localhost:5173';
      }
      if (key === 'JWT_RESET_EXPIRES_IN') {
        return '30m';
      }
      return defaultValue;
    }),
  };

  const mailServiceMock = {
    sendPasswordResetEmail: jest.fn(),
  };

  beforeEach(async () => {
    mailServiceMock.sendPasswordResetEmail.mockReset();
    mailServiceMock.sendPasswordResetEmail.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: usersServiceMock,
        },
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
        {
          provide: MailService,
          useValue: mailServiceMock,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should register a new user and return access token', async () => {
    usersServiceMock.findByEmail.mockResolvedValue(null);
    usersServiceMock.create.mockResolvedValue({
      id: 'user-id',
      name: 'Leo',
      email: 'leo@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    jwtServiceMock.signAsync.mockResolvedValue('token');

    const result = await authService.register({
      name: 'Leo',
      email: 'leo@example.com',
      password: 'secret123',
    });

    expect(result.accessToken).toBe('token');
    expect(result.user.email).toBe('leo@example.com');
    expect(usersServiceMock.create).toHaveBeenCalledTimes(1);
  });

  it('should throw conflict when email already exists on register', async () => {
    usersServiceMock.findByEmail.mockResolvedValue({ id: 'existing-user' });

    await expect(
      authService.register({
        name: 'Leo',
        email: 'leo@example.com',
        password: 'secret123',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('should login with valid credentials', async () => {
    const hashedPassword = await bcrypt.hash('secret123', 10);
    usersServiceMock.findPasswordByEmail.mockResolvedValue({
      id: 'user-id',
      name: 'Leo',
      email: 'leo@example.com',
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    jwtServiceMock.signAsync.mockResolvedValue('token');

    const result = await authService.login({
      email: 'leo@example.com',
      password: 'secret123',
    });

    expect(result.accessToken).toBe('token');
    expect(result.user.id).toBe('user-id');
  });

  it('should reject invalid credentials on login', async () => {
    usersServiceMock.findPasswordByEmail.mockResolvedValue(null);

    await expect(
      authService.login({
        email: 'leo@example.com',
        password: 'secret123',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('should throw not found when forgot password email does not exist', async () => {
    usersServiceMock.findByEmail.mockResolvedValue(null);

    await expect(
      authService.forgotPassword({
        email: 'missing@example.com',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(mailServiceMock.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('should send reset email for existing user', async () => {
    usersServiceMock.findByEmail.mockResolvedValue({
      id: 'user-id',
      name: 'Leo',
      email: 'leo@example.com',
    });
    jwtServiceMock.signAsync.mockResolvedValue('reset-token');

    await expect(
      authService.forgotPassword({ email: 'leo@example.com' }),
    ).resolves.toEqual({
      message:
        'E-mail de recuperação enviado com sucesso. Verifique sua caixa de entrada.',
    });

    expect(mailServiceMock.sendPasswordResetEmail).toHaveBeenCalledWith({
      to: 'leo@example.com',
      userName: 'Leo',
      resetUrl: 'http://localhost:5173/reset-password?token=reset-token',
    });
  });

  it('should reset password with a valid reset token', async () => {
    jwtServiceMock.verifyAsync.mockResolvedValue({
      sub: 'user-id',
      email: 'leo@example.com',
      purpose: 'password-reset',
    });
    usersServiceMock.findPasswordById.mockResolvedValue({
      id: 'user-id',
      email: 'leo@example.com',
    });
    usersServiceMock.updatePasswordById.mockResolvedValue(undefined);

    await expect(
      authService.resetPassword({
        token: 'valid-token',
        password: 'new-secret-123',
      }),
    ).resolves.toMatchObject({
      message: 'Senha atualizada com sucesso.',
    });
    expect(usersServiceMock.updatePasswordById).toHaveBeenCalledWith(
      'user-id',
      expect.any(String),
    );
  });

  it('should reject reset password for invalid token', async () => {
    jwtServiceMock.verifyAsync.mockRejectedValue(new Error('invalid'));

    await expect(
      authService.resetPassword({ token: 'invalid', password: 'secret123' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
