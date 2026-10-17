import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { createHash, randomBytes } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { sendPasswordResetEmail as sendPasswordResetMessage } from '../lib/email.js';
import { requireAuth } from '../middleware/auth.js';
import { getSubscriptionAccess } from '../middleware/requireActiveSubscription.js';
import { getStripe } from '../lib/stripe.js';

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
const passwordRecoveryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

const SESSION_ABSOLUTE_MS = 30 * 24 * 60 * 60 * 1000;
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: SESSION_ABSOLUTE_MS,
};

async function setSession(res, userId) {
  const now = new Date();
  const id = randomBytes(32).toString('base64url');
  const expiresAt = new Date(now.getTime() + SESSION_ABSOLUTE_MS);
  await prisma.session.deleteMany({
    where: {
      OR: [
        { expiresAt: { lte: now } },
        { revokedAt: { lt: new Date(now.getTime() - SESSION_ABSOLUTE_MS) } },
      ],
    },
  });
  await prisma.session.create({ data: { id, userId, expiresAt } });
  const token = jwt.sign({ sid: id }, process.env.JWT_SECRET, {
    subject: String(userId),
    expiresIn: '30d',
  });
  res.cookie('token', token, cookieOptions);
}

async function sendPasswordResetEmailLegacy(user, rawToken) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;
  const clientUrl = process.env.CLIENT_URL?.replace(/\/$/, '');
  if (!apiKey || !from || !clientUrl) {
    throw new Error('Falta configurar el servicio de correo.');
  }
  const url = `${clientUrl}/restablecer-contrasena?token=${encodeURIComponent(rawToken)}`;
  const safeName = String(user.name ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [user.email],
      subject: 'Restablece tu contraseña de Conutria',
      text: `Hola ${user.name}, solicita una contraseña nueva desde este enlace: ${url}\n\nEl enlace vence en 30 minutos y solo se puede usar una vez. Si no pediste este cambio, ignora este correo.`,
      html: `<!doctype html><html lang="es"><body style="margin:0;padding:32px;background:#f4f7f3;font-family:Arial,sans-serif;color:#193d35"><main style="max-width:520px;margin:auto;padding:32px;background:#fff;border:1px solid #e0e7de;border-radius:18px"><p style="color:#0e8060;font-weight:bold">Conutria</p><h1 style="font-size:24px">Restablece tu contraseña</h1><p>Hola ${safeName}, recibimos una solicitud para cambiar la contraseña de tu cuenta.</p><p style="margin:28px 0"><a href="${url}" style="padding:14px 22px;border-radius:10px;background:#f8cb59;color:#103f34;font-weight:bold;text-decoration:none">Crear contraseña nueva</a></p><p style="color:#71847c;font-size:13px">El enlace vence en 30 minutos y solo se puede usar una vez. Si no solicitaste el cambio, ignora este mensaje; tu contraseña seguirá igual.</p><p style="color:#71847c;font-size:12px;word-break:break-all">${url}</p></main></body></html>`,
    }),
  });
  if (!response.ok) {
    throw new Error(`Resend rechazó el correo (${response.status}).`);
  }
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
    await tx.session.updateMany({ where: { userId: setup.userId, revokedAt: null }, data: { revokedAt: now } });
    await tx.auditLog.create({
      data: { actorId: user.id, action: 'Configuró contraseña', details: 'Activación de cuenta desde enlace de pago' },
    });
    return user;
  });
  if (!updated) return res.status(400).json({ error: 'El enlace no es válido o ya venció.' });
  res.json({ ok: true });
});

router.post('/forgot-password', passwordRecoveryLimiter, async (req, res) => {
  const startedAt = Date.now();
  const { email } = z.object({ email: z.string().trim().email().max(254) }).parse(req.body);
  const normalizedEmail = email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (user?.passwordHash) {
    const rawToken = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    await prisma.passwordSetupToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });
    await prisma.passwordSetupToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });
    try {
      await sendPasswordResetMessage(user, rawToken);
    } catch (emailError) {
      await prisma.passwordSetupToken.deleteMany({ where: { tokenHash } });
      console.error('No se pudo enviar el correo de recuperación:', emailError.message);
    }
  }

  const delay = 700 - (Date.now() - startedAt);
  if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
  res.json({
    message: 'Si existe una cuenta con ese correo, enviaremos un enlace para restablecer la contraseña.',
  });
});

router.post('/reset-password', passwordSetupLimiter, async (req, res) => {
  const { token, password } = z.object({
    token: z.string().min(32),
    password: z.string().min(8),
  }).parse(req.body);
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const reset = await prisma.passwordSetupToken.findUnique({
    where: { tokenHash },
  });
  if (!reset || reset.usedAt || reset.expiresAt <= new Date()) {
    return res.status(400).json({ error: 'El enlace no es válido o ya venció.' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const now = new Date();
  const updated = await prisma.$transaction(async (tx) => {
    const claimed = await tx.passwordSetupToken.updateMany({
      where: { id: reset.id, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (claimed.count !== 1) return false;
    await tx.user.update({
      where: { id: reset.userId },
      data: { passwordHash },
    });
    await tx.session.updateMany({ where: { userId: reset.userId, revokedAt: null }, data: { revokedAt: now } });
    await tx.auditLog.create({
      data: { actorId: reset.userId, action: 'Restableció contraseña', details: 'Recuperación por correo' },
    });
    return true;
  });
  if (!updated) {
    return res.status(400).json({ error: 'El enlace no es válido o ya venció.' });
  }
  res.json({ ok: true });
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
  await setSession(res, updatedUser.id);
  res.json({ id: updatedUser.id, name: updatedUser.name, email: updatedUser.email, role: updatedUser.role });
});

router.post('/logout', async (req, res) => {
  try {
    const payload = jwt.verify(req.cookies.token ?? '', process.env.JWT_SECRET, { ignoreExpiration: true });
    if (typeof payload.sid === 'string') {
      await prisma.session.updateMany({ where: { id: payload.sid, revokedAt: null }, data: { revokedAt: new Date() } });
    }
  } catch { /* Clear the cookie even if its token is invalid. */ }
  res.clearCookie('token', cookieOptions);
  res.json({ ok: true });
});

router.post('/session/refresh', requireAuth, async (req, res) => {
  res.json({ ok: true });
});

router.get('/me', requireAuth, async (req, res) => {
  const [user, access] = await Promise.all([prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, name: true, email: true, role: true },
  }), getSubscriptionAccess(req.userId)]);
  res.json({ ...user, ...access });
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
  const access = await getSubscriptionAccess(req.userId);
  res.json({
    user,
    hasAccess: access.hasAccess,
    subscription: current ? {
      id: current.id,
      plan: current.plan,
      status: current.status,
      price: Number(current.price),
      currency: current.currency,
      startedAt: current.startedAt,
      renewsAt: current.renewsAt,
      canceledAt: current.canceledAt,
      cancelAtPeriodEnd: current.cancelAtPeriodEnd,
    } : null,
    payments: subscriptions.flatMap((subscription) => subscription.payments.map((payment) => ({
      id: payment.id,
      amount: Number(payment.amount),
      status: payment.status,
      paidAt: payment.paidAt,
      createdAt: payment.createdAt,
      plan: subscription.plan,
      currency: subscription.currency,
    }))).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 20),
  });
});

router.post('/account/cancel-subscription', requireAuth, async (req, res) => {
  const latest = await prisma.subscription.findFirst({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
  });
  if (!latest || latest.status !== 'ACTIVE') {
    return res.status(409).json({ error: 'No tienes una suscripcion activa para cancelar.' });
  }
  if (latest.plan === 'LIFETIME') {
    return res.status(409).json({ error: 'La membresia de por vida no se puede cancelar desde la cuenta.' });
  }
  if (latest.cancelAtPeriodEnd) {
    return res.status(409).json({ error: 'La renovacion ya esta cancelada.' });
  }

  let canceledAt = new Date();
  let cancelAtPeriodEnd = false;
  if (latest.stripeSubscriptionId) {
    const stripe = getStripe();
    const remote = await stripe.subscriptions.retrieve(latest.stripeSubscriptionId);
    if (remote.status !== 'canceled') {
      const updated = await stripe.subscriptions.update(latest.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
      cancelAtPeriodEnd = Boolean(updated.cancel_at_period_end);
    }
  }

  await prisma.subscription.update({
    where: { id: latest.id },
    data: cancelAtPeriodEnd
      ? { cancelAtPeriodEnd: true }
      : { status: 'CANCELED', canceledAt },
  });
  await prisma.auditLog.create({
    data: {
      actorId: req.userId,
      action: 'Cancelo su suscripcion',
      details: 'Suscripcion ' + latest.id,
    },
  });
  return res.json({ ok: true, canceledAt, cancelAtPeriodEnd });
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

