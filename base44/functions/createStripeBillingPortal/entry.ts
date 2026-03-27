import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), { apiVersion: '2024-06-20' });
    const { returnUrl } = await req.json();

    // Find customer by email
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (!customers.data.length) {
      return Response.json({ error: 'No Stripe customer found for this account.' }, { status: 404 });
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: returnUrl || `${req.headers.get('origin')}/Settings`,
    });

    return Response.json({ url: portal.url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});