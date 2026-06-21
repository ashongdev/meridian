"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

const TIERS = [
  { name: "Free", price: "$0", features: ["Course communities", "Upload & download materials", "20 AI tutor questions/hour"] },
  { name: "Pro", price: "$4/mo", features: ["Everything in Free", "Unlimited AI tutor", "Priority support"], highlight: true },
];

export function SettingsClient({
  isPro,
  trialActive,
  trialDaysLeft,
}: {
  isPro: boolean;
  trialActive: boolean;
  trialDaysLeft: number;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [redeemMessage, setRedeemMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [upgrading, setUpgrading] = useState(false);

  async function redeemCode(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setRedeeming(true);
    setRedeemMessage(null);
    try {
      const res = await fetch("/api/promo-codes/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const json = await res.json();
      if (!res.ok) {
        setRedeemMessage({ type: "error", text: json.error ?? "Failed to redeem code" });
        return;
      }
      setRedeemMessage({ type: "ok", text: `+${json.data.durationDays} days of Pro unlocked.` });
      setCode("");
      router.refresh();
    } finally {
      setRedeeming(false);
    }
  }

  async function upgrade() {
    setUpgrading(true);
    try {
      const res = await fetch("/api/users/me/upgrade", { method: "POST" });
      if (res.ok) router.refresh();
    } finally {
      setUpgrading(false);
    }
  }

  return (
    <>
      {/* ── Plan & billing ─────────────────────────────────────────────── */}
      <section className="mb-10">
        <h2 className="font-display font-bold text-ink text-sm uppercase tracking-widest mb-4">Plan &amp; billing</h2>

        {isPro ? (
          <div className="bg-teal/10 border border-teal/30 rounded-xl p-5 flex items-center gap-3">
            <span className="text-teal text-xl">✦</span>
            <div>
              <p className="font-display font-semibold text-teal">You&apos;re on Pro</p>
              <p className="font-body text-ink-3 text-xs">Unlimited AI tutor access, on every course.</p>
            </div>
          </div>
        ) : (
          <>
            {trialActive && (
              <div className="bg-amber/10 border border-amber/30 rounded-xl p-4 mb-4 flex items-center gap-3">
                <span className="text-amber text-lg">⏱</span>
                <p className="font-body text-sm text-ink">
                  Free Pro trial active — <span className="font-semibold text-amber">{trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""}</span> left.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {TIERS.map((tier) => (
                <div
                  key={tier.name}
                  className={`rounded-xl p-5 border ${
                    tier.highlight ? "bg-teal/5 border-teal/30" : "bg-surface border-border"
                  }`}
                >
                  <div className="flex items-baseline justify-between mb-3">
                    <h3 className="font-display font-bold text-ink">{tier.name}</h3>
                    <span className={`font-display font-bold ${tier.highlight ? "text-teal" : "text-ink-2"}`}>{tier.price}</span>
                  </div>
                  <ul className="space-y-1.5 mb-4">
                    {tier.features.map((f) => (
                      <li key={f} className="text-xs font-body text-ink-2 flex items-start gap-1.5">
                        <span className="text-ink-3 mt-0.5">·</span>{f}
                      </li>
                    ))}
                  </ul>
                  {tier.highlight && (
                    <button
                      onClick={upgrade}
                      disabled={upgrading}
                      className="w-full bg-teal text-paper font-display font-bold text-xs px-4 py-2.5 rounded-full hover:bg-teal-dim transition-colors disabled:opacity-50"
                    >
                      {upgrading ? "Upgrading…" : "Upgrade to Pro"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* ── Promo code ───────────────────────────────────────────────────── */}
      <section>
        <h2 className="font-display font-bold text-ink text-sm uppercase tracking-widest mb-4">Promo code</h2>
        <form onSubmit={redeemCode} className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center gap-3">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter a promo code"
              maxLength={50}
              className="flex-1 bg-surface-2 border border-border text-ink text-sm font-body px-4 py-2.5 rounded-lg focus:outline-none focus:border-teal/60 placeholder:text-ink-3"
            />
            <button
              type="submit"
              disabled={redeeming || !code.trim()}
              className="bg-teal text-paper font-display font-bold text-xs px-5 py-2.5 rounded-full hover:bg-teal-dim transition-colors disabled:opacity-50 shrink-0"
            >
              {redeeming ? "…" : "Redeem"}
            </button>
          </div>
          {redeemMessage && (
            <p className={`text-xs font-body mt-3 ${redeemMessage.type === "ok" ? "text-teal" : "text-coral"}`}>
              {redeemMessage.text}
            </p>
          )}
        </form>
      </section>

      {/* ── Sign out ─────────────────────────────────────────────────────── */}
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="mt-10 text-xs font-body text-ink-3 hover:text-coral transition-colors underline underline-offset-2"
      >
        Sign out
      </button>
    </>
  );
}
