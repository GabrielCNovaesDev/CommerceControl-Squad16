import jwt from 'jsonwebtoken';
import authMiddleware from '../../middlewares/authMiddleware';
import roleMiddleware from '../../middlewares/roleMiddleware';
import { Request, Response } from 'express';

type UserRole = 'GAME_MASTER' | 'PLAYER' | 'OBSERVER';

function mockRes(): Partial<Response> {
  const res: Partial<Response> = {};
  (res as Record<string, unknown>).status = jest.fn().mockReturnValue(res);
  (res as Record<string, unknown>).json = jest.fn().mockReturnValue(res);
  return res;
}

describe('authMiddleware', () => {
  test('JWT válido injeta req.user e chama next()', () => {
    const token = jwt.sign(
      { userId: 'u1', role: 'PLAYER', squadId: 'sq1' },
      process.env.JWT_SECRET as string
    );
    const req = { headers: { authorization: `Bearer ${token}` } } as unknown as Request;
    const res = mockRes() as Response;
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect((req as Request & { user?: unknown }).user).toEqual({ id: 'u1', role: 'PLAYER', squadId: 'sq1' });
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('JWT inválido retorna 401', () => {
    const req = { headers: { authorization: 'Bearer not.a.real.token' } } as unknown as Request;
    const res = mockRes() as Response;
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token inválido ou expirado' });
    expect(next).not.toHaveBeenCalled();
  });

  test('header ausente retorna 401', () => {
    const req = { headers: {} } as unknown as Request;
    const res = mockRes() as Response;
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token não fornecido' });
    expect(next).not.toHaveBeenCalled();
  });

  test('header sem prefixo Bearer retorna 401', () => {
    const req = { headers: { authorization: 'somethingelse' } } as unknown as Request;
    const res = mockRes() as Response;
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });
});

describe('roleMiddleware', () => {
  test('role permitida → next()', () => {
    const mw = roleMiddleware(['PLAYER', 'GAME_MASTER'] as UserRole[]);
    const req = { user: { role: 'PLAYER' as UserRole, id: 'u1', squadId: null } } as unknown as Request;
    const res = mockRes() as Response;
    const next = jest.fn();

    mw(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('role insuficiente → 403', () => {
    const mw = roleMiddleware(['GAME_MASTER'] as UserRole[]);
    const req = { user: { role: 'PLAYER' as UserRole, id: 'u1', squadId: null } } as unknown as Request;
    const res = mockRes() as Response;
    const next = jest.fn();

    mw(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Acesso negado' });
    expect(next).not.toHaveBeenCalled();
  });

  test('OBSERVER bloqueado em rota de PLAYER', () => {
    const mw = roleMiddleware(['PLAYER'] as UserRole[]);
    const req = { user: { role: 'OBSERVER' as UserRole, id: 'u1', squadId: null } } as unknown as Request;
    const res = mockRes() as Response;
    const next = jest.fn();

    mw(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
