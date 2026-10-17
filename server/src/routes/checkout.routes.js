import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { getStripe } from '../lib/stripe.js';
import { requireAuth } from '../middleware/auth.js';
import { getSubscriptionAccess } from '../middleware/requireActiveSubscription.js';

const router = Router();
const limiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 8 });
const plans = {
  weekly: { title: 'Conutria semanal', code: 'WEEKLY_USD', amount: 1.99, amountCents: 199, interval: 'week' },
  monthly: { title: 'Conutria mensual', code: 'MONTHLY_USD', amount: 7.99, amountCents: 799, interval: 'month' },
  annual: { title: 'Conutria anual', code: 'ANNUAL_USD', amount: 79.99, amountCents: 7999, interval: 'year' },
};

async function createCheckout({ name, email, plan, renewalForUserId }, res) {
  const normalizedEmail = email.toLowerCase();
  const selectedPlan = plans[plan];
  if (!renewalForUserId && await prisma.user.findUnique({ where: { email: normalizedEmail }, select: { id: true } })) {
    return res.status(409).json({ error: 'Ya existe una cuenta con ese correo. Inicia sesion para renovar tu plan.' });
  }
  const existingPending = await prisma.pendingSignup.findFirst({
    where: { email: normalizedEmail, status: { in: ['PENDING', 'PROCESSING', 'PAID'] }, expiresAt: { gt: new Date() } },
  });
  if (existingPending) return res.status(409).json({ error: 'Ya hay un registro pendiente para ese correo.' });

  const pending = await prisma.pendingSignup.create({
    data: { name, email: normalizedEmail, plan: selectedPlan.code, amount: selectedPlan.amount, currency: 'USD', renewalForUserId, expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000) },
  });

  try {
    const clientUrl = process.env.CLIENT_URL?.replace(/\/$/, '');
    if (!clientUrl) throw new Error('Falta configurar CLIENT_URL.');
    const session = await getStripe().checkout.sessions.create({
      mode: 'subscription',
      customer_email: normalizedEmail,
      client_reference_id: pending.id,
      expires_at: Math.floor(Date.now() / 1000) + 2 * 60 * 60,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: selectedPlan.title },
          unit_amount: selectedPlan.amountCents,
          recurring: { interval: selectedPlan.interval },
        },
        quantity: 1,
      }],
      metadata: { pendingSignupId: pending.id, plan: selectedPlan.code },
      subscription_data: { metadata: { pendingSignupId: pending.id, plan: selectedPlan.code } },
      success_url: clientUrl + '/pago/resultado?status=success&session_id={CHECKOUT_SESSION_ID}',
      cancel_url: clientUrl + '/pago/resultado?status=failure',
    });
    if (!session.url || !session.id) throw new Error('Stripe no devolvio una URL de pago.');
    await prisma.pendingSignup.update({
      where: { id: pending.id },
      data: { checkoutSessionId: session.id, expiresAt: new Date(session.expires_at * 1000) },
    });
    return res.status(201).json({ checkoutUrl: session.url });
  } catch (error) {
    await prisma.pendingSignup.update({ where: { id: pending.id }, data: { status: 'CHECKOUT_FAILED' } });
    console.error('No se pudo crear la sesion de Stripe:', error.message);
    return res.status(502).json({ error: 'No se pudo iniciar el pago. Intentalo de nuevo mas tarde.' });
  }
}

router.post('/start', limiter, async (req, res) => {
  const values = z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(254),
    plan: z.enum(['weekly', 'monthly', 'annual']),
  }).parse(req.body);
  return createCheckout(values, res);
});

router.post('/renew', requireAuth, limiter, async (req, res) => {
  const { plan } = z.object({ plan: z.enum(['weekly', 'monthly', 'annual']) }).parse(req.body);
  const access = await getSubscriptionAccess(req.userId);
  if (access.hasAccess) return res.status(409).json({ error: 'Tu suscripción sigue activa. Podrás elegir un nuevo plan cuando venza.' });
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user || user.role === 'SUPERADMIN') return res.status(403).json({ error: 'Esta cuenta no puede renovar un plan.' });
  return createCheckout({ name: user.name, email: user.email, plan, renewalForUserId: user.id }, res);
});
export default router;
