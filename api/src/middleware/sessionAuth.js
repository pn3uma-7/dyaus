const { verifyJwt } = require('../services/authService');

function sessionAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const token = authHeader.slice(7);
  try {
    const payload = verifyJwt(token);
    req.session = { userId: payload.userId, email: payload.email };
    next();
  } catch {
    return res.status(401).json({ error: 'Session expired' });
  }
}

module.exports = { sessionAuth };
