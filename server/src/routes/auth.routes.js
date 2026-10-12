import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10 });

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

function setSession(res, userId) {
  const token = jwt.sign({}, process.env.JWT_SECRET, {
    subject: String(userId),
    expiresIn: '7d',
  });
  res.cookie('token', token, cookieOptions);
}

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

// Solo permite crear la primera cuenta (la de tu novia)
router.post('/register', async (req, res) => {
  const data = registerSchema.parse(req.body);
  if ((await prisma.user.count()) > 0) {
    return res.status(403).json({ error: 'Registro deshabilitado' });
  }
  const passwordHash = await bcrypt.hash(data.password, 12);
  const user = await prisma.user.create({
    data: { name: data.name, email: data.email, passwordHash },
  });
  setSession(res, user.id);
  res.status(201).json({ id: user.id, name: user.name, email: user.email });
});

router.post('/login', loginLimiter, async (req, res) => {
  const { name, password } = z
    .object({ name: z.string().trim().min(2), password: z.string() })
    .parse(req.body);

  const user = await prisma.user.findFirst({ where: { name } });
  const ok = user && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) return res.status(401).json({ error: 'Credenciales incorrectas' });

  setSession(res, user.id);
  res.json({ id: user.id, name: user.name, email: user.email });
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', cookieOptions);
  res.json({ ok: true });
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, name: true, email: true },
  });
  res.json(user);
});
router.delete('/me', requireAuth, async (req, res) => {
  const { password } = z.object({ password: z.string() }).parse(req.body);

  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  const ok = user && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) return res.status(401).json({ error: 'Contraseña incorrecta' });

  await prisma.user.delete({ where: { id: req.userId } });
  res.clearCookie('token', cookieOptions);
  res.status(204).end();
});

export default router;

