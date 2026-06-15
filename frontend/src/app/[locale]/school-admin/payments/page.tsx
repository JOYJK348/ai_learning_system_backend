'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Manrope } from 'next/font/google';
import {
  CreditCard,
  Users,
  Shield,
  Clock,
  Zap,
  Video,
  BarChart3,
  Bot,
  Upload,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Wallet,
  AlertTriangle,
  Building2,
  PiggyBank,
  Sparkles,
  Crown,
  ArrowUpRight,
  Info,
  Timer,
  AlertOctagon,
} from 'lucide-react';
import { useSchoolPayments, usePlansConfig } from '@/hooks/useSchoolPayments';
import type { PaymentsData, PlanItem } from '@/hooks/useSchoolPayments';
import UpgradeModal from '../_components/UpgradeModal';
import styles from './page.module.css';

const adminFont = Manrope({
  subsets: ['latin'],
  variable: '--admin-font',
  display: 'swap',
});

// Plans fetched from API. Fallback in usePlansConfig if backend unreachable.
// Edit prices/features in backend/src/config/plans.ts

const CONTAINER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.035 } },
};

const ITEM = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

function Badge({ status }: { status: string | null }) {
  if (!status) return null;
  const m: Record<string, { bg: string; fg: string }> = {
    active: { bg: '#dcfce7', fg: '#166534' },
    expired: { bg: '#fef2f2', fg: '#991b1b' },
    pending: { bg: '#fef3c7', fg: '#92400e' },
    cancelled: { bg: '#f1f5f9', fg: '#475569' },
  };
  const c = m[status] || { bg: '#f1f5f9', fg: '#475569' };
  return (
    <span className={styles.badge} style={{ background: c.bg, color: c.fg }}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function CountdownTimer({ expiresAt, serverTime }: { expiresAt: string; serverTime: string }) {
  const offsetRef = useRef(Date.now() - new Date(serverTime).getTime());
  const calc = useCallback(() => {
    const remaining = new Date(expiresAt).getTime() - (Date.now() - offsetRef.current);
    if (remaining <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    const totalSec = Math.floor(remaining / 1000);
    return {
      days: Math.floor(totalSec / 86400),
      hours: Math.floor((totalSec % 86400) / 3600),
      minutes: Math.floor((totalSec % 3600) / 60),
      seconds: totalSec % 60,
      expired: false,
    };
  }, [expiresAt]);

  const [time, setTime] = useState(calc);

  useEffect(() => {
    setTime(calc());
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [calc]);

  if (time.expired) {
    return <div className={styles.countdownExpired}>Plan Expired</div>;
  }

  return (
    <div className={styles.countdown}>
      <div className={styles.countdownBlock}>
        <span className={styles.countdownNum}>{String(time.days).padStart(2, '0')}</span>
        <span className={styles.countdownLbl}>Days</span>
      </div>
      <span className={styles.countdownSep}>:</span>
      <div className={styles.countdownBlock}>
        <span className={styles.countdownNum}>{String(time.hours).padStart(2, '0')}</span>
        <span className={styles.countdownLbl}>Hrs</span>
      </div>
      <span className={styles.countdownSep}>:</span>
      <div className={styles.countdownBlock}>
        <span className={styles.countdownNum}>{String(time.minutes).padStart(2, '0')}</span>
        <span className={styles.countdownLbl}>Min</span>
      </div>
      <span className={styles.countdownSep}>:</span>
      <div className={styles.countdownBlock}>
        <span className={styles.countdownNum}>{String(time.seconds).padStart(2, '0')}</span>
        <span className={styles.countdownLbl}>Sec</span>
      </div>
    </div>
  );
}

export default function PaymentsPage() {
  const { data, isLoading } = useSchoolPayments();
  const plans = usePlansConfig();
  const d = data as PaymentsData | undefined;
  const sub = d?.subscription;
  const usage = d?.usage;
  const revenue = d?.revenue;
  const serverTime = d?.server_time;
  const expired = sub?.plan_status === 'expired';

  const currentPlanPrice = sub && sub.plan_price > 0
    ? `₹${Number(sub.plan_price).toLocaleString('en-IN')}`
    : '₹0';

  const enabledCount = sub ? Object.values(sub.features).filter(Boolean).length : 0;
  const activeFeatures = sub ? Object.entries(sub.features).filter(([, v]) => v).map(([k]) => k) : [];

  const [localExpired, setLocalExpired] = useState(false);
  const offsetRef = useRef(0);

  useEffect(() => {
    const expires = sub?.plan_expires_at;
    if (!expires || !serverTime) return;
    offsetRef.current = Date.now() - new Date(serverTime).getTime();
    const check = () => {
      const remaining = new Date(expires).getTime() - (Date.now() - offsetRef.current);
      if (remaining <= 0) setLocalExpired(true);
    };
    check();
    const id = setInterval(check, 1000);
    return () => clearInterval(id);
  }, [sub?.plan_expires_at, serverTime]);

  const isExpired = expired || localExpired;

  const [upgradeTarget, setUpgradeTarget] = useState<PlanItem | null>(null);

  const currentPlanTier = plans.find(p => p.type === sub?.plan_type) || plans[0];

  const kpis = [
    { label: 'Monthly Revenue', value: `₹${Number(revenue?.this_month || 0).toLocaleString('en-IN')}`, icon: TrendingUp, change: 'Current month' },
    { label: 'Total Revenue', value: `₹${Number(revenue?.total || 0).toLocaleString('en-IN')}`, icon: Wallet, change: 'All time' },
    { label: 'Student Capacity', value: `${usage?.current_students ?? 0} / ${usage?.max_students ?? 0}`, icon: Users, change: `${usage?.usage_percent ?? 0}% utilised` },
    { label: 'Active Features', value: `${enabledCount} / 6`, icon: Shield, change: `${enabledCount} of 6 enabled` },
  ];

  if (isLoading) {
    return (
      <div className={`${styles.shell} ${adminFont.variable}`}>
        <div className={styles.loading}>
          <div className={styles.loader} />
          <p className={styles.loadingText}>Loading plan details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.shell} ${adminFont.variable}`}>
      <div className={styles.bgGlow} />
      <div className={styles.content}>

        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Plan & Billing</h1>
            <p className={styles.subtitle}>Your current plan, usage, and upgrade options</p>
          </div>
          {sub && (
            <div className={styles.headerRight}>
              <div className={styles.schoolBadge}>
                <Building2 size={15} />
                {sub.plan_type_name || 'School'} Plan
              </div>
            </div>
          )}
        </header>

        {!sub && !isLoading && (
          <div className={styles.prompt}>
            <div className={styles.promptIcon}><CreditCard size={28} /></div>
            <p>No plan data available yet</p>
          </div>
        )}

        {sub && (
          <motion.div variants={CONTAINER} initial="hidden" animate="show">

            {/* Alert */}
            {isExpired && (
              <motion.div className={`${styles.alert} ${styles.alertRed}`} variants={ITEM}>
                <AlertOctagon size={16} />
                <span>Your plan has expired. Choose a plan below to restore access.</span>
              </motion.div>
            )}

            {/* Current Plan — with countdown */}
            <motion.div className={`${styles.currentCard} ${isExpired ? styles.currentExpired : ''}`} variants={ITEM}>
              {isExpired && <div className={styles.currentOverlay} />}
              <div className={styles.currentBg} />
              <div className={styles.currentGrid}>
                <div className={styles.currentLeft}>
                  <div className={styles.currentLabel}>Current Plan</div>
                  <div className={styles.currentName}>{sub.plan_type_name || 'School'} Plan</div>
                  <div className={styles.currentPriceRow}>
                    <span className={styles.currentPrice}>{currentPlanPrice}</span>
                    <span className={styles.currentPeriod}>/ month</span>
                  </div>
                  <div className={styles.currentMeta}>
                    <Badge status={isExpired ? 'expired' : sub.plan_status} />
                  </div>
                  <div className={styles.currentPills}>
                    {sub.discount_percent > 0 && <span className={styles.pill}>{sub.discount_percent}% discount</span>}
                    {sub.setup_fee > 0 && <span className={styles.pill}>₹{Number(sub.setup_fee).toLocaleString('en-IN')} setup fee</span>}
                    {sub.trial_days > 0 && <span className={styles.pill}>{sub.trial_days}-day trial</span>}
                  </div>
                </div>
                <div className={styles.currentRight}>
                  {sub.plan_expires_at && serverTime && !isExpired && (
                    <div className={styles.countdownCard}>
                      <div className={styles.countdownHeader}>
                        <Timer size={13} />
                        <span>Time Remaining</span>
                      </div>
                      <CountdownTimer expiresAt={sub.plan_expires_at} serverTime={serverTime} />
                    </div>
                  )}
                  {isExpired && (
                    <div className={styles.countdownCard}>
                      <div className={styles.countdownHeader}>
                        <AlertOctagon size={13} />
                        <span>Plan Expired</span>
                      </div>
                      <div className={styles.countdownExpiredBlock}>
                        <span className={styles.countdownExpiredIcon}>⏰</span>
                        <span className={styles.countdownExpiredText}>Access restricted</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Plan Selection */}
            <section className={styles.plansSection}>
              <div className={styles.plansHeader}>
                <Sparkles size={16} color="#12312f" />
                <h3>Available Plans</h3>
              </div>
              <div className={styles.plansGrid}>
                {plans.map((plan) => {
                  const isCurrent = plan.type === sub.plan_type;
                  const isUpgrade = plans.findIndex((p) => p.type === plan.type) > plans.findIndex((p) => p.type === sub.plan_type);
                  return (
                    <motion.div key={plan.type} className={`${styles.planCard} ${isCurrent ? styles.planCurrent : ''}`} variants={ITEM}>
                      {isCurrent && <span className={styles.planCurrentBadge}>Current Plan</span>}
                      <div className={styles.planCardTop}>
                        <Crown size={18} color={isCurrent ? '#12312f' : '#94a3b8'} />
                        <div className={styles.planCardName}>{plan.name}</div>
                        <div className={styles.planCardPrice}>
                          {plan.price}
                          <span className={styles.planCardPeriod}>{plan.period}</span>
                        </div>
                        <p className={styles.planCardDesc}>{plan.desc}</p>
                      </div>
                      <div className={styles.planCardFeatures}>
                        {plans.flatMap((t) => t.features).filter((f, i, arr) => arr.findIndex((x) => x.key === f.key) === i).map((f) => {
                          const has = isCurrent ? activeFeatures.includes(f.key) : plan.features.some((pf) => pf.key === f.key);
                          return (
                            <div key={f.key} className={`${styles.planFeat} ${!has ? styles.planFeatOff : ''}`}>
                              {has ? <CheckCircle2 size={12} color="#22c55e" /> : <XCircle size={12} color="#cbd5e1" />}
                              {f.label}
                            </div>
                          );
                        })}
                      </div>
                      {!isCurrent && (
                        <button
                          className={`${styles.planCta} ${isUpgrade ? styles.planCtaUp : styles.planCtaDown}`}
                          onClick={() => setUpgradeTarget(plan)}
                        >
                          {isUpgrade ? 'Upgrade' : 'Downgrade'}
                          <ArrowUpRight size={13} />
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </section>

            {/* KPI Grid */}
            <section className={styles.kpiGrid}>
              {kpis.map((k, i) => (
                <motion.div key={k.label} variants={ITEM} className={styles.kpiCard}>
                  <div className={styles.kpiTop}>
                    <div className={styles.kpiIcon}><k.icon size={17} /></div>
                    <span className={styles.kpiChange}>{k.change}</span>
                  </div>
                  <p className={styles.kpiLabel}>{k.label}</p>
                  <h2 className={styles.kpiValue}>{k.value}</h2>
                </motion.div>
              ))}
            </section>

            {/* Usage */}
            {usage && (
              <motion.div className={styles.card} variants={ITEM}>
                <div className={styles.cardHdr}>
                  <Users size={16} color="#12312f" />
                  <h3>Usage</h3>
                </div>
                <div className={styles.progRow}>
                  <div className={styles.progLbl}>
                    <span>Students enrolled</span>
                    <span>{usage.current_students} / {usage.max_students}</span>
                  </div>
                  <div className={styles.progTrack}>
                    <div className={styles.progFill} style={{
                      width: `${Math.min(usage.usage_percent, 100)}%`,
                      background: usage.usage_percent > 100
                        ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                        : usage.usage_percent > 80
                          ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                          : 'linear-gradient(90deg, #22c55e, #16a34a)',
                    }} />
                  </div>
                  {usage.usage_percent > 100 && (
                    <div className={styles.progWarn}>
                      <AlertTriangle size={12} /> Exceeds limit by {usage.current_students - usage.max_students} students
                    </div>
                  )}
                </div>
                {usage.current_students > 0 && sub && sub.plan_price > 0 && (
                  <div className={styles.costRow}>
                    <PiggyBank size={13} color="#64748b" />
                    <span>₹{(sub.plan_price / usage.current_students).toFixed(2)} / student / month</span>
                  </div>
                )}
              </motion.div>
            )}

            {/* Timeline + Features */}
            <TimelineCard sub={sub} expired={isExpired} serverTime={serverTime} />
            <FeaturesCard plans={plans} activeFeatures={activeFeatures} enabledCount={enabledCount} />

          </motion.div>
        )}

      </div>

      {/* Upgrade Modal */}
      {sub && upgradeTarget && (
        <UpgradeModal
          open={!!upgradeTarget}
          onClose={() => setUpgradeTarget(null)}
          targetPlan={upgradeTarget}
          currentPlan={currentPlanTier}
          currentSub={sub}
        />
      )}
    </div>
  );
}

function TimelineCard({ sub, expired: isExpired, serverTime }: {
  sub: NonNullable<PaymentsData['subscription']>;
  expired: boolean;
  serverTime?: string;
}) {
  const entries = useMemo(() => {
    const e: { label: string; date: string }[] = [];
    if (sub.plan_started_at) {
      e.push({
        label: `${sub.plan_type_name || 'Current'} plan started`,
        date: new Date(sub.plan_started_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      });
    }
    if (sub.plan_expires_at && !isExpired) {
      e.push({
        label: 'Plan renewal',
        date: new Date(sub.plan_expires_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      });
    }
    e.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return e;
  }, [sub, isExpired]);

  return (
    <motion.div className={styles.card} variants={ITEM}>
      <div className={styles.cardHdr}>
        <Clock size={16} color="#12312f" />
        <h3>Timeline</h3>
      </div>
      {entries.length === 0 ? (
        <p className={styles.emptySmall}>No timeline events</p>
      ) : (
        <div className={styles.tl}>
          {entries.map((e, i) => (
            <div key={i} className={styles.tlItem}>
              <div className={styles.tlDot} />
              {i < entries.length - 1 && <div className={styles.tlLine} />}
              <div className={styles.tlBody}>
                <span className={styles.tlDate}>{e.date}</span>
                <span className={styles.tlLabel}>{e.label}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function FeaturesCard({ plans, activeFeatures, enabledCount }: { plans: PlanItem[]; activeFeatures: string[]; enabledCount: number }) {
  const allFeatures = plans.flatMap((t) => t.features)
    .filter((f, i, arr) => arr.findIndex((x) => x.key === f.key) === i);

  return (
    <motion.div className={styles.card} variants={ITEM}>
      <div className={styles.cardHdr}>
        <Shield size={16} color="#12312f" />
        <h3>Features</h3>
        <span className={styles.cardBadge}>{enabledCount} / 6</span>
      </div>
      <div className={styles.fList}>
        {allFeatures.map((f) => {
          const on = activeFeatures.includes(f.key);
          return (
            <div key={f.key} className={`${styles.fItem} ${!on ? styles.fOff : ''}`}>
              <div className={styles.fIcon} style={{ background: on ? '#dbeafe' : '#f1f5f9' }}>
                {on ? <CheckCircle2 size={13} color="#2563eb" /> : <XCircle size={13} color="#94a3b8" />}
              </div>
              <span className={styles.fLabel}>{f.label}</span>
              {on && <Info size={12} color="#94a3b8" />}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
