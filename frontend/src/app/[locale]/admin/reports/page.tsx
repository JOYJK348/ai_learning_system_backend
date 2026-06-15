'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Manrope } from 'next/font/google';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  Calendar,
  ChevronRight,
  Download,
  Filter,
  PieChart,
  TrendingUp,
  Users,
  School,
  BookOpen,
  Award,
  Clock,
  Activity,
  DollarSign,
  Target,
  Zap,
  Loader2,
  FileText,
  Printer,
  Share2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { adminKeys } from '@/core/constants/queryKeys';
import { adminApi } from '@/core/services/adminApi';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

const adminFont = Manrope({
  subsets: ['latin'],
  variable: '--admin-font',
  display: 'swap',
});

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? '';

type DateRange = '7d' | '30d' | '90d' | '1y';

type RevenueData = {
  period: string;
  dates: string[];
  revenue: number[];
  paid: number[];
  summary: {
    total: number;
    average_daily: number;
    max_day: number;
    min_day: number;
    growth_percent: number;
  };
  plan_breakdown: Record<string, number>;
};

type UserData = {
  total_users: Record<string, number>;
  active_users: number;
  new_signups_30d: number;
  churned_users: number;
  churn_rate: number;
  dates: string[];
  daily_active: number[];
  plan_distribution: Record<string, number>;
};

type SchoolData = {
  total_schools: number;
  total_revenue: number;
  total_students: number;
  top_schools: SchoolItem[];
  all_schools: SchoolItem[];
};

type SchoolItem = {
  id: string;
  name: string;
  revenue: number;
  students: number;
  revenue_per_student: number;
  completion_rate: number;
  score: number;
};

type StudentData = {
  top_students: StudentItem[];
  subject_performance: SubjectItem[];
  total_students: number;
  avg_stars: number;
};

type StudentItem = {
  id: string;
  name: string;
  school: string;
  grade: string;
  stars: number;
  badges: number;
  streak: number;
  score: number;
};

type SubjectItem = {
  name: string;
  completion_rate: number;
  avg_score: number;
};

type EngagementData = {
  avg_session_minutes: number;
  completion_rate: number;
  avg_quiz_score: number;
  total_time_spent_hours: number;
  daily_activity: {
    dates: string[];
    activity: number[];
  };
  engagement_score: number;
};

type SubjectReportData = {
  subjects: SubjectReportItem[];
  avg_completion: number;
  total_subjects: number;
  on_track: number;
  needs_attention: number;
};

type SubjectReportItem = {
  id: string;
  name: string;
  grade: string;
  total_lessons: number;
  completed_lessons: number;
  completion_rate: number;
  avg_quiz_score: number;
  status: string;
};

export default function ReportsAdminPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const { user, loading } = useAuth();

  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [activeTab, setActiveTab] = useState('overview');
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/${locale}/login`);
    }
  }, [loading, locale, router, user]);

  const { data: reportsData, isLoading } = useQuery({
    queryKey: adminKeys.reports(dateRange),
    queryFn: () => adminApi.reports(dateRange),
    staleTime: 60_000,
    enabled: !!user,
  });

  const revenue = (reportsData?.revenue as RevenueData | null) ?? null;
  const userStats = (reportsData?.userStats as UserData | null) ?? null;
  const schoolStats = (reportsData?.schoolStats as SchoolData | null) ?? null;
  const studentStats = (reportsData?.studentStats as StudentData | null) ?? null;
  const engagement = (reportsData?.engagement as EngagementData | null) ?? null;
  const subjectStats = (reportsData?.subjectStats as SubjectReportData | null) ?? null;

  const showFeedback = (message: string) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(null), 3500);
  };

  const exportReport = (format: 'pdf' | 'csv' | 'excel') => {
    showFeedback(`Exporting ${format.toUpperCase()}...`);
    // TODO: Implement actual export
    setTimeout(() => showFeedback(`${format.toUpperCase()} exported!`), 1000);
  };

  const kpiCards = useMemo(() => {
    if (!revenue || !userStats || !engagement) return [];
    return [
      {
        label: 'Total Revenue',
        value: `₹${revenue.summary.total.toLocaleString()}`,
        change: `${revenue.summary.growth_percent > 0 ? '+' : ''}${revenue.summary.growth_percent}%`,
        up: revenue.summary.growth_percent >= 0,
        icon: DollarSign,
        color: 'green',
      },
      {
        label: 'Active Users',
        value: userStats.active_users.toLocaleString(),
        change: `${userStats.new_signups_30d} new`,
        up: true,
        icon: Users,
        color: 'blue',
      },
      {
        label: 'Engagement Score',
        value: `${engagement.engagement_score}/100`,
        change: `${engagement.completion_rate}% completion`,
        up: engagement.engagement_score > 50,
        icon: Target,
        color: 'purple',
      },
      {
        label: 'Avg Session',
        value: `${engagement.avg_session_minutes}m`,
        change: `${engagement.avg_quiz_score}% quiz avg`,
        up: engagement.avg_session_minutes > 10,
        icon: Clock,
        color: 'orange',
      },
    ];
  }, [revenue, userStats, engagement]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'revenue', label: 'Revenue', icon: DollarSign },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'schools', label: 'Schools', icon: School },
    { id: 'students', label: 'Students', icon: Award },
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
  ];

  const dateRanges: { value: DateRange; label: string }[] = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: '1y', label: 'Last Year' },
  ];

  return (
    <main className={`${adminFont.variable} ${styles.shell}`}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Analytics</p>
          <h1 className={styles.title}>Reports & Insights</h1>
          <p className={styles.subtitle}>
            Data-driven decisions for your learning platform. Track revenue, engagement, and growth.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Link href={`/${locale}/admin`} className={styles.secondaryButton}>
            <ChevronRight size={16} /> Back to dashboard
          </Link>
          <div className={styles.exportGroup}>
            <button className={styles.secondaryButton} onClick={() => exportReport('csv')}>
              <Download size={16} /> CSV
            </button>
            <button className={styles.secondaryButton} onClick={() => exportReport('excel')}>
              <FileText size={16} /> Excel
            </button>
            <button className={styles.secondaryButton} onClick={() => exportReport('pdf')}>
              <Printer size={16} /> PDF
            </button>
          </div>
        </div>
      </div>

      {/* Date Range & Tabs */}
      <div className={styles.controlsBar}>
        <div className={styles.dateRangeGroup}>
          {dateRanges.map((range) => (
            <button
              key={range.value}
              className={`${styles.rangeButton} ${dateRange === range.value ? styles.rangeActive : ''}`}
              onClick={() => setDateRange(range.value)}
            >
              {range.label}
            </button>
          ))}
        </div>
        <div className={styles.tabBar}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tabButton} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className={styles.loadingState}>
          <Loader2 size={40} className={styles.spinner} />
          <p>Loading analytics...</p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <section className={styles.kpiGrid}>
            {kpiCards.map((card, index) => (
              <article key={index} className={`${styles.kpiCard} ${styles[`kpi${card.color}`]}`}>
                <div className={styles.kpiIcon}>
                  <card.icon size={20} />
                </div>
                <div className={styles.kpiContent}>
                  <p className={styles.kpiLabel}>{card.label}</p>
                  <h2>{card.value}</h2>
                  <span className={`${styles.kpiChange} ${card.up ? styles.up : styles.down}`}>
                    {card.up ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                    {card.change}
                  </span>
                </div>
              </article>
            ))}
          </section>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className={styles.overviewGrid}>
              {/* Revenue Chart */}
              <section className={styles.chartPanel}>
                <div className={styles.chartHeader}>
                  <h3><TrendingUp size={18} /> Revenue Trend</h3>
                  <span className={styles.chartPeriod}>{dateRange}</span>
                </div>
                <div className={styles.chartBody}>
                  {revenue && (
                    <div className={styles.barChart}>
                      {revenue.dates.map((date, i) => (
                        <div key={date} className={styles.barGroup}>
                          <div className={styles.barStack}>
                            <div
                              className={styles.barPaid}
                              style={{ height: `${(revenue.paid[i] / Math.max(...revenue.revenue)) * 100}%` }}
                            />
                            <div
                              className={styles.barFree}
                              style={{ height: `${((revenue.revenue[i] - revenue.paid[i]) / Math.max(...revenue.revenue)) * 100}%` }}
                            />
                          </div>
                          <span className={styles.barLabel}>{date.slice(5)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* User Growth */}
              <section className={styles.chartPanel}>
                <div className={styles.chartHeader}>
                  <h3><Users size={18} /> Daily Active Users</h3>
                </div>
                <div className={styles.chartBody}>
                  {userStats && (
                    <div className={styles.lineChart}>
                      {userStats.daily_active.map((val, i) => (
                        <div key={i} className={styles.linePoint} style={{ left: `${(i / 29) * 100}%`, bottom: `${(val / Math.max(...userStats.daily_active)) * 100}%` }}>
                          <div className={styles.lineDot} />
                        </div>
                      ))}
                      <svg className={styles.lineSvg} viewBox="0 0 100 100" preserveAspectRatio="none">
                        <polyline
                          fill="none"
                          stroke="#16a085"
                          strokeWidth="2"
                          points={userStats.daily_active.map((val, i) => `${(i / 29) * 100},${100 - (val / Math.max(...userStats.daily_active)) * 100}`).join(' ')}
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </section>

              {/* Plan Distribution */}
              <section className={styles.chartPanel}>
                <div className={styles.chartHeader}>
                  <h3><PieChart size={18} /> Plan Distribution</h3>
                </div>
                <div className={styles.chartBody}>
                  {userStats && (
                    <div className={styles.donutChart}>
                      {Object.entries(userStats.plan_distribution).map(([plan, count], i, arr) => {
                        const total = Object.values(userStats.plan_distribution).reduce((a, b) => a + b, 0);
                        const pct = total > 0 ? (count / total) * 100 : 0;
                        const colors = ['#16a085', '#8b5cf6', '#f59e0b', '#ef4444'];
                        return (
                          <div key={plan} className={styles.donutSegment} style={{ '--pct': pct, '--color': colors[i % colors.length] } as any}>
                            <span className={styles.donutLabel}>{plan}: {Math.round(pct)}%</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>

              {/* Top Schools */}
              <section className={styles.tablePanel}>
                <div className={styles.chartHeader}>
                  <h3><School size={18} /> Top Schools</h3>
                </div>
                <div className={styles.tableBody}>
                  {schoolStats && (
                    <table className={styles.miniTable}>
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>School</th>
                          <th>Revenue</th>
                          <th>Students</th>
                          <th>Completion</th>
                        </tr>
                      </thead>
                      <tbody>
                        {schoolStats.top_schools.slice(0, 5).map((school, i) => (
                          <tr key={school.id}>
                            <td>
                              <span className={`${styles.rankBadge} ${i < 3 ? styles.topRank : ''}`}>
                                {i + 1}
                              </span>
                            </td>
                            <td>{school.name}</td>
                            <td>₹{school.revenue.toLocaleString()}</td>
                            <td>{school.students}</td>
                            <td>
                              <div className={styles.miniBar}>
                                <div className={styles.miniFill} style={{ width: `${school.completion_rate}%` }} />
                                <span>{school.completion_rate}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </section>

              {/* Top Students */}
              <section className={styles.tablePanel}>
                <div className={styles.chartHeader}>
                  <h3><Award size={18} /> Top Students</h3>
                </div>
                <div className={styles.tableBody}>
                  {studentStats && (
                    <table className={styles.miniTable}>
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Student</th>
                          <th>School</th>
                          <th>Stars</th>
                          <th>Streak</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentStats.top_students.slice(0, 5).map((student, i) => (
                          <tr key={student.id}>
                            <td>
                              <span className={`${styles.rankBadge} ${i < 3 ? styles.topRank : ''}`}>
                                {i + 1}
                              </span>
                            </td>
                            <td>{student.name}</td>
                            <td>{student.school}</td>
                            <td>
                              <span className={styles.starBadge}>⭐ {student.stars}</span>
                            </td>
                            <td>
                              <span className={styles.streakBadge}>🔥 {student.streak}d</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </section>

              {/* Subject Performance */}
              <section className={styles.chartPanel}>
                <div className={styles.chartHeader}>
                  <h3><BookOpen size={18} /> Subject Performance</h3>
                </div>
                <div className={styles.chartBody}>
                  {subjectStats && (
                    <div className={styles.subjectBars}>
                      {subjectStats.subjects.slice(0, 6).map((subject) => (
                        <div key={subject.id} className={styles.subjectBar}>
                          <div className={styles.subjectHeader}>
                            <span>{subject.name}</span>
                            <span>{subject.completion_rate}%</span>
                          </div>
                          <div className={styles.subjectTrack}>
                            <div
                              className={`${styles.subjectFill} ${subject.status === 'on_track' ? styles.onTrack : styles.needsAttention}`}
                              style={{ width: `${subject.completion_rate}%` }}
                            />
                          </div>
                          <span className={styles.subjectMeta}>Avg Score: {subject.avg_quiz_score}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'revenue' && (
            <div className={styles.detailTab}>
              <h2>Revenue Details</h2>
              {revenue && (
                <div className={styles.detailGrid}>
                  <div className={styles.detailCard}>
                    <h3>Summary</h3>
                    <div className={styles.detailRow}>
                      <span>Total Revenue</span>
                      <strong>₹{revenue.summary.total.toLocaleString()}</strong>
                    </div>
                    <div className={styles.detailRow}>
                      <span>Average Daily</span>
                      <strong>₹{revenue.summary.average_daily.toLocaleString()}</strong>
                    </div>
                    <div className={styles.detailRow}>
                      <span>Best Day</span>
                      <strong>₹{revenue.summary.max_day.toLocaleString()}</strong>
                    </div>
                    <div className={styles.detailRow}>
                      <span>Growth</span>
                      <strong className={revenue.summary.growth_percent >= 0 ? styles.up : styles.down}>
                        {revenue.summary.growth_percent > 0 ? '+' : ''}{revenue.summary.growth_percent}%
                      </strong>
                    </div>
                  </div>
                  <div className={styles.detailCard}>
                    <h3>Plan Breakdown</h3>
                    {Object.entries(revenue.plan_breakdown).map(([plan, amount]) => (
                      <div key={plan} className={styles.detailRow}>
                        <span className={styles.planLabel}>{plan}</span>
                        <strong>₹{(amount as number).toLocaleString()}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className={styles.detailTab}>
              <h2>User Analytics</h2>
              {userStats && (
                <div className={styles.detailGrid}>
                  <div className={styles.detailCard}>
                    <h3>User Distribution</h3>
                    {Object.entries(userStats.total_users).map(([role, count]) => (
                      <div key={role} className={styles.detailRow}>
                        <span>{role}</span>
                        <strong>{count}</strong>
                      </div>
                    ))}
                  </div>
                  <div className={styles.detailCard}>
                    <h3>Key Metrics</h3>
                    <div className={styles.detailRow}>
                      <span>Active Users (30d)</span>
                      <strong>{userStats.active_users}</strong>
                    </div>
                    <div className={styles.detailRow}>
                      <span>New Signups</span>
                      <strong className={styles.up}>{userStats.new_signups_30d}</strong>
                    </div>
                    <div className={styles.detailRow}>
                      <span>Churned Users</span>
                      <strong className={styles.down}>{userStats.churned_users}</strong>
                    </div>
                    <div className={styles.detailRow}>
                      <span>Churn Rate</span>
                      <strong>{userStats.churn_rate}%</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'schools' && (
            <div className={styles.detailTab}>
              <h2>School Performance</h2>
              {schoolStats && (
                <div className={styles.fullTable}>
                  <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>School</th>
                        <th>Revenue</th>
                        <th>Students</th>
                        <th>Revenue/Student</th>
                        <th>Completion</th>
                        <th>Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schoolStats.all_schools.map((school, i) => (
                        <tr key={school.id}>
                          <td>{i + 1}</td>
                          <td>{school.name}</td>
                          <td>₹{school.revenue.toLocaleString()}</td>
                          <td>{school.students}</td>
                          <td>₹{school.revenue_per_student}</td>
                          <td>
                            <div className={styles.tableBar}>
                              <div className={styles.tableFill} style={{ width: `${school.completion_rate}%` }} />
                              <span>{school.completion_rate}%</span>
                            </div>
                          </td>
                          <td>
                            <span className={styles.scoreBadge}>{school.score}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'students' && (
            <div className={styles.detailTab}>
              <h2>Student Leaderboard</h2>
              {studentStats && (
                <div className={styles.fullTable}>
                  <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Student</th>
                        <th>School</th>
                        <th>Grade</th>
                        <th>Stars</th>
                        <th>Badges</th>
                        <th>Streak</th>
                        <th>Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentStats.top_students.map((student, i) => (
                        <tr key={student.id}>
                          <td>
                            <span className={`${styles.rankBadge} ${i < 3 ? styles.topRank : ''}`}>
                              {i + 1}
                            </span>
                          </td>
                          <td>{student.name}</td>
                          <td>{student.school}</td>
                          <td>{student.grade}</td>
                          <td>⭐ {student.stars}</td>
                          <td>🏆 {student.badges}</td>
                          <td>🔥 {student.streak}d</td>
                          <td>
                            <span className={styles.scoreBadge}>{student.score}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'subjects' && (
            <div className={styles.detailTab}>
              <h2>Subject Analytics</h2>
              {subjectStats && (
                <>
                  <div className={styles.summaryCards}>
                    <div className={styles.summaryCard}>
                      <span>Avg Completion</span>
                      <strong>{subjectStats.avg_completion}%</strong>
                    </div>
                    <div className={styles.summaryCard}>
                      <span>On Track</span>
                      <strong className={styles.up}>{subjectStats.on_track}</strong>
                    </div>
                    <div className={styles.summaryCard}>
                      <span>Needs Attention</span>
                      <strong className={styles.down}>{subjectStats.needs_attention}</strong>
                    </div>
                  </div>
                  <div className={styles.fullTable}>
                    <table className={styles.dataTable}>
                      <thead>
                        <tr>
                          <th>Subject</th>
                          <th>Grade</th>
                          <th>Lessons</th>
                          <th>Completed</th>
                          <th>Completion</th>
                          <th>Avg Score</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjectStats.subjects.map((subject) => (
                          <tr key={subject.id}>
                            <td>{subject.name}</td>
                            <td>{subject.grade}</td>
                            <td>{subject.total_lessons}</td>
                            <td>{subject.completed_lessons}</td>
                            <td>
                              <div className={styles.tableBar}>
                                <div
                                  className={`${styles.tableFill} ${subject.status === 'on_track' ? styles.onTrack : styles.needsAttention}`}
                                  style={{ width: `${subject.completion_rate}%` }}
                                />
                                <span>{subject.completion_rate}%</span>
                              </div>
                            </td>
                            <td>{subject.avg_quiz_score}%</td>
                            <td>
                              <span className={`${styles.statusPill} ${subject.status === 'on_track' ? styles.pillSuccess : styles.pillWarning}`}>
                                {subject.status === 'on_track' ? '✅ On Track' : '⚠️ Needs Attention'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* Toast */}
      {feedback && <div className={styles.toast}>{feedback}</div>}
    </main>
  );
}
