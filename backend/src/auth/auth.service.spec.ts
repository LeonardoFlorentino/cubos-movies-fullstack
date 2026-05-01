import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let authService: AuthService;

  const usersServiceMock = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    findPasswordByEmail: jest.fn(),
  };

  const jwtServiceMock = {
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
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
});
