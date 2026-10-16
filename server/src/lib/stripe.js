import Stripe from 'stripe';

let stripeClient;
export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('Falta configurar STRIPE_SECRET_KEY.');
  stripeClient ??= new Stripe(process.env.STRIPE_SECRET_KEY);
  return stripeClient;
}
