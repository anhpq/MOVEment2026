import { UserRole } from '@prisma/client';

export type AuthType = 'TEAM' | 'USER';

export interface AuthContext {
  type: AuthType;
  id: number;
  role?: UserRole;
  sessionId?: string;
}

export type AdminAuthContext = AuthContext & {
  type: 'USER';
  role: 'ADMIN';
};

export type TeamAuthContext = AuthContext & {
  type: 'TEAM';
  sessionId: string;
};

export function isAdmin(auth: AuthContext | null | undefined): auth is AdminAuthContext {
  return auth?.type === 'USER' && auth.role === 'ADMIN';
}

export function isTeam(
  auth: AuthContext | null | undefined,
  teamId?: number,
): auth is TeamAuthContext {
  return auth?.type === 'TEAM' && (teamId === undefined || auth.id === teamId);
}
