const jwt = require('jsonwebtoken');
const authMiddleware = require('../../middlewares/authMiddleware');
const roleMiddleware = require('../../middlewares/roleMiddleware');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('authMiddleware', () => {
  test('JWT válido injeta req.user e chama next()', () => {
    const token = jwt.sign(
      { userId: 'u1', role: 'PLAYER', squadId: 'sq1' },
      process.env.JWT_SECRET
    );
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(req.user).toEqual({ id: 'u1', role: 'PLAYER', squadId: 'sq1' });
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('JWT inválido retorna 401', () => {
    const req = { headers: { authorization: 'Bearer not.a.real.token' } };
    const res = mockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token inválido ou expirado' });
    expect(next).not.toHaveBeenCalled();
  });

  test('header ausente retorna 401', () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token não fornecido' });
    expect(next).not.toHaveBeenCalled();
  });

  test('header sem prefixo Bearer retorna 401', () => {
    const req = { headers: { authorization: 'somethingelse' } };
    const res = mockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });
});

describe('roleMiddleware', () => {
  test('role permitida → next()', () => {
    const mw = roleMiddleware(['PLAYER', 'GAME_MASTER']);
    const req = { user: { role: 'PLAYER' } };
    const res = mockRes();
    const next = jest.fn();

    mw(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('role insuficiente → 403', () => {
    const mw = roleMiddleware(['GAME_MASTER']);
    const req = { user: { role: 'PLAYER' } };
    const res = mockRes();
    const next = jest.fn();

    mw(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Acesso negado' });
    expect(next).not.toHaveBeenCalled();
  });

  test('OBSERVER bloqueado em rota de PLAYER', () => {
    const mw = roleMiddleware(['PLAYER']);
    const req = { user: { role: 'OBSERVER' } };
    const res = mockRes();
    const next = jest.fn();

    mw(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
