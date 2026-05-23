'use client';

import { useState, useEffect } from 'react';
import { createPaymentOrderAction, verifyPaymentAction } from '../actions';

const PACKS = [
  { id: 'starter', name: 'Starter', priceINR: 49,  credits: 50_000,    tag: 'Try it out' },
  { id: 'growth',  name: 'Growth',  priceINR: 149, credits: 200_000,   tag: 'Regular use' },
  { id: 'pro',     name: 'Pro',     priceINR: 499, credits: 750_000,   tag: 'Heavy use' },
  { id: 'power',   name: 'Power',   priceINR: 999, credits: 1_800_000, tag: 'Best value' },
] as const;

type PackId = typeof PACKS[number]['id'];

declare global {
  interface Window {
    Razorpay: new (options: object) => { open(): void };
  }
}

export function TopUpSection({ email, razorpayKeyId }: { email: string; razorpayKeyId: string }) {
  const [loading, setLoading] = useState<PackId | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    if (document.querySelector('script[src*="checkout.razorpay"]')) {
      setScriptReady(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setScriptReady(true);
    document.body.appendChild(script);
  }, []);

  async function handleTopUp(pack: typeof PACKS[number]) {
    if (!scriptReady) return;
    setLoading(pack.id);
    setError(null);
    setSuccess(null);

    try {
      const order = await createPaymentOrderAction(pack.id);

      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: razorpayKeyId,
          amount: order.amount,
          currency: order.currency,
          order_id: order.orderId,
          name: 'Dyaus',
          description: `${pack.name} — ${pack.credits.toLocaleString()} credits`,
          image: '/dyaus.png',
          prefill: { email },
          theme: { color: '#f59e0b' },
          handler: async (response: {
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
          }) => {
            try {
              const result = await verifyPaymentAction(response);
              setSuccess(`${result.creditsAdded.toLocaleString()} credits added to your account!`);
              resolve();
            } catch {
              reject(new Error('Payment verification failed'));
            }
          },
          modal: {
            ondismiss: () => reject(new Error('dismissed')),
          },
        });
        rzp.open();
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg !== 'dismissed') {
        setError(msg || 'Payment failed. Try again.');
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <section className="rounded-2xl border border-sky-200 bg-white/85 backdrop-blur-sm shadow-sm p-6 space-y-4">
      <div>
        <h2 className="font-semibold text-slate-900">Top Up Credits</h2>
        <p className="text-xs text-slate-400 mt-0.5">1 credit = 1 input token · 2 credits = 1 output token</p>
      </div>

      {success && (
        <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800 font-medium">
          {success}
        </div>
      )}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {PACKS.map((pack) => (
          <button
            key={pack.id}
            onClick={() => handleTopUp(pack)}
            disabled={loading !== null || !scriptReady}
            className={`relative rounded-xl border p-4 text-left transition-all disabled:opacity-60 disabled:cursor-not-allowed
              ${pack.id === 'pro'
                ? 'border-amber-400 bg-amber-50/80 shadow-sm ring-1 ring-amber-300'
                : 'border-sky-200 bg-sky-50/60 hover:border-amber-300 hover:bg-amber-50/40'
              }`}
          >
            {pack.id === 'pro' && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                Popular
              </span>
            )}
            <p className="font-semibold text-sm text-slate-900">{pack.name}</p>
            <p className="text-xl font-bold text-amber-600 mt-1">₹{pack.priceINR}</p>
            <p className="text-xs text-slate-500 mt-1">{(pack.credits).toLocaleString()} credits</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{pack.tag}</p>
            {loading === pack.id && (
              <div className="absolute inset-0 rounded-xl bg-white/60 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </button>
        ))}
      </div>

      <p className="text-xs text-slate-400">
        Secured by Razorpay · UPI, cards, net banking accepted · Credits are non-refundable
      </p>
    </section>
  );
}
