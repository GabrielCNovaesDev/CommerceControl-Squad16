const jwt = require('jsonwebtoken');

function signToken({ userId = 'user-test', role = 'PLAYER', squadId = 'squad-test' } = {}) {
  return jwt.sign({ userId, role, squadId }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

module.exports = { signToken };
