// File: src/auth/refresh-token.strategy.ts

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service'; // Pastikan path prisma/ benar
import * as bcrypt from 'bcrypt';

@Injectable()
// 1. UBAH NAMA KELAS
// 2. BERI NAMA UNIK 'jwt-refresh'
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const refreshTokenSecret = configService.get<string>(
      'REFRESH_TOKEN_SECRET',
    );
    if (!refreshTokenSecret) {
      throw new Error('REFRESH_TOKEN_SECRET is not defined');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: refreshTokenSecret,
      passReqToCallback: true,
    });
  }

  async validate(
    req: Request,
    payload: { sub: number; email: string; role: string },
  ) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.sub,
      },
    });

    if (!user || !user.hashedRefreshToken) {
      throw new UnauthorizedException('Akses ditolak (user/token tidak ada)');
    }

    const tokenFromHeader = req
      .get('authorization')
      ?.replace('Bearer ', '')
      .trim();

    if (!tokenFromHeader)
      throw new UnauthorizedException('Akses ditolak (header tidak ada)');

    const isTokenMatch = await bcrypt.compare(
      tokenFromHeader,
      user.hashedRefreshToken,
    );

    if (!isTokenMatch)
      throw new UnauthorizedException('Akses ditolak (token tidak cocok)');

    // Hapus data sensitif sebelum dikembalikan
    const { password, hashedRefreshToken, ...result } = user;
    return result; // Kembalikan seluruh data user (tanpa password/hash)
  }
}
