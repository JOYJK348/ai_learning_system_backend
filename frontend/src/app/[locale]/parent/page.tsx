'use client';

import React, { useState, useEffect } from 'react';
import { Manrope } from 'next/font/google';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen, Clock, TrendingUp, Users, Zap, Award,
} from 'lucide-react';
import { parentApi } from '@/core/services/parentApi';
import { parentKeys } from '@/core/constants/queryKeys';
import dynamic from 'next/dynamic';
import styles from './page.module.css';

const adminFont = Manrope({
  subsets: ['latin'],
  variable: '--admin-font',
  display: 'swap',
});

const ChapterProgressSection = dynamic(() => import('./ChapterProgressSection'), { ssr: false });

function formatNumber(v: number) { return new Intl.NumberFormat('en-IN').format(v || 0); }

export default function ParentDashboard() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [chatMsg, setChatMsg] = useState('');

  const { data: meRaw } = useQuery({
    queryKey: parentKeys.me, queryFn: parentApi.me, staleTime: 5 * 60 * 1000,
  });
  const parentProfile = (meRaw as any)?.parent ?? null;

  const { data: childrenData } = useQuery({
    queryKey: parentKeys.children, queryFn: parentApi.children, staleTime: 5 * 60 * 1000,
  });

  const children = childrenData?.children ?? [];
  const [activeChildId, setActiveChildId] = useState<string | null>(null);

  if (!activeChildId && children.length > 0 && !activeChildId) {
    // Will set on next render via effect
  }
  useEffect(() => {
    if (!activeChildId && children.length > 0) setActiveChildId(children[0].id);
  }, [children, activeChildId]);

  const activeChild = children.find((c: any) => c.id === activeChildId) ?? null;

  const { data: progressData } = useQuery({
    queryKey: parentKeys.childProgress(activeChildId ?? ''),
    queryFn: () => parentApi.childProgress(activeChildId!),
    enabled: !!activeChildId, staleTime: 60_000,
  });

  const { data: quizzesData } = useQuery({
    queryKey: parentKeys.childQuizzes(activeChildId ?? ''),
    queryFn: () => parentApi.childQuizzes(activeChildId!),
    enabled: !!activeChildId, staleTime: 60_000,
  });

  const { data: chapterData } = useQuery({
    queryKey: parentKeys.childChapterProgress(activeChildId ?? ''),
    queryFn: () => parentApi.childChapterProgress(activeChildId!),
    enabled: !!activeChildId, staleTime: 60_000,
  });

  const childProgress = progressData as any;
  const quizzes = quizzesData?.quizzes ?? [];
  const chapterProgress = Array.isArray(chapterData) ? chapterData : [];

  // KPI data for the active child
  const kpiItems = [
    { label: 'Lessons', value: formatNumber(childProgress?.lesson_progress?.completed_lessons ?? 0), change: `${childProgress?.lesson_progress?.completed_lessons || 0} completed`, icon: BookOpen },
    { label: 'Progress', value: `${childProgress?.lesson_progress?.average_completion ?? 0}%`, change: `${childProgress?.lesson_progress?.in_progress_lessons || 0} in progress`, icon: TrendingUp },
    { label: 'Stars', value: formatNumber(childProgress?.student?.total_stars ?? 0), change: `${childProgress?.student?.badges_earned || 0} badges`, icon: Award },
    { label: 'Streak', value: `${childProgress?.student?.current_streak_days ?? 0}d`, change: `${childProgress?.student?.current_streak_days || 0} day streak`, icon: Zap },
  ];

  // Subject progress for the metrics grid
  const subjectMetrics = chapterProgress.length > 0
    ? chapterProgress.map((s: any) => {
        const completed = s.chapters.filter((c: any) => c.is_complete).length;
        const total = s.chapters.length;
        return { label: s.name, value: `${completed}/${total}`, pct: total > 0 ? Math.round((completed / total) * 100) : 0 };
      }).slice(0, 3)
    : [];

  const recentQuizzes = quizzes.slice(0, 5);

  return (
    <div className={`${adminFont.variable} ${styles.shell}`}>
      <div className={styles.content}>
        {/* KPI Grid */}
        <section className={styles.kpiGrid}>
          {kpiItems.map((k, i) => (
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
                <span className={styles.kpiChange}>{k.change}</span>
              </div>
              <p className={styles.kpiLabel}>{k.label}</p>
              <h2 className={styles.kpiValue}>{k.value}</h2>
            </motion.div>
          ))}
        </section>

        {/* Dashboard Grid */}
        <div className={styles.dashboardGrid}>
          <div className={styles.leftStack}>
            {/* Subject Progress */}
            {subjectMetrics.length > 0 && (
              <section className={styles.insightBox}>
                <div className={styles.insightHeader}>
                  <BookOpen size={17} color="#12312f" />
                  <h3>Subject Progress</h3>
                  <span className={styles.insightCount}>{chapterProgress.length} subjects</span>
                </div>
                <div className={styles.metricGrid}>
                  {subjectMetrics.map((m: any) => (
                    <div key={m.label} className={styles.metricCard}>
                      <p className={styles.metricValue} style={{ color: '#12312f' }}>{m.value}</p>
                      <p className={styles.metricLabel}>{m.label}</p>
                    </div>
                  ))}
                </div>
                <div className={styles.progressList}>
                  {chapterProgress.map((s: any) => {
                    const completed = s.chapters.filter((c: any) => c.is_complete).length;
                    const total = s.chapters.length;
                    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                    const color = pct >= 70 ? '#16a34a' : pct >= 40 ? '#d97706' : '#dc2626';
                    return (
                      <div key={s.id} className={styles.progressRow}>
                        <span className={styles.progressLabel}>{s.name}</span>
                        <div className={styles.progressTrack}>
                          <div className={styles.progressFill} style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}dd)` }} />
                        </div>
                        <span className={styles.progressPerc} style={{ color }}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Weekly Activity Graph */}
            <section className={styles.insightBox}>
              <div className={styles.insightHeader}>
                <TrendingUp size={17} color="#2563eb" />
                <h3>This Week</h3>
                <span className={styles.insightCount}>Activity</span>
              </div>
              <div className={styles.activityGraph}>
                {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day, i) => {
                  const h = i === new Date().getDay() - 1 ? 80 : [45, 60, 30, 90, 20, 0, 0][i];
                  return (
                    <div key={day} className={styles.activityBar}>
                      <div className={styles.activityBarFill} style={{ height: `${h}%`, background: i === new Date().getDay() - 1 ? 'linear-gradient(180deg, #2563eb, #7c3aed)' : 'linear-gradient(180deg, #93c5fd, #60a5fa)' }} />
                      <span className={styles.activityLabel}>{day}</span>
                    </div>
                  );
                })}
              </div>
              <div className={styles.activityMeta}>
                <span>{childProgress?.student?.total_time_spent_seconds ? Math.round(childProgress.student.total_time_spent_seconds / 60) : 0}m this week</span>
                <span className={styles.activityDelta}>+12% vs last week</span>
              </div>
            </section>

            {/* Chapter Progress (full component) */}
            <ChapterProgressSection childId={activeChildId} />
          </div>

          <div className={styles.rightStack}>
            {/* Recent Quizzes */}
            <section className={styles.insightBox}>
              <div className={styles.insightHeader}>
                <BookOpen size={17} color="#ea580c" />
                <h3>Recent Quizzes</h3>
                <span className={styles.insightCount}>{recentQuizzes.length} attempts</span>
              </div>
              <div className={styles.quizList}>
                {recentQuizzes.length === 0 && (
                  <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textAlign: 'center', padding: '0.5rem 0' }}>No quizzes yet</p>
                )}
                {recentQuizzes.map((q: any, i: number) => {
                  const passed = q.percentage >= 60;
                  return (
                    <div key={q.id || i} className={styles.quizRow}>
                      <div className={styles.quizInfo}>
                        <p className={styles.quizName}>Quiz #{q.attempt_number}</p>
                        <p className={styles.quizMeta}>{passed ? 'Passed' : 'Needs Review'} &middot; {q.time_taken_seconds ? Math.round(q.time_taken_seconds / 60) + 'm' : ''}</p>
                      </div>
                      <div className={styles.quizProgress}>
                        <div className={styles.quizProgressFill} style={{ width: `${q.percentage}%`, background: passed ? '#16a34a' : '#dc2626' }} />
                      </div>
                      <span className={`${styles.quizScore} ${passed ? styles.quizPassed : styles.quizFailed}`}>{q.score}/{q.max_score}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Quick Stats */}
            <section className={styles.insightBox}>
              <div className={styles.insightHeader}>
                <Zap size={17} color="#2563eb" />
                <h3>Quick Stats</h3>
              </div>
              <div className={styles.metricGrid}>
                <div className={styles.metricCard}>
                  <p className={styles.metricValue} style={{ color: '#16a34a' }}>{childProgress?.student?.total_stars ?? 0}</p>
                  <p className={styles.metricLabel}>Stars</p>
                </div>
                <div className={styles.metricCard}>
                  <p className={styles.metricValue} style={{ color: '#2563eb' }}>{childProgress?.student?.current_streak_days ?? 0}d</p>
                  <p className={styles.metricLabel}>Streak</p>
                </div>
                <div className={styles.metricCard}>
                  <p className={styles.metricValue} style={{ color: '#7c3aed' }}>{childProgress?.student?.badges_earned ?? 0}</p>
                  <p className={styles.metricLabel}>Badges</p>
                </div>
              </div>
              <div className={styles.progressList}>
                <div className={styles.progressRow}>
                  <span className={styles.progressLabel}>Overall</span>
                  <div className={styles.progressTrack}>
                    <div className={styles.progressFill} style={{ width: `${childProgress?.student?.overall_progress ?? 0}%`, background: 'linear-gradient(90deg, #2563eb, #7c3aed)' }} />
                  </div>
                  <span className={styles.progressPerc} style={{ color: '#7c3aed' }}>{childProgress?.student?.overall_progress ?? 0}%</span>
                </div>
              </div>
            </section>

            {/* Hours Spent */}
            <section className={styles.insightBox}>
              <div className={styles.insightHeader}>
                <Clock size={17} color="#12312f" />
                <h3>Time Spent</h3>
              </div>
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <p style={{ fontSize: '2rem', fontWeight: 950, margin: 0, color: '#0f172a' }}>
                  {childProgress?.student?.total_time_spent_seconds ? Math.round(childProgress.student.total_time_spent_seconds / 3600) : 0}h
                </p>
                <p style={{ fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0.2rem 0 0' }}>
                  Total Learning Time
                </p>
              </div>
            </section>
          </div>
        </div>

        <div className={styles.bottomPad} />
      </div>
    </div>
  );
}
