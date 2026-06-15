'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Manrope } from 'next/font/google';
import {
  GraduationCap,
  Star,
  Search,
  Users,
  Activity,
  TrendingUp,
  Eye,
  CheckSquare,
  Square,
  AlertTriangle,
  X,
  Mail,
  Calendar,
  Hash,
  Clock3,
  BookOpen,
  Filter,
  ChevronDown,
  User,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { adminKeys } from '@/core/constants/queryKeys';
import { adminApi } from '@/core/services/adminApi';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

const adminFont = Manrope({ subsets: ['latin'], variable: '--admin-font', display: 'swap' });

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

type Kid = {
  id: string;
  name: string;
  email?: string;
  grade_name?: string;
  photo_url?: string;
  overall_progress: number;
  total_stars: number;
  badges_count: number;
  current_streak_days: number;
  last_active?: string;
  created_at: string;
  section?: string | null;
  parent_name?: string;
  parent_id?: string | null;
};

const CONTAINER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.025 } },
};

const ROW_ITEM = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export default function StudentsPage() {
  const { user } = useAuth();

  const { data: studentsRes, isLoading, isError, error } = useQuery({
    queryKey: adminKeys.students,
    queryFn: async () => {
      const data = await adminApi.students();
      if (!data) return [];
      const raw = (data as any)?.data ?? data ?? [];
      return Array.isArray(raw) ? raw : [];
    },
    staleTime: 60_000,
    enabled: !!user,
  });

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);

  const students: Kid[] = studentsRes ?? [];

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'progress' | 'stars' | 'last_active'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailStudent, setDetailStudent] = useState<Kid | null>(null);
  const [gradeFilter, setGradeFilter] = useState('');

  const schoolOptions = useMemo(() => {
    const set = new Set<string>();
    students.forEach(s => { if (s.school_name) set.add(s.school_name); });
    return Array.from(set).sort();
  }, [students]);

  const gradeOptions = useMemo(() => {
    const set = new Set<string>();
    students.forEach(s => { if (s.grade_name) set.add(s.grade_name); });
    return Array.from(set).sort();
  }, [students]);

  const filtered = useMemo(() => {
    let list = [...students];
    if (gradeFilter) list = list.filter(s => s.grade_name === gradeFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((s) => (s.name ?? '').toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name') cmp = (a.name ?? '').localeCompare(b.name ?? '');
      else if (sortBy === 'progress') cmp = a.overall_progress - b.overall_progress;
      else if (sortBy === 'stars') cmp = a.total_stars - b.total_stars;
      else if (sortBy === 'last_active') {
        const aT = a.last_active ? new Date(a.last_active).getTime() : 0;
        const bT = b.last_active ? new Date(b.last_active).getTime() : 0;
        cmp = aT - bT;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [students, searchQuery, sortBy, sortDir, gradeFilter]);

  const stats = useMemo(() => {
    const pool = students;
    const activeToday = pool.filter(
      (s) => s.last_active && Date.now() - new Date(s.last_active).getTime() < 24 * 60 * 60 * 1000,
    ).length;
    const avgProgress = pool.length
      ? Math.round(pool.reduce((s, k) => s + k.overall_progress, 0) / pool.length)
      : 0;
    const avgStars = pool.length
      ? Math.round(pool.reduce((s, k) => s + (k.total_stars || 0), 0) / pool.length)
      : 0;
    return { total: pool.length, activeToday, avgProgress, avgStars };
  }, [students]);

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortDir('asc'); }
  };

  const sortArrow = (field: typeof sortBy) => {
    if (sortBy !== field) return '';
    return sortDir === 'asc' ? ' \u2191' : ' \u2193';
  };

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

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((s) => s.id)));
    }
  };

  const selectedCount = selectedIds.size;

  return (
    <main className={`${adminFont.variable} ${styles.shell}`}>
      <div className={styles.bgGlow} />
      <div className={styles.content}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Student Directory</h1>
            <p className={styles.subtitle}>Monitor all students across your platform</p>
          </div>
        </header>

        <div className={styles.statsRow}>
          <motion.div className={styles.statCard} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.35 }}>
            <div className={`${styles.statIcon} ${styles.statIcon1}`}><Users size={18} /></div>
            <div>
              <p className={styles.statValue}>{stats.total}</p>
              <p className={styles.statLabel}>Total Students</p>
            </div>
          </motion.div>
          <motion.div className={styles.statCard} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.35 }}>
            <div className={`${styles.statIcon} ${styles.statIcon2}`}><Activity size={18} /></div>
            <div>
              <p className={styles.statValue}>{stats.activeToday}</p>
              <p className={styles.statLabel}>Active Today</p>
            </div>
          </motion.div>
          <motion.div className={styles.statCard} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.35 }}>
            <div className={`${styles.statIcon} ${styles.statIcon3}`}><TrendingUp size={18} /></div>
            <div>
              <p className={styles.statValue}>{stats.avgProgress}%</p>
              <p className={styles.statLabel}>Avg Progress</p>
            </div>
          </motion.div>
          <motion.div className={styles.statCard} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.35 }}>
            <div className={`${styles.statIcon} ${styles.statIcon4}`}><Star size={18} /></div>
            <div>
              <p className={styles.statValue}>{stats.avgStars}</p>
              <p className={styles.statLabel}>Avg Stars</p>
            </div>
          </motion.div>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.filterRow}>
            <div className={styles.searchBox}>
              <Search size={16} className={styles.searchIcon} />
              <input className={styles.searchInput} type="search" placeholder="Search by name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              {searchQuery && (
                <button type="button" className={styles.clearBtn} onClick={() => setSearchQuery('')}>
                  <span aria-hidden>&times;</span>
                </button>
              )}
            </div>

            <div className={styles.filterGroup}>
              <div className={styles.selectWrap}>
                <select className={styles.selectBox} value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}>
                  <option value="">All Grades</option>
                  {gradeOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown size={12} className={styles.selectChevron} />
              </div>
            </div>
          </div>
        </div>

        {selectedCount > 0 && (
          <motion.div className={styles.bulkBar} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            <span className={styles.bulkCount}>{selectedCount} selected</span>
            <button type="button" className={styles.bulkDeselectBtn} onClick={() => setSelectedIds(new Set())}>
              Deselect All
            </button>
          </motion.div>
        )}

        {isError ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><AlertTriangle size={40} /></div>
            <h3 className={styles.emptyTitle}>Failed to load students</h3>
            <p className={styles.emptyText}>{(error as any)?.message || 'Check console for details'}</p>
          </div>
        ) : isLoading && hydrated ? (
          <div className={styles.emptyState}>
            <div className={styles.loader} />
            <p className={styles.emptyText}>Loading students...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><GraduationCap size={40} /></div>
            <h3 className={styles.emptyTitle}>No students found</h3>
            <p className={styles.emptyText}>
              {searchQuery ? 'Try adjusting your search' : 'No students registered yet'}
            </p>
          </div>
        ) : (
          <section className={styles.tableWrap}>
            <div className={styles.tableHeader}>
              <div className={styles.cellCheck}>
                <button type="button" className={styles.checkBtn} onClick={toggleSelectAll} aria-label="Select all">
                  {selectedIds.size === filtered.length ? <CheckSquare size={15} /> : <Square size={15} />}
                </button>
              </div>
              <button type="button" className={styles.sortBtn} onClick={() => handleSort('name')}>Student{sortArrow('name')}</button>
              <button type="button" className={styles.sortBtn} onClick={() => handleSort('progress')}>Progress{sortArrow('progress')}</button>
              <button type="button" className={styles.sortBtn} onClick={() => handleSort('stars')}>Stars{sortArrow('stars')}</button>
              <button type="button" className={styles.sortBtn} onClick={() => handleSort('last_active')}>Status{sortArrow('last_active')}</button>
              <span className={styles.actionColHeader} />
            </div>

            <motion.div variants={CONTAINER} initial="hidden" animate="show">
              {filtered.map((s) => {
                const isOnline = s.last_active
                  ? Date.now() - new Date(s.last_active).getTime() < 30 * 60 * 1000
                  : false;
                const pc = getProgressColor(s.overall_progress);
                const pg = getProgressGradient(s.overall_progress);
                const isSelected = selectedIds.has(s.id);

                return (
                  <motion.div
                    key={s.id}
                    variants={ROW_ITEM}
                    className={`${styles.row} ${isSelected ? styles.rowSelected : ''}`}
                    role="button"
                    tabIndex={0}
                  >
                    <div className={styles.cellCheck}>
                      <button type="button" className={styles.checkBtn} onClick={(e) => { e.stopPropagation(); toggleSelect(s.id); }} aria-label={isSelected ? 'Deselect' : 'Select'}>
                        {isSelected ? <CheckSquare size={15} color="#12312f" /> : <Square size={15} />}
                      </button>
                    </div>

                    <div className={styles.cellStudent}>
                      <div className={styles.avatar} style={{ background: getAvatarGradient(s.name ?? '') }}>
                        {(s.name ?? '?').charAt(0)}
                      </div>
                      <div className={styles.nameGroup}>
                        <p className={styles.name}>{s.name}</p>
                        <p className={styles.meta}>
                          <span className={styles.gradePill}>{s.grade_name || 'No Grade'}</span>
                        </p>
                      </div>
                    </div>

                    <div className={styles.cellProgress}>
                      <div className={styles.progressTrack}>
                        <div className={styles.progressFill} style={{ width: `${s.overall_progress}%`, background: pg }} />
                      </div>
                      <span className={styles.progressPct} style={{ color: pc }}>{s.overall_progress}%</span>
                    </div>

                    <div className={styles.cellStars}>
                      <Star size={13} fill="#f59e0b" color="#f59e0b" />
                      <span className={styles.starsVal}>{s.total_stars}</span>
                    </div>

                    <div className={styles.cellStatus}>
                      <span className={`${styles.statusDot} ${isOnline ? styles.online : ''}`}>
                        <span className={styles.pulse} />
                        {isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>

                    <div className={styles.cellActions}>
                      <button type="button" className={styles.actionBtn} aria-label="View details" onClick={(e) => { e.stopPropagation(); setDetailStudent(s); }}>
                        <Eye size={15} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </section>
        )}

        <div className={styles.bottomPad} />
      </div>

      {detailStudent && (
        <div className={styles.drawerOverlay} onClick={() => setDetailStudent(null)}>
          <div className={styles.drawer} onClick={e => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <div className={styles.drawerTitle}>
                <div className={styles.drawerLogo} style={{background: getAvatarGradient(detailStudent.name)}}>
                  {detailStudent.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <h2>{detailStudent.name}</h2>
                  <span className={styles.planBadge} style={{background:'rgba(99,102,241,0.1)',color:'#4f46e5'}}>{detailStudent.grade_name || 'No Grade'}</span>
                </div>
              </div>
              <button className={styles.closeButton} onClick={() => setDetailStudent(null)}><X size={20} /></button>
            </div>
            <div className={styles.drawerBody}>
              <section className={styles.drawerSection}>
                <h3><User size={16} /> Student Details</h3>
                <div className={styles.drawerGrid}>
                  <div><label>Email</label><p>{detailStudent.email || 'No email'}</p></div>
                  <div><label>Grade</label><p>{detailStudent.grade_name || 'No Grade'}</p></div>
                  <div><label>Parent</label><p>{detailStudent.parent_name || 'Not linked'}</p></div>
                  <div><label>Joined</label><p>{new Date(detailStudent.created_at).toLocaleDateString('en-IN')}</p></div>
                  <div><label>Last Active</label><p>{detailStudent.last_active ? new Date(detailStudent.last_active).toLocaleDateString('en-IN') : 'Never'}</p></div>
                </div>
              </section>

              <section className={styles.drawerSection}>
                <h3><TrendingUp size={16} /> Performance</h3>
                <div className={styles.revenueCards}>
                  <div className={styles.revenueCard}>
                    <span>Progress</span>
                    <strong>{detailStudent.overall_progress}%</strong>
                    <div className={styles.timelineBar} style={{marginTop:'0.35rem'}}>
                      <div className={styles.timelineProgress} style={{width: detailStudent.overall_progress + '%', background: detailStudent.overall_progress >= 70 ? '#22c55e' : detailStudent.overall_progress >= 40 ? '#f59e0b' : '#ef4444'}} />
                    </div>
                  </div>
                  <div className={styles.revenueCard}>
                    <span>Stars</span>
                    <strong>{detailStudent.total_stars}</strong>
                  </div>
                  <div className={styles.revenueCard}>
                    <span>Badges</span>
                    <strong>{detailStudent.badges_count}</strong>
                  </div>
                  <div className={styles.revenueCard}>
                    <span>Streak</span>
                    <strong>{detailStudent.current_streak_days}d</strong>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
