import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { getStripe } from '../lib/stripe.js';

const router = Router();
const limiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 8 });
const plans = {
  monthly: { title: 'Conutria mensual', code: 'MONTHLY', amount: 199, interval: 'month' },
  annual: { title: 'Conutria anual', code: 'ANNUAL', amount: 1990, interval: 'year' },
  production_test: { title: 'Conutria prueba de produccion', code: 'PRODUCTION_TEST', amount: 10, interval: 'month' },
};

router.post('/start', limiter, async (req, res) => {
  const { name, email, plan } = z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(254),
    plan: z.enum(['monthly', 'annual', 'production_test']),
  }).parse(req.body);
  const normalizedEmail = email.toLowerCase();
  const selectedPlan = plans[plan];

  if (await prisma.user.findUnique({ where: { email: normalizedEmail }, select: { id: true } })) {
    return res.status(409).json({ error: 'Ya existe una cuenta con ese correo. Inicia sesion o contacta soporte.' });
  }
  const existingPending = await prisma.pendingSignup.findFirst({
    where: { email: normalizedEmail, status: { in: ['PENDING', 'PROCESSING', 'PAID'] }, expiresAt: { gt: new Date() } },
  });
  if (existingPending) return res.status(409).json({ error: 'Ya hay un registro pendiente para ese correo.' });

  const pending = await prisma.pendingSignup.create({
    data: { name, email: normalizedEmail, plan: selectedPlan.code, amount: selectedPlan.amount, expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000) },
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
          currency: 'mxn',
          product_data: { name: selectedPlan.title },
          unit_amount: selectedPlan.amount * 100,
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
});
export default router;
