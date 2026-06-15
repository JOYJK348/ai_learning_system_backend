'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Manrope } from 'next/font/google';
import {
  GraduationCap,
  Star,
  Search,
  Plus,
  Users,
  Activity,
  TrendingUp,
  Clock,
  ChevronDown,
  Eye,
  Download,
  Trash2,
  CheckSquare,
  Square,
  AlertTriangle,
} from 'lucide-react';
import { useSchoolStudents, useBulkDeleteStudents } from '@/hooks/useSchoolStudents';
import StudentDetailModal from '../_components/StudentDetailModal';
import AddStudentModal from '../_components/AddStudentModal';
import type { StudentDetail } from '../_components/StudentDetailModal';
import styles from './page.module.css';

const adminFont = Manrope({
  subsets: ['latin'],
  variable: '--admin-font',
  display: 'swap',
});

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

const CONTAINER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.025 } },
};

const ROW_ITEM = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export default function StudentsPage() {
  const { data: studentsRes, isLoading } = useSchoolStudents();
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [detailStudent, setDetailStudent] = useState<StudentDetail | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'progress' | 'stars' | 'last_active'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const bulkDelete = useBulkDeleteStudents();

  const students: Kid[] = studentsRes?.data ?? [];

  const grades = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => { if (s.grade_name) set.add(s.grade_name); });
    return Array.from(set).sort();
  }, [students]);

  const sections = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.grade_name === gradeFilter && s.section) set.add(s.section);
    });
    return Array.from(set).sort();
  }, [students, gradeFilter]);

  const filtered = useMemo(() => {
    let list = [...students];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((s) => (s.full_name ?? '').toLowerCase().includes(q));
    }
    if (gradeFilter) list = list.filter((s) => s.grade_name === gradeFilter);
    if (sectionFilter) list = list.filter((s) => s.section === sectionFilter);

    list.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name') cmp = (a.full_name ?? '').localeCompare(b.full_name ?? '');
      else if (sortBy === 'progress') cmp = a.overall_progress - b.overall_progress;
      else if (sortBy === 'stars') cmp = a.total_stars_earned - b.total_stars_earned;
      else if (sortBy === 'last_active') {
        const aT = a.last_activity_at ? new Date(a.last_activity_at).getTime() : 0;
        const bT = b.last_activity_at ? new Date(b.last_activity_at).getTime() : 0;
        cmp = aT - bT;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [students, searchQuery, gradeFilter, sectionFilter, sortBy, sortDir]);

  const stats = useMemo(() => {
    const activeToday = students.filter(
      (s) => s.last_activity_at && Date.now() - new Date(s.last_activity_at).getTime() < 24 * 60 * 60 * 1000
    ).length;
    const avgProgress = students.length
      ? Math.round(students.reduce((s, k) => s + k.overall_progress, 0) / students.length)
      : 0;
    const avgStars = students.length
      ? Math.round(students.reduce((s, k) => s + (k.total_stars_earned || 0), 0) / students.length)
      : 0;
    return { total: students.length, activeToday, avgProgress, avgStars };
  }, [students]);

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortDir('asc'); }
  };

  const sortArrow = (field: typeof sortBy) => {
    if (sortBy !== field) return '';
    return sortDir === 'asc' ? ' ↑' : ' ↓';
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

  const handleBulkDelete = async () => {
    try {
      await bulkDelete.mutateAsync(Array.from(selectedIds));
      setSelectedIds(new Set());
      setShowBulkDeleteConfirm(false);
    } catch {
      // handled by mutation
    }
  };

  const exportCSV = useCallback((ids?: Set<string>) => {
    const rows = ids && ids.size > 0
      ? students.filter((s) => ids.has(s.id))
      : students;

    const csvRows = [
      ['Name', 'Grade', 'Section', 'Progress (%)', 'Stars', 'Last Active'],
      ...rows.map((s) => [
        s.full_name ?? '',
        s.grade_name ?? '',
        s.section ?? '',
        String(s.overall_progress),
        String(s.total_stars_earned),
        s.last_activity_at ? new Date(s.last_activity_at).toLocaleString('en-IN') : 'Never',
      ]),
    ];

    const csv = csvRows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [students]);

  const selectedCount = selectedIds.size;

  if (isLoading) {
    return (
      <main className={`${adminFont.variable} ${styles.shell}`}>
        <div className={styles.loading}>
          <div className={styles.loader} />
          <p>Loading students...</p>
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
            <h1 className={styles.title}>Student Directory</h1>
            <p className={styles.subtitle}>Manage and monitor all enrolled students</p>
          </div>
          <button type="button" className={styles.addBtn} onClick={() => setShowAddModal(true)}>
            <Plus size={16} />
            <span>Add Student</span>
          </button>
        </header>

        {/* Stats Hero */}
        <div className={styles.statsRow}>
          <motion.div
            className={styles.statCard}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.35 }}
          >
            <div className={`${styles.statIcon} ${styles.statIcon1}`}>
              <Users size={18} />
            </div>
            <div>
              <p className={styles.statValue}>{stats.total}</p>
              <p className={styles.statLabel}>Total Students</p>
            </div>
          </motion.div>
          <motion.div
            className={styles.statCard}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.35 }}
          >
            <div className={`${styles.statIcon} ${styles.statIcon2}`}>
              <Activity size={18} />
            </div>
            <div>
              <p className={styles.statValue}>{stats.activeToday}</p>
              <p className={styles.statLabel}>Active Today</p>
            </div>
          </motion.div>
          <motion.div
            className={styles.statCard}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.35 }}
          >
            <div className={`${styles.statIcon} ${styles.statIcon3}`}>
              <TrendingUp size={18} />
            </div>
            <div>
              <p className={styles.statValue}>{stats.avgProgress}%</p>
              <p className={styles.statLabel}>Avg Progress</p>
            </div>
          </motion.div>
          <motion.div
            className={styles.statCard}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.35 }}
          >
            <div className={`${styles.statIcon} ${styles.statIcon4}`}>
              <Star size={18} />
            </div>
            <div>
              <p className={styles.statValue}>{stats.avgStars}</p>
              <p className={styles.statLabel}>Avg Stars</p>
            </div>
          </motion.div>
        </div>

        {/* Search + Filters + Export */}
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              type="search"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button type="button" className={styles.clearBtn} onClick={() => setSearchQuery('')}>
                <span aria-hidden>&times;</span>
              </button>
            )}
          </div>
          <div className={styles.filterGroup}>
            <div className={styles.selectWrap}>
              <select value={gradeFilter} onChange={(e) => { setGradeFilter(e.target.value); setSectionFilter(''); }}>
                <option value="">All Grades</option>
                {grades.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
              <ChevronDown size={14} className={styles.chevron} />
            </div>
            <div className={styles.selectWrap}>
              <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)} disabled={!gradeFilter}>
                <option value="">All Sections</option>
                {sections.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown size={14} className={styles.chevron} />
            </div>
            <button
              type="button"
              className={styles.exportBtn}
              onClick={() => {
                if (selectedCount > 0) exportCSV(selectedIds);
                else exportCSV();
              }}
              title={selectedCount > 0 ? `Export ${selectedCount} selected` : 'Export all'}
            >
              <Download size={15} />
              {selectedCount > 0 ? `Export (${selectedCount})` : 'Export'}
            </button>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedCount > 0 && (
          <motion.div
            className={styles.bulkBar}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className={styles.bulkCount}>{selectedCount} selected</span>
            <button
              type="button"
              className={styles.bulkDeleteBtn}
              onClick={() => setShowBulkDeleteConfirm(true)}
            >
              <Trash2 size={14} />
              Delete Selected
            </button>
            <button
              type="button"
              className={styles.bulkDeselectBtn}
              onClick={() => setSelectedIds(new Set())}
            >
              Deselect All
            </button>
          </motion.div>
        )}

        {/* Table */}
        {filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <GraduationCap size={40} />
            </div>
            <h3 className={styles.emptyTitle}>No students found</h3>
            <p className={styles.emptyText}>
              {searchQuery || gradeFilter
                ? 'Try adjusting your search or filters'
                : 'Add your first student to get started'}
            </p>
          </div>
        ) : (
          <section className={styles.tableWrap}>
            <div className={styles.tableHeader}>
              <div className={styles.cellCheck}>
                <button
                  type="button"
                  className={styles.checkBtn}
                  onClick={toggleSelectAll}
                  aria-label="Select all"
                >
                  {selectedIds.size === filtered.length ? <CheckSquare size={15} /> : <Square size={15} />}
                </button>
              </div>
              <button type="button" className={styles.sortBtn} onClick={() => handleSort('name')}>
                Student{sortArrow('name')}
              </button>
              <button type="button" className={styles.sortBtn} onClick={() => handleSort('progress')}>
                Progress{sortArrow('progress')}
              </button>
              <button type="button" className={styles.sortBtn} onClick={() => handleSort('stars')}>
                Stars{sortArrow('stars')}
              </button>
              <button type="button" className={styles.sortBtn} onClick={() => handleSort('last_active')}>
                Status{sortArrow('last_active')}
              </button>
              <span className={styles.actionColHeader} />
            </div>

            <motion.div variants={CONTAINER} initial="hidden" animate="show">
              {filtered.map((s) => {
                const isOnline = s.last_activity_at
                  ? Date.now() - new Date(s.last_activity_at).getTime() < 30 * 60 * 1000
                  : false;
                const pc = getProgressColor(s.overall_progress);
                const pg = getProgressGradient(s.overall_progress);
                const isSelected = selectedIds.has(s.id);

                return (
                  <motion.div
                    key={s.id}
                    variants={ROW_ITEM}
                    className={`${styles.row} ${isSelected ? styles.rowSelected : ''}`}
                    onClick={() => {
                      if (!isSelected && !selectedIds.size) setDetailStudent(s as StudentDetail);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (!selectedIds.size) setDetailStudent(s as StudentDetail);
                      }
                    }}
                  >
                    <div className={styles.cellCheck}>
                      <button
                        type="button"
                        className={styles.checkBtn}
                        onClick={(e) => { e.stopPropagation(); toggleSelect(s.id); }}
                        aria-label={isSelected ? 'Deselect' : 'Select'}
                      >
                        {isSelected ? <CheckSquare size={15} color="#12312f" /> : <Square size={15} />}
                      </button>
                    </div>

                    <div className={styles.cellStudent}>
                      <div className={styles.avatar} style={{ background: getAvatarGradient(s.full_name ?? '') }}>
                        {(s.full_name ?? '?').charAt(0)}
                      </div>
                      <div className={styles.nameGroup}>
                        <p className={styles.name}>{s.full_name}</p>
                        <p className={styles.meta}>
                          <span className={styles.gradePill}>{s.grade_name}</span>
                          {s.section && <><span className={styles.dot}>·</span>{s.section}</>}
                        </p>
                      </div>
                    </div>

                    <div className={styles.cellProgress}>
                      <div className={styles.progressTrack}>
                        <div
                          className={styles.progressFill}
                          style={{ width: `${s.overall_progress}%`, background: pg }}
                        />
                      </div>
                      <span className={styles.progressPct} style={{ color: pc }}>
                        {s.overall_progress}%
                      </span>
                    </div>

                    <div className={styles.cellStars}>
                      <Star size={13} fill="#f59e0b" color="#f59e0b" />
                      <span className={styles.starsVal}>{s.total_stars_earned}</span>
                    </div>

                    <div className={styles.cellStatus}>
                      <span className={`${styles.statusDot} ${isOnline ? styles.online : ''}`}>
                        <span className={styles.pulse} />
                        {isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>

                    <div className={styles.cellActions}>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={(e) => { e.stopPropagation(); setDetailStudent(s as StudentDetail); }}
                        aria-label="View details"
                      >
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

      <StudentDetailModal
        student={detailStudent!}
        open={detailStudent !== null}
        onClose={() => setDetailStudent(null)}
      />
      <AddStudentModal open={showAddModal} onClose={() => setShowAddModal(false)} />

      {/* Bulk Delete Confirmation */}
      {showBulkDeleteConfirm && (
        <>
          <div
            className={styles.bulkConfirmOverlay}
            onClick={() => setShowBulkDeleteConfirm(false)}
          />
          <div className={styles.bulkConfirmBox}>
            <div className={styles.bulkConfirmIcon}>
              <AlertTriangle size={28} color="#ef4444" />
            </div>
            <h3 className={styles.bulkConfirmTitle}>Delete {selectedCount} students?</h3>
            <p className={styles.bulkConfirmText}>
              This will permanently remove all selected students and their associated data.
            </p>
            <div className={styles.bulkConfirmActions}>
              <button
                type="button"
                className={styles.bulkCancelBtn}
                onClick={() => setShowBulkDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.bulkConfirmDeleteBtn}
                onClick={handleBulkDelete}
                disabled={bulkDelete.isPending}
              >
                {bulkDelete.isPending ? 'Deleting...' : `Delete ${selectedCount}`}
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
