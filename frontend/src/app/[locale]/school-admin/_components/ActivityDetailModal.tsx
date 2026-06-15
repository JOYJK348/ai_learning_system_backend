'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, CheckCircle2, XCircle, BookOpen, BrainCircuit, GraduationCap,
  Hash, Clock3, User, Sparkles, Layers, Trophy,
} from 'lucide-react';
import { TimeAgo } from './TimeAgo';
import type { ActivityItem } from '@/hooks/useSchoolActivities';
import styles from './ActivityDetailModal.module.css';

type Props = {
  activity: ActivityItem | null;
  serverTime: string;
  open: boolean;
  onClose: () => void;
};

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
  lesson_complete: {
    icon: <CheckCircle2 size={16} />,
    label: 'Lesson Complete',
    color: '#22c55e',
    bg: 'linear-gradient(135deg, #d1fae5, #ecfdf5)',
  },
  quiz_pass: {
    icon: <Trophy size={16} />,
    label: 'Quiz Pass',
    color: '#3b82f6',
    bg: 'linear-gradient(135deg, #dbeafe, #eff6ff)',
  },
  quiz_fail: {
    icon: <XCircle size={16} />,
    label: 'Quiz Fail',
    color: '#ef4444',
    bg: 'linear-gradient(135deg, #fef2f2, #fff5f5)',
  },
};

function formatFullDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ActivityDetailModal({ activity, serverTime, open, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const config = activity ? TYPE_CONFIG[activity.type] : null;

  return (
    <AnimatePresence>
      {open && activity && (
        <>
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={styles.drawer}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            {/* Header */}
            <div className={styles.header}>
              <h2 className={styles.heading}>Activity Details</h2>
              <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className={styles.body}>
              {/* Type Badge */}
              <div className={styles.typeBadge} style={{ background: config?.bg, color: config?.color }}>
                {config?.icon}
                <span>{config?.label}</span>
              </div>

              {/* Student Profile */}
              <div className={styles.profile}>
                <div className={styles.avatarLarge} style={{ background: config?.color || '#12312f' }}>
                  {activity.student_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className={styles.name}>{activity.student_name}</p>
                  <div className={styles.profileMeta}>
                    <GraduationCap size={12} />
                    <span>{activity.grade_name}{activity.section ? ` · Section ${activity.section}` : ''}</span>
                  </div>
                </div>
              </div>

              {/* Detail Rows */}
              <div className={styles.detailSection}>
                <div className={styles.detailRow}>
                  <div className={styles.detailIcon}><BrainCircuit size={15} /></div>
                  <div>
                    <p className={styles.detailLabel}>Subject</p>
                    <p className={styles.detailValue}>{activity.subject || 'General'}</p>
                  </div>
                </div>
                <div className={styles.detailRow}>
                  <div className={styles.detailIcon}>
                    {activity.type === 'lesson_complete' ? <BookOpen size={15} /> : <Sparkles size={15} />}
                  </div>
                  <div>
                    <p className={styles.detailLabel}>
                      {activity.type === 'lesson_complete' ? 'Lesson' : 'Quiz'}
                    </p>
                    <p className={styles.detailValue}>{activity.title}</p>
                  </div>
                </div>
                {activity.score != null && activity.max_score != null && (
                  <div className={styles.detailRow}>
                    <div className={styles.detailIcon}><Trophy size={15} /></div>
                    <div>
                      <p className={styles.detailLabel}>Score</p>
                      <p className={styles.detailValue}>
                        <span
                          className={styles.scoreBadge}
                          style={{
                            background: activity.type === 'quiz_fail' ? '#fef2f2' : '#f0fdf4',
                            color: activity.type === 'quiz_fail' ? '#ef4444' : '#22c55e',
                          }}
                        >
                          {activity.score}/{activity.max_score}
                        </span>
                        <span className={styles.scorePerc}>
                          ({Math.round((activity.score / activity.max_score) * 100)}%)
                        </span>
                      </p>
                    </div>
                  </div>
                )}

              </div>

              {/* Timestamp */}
              <div className={styles.timestampSection}>
                <div className={styles.timestampRow}>
                  <Clock3 size={14} />
                  <span className={styles.timestampLabel}>Relative</span>
                  <span className={styles.timestampValue}>
                    <TimeAgo dateStr={activity.created_at} serverTime={serverTime} />
                  </span>
                </div>
                <div className={styles.timestampRow}>
                  <Clock3 size={14} />
                  <span className={styles.timestampLabel}>Full Date</span>
                  <span className={styles.timestampValue}>{formatFullDate(activity.created_at)}</span>
                </div>
              </div>

              {/* Grade/Section Info */}
              <div className={styles.infoBanner}>
                <Layers size={14} />
                <span>
                  This event is recorded under <strong>{activity.grade_name}</strong>
                  {activity.section ? `, Section ${activity.section}` : ''} for{' '}
                  <strong>{activity.student_name}</strong>.
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
