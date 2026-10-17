import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requireSuperadmin } from '../middleware/requireSuperadmin.js';
import { z } from 'zod';
import { getStripe } from '../lib/stripe.js';

const router = Router();
router.use(requireAuth, requireSuperadmin);

const money = (value) => Number(value ?? 0);
const startOfMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

router.get('/support-tickets', async (_req, res) => {
  const tickets = await prisma.supportTicket.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      messages: { orderBy: { createdAt: 'asc' }, include: { author: { select: { name: true } } } },
    },
    orderBy: { updatedAt: 'desc' },
  });
  const priority = { OPEN: 0, IN_PROGRESS: 1, CLOSED: 2 };
  tickets.sort((a, b) => (priority[a.status] ?? 3) - (priority[b.status] ?? 3));
  res.json(tickets);
});

router.post('/support-tickets/:id/messages', async (req, res) => {
  const ticketId = Number(req.params.id);
  const { message } = z.object({ message: z.string().trim().min(1).max(5000) }).parse(req.body);
  if (!Number.isInteger(ticketId) || ticketId < 1) return res.status(400).json({ error: 'Ticket inválido.' });
  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) return res.status(404).json({ error: 'No encontramos este ticket.' });
  const [, created] = await prisma.$transaction([
    prisma.supportTicket.update({ where: { id: ticketId }, data: { status: 'IN_PROGRESS', updatedAt: new Date() } }),
    prisma.supportMessage.create({ data: { ticketId, authorId: req.userId, authorRole: 'ADMIN', content: message } }),
    prisma.auditLog.create({ data: { actorId: req.userId, action: 'Respondió ticket de soporte', details: `Ticket ${ticketId}` } }),
  ]);
  res.status(201).json(created);
});

router.patch('/support-tickets/:id', async (req, res) => {
  const ticketId = Number(req.params.id);
  const { status } = z.object({ status: z.enum(['OPEN', 'IN_PROGRESS', 'CLOSED']) }).parse(req.body);
  if (!Number.isInteger(ticketId) || ticketId < 1) return res.status(400).json({ error: 'Ticket inválido.' });
  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) return res.status(404).json({ error: 'No encontramos este ticket.' });
  const updated = await prisma.supportTicket.update({ where: { id: ticketId }, data: { status } });
  await prisma.auditLog.create({ data: { actorId: req.userId, action: 'Actualizó ticket de soporte', details: `Ticket ${ticketId}: ${status}` } });
  res.json(updated);
});

router.post('/subscriptions/:id/cancel', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Suscripcion invalida.' });
  const subscription = await prisma.subscription.findUnique({ where: { id } });
  if (!subscription) return res.status(404).json({ error: 'No encontramos la suscripcion.' });
  if (!subscription.stripeSubscriptionId) return res.status(409).json({ error: 'Esta suscripcion no se gestiona en Stripe.' });
  if (subscription.status === 'CANCELED') return res.status(409).json({ error: 'La suscripcion ya esta cancelada.' });

  try {
    const stripe = getStripe();
    const remote = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
    const canceled = remote.status === 'canceled'
      ? remote
      : await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
    const canceledAt = canceled.canceled_at ? new Date(canceled.canceled_at * 1000) : new Date();
    const updated = await prisma.subscription.update({
      where: { id },
      data: { status: 'CANCELED', canceledAt, cancelAtPeriodEnd: false },
    });
    await prisma.auditLog.create({
      data: {
        actorId: req.userId,
        action: 'Superadmin cancelo suscripcion en Stripe',
        details: 'Suscripcion local ' + id + '; Stripe ' + subscription.stripeSubscriptionId,
      },
    });
    return res.json({ id: updated.id, status: updated.status, canceledAt: updated.canceledAt });
  } catch (error) {
    console.error('Superadmin could not cancel Stripe subscription:', error.message);
    return res.status(502).json({ error: 'No se pudo cancelar la suscripcion en Stripe.' });
  }
});

router.get('/dashboard', async (req, res) => {
  const now = new Date();
  const monthStart = startOfMonth();
  const in7Days = new Date(now.getTime() + 7 * 86400000);
  const in30Days = new Date(now.getTime() + 30 * 86400000);

  const [users, subscriptions, recentPayments, failedPayments, monthPayments,
    recentErrors, logs, totalUsers, newUsers, cancellations] = await Promise.all([
    prisma.user.findMany({
      where: { role: { not: 'SUPERADMIN' } },
      select: {
        id: true, name: true, email: true, createdAt: true, lastLoginAt: true,
        patients: { where: { status: 'ACTIVE' }, select: { id: true } },
        subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.subscription.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.payment.findMany({
      include: { subscription: { include: { user: { select: { name: true, email: true } } } } },
      orderBy: { createdAt: 'desc' }, take: 12,
    }),
    prisma.payment.findMany({
      where: { status: 'FAILED' },
      include: { subscription: { include: { user: { select: { name: true, email: true } } } } },
      orderBy: { createdAt: 'desc' }, take: 12,
    }),
    prisma.payment.findMany({
      where: { status: 'PAID', paidAt: { gte: monthStart, lte: now } },
      select: { amount: true, subscription: { select: { currency: true } } },
    }),
    prisma.systemError.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
    prisma.auditLog.findMany({
      where: {
        action: {
          notIn: ['GET /admin/dashboard', 'POST /admin/audit', 'Cerró sesión'],
        },
      },
      include: { actor: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' }, take: 30,
    }),
    prisma.user.count({ where: { role: { not: 'SUPERADMIN' } } }),
    prisma.user.count({ where: { role: { not: 'SUPERADMIN' }, createdAt: { gte: monthStart } } }),
    prisma.subscription.count({ where: { status: 'CANCELED', canceledAt: { gte: monthStart } } }),
  ]);

  // Resolve each account's most recent subscription so old canceled plans do not
  // inflate the current subscriber counts.
  const latestByUser = new Map();
  for (const sub of subscriptions) {
    if (!latestByUser.has(sub.userId)) latestByUser.set(sub.userId, sub);
  }
  const currentSubs = [...latestByUser.values()];
  const countStatus = (status) => currentSubs.filter((s) => s.status === status).length;
  const activeSubs = currentSubs.filter((s) => s.status === 'ACTIVE');
  const recurringSubs = activeSubs.filter((s) => ['MONTHLY', 'ANNUAL', 'PRODUCTION_TEST', 'WEEKLY_USD', 'MONTHLY_USD', 'ANNUAL_USD'].includes(s.plan));
  const mrr = Object.fromEntries(['MXN', 'USD'].map((currency) => [currency, recurringSubs
    .filter((s) => s.currency === currency)
    .reduce((sum, s) => sum + money(s.price) * (s.plan === 'ANNUAL' || s.plan === 'ANNUAL_USD' ? 1 / 12 : s.plan === 'WEEKLY_USD' ? 52 / 12 : 1), 0)]));
  const monthlyRevenue = Object.fromEntries(['MXN', 'USD'].map((currency) => [currency, monthPayments
    .filter((payment) => payment.subscription.currency === currency)
    .reduce((sum, payment) => sum + money(payment.amount), 0)]));
  const renewals = currentSubs.filter((s) => s.status === 'ACTIVE' && s.renewsAt && s.renewsAt >= now);
  const presentUserIds = new Set(currentSubs.filter((s) => s.status !== 'CANCELED').map((s) => s.userId));

  res.json({
    summary: {
      active: countStatus('ACTIVE'), trial: countStatus('TRIAL'),
      pastDue: countStatus('PAST_DUE'), canceled: countStatus('CANCELED'),
      mrr, newThisMonth: newUsers, cancellationsThisMonth: cancellations,
      totalUsers, subscribers: presentUserIds.size,
    },
    plans: {
      weeklyUsd: activeSubs.filter((s) => s.plan === 'WEEKLY_USD').length,
      monthlyUsd: activeSubs.filter((s) => s.plan === 'MONTHLY_USD').length,
      annualUsd: activeSubs.filter((s) => s.plan === 'ANNUAL_USD').length,
      monthly: activeSubs.filter((s) => s.plan === 'MONTHLY').length,
      annual: activeSubs.filter((s) => s.plan === 'ANNUAL').length,
      productionTest: activeSubs.filter((s) => s.plan === 'PRODUCTION_TEST').length,
      monthlyRevenue, annualProjection: { MXN: mrr.MXN * 12, USD: mrr.USD * 12 },
    },
    subscriptions: subscriptions.map((s) => ({
      id: s.id, userId: s.userId, name: s.user.name, email: s.user.email,
      plan: s.plan, status: s.status, price: money(s.price), currency: s.currency, renewsAt: s.renewsAt,
      cancelAtPeriodEnd: s.cancelAtPeriodEnd, stripeSubscriptionId: s.stripeSubscriptionId,
      createdAt: s.createdAt,
    })),
    users: users.map((user) => {
      const sub = user.subscriptions[0];
      return {
        id: user.id, name: user.name, email: user.email, createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt, patientCount: user.patients.length,
        plan: sub?.plan ?? null, currency: sub?.currency ?? null, status: sub?.status ?? 'NO_PLAN',
        nextChargeAt: sub?.renewsAt ?? null,
      };
    }),
    payments: recentPayments.map((p) => ({
      id: p.id, amount: money(p.amount), status: p.status, paidAt: p.paidAt,
      createdAt: p.createdAt, name: p.subscription.user.name, email: p.subscription.user.email, currency: p.subscription.currency,
    })),
    failedPayments: failedPayments.map((p) => ({
      id: p.id, amount: money(p.amount), createdAt: p.createdAt,
      name: p.subscription.user.name, email: p.subscription.user.email, currency: p.subscription.currency,
    })),
    renewals: {
      next7Days: renewals.filter((s) => s.renewsAt <= in7Days).map((s) => ({
        id: s.id, name: s.user.name, email: s.user.email, plan: s.plan,
        price: money(s.price), currency: s.currency, renewsAt: s.renewsAt,
      })),
      next30Days: renewals.filter((s) => s.renewsAt > in7Days && s.renewsAt <= in30Days).map((s) => ({
        id: s.id, name: s.user.name, email: s.user.email, plan: s.plan,
        price: money(s.price), currency: s.currency, renewsAt: s.renewsAt,
      })),
    },
    audit: logs.map((log) => ({
      id: log.id, action: log.action, details: log.details, createdAt: log.createdAt,
      actor: log.actor?.name ?? 'Cuenta eliminada', email: log.actor?.email ?? null,
    })),
    system: {
      lastBackupAt: process.env.LAST_BACKUP_AT ?? null,
      version: process.env.APP_VERSION ?? process.env.npm_package_version ?? 'No configurada',
      errors: recentErrors,
    },
    dataNotice: 'Las suscripciones y pagos se consultan desde la base de datos y se actualizan con los eventos de Stripe.',
  });
});

export default router;
