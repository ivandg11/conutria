import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'No autenticado' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = Number(payload.sub);
    next();
  } catch {
    res.status(401).json({ error: 'Sesión inválida o expirada' });
  }
}
