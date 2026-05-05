import { Request, Response, NextFunction } from 'express';

type UserRole = 'GAME_MASTER' | 'PLAYER' | 'OBSERVER';

function roleMiddleware(allowedRoles: UserRole[]): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Não autenticado' });
      return;
    }
    if (!allowedRoles.includes(req.user.role as UserRole)) {
      res.status(403).json({ message: 'Acesso negado' });
      return;
    }
    next();
  };
}

export default roleMiddleware;
