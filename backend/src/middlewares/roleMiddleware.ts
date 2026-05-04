import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';

function roleMiddleware(allowedRoles: UserRole[]): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Não autenticado' });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ message: 'Acesso negado' });
      return;
    }
    next();
  };
}

export default roleMiddleware;
