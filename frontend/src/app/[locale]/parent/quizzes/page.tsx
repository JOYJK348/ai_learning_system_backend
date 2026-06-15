'use client';

import { Manrope } from 'next/font/google';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BookOpen, Clock, TrendingUp, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { parentApi } from '@/core/services/parentApi';
import { parentKeys } from '@/core/constants/queryKeys';
import styles from './page.module.css';

const adminFont = Manrope({
  subsets: ['latin'],
  variable: '--admin-font',
  display: 'swap',
});

function formatNumber(v: number) { return new Intl.NumberFormat('en-IN').format(v || 0); }

export default function QuizzesPage() {
  const [activeChildId, setActiveChildId] = useState<string | null>(null);

  const { data: childrenData } = useQuery({
    queryKey: parentKeys.children,
    queryFn: parentApi.children,
    staleTime: 5 * 60 * 1000,
  });
  const children = childrenData?.children ?? [];

  useEffect(() => {
    if (!activeChildId && children.length > 0) setActiveChildId(children[0].id);
  }, [children, activeChildId]);

  const { data: quizzesData, isLoading } = useQuery({
    queryKey: parentKeys.childQuizzes(activeChildId ?? ''),
    queryFn: () => parentApi.childQuizzes(activeChildId!),
    enabled: !!activeChildId,
    staleTime: 60_000,
  });

  const quizzes = quizzesData?.quizzes ?? [];
  const passedCount = quizzes.filter((q: any) => q.passed).length;
  const avgScore = quizzes.length > 0 ? Math.round(quizzes.reduce((s: number, q: any) => s + q.percentage, 0) / quizzes.length) : 0;

  return (
    <div className={`${adminFont.variable} ${styles.shell}`}>
      <div className={styles.content}>
        <header className={styles.header}>
          <h1 className={styles.title}>Quiz History</h1>
          <div className={styles.headerMeta}>
            <span className={styles.headerStat}>{formatNumber(quizzes.length)} total</span>
            <span className={styles.headerDot} />
            <span className={styles.headerStat}>{formatNumber(passedCount)} passed</span>
            <span className={styles.headerDot} />
            <span className={styles.headerStat}>{avgScore}% avg</span>
          </div>
        </header>

        <div className={styles.kpiGrid}>
          <motion.div className={styles.kpiCard} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
            <p className={styles.kpiLabel}>Total Attempts</p>
            <h2 className={styles.kpiValue}>{formatNumber(quizzes.length)}</h2>
          </motion.div>
          <motion.div className={styles.kpiCard} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}>
            <p className={styles.kpiLabel}>Passed</p>
            <h2 className={styles.kpiValue} style={{ color: '#16a34a' }}>{formatNumber(passedCount)}</h2>
          </motion.div>
          <motion.div className={styles.kpiCard} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
            <p className={styles.kpiLabel}>Failed</p>
            <h2 className={styles.kpiValue} style={{ color: '#dc2626' }}>{formatNumber(quizzes.length - passedCount)}</h2>
          </motion.div>
          <motion.div className={styles.kpiCard} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.21 }}>
            <p className={styles.kpiLabel}>Avg Score</p>
            <h2 className={styles.kpiValue}>{avgScore}%</h2>
          </motion.div>
        </div>

        <section className={styles.insightBox}>
          <div className={styles.insightHeader}>
            <BookOpen size={17} color="#12312f" />
            <h3>All Quiz Attempts</h3>
            <span className={styles.insightCount}>{quizzes.length} records</span>
          </div>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontWeight: 700 }}>Loading...</div>
          ) : quizzes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontWeight: 700 }}>
              <BookOpen size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
              <p>No quiz attempts yet</p>
            </div>
          ) : (
            <div className={styles.quizList}>
              {quizzes.map((q: any, i: number) => {
                const passed = q.percentage >= 60;
                return (
                  <motion.div
                    key={q.id || i}
                    className={styles.quizRow}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <div className={`${styles.quizIcon} ${passed ? styles.quizIconPassed : styles.quizIconFailed}`}>
                      {passed ? <CheckCircle2 size={16} /> : <X size={16} />}
                    </div>
                    <div className={styles.quizInfo}>
                      <p className={styles.quizName}>Quiz #{q.attempt_number}</p>
                      <p className={styles.quizMeta}>
                        {new Date(q.completed_at || q.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' · '}
                        {q.time_taken_seconds ? Math.round(q.time_taken_seconds / 60) + ' min' : 'N/A'}
                      </p>
                    </div>
                    <div className={styles.quizProgress}>
                      <div
                        className={styles.quizProgressFill}
                        style={{ width: `${q.percentage}%`, background: passed ? '#16a34a' : '#dc2626' }}
                      />
                    </div>
                    <div className={styles.quizScoreWrap}>
                      <span className={`${styles.quizScore} ${passed ? styles.quizPassed : styles.quizFailed}`}>
                        {q.score}/{q.max_score}
                      </span>
                      <span className={`${styles.quizBadge} ${passed ? styles.quizBadgePassed : styles.quizBadgeFailed}`}>
                        {passed ? 'Pass' : 'Fail'}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
