import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Zap, Crown, Shield } from 'lucide-react';
import { COLORS, FONT, FONT_LINK } from '@/components/bioneer/ui/DesignTokens';
import { base44 } from '@/api/base44Client';

const STRIPE_PRO_PRICE_ID  = import.meta.env.VITE_STRIPE_PRO_PRICE_ID  || '';
const STRIPE_ELITE_PRICE_ID = import.meta.env.VITE_STRIPE_ELITE_PRICE_ID || '';

const PLANS = [
  {
    id: 'free',
    label: 'STARTER',
    price: 'FREE',
    sub: 'Always free',
    icon: Shield,
    features: [
      '3 sessions per week',
      '10 exercises',
      'Real-time pose tracking',
      'Form score & rep count',
      'Session history',
    ],
    locked: [],
    cta: null,
    highlight: false,
  },
  {
    id: 'pro',
    label: 'PRO',
    price: '$9.99',
    sub: 'per month',
    priceId: STRIPE_PRO_PRICE_ID,
    icon: Zap,
    features: [
      'Unlimited sessions',
      '80+ exercises',
      'AI coaching cues (Gemini)',
      'Technique Compare',
      'Analytics dashboard',
      'Session export',
    ],
    locked: [],
    cta: 'START FREE TRIAL',
    highlight: true,
  },
  {
    id: 'elite',
    label: 'ELITE',
    price: '$19.99',
    sub: 'per month',
    priceId: STRIPE_ELITE_PRICE_ID,
    icon: Crown,
    features: [
      'Everything in PRO',
      'Training program generation',
      'Coach portal access',
      'Priority AI model',
      'Advanced biomechanics report',
    ],
    locked: [],
    cta: 'START FREE TRIAL',
    highlight: false,
  },
];

function PlanCard({ plan, onSelect, loading }) {
  const Icon = plan.icon;
  return (
    <div
      className="flex flex-col rounded-xl p-6 space-y-5 relative flex-1"
      style={{
        background: plan.highlight ? 'rgba(201,162,39,0.07)' : COLORS.surface,
        border: `${plan.highlight ? '2px' : '1px'} solid ${plan.highlight ? COLORS.gold : COLORS.border}`,
        minWidth: 240,
        maxWidth: 340,
      }}
    >
      {plan.highlight && (
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded text-[9px] font-bold tracking-[0.18em] uppercase"
          style={{ background: COLORS.gold, color: '#000', fontFamily: FONT.mono }}
        >
          MOST POPULAR
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded flex items-center justify-center flex-shrink-0"
          style={{ background: plan.highlight ? COLORS.goldDim : COLORS.bg, border: `1px solid ${plan.highlight ? COLORS.goldBorder : COLORS.border}` }}>
          <Icon size={16} style={{ color: plan.highlight ? COLORS.gold : COLORS.textTertiary }} />
        </div>
        <div>
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: plan.highlight ? COLORS.gold : COLORS.textSecondary, fontFamily: FONT.mono }}>
            {plan.label}
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold" style={{ color: COLORS.textPrimary, fontFamily: FONT.heading }}>{plan.price}</span>
            {plan.sub && <span className="text-[9px]" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>{plan.sub}</span>}
          </div>
        </div>
      </div>

      <ul className="space-y-2 flex-1">
        {plan.features.map(f => (
          <li key={f} className="flex items-start gap-2">
            <Check size={11} className="mt-0.5 flex-shrink-0" style={{ color: plan.highlight ? COLORS.gold : COLORS.correct }} />
            <span className="text-[10px] leading-relaxed" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>{f}</span>
          </li>
        ))}
      </ul>

      {plan.cta ? (
        <button
          onClick={() => onSelect(plan)}
          disabled={loading === plan.id}
          className="w-full py-3 rounded text-[10px] font-bold tracking-[0.15em] uppercase disabled:opacity-50"
          style={{
            background: plan.highlight ? COLORS.gold : 'transparent',
            color: plan.highlight ? '#000' : COLORS.gold,
            border: plan.highlight ? 'none' : `1px solid ${COLORS.goldBorder}`,
            fontFamily: FONT.mono,
          }}
        >
          {loading === plan.id ? 'REDIRECTING...' : plan.cta}
        </button>
      ) : (
        <div className="py-3 text-center text-[10px] tracking-[0.1em] uppercase" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
          Current Plan
        </div>
      )}
    </div>
  );
}

export default function Paywall() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);

  const handleSelect = async (plan) => {
    if (!plan.priceId) {
      setError('Stripe price ID not configured. Set VITE_STRIPE_PRO_PRICE_ID / VITE_STRIPE_ELITE_PRICE_ID in env.');
      return;
    }
    setLoading(plan.id);
    setError(null);
    try {
      const res = await base44.functions.invoke('createStripeCheckout', {
        priceId: plan.priceId,
        successUrl: `${window.location.origin}/Settings?subscribed=1`,
        cancelUrl:  window.location.href,
      });
      if (res?.data?.url) {
        window.location.href = res.data.url;
      } else {
        setError('Failed to create checkout session.');
      }
    } catch (e) {
      setError(e?.message || 'Checkout failed.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <link href={FONT_LINK} rel="stylesheet" />
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
        style={{ background: COLORS.bg, fontFamily: FONT.mono }}>

        {/* Header */}
        <div className="mb-10 text-center space-y-3 max-w-xl">
          <p className="text-[9px] tracking-[0.3em] uppercase" style={{ color: COLORS.gold }}>BIONEER</p>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: COLORS.textPrimary, fontFamily: FONT.heading }}>
            Unlock Your Full Potential
          </h1>
          <p className="text-[11px] leading-relaxed" style={{ color: COLORS.textSecondary }}>
            Professional-grade movement analysis used by elite athletes and coaches.
          </p>
        </div>

        {/* Cards */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-3xl items-stretch justify-center">
          {PLANS.map(p => (
            <PlanCard key={p.id} plan={p} onSelect={handleSelect} loading={loading} />
          ))}
        </div>

        {error && (
          <p className="mt-6 text-[10px] px-4 py-2 rounded border" style={{ color: '#EF4444', borderColor: '#EF444440', background: '#EF444410', fontFamily: FONT.mono }}>
            {error}
          </p>
        )}

        <button
          onClick={() => navigate(-1)}
          className="mt-8 text-[9px] tracking-[0.1em] uppercase underline"
          style={{ color: COLORS.textTertiary }}
        >
          Back
        </button>
      </div>
    </>
  );
}