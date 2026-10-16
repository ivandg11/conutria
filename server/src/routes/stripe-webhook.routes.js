import { Router } from 'express';
import { createHash, randomBytes } from 'node:crypto';
import { prisma } from '../lib/prisma.js';
import { sendWelcomeEmail } from '../lib/email.js';
import { getStripe } from '../lib/stripe.js';

const router = Router();
const plans = { MONTHLY: { amount: 199 }, ANNUAL: { amount: 1990 } };
const idOf = (value) => typeof value === 'string' ? value : value?.id ?? null;
const unixDate = (value) => value ? new Date(value * 1000) : null;
const invoiceSubId = (invoice) => idOf(invoice.subscription ?? invoice.parent?.subscription_details?.subscription);
const periodEnd = (sub) => unixDate(sub.items?.data?.[0]?.current_period_end ?? sub.current_period_end);
const localStatus = (status) => ({
  active: 'ACTIVE', trialing: 'TRIAL', canceled: 'CANCELED', incomplete_expired: 'CANCELED',
}[status] ?? 'PAST_DUE');

function invoicePaymentData(invoice, status) {
  return {
    amount: Number(invoice.amount_paid ?? invoice.amount_due ?? 0) / 100,
    status,
    paidAt: status === 'PAID' ? unixDate(invoice.status_transitions?.paid_at) ?? unixDate(invoice.created) ?? new Date() : null,
    dueAt: unixDate(invoice.period_start) ?? new Date(),
  };
}
async function upsertInvoicePayment(local, invoice, status, tx = prisma) {
  const data = invoicePaymentData(invoice, status);
  await tx.payment.upsert({
    where: { providerPaymentId: invoice.id },
    create: { subscriptionId: local.id, providerPaymentId: invoice.id, ...data },
    update: { subscriptionId: local.id, ...data },
  });
}
async function syncSubscription(sub) {
  const local = await prisma.subscription.findUnique({ where: { stripeSubscriptionId: sub.id } });
  if (!local) return;
  await prisma.subscription.update({
    where: { id: local.id },
    data: {
      status: localStatus(sub.status),
      renewsAt: periodEnd(sub) ?? local.renewsAt,
      cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
      canceledAt: sub.status === 'canceled' ? unixDate(sub.canceled_at) ?? new Date() : null,
      stripeCustomerId: idOf(sub.customer),
    },
  });
}

async function retrySetupEmail(pending, res) {
  if (pending.status === 'COMPLETED' || pending.status === 'EMAIL_CONFLICT') return;
  if (pending.status === 'PROCESSING' && pending.processingStartedAt &&
      Date.now() - pending.processingStartedAt.getTime() < 5 * 60 * 1000) {
    res.status(503).json({ error: 'El alta se esta procesando.' });
    return;
  }
  if (!pending.userId) return;

  const user = await prisma.user.findUnique({ where: { id: pending.userId } });
  if (!user) throw new Error('No se encontro la cuenta asociada al pago.');
  const rawToken = randomBytes(32).toString('base64url');
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  await prisma.$transaction(async (tx) => {
    await tx.passwordSetupToken.deleteMany({ where: { userId: user.id, usedAt: null } });
    await tx.passwordSetupToken.create({
      data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 36 * 60 * 60 * 1000) },
    });
    await tx.pendingSignup.update({
      where: { id: pending.id },
      data: { status: 'PROCESSING', processingStartedAt: new Date() },
    });
  });
  try {
    await sendWelcomeEmail(user, rawToken);
    await prisma.pendingSignup.update({
      where: { id: pending.id },
      data: { status: 'COMPLETED', emailSentAt: new Date(), processingStartedAt: null },
    });
  } catch (error) {
    await prisma.pendingSignup.update({
      where: { id: pending.id },
      data: { status: 'PAID', processingStartedAt: null },
    });
    console.error('Payment is confirmed, but setup email failed:', error.message);
    res.status(503).json({ error: 'No se pudo enviar el correo.' });
  }
}
async function processPaidInvoice(invoice, stripe, res) {
  const subId = invoiceSubId(invoice);
  if (!subId) return;
  const remote = await stripe.subscriptions.retrieve(subId);
  const local = await prisma.subscription.findUnique({ where: { stripeSubscriptionId: subId } });
  const planCode = local?.plan ?? remote.metadata?.plan;
  const plan = plans[planCode];
  const expected = plan ? plan.amount * 100 : null;
  if (!plan || String(invoice.currency).toUpperCase() !== 'MXN' || Number(invoice.amount_paid) !== expected) {
    console.error('Stripe invoice does not match configured plan.', { invoiceId: invoice.id, currency: invoice.currency, amountPaid: invoice.amount_paid, expected });
    return;
  }
  const end = periodEnd(remote);
  if (local) {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.subscription.update({
        where: { id: local.id },
        data: { status: 'ACTIVE', renewsAt: end ?? local.renewsAt, cancelAtPeriodEnd: Boolean(remote.cancel_at_period_end), stripeCustomerId: idOf(remote.customer) },
      });
      await upsertInvoicePayment(updated, invoice, 'PAID', tx);
    });
    const pendingId = remote.metadata?.pendingSignupId;
    if (pendingId) {
      const pending = await prisma.pendingSignup.findUnique({ where: { id: pendingId } });
      if (pending && pending.status !== 'COMPLETED') {
        await retrySetupEmail(pending, res);
        if (res.headersSent) return;
      }
    }
    return;
  }

  const pendingId = remote.metadata?.pendingSignupId;
  if (!pendingId) {
    console.error('Stripe subscription has no signup metadata.', { subscriptionId: subId });
    return;
  }
  const pending = await prisma.pendingSignup.findUnique({ where: { id: pendingId } });
  if (!pending) {
    console.error('Stripe invoice refers to unknown signup.', { invoiceId: invoice.id, pendingSignupId: pendingId });
    return;
  }
  if (pending.plan !== planCode || Number(pending.amount) !== plan.amount) {
    console.error('Stripe invoice does not match pending signup.', { invoiceId: invoice.id, pendingSignupId: pendingId });
    return;
  }
  if (pending.status === 'COMPLETED') return;
  if (pending.status === 'PROCESSING' && pending.processingStartedAt && Date.now() - pending.processingStartedAt.getTime() < 5 * 60 * 1000) {
    return res.status(503).json({ error: 'El alta se esta procesando.' });
  }
  const claim = await prisma.pendingSignup.updateMany({
    where: { id: pending.id, status: { in: ['PENDING', 'PAYMENT_FAILED', 'PAID'] } },
    data: { status: 'PROCESSING', processingStartedAt: new Date() },
  });
  if (!claim.count) {
    const staleClaim = await prisma.pendingSignup.updateMany({
      where: {
        id: pending.id,
        status: 'PROCESSING',
        processingStartedAt: { lt: new Date(Date.now() - 5 * 60 * 1000) },
      },
      data: { status: 'PROCESSING', processingStartedAt: new Date() },
    });
    if (!staleClaim.count) return res.status(503).json({ error: 'El alta se esta procesando.' });
  }

  const existing = pending.userId
    ? await prisma.user.findUnique({ where: { id: pending.userId } })
    : await prisma.user.findUnique({ where: { email: pending.email } });
  if (existing && !pending.userId) {
    await prisma.pendingSignup.update({ where: { id: pending.id }, data: { status: 'EMAIL_CONFLICT', processingStartedAt: null } });
    return;
  }

  const rawToken = randomBytes(32).toString('base64url');
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  const paidAt = invoicePaymentData(invoice, 'PAID').paidAt;
  let user;
  await prisma.$transaction(async (tx) => {
    user = existing ?? await tx.user.create({
      data: { name: pending.name, email: pending.email, passwordHash: null, role: 'NUTRITIONIST' },
    });
    const subscription = await tx.subscription.upsert({
      where: { stripeSubscriptionId: subId },
      create: {
        userId: user.id, plan: pending.plan, status: 'ACTIVE', price: plan.amount,
        startedAt: paidAt, renewsAt: end, stripeSubscriptionId: subId,
        stripeCustomerId: idOf(remote.customer),
      },
      update: { status: 'ACTIVE', renewsAt: end, stripeCustomerId: idOf(remote.customer) },
    });
    await upsertInvoicePayment(subscription, invoice, 'PAID', tx);
    await tx.passwordSetupToken.deleteMany({ where: { userId: user.id, usedAt: null } });
    await tx.passwordSetupToken.create({ data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 36 * 60 * 60 * 1000) } });
    await tx.pendingSignup.update({
      where: { id: pending.id },
      data: { status: 'PROCESSING', userId: user.id, paidAt, processingStartedAt: new Date() },
    });
    if (!existing) await tx.auditLog.create({
      data: { actorId: user.id, action: 'Cuenta creada por suscripcion pagada', details: 'Plan ' + pending.plan + '; factura ' + invoice.id },
    });
  });
  try {
    await sendWelcomeEmail(user, rawToken);
    await prisma.pendingSignup.update({ where: { id: pending.id }, data: { status: 'COMPLETED', emailSentAt: new Date(), processingStartedAt: null } });
  } catch (error) {
    await prisma.pendingSignup.update({ where: { id: pending.id }, data: { status: 'PAID', processingStartedAt: null } });
    console.error('Payment confirmed, but setup email failed:', error.message);
    return res.status(503).json({ error: 'No se pudo enviar el correo.' });
  }
}

async function processFailedInvoice(invoice, stripe) {
  const subId = invoiceSubId(invoice);
  if (!subId) return;
  const local = await prisma.subscription.findUnique({ where: { stripeSubscriptionId: subId } });
  if (local) {
    await prisma.$transaction(async (tx) => {
      await tx.subscription.update({ where: { id: local.id }, data: { status: 'PAST_DUE' } });
      await upsertInvoicePayment(local, invoice, 'FAILED', tx);
    });
    return;
  }
  const remote = await stripe.subscriptions.retrieve(subId);
  if (remote.metadata?.pendingSignupId) await prisma.pendingSignup.updateMany({
    where: { id: remote.metadata.pendingSignupId, status: 'PENDING' },
    data: { status: 'PAYMENT_FAILED' },
  });
}

router.post('/', async (req, res) => {
  if (!process.env.STRIPE_WEBHOOK_SECRET) return res.status(503).json({ error: 'Webhook no configurado.' });
  let event;
  try {
    event = getStripe().webhooks.constructEvent(req.body, req.get('stripe-signature'), process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error('Stripe webhook signature verification failed:', error.message);
    return res.status(400).json({ error: 'Firma de webhook invalida.' });
  }
  try {
    const stripe = getStripe();
    if (event.type === 'invoice.paid') {
      await processPaidInvoice(event.data.object, stripe, res);
      if (res.headersSent) return;
    } else if (event.type === 'invoice.payment_failed') {
      await processFailedInvoice(event.data.object, stripe);
    } else if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      await syncSubscription(event.data.object);
    }
    return res.sendStatus(200);
  } catch (error) {
    console.error('Error processing Stripe webhook:', error.message);
    return res.status(500).json({ error: 'Error temporal al procesar el pago.' });
  }
});
export default router;
