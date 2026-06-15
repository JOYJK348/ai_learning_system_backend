'use client';

import { useRouter, useParams } from 'next/navigation';
import { Manrope } from 'next/font/google';
import { useQuery } from '@tanstack/react-query';
import { parentKeys } from '@/core/constants/queryKeys';
import { parentApi } from '@/core/services/parentApi';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Crown, Star, Zap, Sparkles, Calendar, Clock, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import styles from './page.module.css';

const adminFont = Manrope({ subsets: ['latin'], variable: '--admin-font', display: 'swap' });

const PLAN_ICONS: Record<string, React.ReactNode> = {
  free: <Zap size={24} />,
  focus: <Star size={24} />,
  premium: <Crown size={24} />,
  ultimate: <Sparkles size={24} />,
};

const PLAN_COLORS: Record<string, string> = {
  free: '#64748b',
  focus: '#2563eb',
  premium: '#7c3aed',
  ultimate: '#d97706',
};

export default function MyPlanPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const { user, loading } = useAuth();

  const { data: subscription, isLoading } = useQuery({
    queryKey: parentKeys.subscription,
    queryFn: () => parentApi.subscription(),
    enabled: !!user,
    staleTime: 60_000,
    retry: false,
  });

  if (loading || !user) return null;

  return (
    <main className={`${adminFont.variable} ${styles.shell}`}>
      <header className={styles.header}>
        <button type="button" className={styles.backBtn} onClick={() => router.push(`/${locale}/parent`)}>
          <ArrowLeft size={18} />
        </button>
        <h1 className={styles.title}>My Subscription</h1>
      </header>

      {isLoading ? (
        <div className={styles.loadingState}>
          <Loader2 size={24} className={styles.spinner} />
          <p>Loading subscription...</p>
        </div>
      ) : !subscription ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>No active subscription found.</p>
          <button type="button" className={styles.primaryBtn} onClick={() => router.push(`/${locale}/parent/plans`)}>
            Choose a Plan
          </button>
        </div>
      ) : (
        <div className={styles.content}>
          {/* Plan Card */}
          <div className={styles.planHero} style={{ borderColor: PLAN_COLORS[subscription.plan.code] }}>
            <div className={styles.planIcon} style={{ background: `${PLAN_COLORS[subscription.plan.code]}15`, color: PLAN_COLORS[subscription.plan.code] }}>
              {PLAN_ICONS[subscription.plan.code]}
            </div>
            <div>
              <h2 className={styles.planName}>{subscription.plan.name}</h2>
              <p className={styles.planPrice}>₹{subscription.plan.amount_monthly}/month</p>
            </div>
            <span className={`${styles.statusBadge} ${subscription.status === 'trial' ? styles.statusTrial : styles.statusActive}`}>
              {subscription.status === 'trial' ? 'Trial' : 'Active'}
            </span>
          </div>

          {/* Details */}
          <div className={styles.detailGrid}>
            <div className={styles.detailItem}>
              <Calendar size={16} />
              <div>
                <p className={styles.detailLabel}>Start Date</p>
                <p className={styles.detailValue}>{new Date(subscription.start_date).toLocaleDateString('en-IN')}</p>
              </div>
            </div>
            {subscription.trial_end && (
              <div className={styles.detailItem}>
                <Clock size={16} />
                <div>
                  <p className={styles.detailLabel}>Trial Ends</p>
                  <p className={styles.detailValue}>{new Date(subscription.trial_end).toLocaleDateString('en-IN')}</p>
                </div>
              </div>
            )}
            {subscription.end_date && (
              <div className={styles.detailItem}>
                <AlertTriangle size={16} />
                <div>
                  <p className={styles.detailLabel}>Expires</p>
                  <p className={styles.detailValue}>{new Date(subscription.end_date).toLocaleDateString('en-IN')}</p>
                </div>
              </div>
            )}
          </div>

          {/* Features */}
          <div className={styles.featuresSection}>
            <h3 className={styles.sectionTitle}>Included Features</h3>
            <div className={styles.featuresGrid}>
              {subscription.plan.features.map(f => (
                <div key={f.id} className={styles.featureRow}>
                  <CheckCircle2 size={14} color={f.limit === false ? '#cbd5e1' : '#059669'} />
                  <span className={f.limit === false ? styles.featureDisabled : ''}>{f.name}</span>
                  <span className={styles.featureValue}>
                    {f.limit === 'unlimited' ? '∞' : f.limit === true ? '✓' : f.limit === false ? '—' : String(f.limit)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => router.push(`/${locale}/parent/plans`)}
            >
              Change Plan
            </button>
          </div>
        </div>
      )}

      <div className={styles.bottomPad} />
    </main>
  );
}
