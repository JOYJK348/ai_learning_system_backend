'use client';

import { useRouter, useParams } from 'next/navigation';
import { Manrope } from 'next/font/google';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Zap, Gamepad2, HelpCircle, CheckSquare, LayoutDashboard,
  Mail, Clock, Bell, Bot, FilePlus, CalendarCheck, TrendingUp,
  Users, Smartphone, Eye, Crown, Star, Sparkles, Shield,
  Check, ChevronRight, ArrowLeft, Loader2, AlertTriangle,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { parentKeys } from '@/core/constants/queryKeys';
import { parentApi } from '@/core/services/parentApi';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

const adminFont = Manrope({ subsets: ['latin'], variable: '--admin-font', display: 'swap' });

const PLAN_ICONS: Record<string, React.ReactNode> = {
  free: <Zap size={22} />,
  focus: <Star size={22} />,
  premium: <Crown size={22} />,
  ultimate: <Sparkles size={22} />,
};

const PLAN_COLORS: Record<string, string> = {
  free: '#64748b',
  focus: '#2563eb',
  premium: '#7c3aed',
  ultimate: '#d97706',
};

const CATEGORY_LABELS: Record<string, string> = {
  core: 'Core Learning',
  assessment: 'Assessment & Exams',
  fun: 'Fun Zone',
  parent: 'Parent Portal',
  ai: 'AI Features',
  technical: 'Technical',
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  core: <Zap size={14} />,
  assessment: <CheckSquare size={14} />,
  fun: <Gamepad2 size={14} />,
  parent: <LayoutDashboard size={14} />,
  ai: <Bot size={14} />,
  technical: <Shield size={14} />,
};

const FEATURE_ICONS: Record<string, React.ReactNode> = {
  subjects_access: <Book size={14} />,
  unit_tests: <CheckSquare size={14} />,
  games: <Gamepad2 size={14} />,
  activities: <Zap size={14} />,
  ai_doubt_solver: <Bot size={14} />,
  ai_worksheet: <FilePlus size={14} />,
  weekly_report: <Mail size={14} />,
  screen_time: <Clock size={14} />,
  performance_alerts: <Bell size={14} />,
  ai_planner: <CalendarCheck size={14} />,
  ai_parent_insights: <TrendingUp size={14} />,
  multi_profile: <Users size={14} />,
  devices: <Smartphone size={14} />,
  ads: <Eye size={14} />,
  parent_dashboard: <LayoutDashboard size={14} />,
};

function formatLimit(limit: unknown): string {
  if (limit === 'unlimited') return 'Unlimited';
  if (limit === false) return '—';
  if (limit === true) return '✅';
  if (typeof limit === 'string') return limit;
  return String(limit);
}

function FeatureIcon({ code }: { code: string }) {
  return FEATURE_ICONS[code] || <HelpCircle size={14} />;
}

function Book(props: { size?: number }) {
  return <svg width={props.size || 14} height={props.size || 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
}

export default function PlansPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const { user, loading } = useAuth();
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [subscribing, setSubscribing] = useState(false);

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: parentKeys.plans,
    queryFn: () => parentApi.plans(),
    staleTime: 5 * 60_000,
  });

  const { data: subscription, isLoading: subLoading } = useQuery({
    queryKey: parentKeys.subscription,
    queryFn: () => parentApi.subscription(),
    enabled: !!user,
    staleTime: 60_000,
    retry: false,
  });

  const handleSubscribe = async (planId: number) => {
    setSelectedPlanId(planId);
    setSubscribing(true);
    try {
      const result = await parentApi.subscribe(planId);
      if (result.amount > 0) {
        // TODO: Integrate Razorpay here in Phase 2
        router.push(`/${locale}/parent/plans/checkout?order_id=${result.payment?.order_id}`);
      } else {
        router.push(`/${locale}/parent/plans/my-plan`);
      }
    } catch {
      // Error handled silently
    } finally {
      setSubscribing(false);
    }
  };

  if (loading || !user) return null;

  const currentPlanId = subscription?.plan_id;

  return (
    <main className={`${adminFont.variable} ${styles.shell}`}>

      {/* Header */}
      <header className={styles.header}>
        <button type="button" className={styles.backBtn} onClick={() => router.push(`/${locale}/parent`)}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className={styles.title}>Choose Your Plan</h1>
          <p className={styles.subtitle}>Unlock fun activities, exams, games & more!</p>
        </div>
      </header>

      {/* Current Plan Banner */}
      {subscription && (
        <motion.div
          className={styles.currentBanner}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={styles.currentBannerContent}>
            <div>
              <p className={styles.currentLabel}>Current Plan</p>
              <p className={styles.currentName}>
                {subscription.plan.name}
                {subscription.status === 'trial' && (
                  <span className={styles.trialBadge}>14-day Trial</span>
                )}
              </p>
            </div>
            <div className={styles.currentMeta}>
              {subscription.status === 'trial' && subscription.trial_end && (
                <p className={styles.trialCountdown}>
                  {Math.ceil((new Date(subscription.trial_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left
                </p>
              )}
              <p className={styles.currentPrice}>
                {subscription.plan.amount_monthly === 0 ? 'Free' : `₹${subscription.plan.amount_monthly}/mo`}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Plan Cards */}
      {plansLoading ? (
        <div className={styles.loadingState}>
          <div className={styles.loader} />
          <p>Loading plans...</p>
        </div>
      ) : (
        <div className={styles.plansGrid}>
          {(plans || []).map((plan, i) => {
            const isCurrent = plan.id === currentPlanId;
            const featuresByCategory = plan.features.reduce<Record<string, typeof plan.features>>((acc, f) => {
              if (!acc[f.category]) acc[f.category] = [];
              acc[f.category].push(f);
              return acc;
            }, {});

            return (
              <motion.div
                key={plan.id}
                className={`${styles.planCard} ${isCurrent ? styles.planCardCurrent : ''} ${selectedPlanId === plan.id && subscribing ? styles.planCardLoading : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.35 }}
              >
                {plan.badge_label && (
                  <span className={styles.badge}>{plan.badge_label}</span>
                )}

                <div className={styles.planIcon} style={{ background: `${PLAN_COLORS[plan.code]}15`, color: PLAN_COLORS[plan.code] }}>
                  {PLAN_ICONS[plan.code]}
                </div>

                <h2 className={styles.planName}>{plan.name}</h2>
                <div className={styles.planPrice}>
                  <span className={styles.priceAmount}>₹{plan.amount_monthly}</span>
                  <span className={styles.pricePeriod}>/month</span>
                </div>

                <p className={styles.planDesc}>{plan.description}</p>

                {/* Features by category */}
                <div className={styles.featureGroups}>
                  {Object.entries(featuresByCategory).map(([category, features]) => (
                    <div key={category} className={styles.featureGroup}>
                      <p className={styles.featureCategory}>
                        {CATEGORY_ICONS[category]}
                        {CATEGORY_LABELS[category] || category}
                      </p>
                      <div className={styles.featureList}>
                        {features.map((f) => (
                          <div key={f.id} className={styles.featureItem}>
                            <FeatureIcon code={f.code} />
                            <span className={styles.featureName}>{f.name}</span>
                            <span className={`${styles.featureLimit} ${f.limit === false ? styles.featureDisabled : ''}`}>
                              {formatLimit(f.limit)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button
                  type="button"
                  className={`${styles.ctaBtn} ${isCurrent ? styles.ctaBtnCurrent : ''}`}
                  style={!isCurrent ? { background: PLAN_COLORS[plan.code] } : {}}
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isCurrent || subscribing}
                >
                  {subscribing && selectedPlanId === plan.id ? (
                    <><Loader2 size={16} className={styles.spinner} /> Processing...</>
                  ) : isCurrent ? (
                    'Current Plan'
                  ) : plan.amount_monthly === 0 ? (
                    'Get Started Free'
                  ) : (
                    <>Subscribe <ChevronRight size={16} /></>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className={styles.bottomPad} />
    </main>
  );
}
