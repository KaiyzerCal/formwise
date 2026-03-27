import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), { apiVersion: '2024-06-20' });
    const { priceId, successUrl, cancelUrl } = await req.json();

    if (!priceId) return Response.json({ error: 'priceId required' }, { status: 400 });

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl || `${req.headers.get('origin')}/Settings?subscribed=1`,
      cancel_url:  cancelUrl  || `${req.headers.get('origin')}/Paywall`,
      subscription_data: {
        trial_period_days: 7,
        metadata: { base44_user_id: user.id, base44_user_email: user.email },
      },
      metadata: { base44_user_id: user.id },
    });

    return Response.json({ url: session.url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});