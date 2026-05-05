import jwt from 'jsonwebtoken';

type UserRole = 'GAME_MASTER' | 'PLAYER' | 'OBSERVER';

interface SignTokenOptions {
  userId?: string;
  role?: UserRole;
  squadId?: string | null;
}

export function signToken({ userId = 'user-test', role = 'PLAYER' as UserRole, squadId = 'squad-test' }: SignTokenOptions = {}): string {
  return jwt.sign({ userId, role, squadId }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
}
