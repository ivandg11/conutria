import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const createAuthLimiter = () => rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === 'production' ? 10 : 100,
  skipSuccessfulRequests: true,
  handler: (_req, res) => res.status(429).json({
    error: 'Demasiados intentos. Espera 15 minutos antes de volver a intentar.',
  }),
});

const loginLimiter = createAuthLimiter();
const passwordSetupLimiter = createAuthLimiter();

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

router.post('/register', async (_req, res) => {
  res.status(410).json({ error: 'Elige un plan para iniciar el registro y el pago.' });
});

router.post('/setup-password', passwordSetupLimiter, async (req, res) => {
  const { token, password } = z.object({
    token: z.string().min(32),
    password: z.string().min(8),
  }).parse(req.body);
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const setup = await prisma.passwordSetupToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
  if (!setup || setup.usedAt || setup.expiresAt <= new Date()) {
    return res.status(400).json({ error: 'El enlace no es válido o ya venció.' });
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const now = new Date();
  const updated = await prisma.$transaction(async (tx) => {
    const claimed = await tx.passwordSetupToken.updateMany({
      where: { id: setup.id, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (claimed.count !== 1) return null;
    const user = await tx.user.update({
      where: { id: setup.userId },
      data: { passwordHash },
    });
    await tx.auditLog.create({
      data: { actorId: user.id, action: 'Configuró contraseña', details: 'Activación de cuenta desde enlace de pago' },
    });
    return user;
  });
  if (!updated) return res.status(400).json({ error: 'El enlace no es válido o ya venció.' });
  setSession(res, updated.id);
  res.json({ id: updated.id, name: updated.name, email: updated.email, role: updated.role });
});

router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = z
    .object({ email: z.string().trim().email(), password: z.string() })
    .parse(req.body);

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  const ok = user?.passwordHash && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) return res.status(401).json({ error: 'Credenciales incorrectas' });

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  setSession(res, updatedUser.id);
  res.json({ id: updatedUser.id, name: updatedUser.name, email: updatedUser.email, role: updatedUser.role });
});

router.post('/logout', async (req, res) => {
  res.clearCookie('token', cookieOptions);
  res.json({ ok: true });
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, name: true, email: true, role: true },
  });
  res.json(user);
});

router.get('/account', requireAuth, async (req, res) => {
  const [user, subscriptions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, name: true, email: true, createdAt: true },
    }),
    prisma.subscription.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      include: { payments: { orderBy: { createdAt: 'desc' }, take: 20 } },
    }),
  ]);

  const current = subscriptions[0] ?? null;
  res.json({
    user,
    subscription: current ? {
      id: current.id,
      plan: current.plan,
      status: current.status,
      price: Number(current.price),
      startedAt: current.startedAt,
      renewsAt: current.renewsAt,
      canceledAt: current.canceledAt,
    } : null,
    payments: subscriptions.flatMap((subscription) => subscription.payments.map((payment) => ({
      id: payment.id,
      amount: Number(payment.amount),
      status: payment.status,
      paidAt: payment.paidAt,
      createdAt: payment.createdAt,
      plan: subscription.plan,
    }))).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 20),
  });
});

router.post('/account/cancel-subscription', requireAuth, async (req, res) => {
  const latest = await prisma.subscription.findFirst({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
  });
  if (!latest || latest.status !== 'ACTIVE') {
    return res.status(409).json({ error: 'No tienes una suscripción activa para cancelar.' });
  }
  if (latest.plan === 'LIFETIME') {
    return res.status(409).json({ error: 'La membresía de por vida no se puede cancelar desde la cuenta.' });
  }

  const canceledAt = new Date();
  const result = await prisma.subscription.updateMany({
    where: { id: latest.id, userId: req.userId, status: 'ACTIVE' },
    data: { status: 'CANCELED', canceledAt },
  });
  if (!result.count) return res.status(409).json({ error: 'La suscripción ya fue modificada.' });

  await prisma.auditLog.create({
    data: { actorId: req.userId, action: 'Canceló su suscripción', details: `Suscripción ${latest.id}` },
  });
  res.json({ ok: true, canceledAt });
});

router.get('/support-tickets', requireAuth, async (req, res) => {
  const tickets = await prisma.supportTicket.findMany({
    where: { userId: req.userId },
    include: {
      messages: { orderBy: { createdAt: 'asc' }, include: { author: { select: { name: true } } } },
    },
    orderBy: { updatedAt: 'desc' },
  });
  res.json(tickets);
});

router.post('/support-tickets', requireAuth, async (req, res) => {
  const { subject, message } = z.object({
    subject: z.string().trim().min(4).max(160),
    message: z.string().trim().min(5).max(5000),
  }).parse(req.body);
  const ticket = await prisma.supportTicket.create({
    data: {
      userId: req.userId,
      subject,
      messages: { create: { authorId: req.userId, authorRole: 'CUSTOMER', content: message } },
    },
    include: { messages: { orderBy: { createdAt: 'asc' }, include: { author: { select: { name: true } } } } },
  });
  res.status(201).json(ticket);
});

router.post('/support-tickets/:id/messages', requireAuth, async (req, res) => {
  const ticketId = Number(req.params.id);
  const { message } = z.object({ message: z.string().trim().min(1).max(5000) }).parse(req.body);
  if (!Number.isInteger(ticketId) || ticketId < 1) return res.status(400).json({ error: 'Ticket inválido.' });
  const ticket = await prisma.supportTicket.findFirst({ where: { id: ticketId, userId: req.userId } });
  if (!ticket) return res.status(404).json({ error: 'No encontramos este ticket.' });
  if (ticket.status === 'CLOSED') return res.status(409).json({ error: 'Este ticket está cerrado. Crea uno nuevo para solicitar más ayuda.' });

  const [, created] = await prisma.$transaction([
    prisma.supportTicket.update({ where: { id: ticketId }, data: { updatedAt: new Date(), status: 'OPEN' } }),
    prisma.supportMessage.create({ data: { ticketId, authorId: req.userId, authorRole: 'CUSTOMER', content: message } }),
  ]);
  res.status(201).json(created);
});

router.delete('/me', requireAuth, async (req, res) => {
  const { password } = z.object({ password: z.string() }).parse(req.body);

  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  const ok = user?.passwordHash && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) return res.status(401).json({ error: 'Contraseña incorrecta' });

  await prisma.user.delete({ where: { id: req.userId } });
  res.clearCookie('token', cookieOptions);
  res.status(204).end();
});

export default router;

