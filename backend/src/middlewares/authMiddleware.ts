import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { sendError } from '../utils/errorResponse';

interface JwtPayload {
  userId: string;
  role: UserRole;
  squadId: string | null;
}

function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 401, 'MISSING_TOKEN', 'Token não fornecido');
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.user = {
      id: decoded.userId,
      role: decoded.role,
      squadId: decoded.squadId,
    };
    next();
  } catch {
    sendError(res, 401, 'INVALID_TOKEN', 'Token inválido ou expirado');
  }
}

export default authMiddleware;
