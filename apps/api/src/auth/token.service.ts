import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class TokenService {
  constructor(private readonly config: ConfigService) {}

  sign(payload: JwtPayload, expiresIn = '7d'): string {
    const secret = this.config.get<string>('JWT_SECRET') || 'devpilot_default_secret_key';
    return jwt.sign(payload as object, secret, {
      expiresIn: (expiresIn || '7d') as any,
    });
  }

  verify(token: string): JwtPayload {
    const secret = this.config.get<string>('JWT_SECRET') || 'devpilot_default_secret_key';
    try {
      const decoded = jwt.verify(token, secret);
      return decoded as unknown as JwtPayload;
    } catch {
      throw new UnauthorizedException('Invalid or expired authentication token.');
    }
  }

  decode(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as unknown as JwtPayload;
    } catch {
      return null;
    }
  }
}
