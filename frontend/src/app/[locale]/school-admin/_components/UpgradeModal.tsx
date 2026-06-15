'use client';

import { Crown, ArrowUpRight, CheckCircle2, X, Clock, Shield, AlertTriangle, Sparkles } from 'lucide-react';
import { useSchoolUpgrade } from '@/hooks/useSchoolPayments';
import type { SubscriptionInfo } from '@/hooks/useSchoolPayments';

type PlanInfo = {
  type: string; name: string; price: string; period: string;
  features: { key: string; label: string }[];
};

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  targetPlan: PlanInfo;
  currentPlan: PlanInfo;
  currentSub: SubscriptionInfo;
}

export default function UpgradeModal({ open, onClose, targetPlan, currentPlan, currentSub }: UpgradeModalProps) {
  const upgrade = useSchoolUpgrade();

  if (!open) return null;

  const isUpgrade = targetPlan.type === 'school' || (targetPlan.type === 'paid' && currentSub.plan_type === 'free');

  const handleConfirm = async () => {
    try {
      await upgrade.mutateAsync(targetPlan.type);
    } catch {
      // error caught below
    }
  };

  const newFeatures = targetPlan.features.filter(
    f => !currentPlan.features.some(cf => cf.key === f.key)
  );

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
    }}>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0,
        background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)',
      }} />
      <div style={{
        position: 'relative', width: '100%', maxWidth: '26rem',
        background: '#fff', borderRadius: '1rem',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem 1.5rem 1rem',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
        }}>
          <div style={{
            width: '2.5rem', height: '2.5rem', borderRadius: '0.7rem',
            background: 'linear-gradient(135deg, #dbeafe, #eff6ff)',
            display: 'grid', placeItems: 'center', flexShrink: 0,
          }}>
            <Crown size={18} color="#2563eb" />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 950, color: '#0f172a' }}>
              {isUpgrade ? 'Upgrade Plan' : 'Change Plan'}
            </h3>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
              {isUpgrade
                ? `Switch from ${currentPlan.name} to ${targetPlan.name}`
                : `Move from ${currentPlan.name} to ${targetPlan.name}`}
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '0.25rem', color: '#94a3b8', borderRadius: '0.3rem',
          }}>
            <X size={18} />
          </button>
        </div>

        {/* Plan comparison */}
        <div style={{ padding: '1rem 1.5rem' }}>
          <div style={{
            display: 'flex', gap: '0.75rem', marginBottom: '1rem',
          }}>
            {/* Current */}
            <div style={{
              flex: 1, padding: '0.75rem', borderRadius: '0.7rem',
              border: '1px solid #e2e8f0', background: '#f8fafc',
            }}>
              <div style={{ fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', marginBottom: '0.2rem' }}>
                Current
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 950, color: '#475569' }}>{currentPlan.name}</div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8' }}>{currentPlan.price}{currentPlan.period}</div>
            </div>
            {/* Arrow */}
            <div style={{ display: 'grid', placeItems: 'center', color: '#94a3b8' }}>
              <ArrowUpRight size={20} />
            </div>
            {/* Target */}
            <div style={{
              flex: 1, padding: '0.75rem', borderRadius: '0.7rem',
              border: '2px solid #2563eb', background: '#eff6ff',
            }}>
              <div style={{ fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#2563eb', marginBottom: '0.2rem' }}>
                New Plan
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 950, color: '#1e3a5f' }}>{targetPlan.name}</div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#2563eb' }}>{targetPlan.price}{targetPlan.period}</div>
            </div>
          </div>

          {/* New features */}
          {newFeatures.length > 0 && (
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b', marginBottom: '0.4rem' }}>
                You'll unlock
              </div>
              {newFeatures.map(f => (
                <div key={f.key} style={{
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                  padding: '0.3rem 0', fontSize: '0.72rem', fontWeight: 700, color: '#166534',
                }}>
                  <Sparkles size={12} color="#22c55e" />
                  {f.label}
                </div>
              ))}
            </div>
          )}

          {/* Billing info */}
          <div style={{
            padding: '0.65rem 0.75rem', borderRadius: '0.5rem',
            background: '#fffbeb', border: '1px solid #fef3c7',
            display: 'flex', alignItems: 'flex-start', gap: '0.4rem',
            marginBottom: '0.1rem',
          }}>
            <Clock size={14} color="#d97706" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#92400e' }}>
                {isUpgrade ? 'Billing will start today' : 'Plan change takes effect immediately'}
              </div>
              <div style={{ fontSize: '0.6rem', fontWeight: 600, color: '#a16207', marginTop: '0.1rem' }}>
                {targetPlan.type === 'school'
                  ? 'Your plan will be active for 365 days'
                  : 'Your plan will be active for 30 days'}
              </div>
            </div>
          </div>

          {/* Loading / Error */}
          {upgrade.isPending && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              padding: '0.75rem', fontSize: '0.8rem', fontWeight: 800, color: '#2563eb',
            }}>
              <div style={{
                width: '1.2rem', height: '1.2rem', border: '2px solid #dbeafe',
                borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite',
              }} />
              Processing your upgrade...
            </div>
          )}
          {upgrade.isError && (
            <div style={{
              padding: '0.65rem 0.75rem', borderRadius: '0.5rem',
              background: '#fef2f2', border: '1px solid #fecaca',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              fontSize: '0.72rem', fontWeight: 700, color: '#991b1b',
            }}>
              <AlertTriangle size={14} />
              {upgrade.error instanceof Error ? upgrade.error.message : 'Upgrade failed'}
            </div>
          )}
          {upgrade.isSuccess && (
            <div style={{
              padding: '0.75rem', borderRadius: '0.5rem',
              background: '#f0fdf4', border: '1px solid #bbf7d0',
              textAlign: 'center',
            }}>
              <CheckCircle2 size={24} color="#22c55e" style={{ marginBottom: '0.3rem' }} />
              <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#166534' }}>
                {upgrade.data?.message || 'Upgrade successful!'}
              </div>
              <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#16a34a', marginTop: '0.15rem' }}>
                Your plan has been activated
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem', borderTop: '1px solid #f1f5f9',
          display: 'flex', gap: '0.6rem',
        }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '0.6rem', borderRadius: '0.5rem',
            border: '1px solid #e2e8f0', background: '#fff',
            fontSize: '0.72rem', fontWeight: 850, color: '#64748b',
            cursor: 'pointer',
          }}>
            {upgrade.isSuccess ? 'Close' : 'Cancel'}
          </button>
          {!upgrade.isSuccess && (
            <button onClick={handleConfirm} disabled={upgrade.isPending} style={{
              flex: 1, padding: '0.6rem', borderRadius: '0.5rem',
              border: 'none',
              background: upgrade.isPending ? '#94a3b8' : '#12312f',
              fontSize: '0.72rem', fontWeight: 850, color: '#fff',
              cursor: upgrade.isPending ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
            }}>
              {isUpgrade ? 'Confirm Upgrade' : 'Change Plan'}
              <ArrowUpRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
