import { prisma } from '../lib/prisma.js';

export async function getSubscriptionAccess(userId) {
  const subscription = await prisma.subscription.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      plan: true,
      status: true,
      price: true,
      currency: true,
      renewsAt: true,
      cancelAtPeriodEnd: true,
    },
  });
  const isLifetime = subscription?.plan === 'LIFETIME' && subscription.status === 'ACTIVE';
  const periodIsPaid = Boolean(subscription?.renewsAt && subscription.renewsAt > new Date());
  const hasAccess = Boolean(isLifetime || (
    subscription && periodIsPaid && (
      ['ACTIVE', 'TRIAL', 'PAST_DUE'].includes(subscription.status) ||
      subscription.status === 'CANCELED'
    )
  ));
  return {
    hasAccess,
    subscription: subscription ? {
      ...subscription,
      price: Number(subscription.price),
      isLifetime,
    } : null,
  };
}

export async function requireActiveSubscription(req, res, next) {
  try {
    const access = await getSubscriptionAccess(req.userId);
    if (access.hasAccess) return next();
    return res.status(402).json({
      error: 'Tu suscripción venció. Renueva tu plan para volver a usar Conutria.',
      code: 'SUBSCRIPTION_REQUIRED',
      subscription: access.subscription,
    });
  } catch (error) {
    return next(error);
  }
}
