// File: src/auth/jwt.strategy.ts (File TERPISAH)

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service'; // Pastikan path prisma/ benar

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const accessTokenSecret = configService.get<string>('ACCESS_TOKEN_SECRET'); // <-- Pakai ACCESS token secret
    if (!accessTokenSecret) {
      throw new Error('ACCESS_TOKEN_SECRET is not defined');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: accessTokenSecret, // <-- Pakai ACCESS token secret
    });
  }

  // Validasi ini JAUH LEBIH SEDERHANA
  // Tidak perlu bcrypt.compare!
  async validate(payload: { sub: number; email: string; role: string }) {
    // Kita hanya perlu memastikan user-nya masih ada
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User tidak ditemukan');
    }

    // Ini akan di-inject ke 'req.user'
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
