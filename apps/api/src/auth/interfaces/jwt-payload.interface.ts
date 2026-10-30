import { UserRole } from '@devpilot/shared';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  sessionId: string;
  iat?: number;
  exp?: number;
}
