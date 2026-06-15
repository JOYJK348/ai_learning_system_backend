'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Manrope } from 'next/font/google';
import {
  GraduationCap,
  Users,
  Building2,
  Star,
  ChevronDown,
  Clock,
  BookOpen,
  CheckCircle2,
  Zap,
  AlertTriangle,
  Trophy,
  BarChart3,
  Plus,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSchoolStudents, useSchoolDashboard } from '@/hooks/useSchoolStudents';
import StudentDetailModal from './_components/StudentDetailModal';
import AddStudentModal from './_components/AddStudentModal';
import type { StudentDetail } from './_components/StudentDetailModal';
import styles from './page.module.css';

const adminFont = Manrope({
  subsets: ['latin'],
  variable: '--admin-font',
  display: 'swap',
});

type Kid = {
  id: string;
  student_id: string;
  full_name: string | null;
  grade_id: string | null;
  grade_name: string | null;
  section: string | null;
  roll_number: string | null;
  total_stars_earned: number;
  overall_progress: number;
  last_activity_at: string | null;
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
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function getAvatarGradient(name: string) {
  const g = AVATAR_GRADIENTS[hashName(name) % AVATAR_GRADIENTS.length];
  return `linear-gradient(135deg, ${g[0]}, ${g[1]})`;
}

const CONTAINER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.02 } },
};

const ROW_ITEM = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export default function SchoolAdminPage() {
  const { user } = useAuth();
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [detailStudent, setDetailStudent] = useState<StudentDetail | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: studentsRes, isLoading } = useSchoolStudents();
  const { data: dashboardRes } = useSchoolDashboard();

  const students: Kid[] = studentsRes?.data ?? [];
  const dashboard = dashboardRes?.data ?? {};

  const currentDate = useMemo(
    () => new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date()),
    [],
  );

  const grades = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => { if (s.grade_name) set.add(s.grade_name); });
    return Array.from(set).sort();
  }, [students]);

  const sections = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.grade_name === selectedGrade && s.section) set.add(s.section);
    });
    return Array.from(set).sort();
  }, [students, selectedGrade]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchGrade = !selectedGrade || s.grade_name === selectedGrade;
      const matchSection = !selectedSection || s.section === selectedSection;
      return matchGrade && matchSection;
    });
  }, [students, selectedGrade, selectedSection]);

  const activeToday = useMemo(
    () => students.filter((s) => s.last_activity_at && Date.now() - new Date(s.last_activity_at).getTime() < 24 * 60 * 60 * 1000).length,
    [students],
  );

  const totalStars = useMemo(() => students.reduce((sum, s) => sum + (s.total_stars_earned || 0), 0), [students]);

  const needsAttention = useMemo(() => {
    const now = Date.now();
    const week = 7 * 24 * 60 * 60 * 1000;
    return students
      .filter((s) => s.overall_progress < 30 || (s.last_activity_at && now - new Date(s.last_activity_at).getTime() > week))
      .sort((a, b) => a.overall_progress - b.overall_progress)
      .slice(0, 6);
  }, [students]);

  const topPerformers = useMemo(() => {
    return [...students].sort((a, b) => b.total_stars_earned - a.total_stars_earned).slice(0, 5);
  }, [students]);

  const classPulse = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    students.forEach((s) => {
      if (!s.grade_name) return;
      const cur = map.get(s.grade_name) ?? { total: 0, count: 0 };
      cur.total += s.overall_progress;
      cur.count += 1;
      map.set(s.grade_name, cur);
    });
    return Array.from(map.entries())
      .map(([name, v]) => ({ name, avg: Math.round(v.total / v.count), count: v.count }))
      .sort((a, b) => b.avg - a.avg);
  }, [students]);

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

  const kpiValues = [
    { label: 'Total Kids', value: dashboard?.my_school?.total_students ?? students.length, icon: GraduationCap, change: `${students.length} enrolled`, iconBg: 'var(--kpi1)' },
    { label: 'Classes', value: grades.length, icon: Building2, change: `${sections.length || '—'} sections`, iconBg: 'var(--kpi2)' },
    { label: 'Active Today', value: activeToday, icon: Activity, change: `${Math.round((activeToday / Math.max(students.length, 1)) * 100)}% rate`, iconBg: 'var(--kpi3)' },
    { label: 'Stars Given', value: totalStars, icon: Star, change: `${Math.round(totalStars / Math.max(students.length, 1))} avg`, iconBg: 'var(--kpi4)' },
  ];

  if (isLoading) {
    return (
      <main className={`${adminFont.variable} ${styles.shell}`}>
        <div className={styles.loading}>
          <div className={styles.loader} />
          <p>Loading school dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className={`${adminFont.variable} ${styles.shell}`}>
      <div className={styles.bgGlow} />
      <div className={styles.content}>
        {/* Header */}
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>School Command Center</h1>
            <p className={styles.subtitle}>Every child, every class, one view</p>
          </div>
          <div className={styles.headerRight}>
            <button type="button" className={styles.addBtn} onClick={() => setShowAddModal(true)}>
              <Plus size={16} />
              <span>Add Student</span>
            </button>
            <div className={styles.schoolBadge}>
              <Building2 size={15} />
              {dashboard?.my_school?.name || 'Your School'}
            </div>
          </div>
        </header>

        {/* Control Strip */}
        <div className={styles.controlStrip}>
          <div className={styles.pill}><Clock size={13} />{currentDate}</div>
          <div className={`${styles.pill} ${styles.pillLive}`}>
            <span className={styles.liveDot} />
            Live
          </div>
          <div className={styles.pill}>{students.length} students · {grades.length} grades</div>
        </div>

        {/* KPI Grid */}
        <section className={styles.kpiGrid}>
          {kpiValues.map((k, i) => (
            <motion.div
              key={k.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.35 }}
              className={styles.kpiCard}
            >
              <div className={styles.kpiTop}>
                <div className={styles.kpiIcon} style={{ background: k.iconBg }}>
                  <k.icon size={18} />
                </div>
                <span className={styles.kpiChange}>{k.change}</span>
              </div>
              <p className={styles.kpiLabel}>{k.label}</p>
              <h2 className={styles.kpiValue}>{typeof k.value === 'number' ? k.value.toLocaleString('en-IN') : k.value}</h2>
            </motion.div>
          ))}
        </section>

        {/* Quick Access */}
        <section className={styles.quickAccess}>
          <div className={styles.qaHeader}>
            <Zap size={17} className={styles.qaIcon} />
            <h3>Quick Access</h3>
            <button type="button" className={styles.addBtnSmall} onClick={() => setShowAddModal(true)}>
              <Plus size={14} />
              <span>Add Student</span>
            </button>
          </div>
          <div className={styles.qaRow}>
            <div className={styles.selectGroup}>
              <label className={styles.selectLabel}>Grade</label>
              <div className={styles.selectWrap}>
                <select value={selectedGrade} onChange={(e) => { setSelectedGrade(e.target.value); setSelectedSection(''); }} className={styles.select}>
                  <option value="">Select Grade</option>
                  {grades.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
                <ChevronDown size={16} className={styles.chevron} />
              </div>
            </div>
            <div className={styles.selectGroup}>
              <label className={styles.selectLabel}>Section</label>
              <div className={styles.selectWrap}>
                <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} className={styles.select} disabled={!selectedGrade}>
                  <option value="">Select Section</option>
                  {sections.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown size={16} className={styles.chevron} />
              </div>
            </div>
            <div className={styles.qaMeta}>
              <BookOpen size={14} />
              <span>{filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </section>

        {/* Student Table */}
        {selectedGrade && selectedSection ? (
          <section className={styles.studentList}>
            <div className={styles.listHeader}>
              <span>Student</span>
              <span>Progress</span>
              <span>Stars</span>
              <span>Status</span>
            </div>
            <motion.div variants={CONTAINER} initial="hidden" animate="show">
              {filteredStudents.map((s) => {
                const isOnline = s.last_activity_at
                  ? Date.now() - new Date(s.last_activity_at).getTime() < 30 * 60 * 1000
                  : false;
                const pc = getProgressColor(s.overall_progress);
                const pg = getProgressGradient(s.overall_progress);
                return (
                  <motion.div
                    key={s.id}
                    variants={ROW_ITEM}
                    className={styles.studentRow}
                    onClick={() => setDetailStudent(s as StudentDetail)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDetailStudent(s as StudentDetail); } }}
                  >
                    <div className={styles.studentInfo}>
                      <div className={styles.avatar} style={{ background: getAvatarGradient(s.full_name ?? '') }}>
                        {(s.full_name ?? '?').charAt(0)}
                      </div>
                      <div>
                        <p className={styles.studentName}>{s.full_name}</p>
                        <p className={styles.studentMeta}>
                          <span className={styles.gradePill}>{s.grade_name}</span>
                          <span className={styles.dot}>·</span>
                          {s.section}
                        </p>
                      </div>
                    </div>
                    <div className={styles.progressCol}>
                      <div className={styles.bar}>
                        <div className={styles.fill} style={{ width: `${s.overall_progress}%`, background: pg }} />
                      </div>
                      <span className={styles.perc} style={{ color: pc }}>{s.overall_progress}%</span>
                    </div>
                    <div className={styles.starsCol}>
                      <Star size={13} fill="#f59e0b" color="#f59e0b" />
                      <span>{s.total_stars_earned}</span>
                    </div>
                    <div className={styles.statusCol}>
                      <span className={`${styles.statusBadge} ${isOnline ? styles.onlineBadge : ''}`}>
                        <span className={styles.statusDot} />
                        {isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </section>
        ) : (
          <div className={styles.prompt}>
            <div className={styles.promptIcon}>
              <CheckCircle2 size={28} />
            </div>
            <p>Select a grade and section to view students</p>
          </div>
        )}

        {/* Needs Attention */}
        {needsAttention.length > 0 && (
          <section className={styles.insightBox}>
            <div className={styles.insightHeader}>
              <AlertTriangle size={17} color="#ea580c" />
              <h3>Needs Attention</h3>
              <span className={styles.insightCount}>{needsAttention.length} students</span>
            </div>
            <div className={styles.insightGrid}>
              {needsAttention.map((s) => {
                const inactive = s.last_activity_at
                  ? Date.now() - new Date(s.last_activity_at).getTime() > 7 * 24 * 60 * 60 * 1000
                  : true;
                return (
                  <div key={s.id} className={styles.insightCard}>
                    <div className={styles.insightCardTop}>
                      <div className={styles.avatarSmall} style={{ background: getAvatarGradient(s.full_name ?? '') }}>
                        {(s.full_name ?? '?').charAt(0)}
                      </div>
                      <div>
                        <p className={styles.insightName}>{s.full_name}</p>
                        <p className={styles.insightMeta}>{s.grade_name} · {s.section}</p>
                      </div>
                    </div>
                    <div className={styles.insightTags}>
                      {s.overall_progress < 30 && <span className={styles.tagDanger}>Progress {s.overall_progress}%</span>}
                      {inactive && <span className={styles.tagWarning}>Inactive 7d+</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Top Performers */}
        {topPerformers.length > 0 && (
          <section className={styles.insightBox}>
            <div className={styles.insightHeader}>
              <Trophy size={17} color="#f59e0b" />
              <h3>Top Performers</h3>
              <span className={styles.insightCount}>This week</span>
            </div>
            <div className={styles.insightGrid}>
              {topPerformers.map((s, i) => (
                <div key={s.id} className={styles.insightCard}>
                  <div className={styles.insightCardTop}>
                    <span className={styles.rank}>{i + 1}</span>
                    <div className={styles.avatarSmall} style={{ background: getAvatarGradient(s.full_name ?? '') }}>
                      {(s.full_name ?? '?').charAt(0)}
                    </div>
                    <div>
                      <p className={styles.insightName}>{s.full_name}</p>
                      <p className={styles.insightMeta}>{s.grade_name} · {s.section}</p>
                    </div>
                  </div>
                  <div className={styles.insightStars}>
                    <Star size={14} fill="#f59e0b" color="#f59e0b" />
                    <span>{s.total_stars_earned}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Class Pulse */}
        {classPulse.length > 0 && (
          <section className={styles.insightBox}>
            <div className={styles.insightHeader}>
              <BarChart3 size={17} color="#3b82f6" />
              <h3>Class Pulse</h3>
              <span className={styles.insightCount}>Avg progress</span>
            </div>
            <div className={styles.pulseList}>
              {classPulse.map((cls) => {
                const color = getProgressColor(cls.avg);
                const gradient = getProgressGradient(cls.avg);
                return (
                  <div key={cls.name} className={styles.pulseRow}>
                    <span className={styles.pulseLabel}>{cls.name}</span>
                    <span className={styles.pulseCount}>{cls.count} students</span>
                    <div className={styles.pulseBar}>
                      <div className={styles.pulseFill} style={{ width: `${cls.avg}%`, background: gradient }} />
                    </div>
                    <span className={styles.pulsePerc} style={{ color }}>{cls.avg}%</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <div className={styles.bottomPad} />
      </div>

      <StudentDetailModal
        student={detailStudent!}
        open={detailStudent !== null}
        onClose={() => setDetailStudent(null)}
      />
      <AddStudentModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </main>
  );
}
