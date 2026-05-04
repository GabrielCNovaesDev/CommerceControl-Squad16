// Augment Express Request to include the authenticated user
import { UserRole } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole;
        squadId: string | null;
      };
    }
  }
}

export {};
