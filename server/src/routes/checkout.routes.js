import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

const router = Router();
const limiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 8 });
const plans = {
  monthly: {
    title: 'Conutria mensual',
    code: 'MONTHLY',
    amount: 1,
    months: 1,
  },
  annual: { title: 'Conutria anual', code: 'ANNUAL', amount: 1990, months: 12 },
};

router.post('/start', limiter, async (req, res) => {
  const { name, email, plan } = z
    .object({
      name: z.string().trim().min(2).max(100),
      email: z.string().trim().email().max(254),
      plan: z.enum(['monthly', 'annual']),
    })
    .parse(req.body);
  const normalizedEmail = email.toLowerCase();
  const selectedPlan = plans[plan];
  if (
    await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    })
  ) {
    return res.status(409).json({
      error:
        'Ya existe una cuenta con ese correo. Inicia sesión o contacta soporte.',
    });
  }
  if (
    await prisma.pendingSignup.findFirst({
      where: {
        email: normalizedEmail,
        status: { in: ['PENDING', 'PROCESSING', 'PAID'] },
        expiresAt: { gt: new Date() },
      },
    })
  )
    return res
      .status(409)
      .json({ error: 'Ya hay un registro pendiente para ese correo.' });

  const pending = await prisma.pendingSignup.create({
    data: {
      name,
      email: normalizedEmail,
      plan: selectedPlan.code,
      amount: selectedPlan.amount,
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
    },
  });
  try {
    const apiUrl = process.env.PUBLIC_API_URL?.replace(/\/$/, '');
    const clientUrl = process.env.CLIENT_URL?.replace(/\/$/, '');
    if (!process.env.MP_ACCESS_TOKEN || !apiUrl || !clientUrl)
      throw new Error('Falta configurar Mercado Pago o las URLs públicas.');
    const response = await fetch(
      'https://api.mercadopago.com/checkout/preferences',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              id: selectedPlan.code,
              title: selectedPlan.title,
              quantity: 1,
              currency_id: 'MXN',
              unit_price: selectedPlan.amount,
            },
          ],
          payer: { name, email: normalizedEmail },
          external_reference: pending.id,
          notification_url: `${apiUrl}/api/webhooks/mercadopago`,
          back_urls: {
            success: `${clientUrl}/pago/resultado?status=success`,
            pending: `${clientUrl}/pago/resultado?status=pending`,
            failure: `${clientUrl}/pago/resultado?status=failure`,
          },
          auto_return: 'approved',
          metadata: { pending_signup_id: pending.id },
        }),
      },
    );
    const preference = await response.json();
    if (!response.ok || !preference.init_point || !preference.id) {
      throw new Error(
        preference.message || 'Mercado Pago no pudo iniciar el cobro.',
      );
    }
    await prisma.pendingSignup.update({
      where: { id: pending.id },
      data: { providerPreferenceId: String(preference.id) },
    });
    res.status(201).json({ checkoutUrl: preference.init_point });
  } catch (error) {
    await prisma.pendingSignup.update({
      where: { id: pending.id },
      data: { status: 'CHECKOUT_FAILED' },
    });
    console.error(
      'No se pudo crear la preferencia de Mercado Pago:',
      error.message,
    );
    res.status(502).json({
      error: 'No se pudo iniciar el pago. Inténtalo de nuevo más tarde.',
    });
  }
});

export default router;
