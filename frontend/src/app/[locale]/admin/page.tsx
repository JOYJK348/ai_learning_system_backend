'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Manrope } from 'next/font/google';
import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { adminKeys } from '@/core/constants/queryKeys';
import { adminApi } from '@/core/services/adminApi';
import {
  AlertTriangle,
  BookOpen,
  Building2,
  Check,
  CircleDollarSign,
  Clock,
  GraduationCap,
  School,
  ShieldCheck,
  UserPlus,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

const adminFont = Manrope({
  subsets: ['latin'],
  variable: '--admin-font',
  display: 'swap',
});

type DashboardApiResponse = {
  counts: {
    students: number;
    parents: number;
    schools: number;
    active_schools: number;
    lessons: number;
  };
  revenue: {
    total: number;
    growth_percent: number;
    trend: number[];
  };
  engagement: {
    active_users: number;
    lessons_completed: number;
    completion_rate: number;
    avg_quiz_score: number;
    engagement_score: number;
    avg_session_minutes: number;
    activity_trend: number[];
  };
  alerts: {
    pending_approvals: number;
    pending_payments: number;
    expiring_plans: number;
  };
  recent_signups: Array<{
    name: string;
    role: string;
    status: string;
    created_at: string;
  }>;
  new_signups_30d: number;
};

const AVATAR_GRADIENTS = [
  ['#12312f', '#1a4a47'],
  ['#1e293b', '#334155'],
  ['#3b1f4e', '#5b2d75'],
  ['#1e3a5f', '#2d5a8e'],
  ['#5c1f1f', '#8e2d2d'],
  ['#1f4e3a', '#2d755a'],
];

function hashName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash);
}

function getAvatarGradient(name: string) {
  const g = AVATAR_GRADIENTS[hashName(name) % AVATAR_GRADIENTS.length];
  return `linear-gradient(135deg, ${g[0]}, ${g[1]})`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-IN').format(value || 0);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);
}

function timeAgo(dateValue?: string) {
  if (!dateValue) return 'Recently';
  const diffMs = Date.now() - new Date(dateValue).getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

export default function SuperAdminPortal() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const { data: rawDashboard, isLoading: dashboardLoading, error: dashboardError } = useQuery({
    queryKey: adminKeys.dashboard,
    queryFn: adminApi.dashboard,
    refetchInterval: 60_000,
    staleTime: 60_000,
    enabled: !!user,
  });

  const { data: pendingRegs } = useQuery({
    queryKey: ['admin', 'pending-registrations', 'pending'],
    queryFn: () => fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? ''}/api/admin/pending-registrations?status=pending`, { credentials: 'include' })
      .then(r => r.json()).then(d => d.data ?? []),
    enabled: !!user,
    refetchInterval: 30_000,
  });

  const dashboard = useMemo(() => {
    if (!rawDashboard) return null;
    return rawDashboard as DashboardApiResponse;
  }, [rawDashboard]);

  const currentDate = useMemo(
    () => new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' }).format(new Date()),
    [],
  );

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const kpiValues = useMemo(() => {
    if (!dashboard) return [];
    return [
      { label: 'Students', value: formatNumber(dashboard.counts.students), change: `${formatNumber(dashboard.counts.students)} total`, icon: GraduationCap },
      { label: 'Parents', value: formatNumber(dashboard.counts.parents), change: `${formatNumber(dashboard.new_signups_30d)} new`, icon: Users },
      { label: 'Schools', value: formatNumber(dashboard.counts.schools), change: `${formatNumber(dashboard.counts.active_schools)} active`, icon: School },
      { label: 'Revenue', value: formatCurrency(dashboard.revenue.total), change: `${dashboard.revenue.growth_percent}%`, icon: CircleDollarSign },
      { label: 'Lessons', value: formatNumber(dashboard.counts.lessons), change: `${dashboard.engagement.completion_rate}% done`, icon: BookOpen },
    ];
  }, [dashboard]);

  const engagementMetrics = useMemo(() => {
    if (!dashboard) return [];
    return [
      { label: 'Lessons Completed', value: formatNumber(dashboard.engagement.lessons_completed), color: '#16a34a' },
      { label: 'Active Users', value: formatNumber(dashboard.engagement.active_users), color: '#2563eb' },
      { label: 'Avg Quiz Score', value: `${dashboard.engagement.avg_quiz_score}%`, color: '#7c3aed' },
    ];
  }, [dashboard]);

  const progressBars = useMemo(() => {
    if (!dashboard) return [];
    const e = dashboard.engagement;
    return [
      { label: 'Lessons', value: e.completion_rate, color: '#16a34a' },
      { label: 'Quiz Score', value: e.avg_quiz_score, color: '#7c3aed' },
      { label: 'Engagement', value: e.engagement_score, color: '#2563eb' },
      { label: 'Sessions', value: Math.min(100, e.avg_session_minutes), color: '#d97706' },
    ];
  }, [dashboard]);

  const alerts = useMemo(() => {
    if (!dashboard) return [];
    const a = dashboard.alerts;
    return [
      { label: 'Pending Approvals', value: a.pending_approvals, severity: a.pending_approvals > 0 ? 'High' : 'Clear', className: a.pending_approvals > 0 ? styles.alertDanger : '' },
      { label: 'Payment Unverified', value: a.pending_payments, severity: a.pending_payments > 0 ? 'Medium' : 'Clear', className: a.pending_payments > 0 ? styles.alertWarning : '' },
      { label: 'Plans Expiring', value: a.expiring_plans, severity: a.expiring_plans > 0 ? 'Soon' : 'Clear', className: a.expiring_plans > 0 ? styles.alertSuccess : '' },
    ];
  }, [dashboard]);

  const signups = useMemo(() => {
    if (!dashboard?.recent_signups) return [];
    return dashboard.recent_signups.slice(0, 5).map((s) => ({
      ...s,
      time: timeAgo(s.created_at),
    }));
  }, [dashboard]);

  const getProgressColor = (val: number) => {
    if (val >= 70) return '#22c55e';
    if (val >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const getProgressGradient = (val: number) => {
    if (val >= 70) return 'linear-gradient(90deg, #22c55e, #16a34a)';
    if (val >= 40) return 'linear-gradient(90deg, #f59e0b, #d97706)';
    return 'linear-gradient(90deg, #ef4444, #dc2626)';
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/${locale}/login`);
    }
  }, [loading, locale, router, user]);

  if (loading) {
    return (
      <main className={`${adminFont.variable} ${styles.shell}`}>
        <div className={styles.loading}><div className={styles.loader} /></div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <div className={`${adminFont.variable} ${styles.shell}`}>
      <div className={styles.content}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>{greeting}, {user?.name || 'Super Admin'}</h1>
            <div className={styles.headerMeta}>
              <span className={styles.headerDate}>{currentDate}</span>
              <span className={styles.headerDot} />
              <span className={styles.headerLive}>
                <span className={styles.liveDot} />
                {dashboardLoading ? 'Syncing' : 'System Live'}
              </span>
              <span className={styles.headerDot} />
              <span className={styles.headerRole}>
                <ShieldCheck size={12} />
                Super Admin
              </span>
            </div>
          </div>
          <Link href={`/${locale}/admin/schools`} className={styles.headerSchoolBtn}>
            <Building2 size={16} />
            Schools
          </Link>
        </header>

        {dashboardError && (
          <div className={styles.prompt}>
            <div className={styles.promptIcon}><AlertTriangle size={28} /></div>
            <p className={styles.promptTitle}>Dashboard Error</p>
            <p className={styles.promptText}>{(dashboardError as Error).message}</p>
          </div>
        )}

        {!dashboardError && (
          <>
            {/* KPI Grid */}
            <section className={styles.kpiGrid}>
              {kpiValues.map((k, i) => (
                <motion.div
                  key={k.label}
                  className={styles.kpiCard}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.35 }}
                >
                  <div className={styles.kpiTop}>
                    <div className={styles.kpiIcon}>
                      <k.icon size={17} />
                    </div>
                    <span className={styles.kpiChange}>{dashboardLoading ? '...' : k.change}</span>
                  </div>
                  <p className={styles.kpiLabel}>{k.label}</p>
                  <h2 className={styles.kpiValue}>{dashboardLoading ? '...' : k.value}</h2>
                </motion.div>
              ))}
            </section>

            {/* Dashboard Grid */}
            <div className={styles.dashboardGrid}>
              <div className={styles.leftStack}>
                {/* Engagement Section */}
                <section className={styles.insightBox}>
                  <div className={styles.insightHeader}>
                    <Zap size={17} color="#12312f" />
                    <h3>Engagement</h3>
                    <span className={styles.insightCount}>Live</span>
                  </div>
                  <div className={styles.metricGrid}>
                    {engagementMetrics.map((m) => (
                      <div key={m.label} className={styles.metricCard}>
                        <p className={styles.metricValue} style={{ color: m.color }}>{dashboardLoading ? '...' : m.value}</p>
                        <p className={styles.metricLabel}>{m.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className={styles.progressList}>
                    {progressBars.map((p) => {
                      const pc = getProgressColor(p.value);
                      const pg = getProgressGradient(p.value);
                      return (
                        <div key={p.label} className={styles.progressRow}>
                          <span className={styles.progressLabel}>{p.label}</span>
                          <div className={styles.progressTrack}>
                            <div className={styles.progressFill} style={{ width: `${p.value}%`, background: pg }} />
                          </div>
                          <span className={styles.progressPerc} style={{ color: pc }}>{p.value}%</span>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Recent Signups */}
                <section className={styles.insightBox}>
                  <div className={styles.insightHeader}>
                    <Users size={17} color="#2563eb" />
                    <h3>Recent Signups</h3>
                    {dashboard && (
                      <span className={styles.insightCount}>{dashboard.recent_signups.length} entries</span>
                    )}
                  </div>
                  <div className={styles.signupList}>
                    {signups.length === 0 && (
                      <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', margin: 0, textAlign: 'center', padding: '0.5rem 0' }}>
                        No recent entries
                      </p>
                    )}
                    {signups.map((signup) => (
                      <div key={`${signup.name}-${signup.created_at}`} className={styles.signupRow}>
                        <div className={styles.signupAvatar} style={{ background: getAvatarGradient(signup.name) }}>
                          {signup.name.charAt(0)}
                        </div>
                        <div className={styles.signupInfo}>
                          <p className={styles.signupName}>{signup.name}</p>
                          <p className={styles.signupMeta}>{signup.role} &middot; {signup.time}</p>
                        </div>
                        <span className={styles.signupBadge}>{signup.status}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className={styles.rightStack}>
                {/* Alerts */}
                <section className={styles.insightBox}>
                  <div className={styles.insightHeader}>
                    <AlertTriangle size={17} color="#ea580c" />
                    <h3>Alerts</h3>
                    <span className={styles.insightCount}>
                      {alerts.reduce((sum, a) => sum + (a.value > 0 ? 1 : 0), 0)} active
                    </span>
                  </div>
                  <div className={styles.alertList}>
                    {alerts.map((alert) => (
                      <div key={alert.label} className={`${styles.alertRow} ${alert.className}`}>
                        <div className={styles.alertInfo}>
                          <p className={styles.alertName}>{alert.label}</p>
                          <p className={styles.alertMeta}>{alert.severity}</p>
                        </div>
                        <span className={styles.alertCount}>{dashboardLoading ? '...' : alert.value}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Pending Approvals */}
                <section className={styles.insightBox}>
                  <div className={styles.insightHeader}>
                    <UserPlus size={17} color="#ea580c" />
                    <h3>Pending Approvals</h3>
                    <span className={styles.insightCount}>{pendingRegs?.length || 0} pending</span>
                  </div>
                  {pendingRegs && pendingRegs.length > 0 ? (
                    <div className={styles.approvalList}>
                      {pendingRegs.slice(0, 5).map((item: any) => (
                        <Link key={item.id} href={`/${locale}/admin/pending-registrations`} className={styles.approvalRow} style={{ textDecoration: 'none', cursor: 'pointer' }}>
                          <div className={styles.approvalAvatar} style={{ background: getAvatarGradient(item.parent_name) }}>
                            {item.parent_name.charAt(0)}
                          </div>
                          <div className={styles.approvalInfo}>
                            <p className={styles.approvalName}>{item.parent_name}</p>
                            <p className={styles.approvalMeta}>{item.child_name} &middot; {item.grade || 'N/A'} &middot; {timeAgo(item.created_at)}</p>
                          </div>
                          <div style={{ color: '#3b82f6', fontSize: '0.6rem', fontWeight: 900 }}>
                            Review →
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', margin: 0, textAlign: 'center', padding: '0.5rem 0' }}>
                      All clear — no pending approvals
                    </p>
                  )}
                </section>

              </div>
            </div>
          </>
        )}

        <div className={styles.bottomPad} />
      </div>
    </div>
  );
}
