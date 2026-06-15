'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Manrope } from 'next/font/google';
import {
  Users,
  GraduationCap,
  Brain,
  Zap,
  BookOpen,
  Clock,
  CheckCircle2,
  XCircle,
  Activity,
  Search,
  Filter,
  ArrowUpDown,
} from 'lucide-react';
import { useSchoolActivities } from '@/hooks/useSchoolActivities';
import { TimeAgo } from '../_components/TimeAgo';
import ActivityDetailModal from '../_components/ActivityDetailModal';
import type { ActivityItem } from '@/hooks/useSchoolActivities';
import styles from './page.module.css';

const adminFont = Manrope({
  subsets: ['latin'],
  variable: '--admin-font',
  display: 'swap',
});

const CONTAINER = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const ITEM = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  lesson_complete: <CheckCircle2 size={12} />,
  quiz_pass: <CheckCircle2 size={12} />,
  quiz_fail: <XCircle size={12} />,
};

const TYPE_LABELS: Record<string, string> = {
  lesson_complete: 'Lesson Complete',
  quiz_pass: 'Quiz Pass',
  quiz_fail: 'Quiz Fail',
};

function getGradeColor(pct: number) {
  return pct >= 70 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#ef4444';
}

export default function ActivitiesPage() {
  const { data, isLoading } = useSchoolActivities();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);

  const stats = useMemo(() => {
    if (!data) return [];
    const s = data.stats;
    return [
      { icon: Users, label: 'Total Students', value: s.total_students },
      { icon: Zap, label: 'Active Today', value: s.active_today },
      { icon: BookOpen, label: 'Lessons Done', value: s.total_lessons_completed },
      { icon: Brain, label: 'Avg Progress', value: `${s.avg_completion_rate}%` },
    ];
  }, [data]);

  const filterOptions = useMemo(() => {
    if (!data) return { grades: [] as string[], sections: [] as string[] };
    const gSet = new Set<string>();
    const sSet = new Set<string>();
    for (const g of data.grade_progress) {
      if (g.grade_name && g.grade_name !== 'Grade 2') gSet.add(g.grade_name);
    }
    for (const a of data.recent_activity) {
      if (a.section) sSet.add(a.section);
    }
    return {
      grades: Array.from(gSet).sort(),
      sections: Array.from(sSet).sort(),
    };
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    let list = [...data.recent_activity];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a) => a.student_name.toLowerCase().includes(q));
    }
    if (typeFilter) list = list.filter((a) => a.type === typeFilter);
    if (gradeFilter) list = list.filter((a) => a.grade_name === gradeFilter);
    if (sectionFilter) list = list.filter((a) => a.section === sectionFilter);
    list.sort((a, b) => {
      const t = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortDir === 'desc' ? -t : t;
    });
    return list;
  }, [data, search, typeFilter, gradeFilter, sectionFilter, sortDir]);

  const hasActiveFilters = search || typeFilter || gradeFilter || sectionFilter;

  if (isLoading) {
    return (
      <main className={`${adminFont.variable} ${styles.shell}`}>
        <div className={styles.loading}><div className={styles.loader} /></div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className={`${adminFont.variable} ${styles.shell}`}>
        <div className={styles.content}>
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Activities</h1>
              <p className={styles.subtitle}>Monitor student progress and engagement</p>
            </div>
          </div>
          <div className={styles.prompt}>
            <div className={styles.promptIcon}><Activity size={28} /></div>
            <p className={styles.promptTitle}>No activity data yet</p>
            <p className={styles.promptText}>Start adding students to see their activity</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={`${adminFont.variable} ${styles.shell}`}>
      <div className={styles.bgGlow} />
      <div className={styles.content}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Activities</h1>
            <p className={styles.subtitle}>Monitor student progress and engagement</p>
          </div>
        </div>

        {/* Stats */}
        <div className={styles.statsRow}>
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className={styles.statCard}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.3 }}
            >
              <div className={styles.statTop}>
                <div className={styles.statIcon}><stat.icon size={16} /></div>
              </div>
              <p className={styles.statValue}>{stat.value}</p>
              <p className={styles.statLabel}>{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Grade-wise Progress */}
        {data.grade_progress.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <GraduationCap size={16} className={styles.sectionIcon} />
              <h2 className={styles.sectionTitle}>Grade-wise Progress</h2>
              <span className={styles.sectionCount}>{data.grade_progress.length} grades</span>
            </div>
            <motion.div className={styles.gradeList} variants={CONTAINER} initial="hidden" animate="show">
              {data.grade_progress.map((g) => (
                <motion.div key={g.grade_name} className={styles.gradeRow} variants={ITEM}>
                  <div className={styles.gradeDot}>
                    {g.grade_name.replace('Grade ', 'G')}
                  </div>
                  <div className={styles.gradeInfo}>
                    <p className={styles.gradeName}>{g.grade_name}</p>
                    <p className={styles.gradeMeta}>{g.total_students} students · {g.completed_lessons} lessons</p>
                  </div>
                  <div className={styles.gradeBarWrapper}>
                    <div className={styles.gradeBarTrack}>
                      <div
                        className={styles.gradeBarFill}
                        style={{ width: `${g.avg_completion}%`, background: getGradeColor(g.avg_completion) }}
                      />
                    </div>
                  </div>
                  <span className={styles.gradePerc} style={{ color: getGradeColor(g.avg_completion) }}>
                    {g.avg_completion}%
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}

        {/* Recent Activity */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Activity size={16} className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>Recent Activity</h2>
            <div className={styles.headerActions}>
              <button
                type="button"
                className={`${styles.filterToggle} ${hasActiveFilters || showFilters ? styles.filterActive : ''}`}
                onClick={() => setShowFilters((v) => !v)}
                aria-label="Toggle filters"
              >
                <Filter size={14} />
                <span>{hasActiveFilters ? 'Filtered' : 'Filter'}</span>
              </button>
              <span className={styles.sectionCount}>{filtered.length} events</span>
            </div>
          </div>

          {(showFilters || hasActiveFilters || sortDir === 'asc') && (
            <div className={styles.filterBar}>
              <div className={styles.searchWrap}>
                <Search size={14} className={styles.searchIcon} />
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Search by student name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button type="button" className={styles.clearBtn} onClick={() => setSearch('')}>✕</button>
                )}
              </div>
              <div className={styles.filterRow}>
                <select
                  className={styles.typeSelect}
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="">All Types</option>
                  <option value="lesson_complete">Lesson Complete</option>
                  <option value="quiz_pass">Quiz Pass</option>
                  <option value="quiz_fail">Quiz Fail</option>
                </select>
                <select
                  className={styles.typeSelect}
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value)}
                >
                  <option value="">All Grades</option>
                  {filterOptions.grades.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                <select
                  className={styles.typeSelect}
                  value={sectionFilter}
                  onChange={(e) => setSectionFilter(e.target.value)}
                >
                  <option value="">All Sections</option>
                  {filterOptions.sections.map((s) => (
                    <option key={s} value={s}>Section {s}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className={styles.sortBtn}
                  onClick={() => setSortDir((d) => d === 'desc' ? 'asc' : 'desc')}
                  aria-label={`Sort ${sortDir === 'desc' ? 'ascending' : 'descending'}`}
                >
                  <ArrowUpDown size={13} />
                  <span>{sortDir === 'desc' ? 'Newest' : 'Oldest'}</span>
                </button>
              </div>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className={styles.prompt}>
              <div className={styles.promptIcon}><Clock size={24} /></div>
              <p className={styles.promptText}>
                {search || typeFilter ? 'No matching activity' : 'No recent activity'}
              </p>
            </div>
          ) : (
            <motion.div className={styles.feedList} variants={CONTAINER} initial="hidden" animate="show">
              {filtered.map((a) => (
                <motion.div
                  key={`${a.type}-${a.id}`}
                  className={styles.feedItem}
                  variants={ITEM}
                  onClick={() => setSelectedActivity(a)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') setSelectedActivity(a); }}
                >
                  <div
                    className={styles.feedDot}
                    style={{
                      background: a.type === 'lesson_complete' ? '#22c55e'
                        : a.type === 'quiz_pass' ? '#3b82f6' : '#ef4444',
                    }}
                  />
                  <div className={styles.feedContent}>
                    <p className={styles.feedStudent}>{a.student_name}</p>
                    <p className={styles.feedTitle}>
                      {a.type === 'lesson_complete' ? 'Completed lesson' : a.type === 'quiz_pass' ? 'Passed quiz' : 'Failed quiz'}
                      : {a.title}{a.subject ? ` · ${a.subject}` : ''}
                    </p>
                    <div className={styles.feedMeta}>
                      {a.score != null && a.max_score != null && (
                        <span
                          className={styles.feedScore}
                          style={{
                            background: a.type === 'quiz_fail' ? '#fef2f2' : '#f0fdf4',
                            color: a.type === 'quiz_fail' ? '#ef4444' : '#22c55e',
                          }}
                        >
                          {TYPE_ICON[a.type]}
                          {a.score}/{a.max_score}
                        </span>
                      )}
                      <span className={styles.feedTime}><TimeAgo dateStr={a.created_at} serverTime={data.server_time} /></span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        <div className={styles.bottomPad} />
      </div>

      <ActivityDetailModal
        activity={selectedActivity}
        serverTime={data?.server_time || ''}
        open={!!selectedActivity}
        onClose={() => setSelectedActivity(null)}
      />
    </main>
  );
}
