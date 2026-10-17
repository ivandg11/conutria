import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';

const SESSION_IDLE_MS = 10 * 60 * 1000;

export async function requireAuth(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'No autenticado' });

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid session' });
  }

  try {
    const userId = Number(payload.sub);
    const now = new Date();
    const activeSince = new Date(now.getTime() - SESSION_IDLE_MS);
    if (!Number.isInteger(userId) || typeof payload.sid !== 'string') {
      return res.status(401).json({ error: 'Invalid session' });
    }
    const session = await prisma.session.updateMany({
      where: {
        id: payload.sid,
        userId,
        revokedAt: null,
        expiresAt: { gt: now },
        lastActivity: { gt: activeSince },
      },
      data: { lastActivity: now },
    });
    if (session.count !== 1) return res.status(401).json({ error: 'Invalid session' });
    req.userId = userId;
    req.sessionId = payload.sid;
    next();
  } catch {
    res.status(401).json({ error: 'Sesión inválida o expirada' });
  }
}
