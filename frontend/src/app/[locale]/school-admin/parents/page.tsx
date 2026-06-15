'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Manrope } from 'next/font/google';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  ChevronDown,
  Eye,
  Baby,
  CreditCard,
  Clock,
  UserCheck,
  GraduationCap,
  X,
} from 'lucide-react';
import { useSchoolParents } from '@/hooks/useSchoolParents';
import AddParentModal from '../_components/AddParentModal';
import ParentDetailModal from '../_components/ParentDetailModal';
import type { ParentDetail } from '../_components/ParentDetailModal';
import styles from './page.module.css';

const adminFont = Manrope({
  subsets: ['latin'],
  variable: '--admin-font',
  display: 'swap',
});

type ParentRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  plan_type: string;
  plan_type_name: string;
  plan_status: string | null;
  plan_status_name: string | null;
  approval_status: string;
  approval_status_name: string;
  status_id: number | null;
  plan_expires_at: string | null;
  created_at: string;
  children: { student_id: string; name: string; grade_name?: string; is_primary: boolean }[];
  children_count: number;
};

const CONTAINER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.025 } },
};

const ROW_ITEM = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

const AVATAR_COLORS = [
  '#12312f', '#1e293b', '#3b1f4e', '#1e3a5f', '#5c1f1f', '#1f4e3a',
];

function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h);
}

export default function ParentsPage() {
  const { data: parentsRes, isLoading } = useSchoolParents();
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string[]>([]);
  const [detailParent, setDetailParent] = useState<ParentDetail | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const GRADES = ['LKG', 'UKG', 'Grade 1'];

  const toggleGrade = (grade: string) => {
    setGradeFilter((prev) =>
      prev.includes(grade) ? prev.filter((g) => g !== grade) : [...prev, grade]
    );
  };

  const parents: ParentRow[] = parentsRes?.data ?? [];

  const planTypes = useMemo(() => {
    const set = new Set<string>();
    parents.forEach((p) => { if (p.plan_type_name) set.add(p.plan_type_name); });
    return Array.from(set).sort();
  }, [parents]);

  const filtered = useMemo(() => {
    let list = [...parents];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)
      );
    }
    if (planFilter) list = list.filter((p) => p.plan_type_name === planFilter);
    if (gradeFilter.length > 0) {
      list = list.filter((p) =>
        p.children.some((c) => c.grade_name && gradeFilter.includes(c.grade_name))
      );
    }
    return list;
  }, [parents, search, planFilter, gradeFilter]);

  const stats = useMemo(() => {
    const total = parents.length;
    const totalChildren = parents.reduce((s, p) => s + p.children_count, 0);
    const activePlans = parents.filter((p) => p.plan_status === 'active').length;
    const expiring = parents.filter((p) => {
      if (!p.plan_expires_at) return false;
      const days = Math.ceil((new Date(p.plan_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return days >= 0 && days <= 30;
    }).length;
    return { total, totalChildren, activePlans, expiring };
  }, [parents]);

  if (isLoading) {
    return (
      <main className={`${adminFont.variable} ${styles.shell}`}>
        <div className={styles.loading}><div className={styles.loader} /><p>Loading parents...</p></div>
      </main>
    );
  }

  return (
    <main className={`${adminFont.variable} ${styles.shell}`}>
      <div className={styles.bgGlow} />
      <div className={styles.content}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Parent Directory</h1>
            <p className={styles.subtitle}>Manage parents and their linked children</p>
          </div>
          <button type="button" className={styles.addBtn} onClick={() => setShowAddModal(true)}>
            <Plus size={16} />
            <span>Add Parent</span>
          </button>
        </header>

        <div className={styles.statsRow}>
          <motion.div className={styles.statCard} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <div className={`${styles.statIcon} ${styles.statIcon1}`}><Users size={18} /></div>
            <div><p className={styles.statValue}>{stats.total}</p><p className={styles.statLabel}>Total Parents</p></div>
          </motion.div>
          <motion.div className={styles.statCard} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className={`${styles.statIcon} ${styles.statIcon2}`}><Baby size={18} /></div>
            <div><p className={styles.statValue}>{stats.totalChildren}</p><p className={styles.statLabel}>Linked Children</p></div>
          </motion.div>
          <motion.div className={styles.statCard} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className={`${styles.statIcon} ${styles.statIcon3}`}><CreditCard size={18} /></div>
            <div><p className={styles.statValue}>{stats.activePlans}</p><p className={styles.statLabel}>Active Plans</p></div>
          </motion.div>
          <motion.div className={styles.statCard} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className={`${styles.statIcon} ${styles.statIcon4}`}><Clock size={18} /></div>
            <div><p className={styles.statValue}>{stats.expiring}</p><p className={styles.statLabel}>Expiring Soon</p></div>
          </motion.div>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              type="search"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button type="button" className={styles.clearBtn} onClick={() => setSearch('')}>
                <span aria-hidden>&times;</span>
              </button>
            )}
          </div>
          <div className={styles.filterGroup}>
            <div className={styles.gradePills}>
              <GraduationCap size={14} className={styles.gradePillIcon} />
              {GRADES.map((grade) => (
                <button
                  key={grade}
                  type="button"
                  className={`${styles.gradePill} ${gradeFilter.includes(grade) ? styles.gradePillActive : ''}`}
                  onClick={() => toggleGrade(grade)}
                >
                  {grade === 'Grade 1' ? 'G1' : grade}
                </button>
              ))}
              {gradeFilter.length > 0 && (
                <button
                  type="button"
                  className={styles.gradeClear}
                  onClick={() => setGradeFilter([])}
                  aria-label="Clear grade filter"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <div className={styles.selectWrap}>
              <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}>
                <option value="">All Plans</option>
                {planTypes.map((pt) => <option key={pt} value={pt}>{pt}</option>)}
              </select>
              <ChevronDown size={14} className={styles.chevron} />
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><Users size={40} /></div>
            <h3 className={styles.emptyTitle}>No parents found</h3>
            <p className={styles.emptyText}>
              {search ? 'Try adjusting your search' : 'Add a parent to link with students'}
            </p>
          </div>
        ) : (
          <section className={styles.tableWrap}>
            <div className={styles.tableHeader}>
              <span>Parent</span>
              <span>Contact</span>
              <span>Children</span>
              <span>Plan</span>
              <span />
            </div>
            <motion.div variants={CONTAINER} initial="hidden" animate="show">
              {filtered.map((p) => (
                <motion.div
                  key={p.id}
                  variants={ROW_ITEM}
                  className={styles.row}
onClick={() => setDetailParent(p)}
                   role="button"
                   tabIndex={0}
                   onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDetailParent(p); } }}
                >
                  <div className={styles.cellParent}>
                    <div
                      className={styles.avatar}
                      style={{ background: AVATAR_COLORS[hashStr(p.name) % AVATAR_COLORS.length] }}
                    >
                      {p.name.charAt(0)}
                    </div>
                    <div className={styles.nameGroup}>
                      <p className={styles.name}>{p.name}</p>
                      <p className={styles.meta}>
                        <UserCheck size={11} />
                        {p.approval_status_name}
                      </p>
                    </div>
                  </div>

                  <div className={styles.cellContact}>
                    <div className={styles.contactRow}>
                      <Mail size={12} />
                      <span>{p.email}</span>
                    </div>
                    {p.phone && (
                      <div className={styles.contactRow}>
                        <Phone size={12} />
                        <span>{p.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className={styles.cellChildren}>
                    <span className={styles.childCount}>{p.children_count}</span>
                    <div className={styles.childNames}>
                      {p.children.slice(0, 3).map((c) => (
                        <span key={c.student_id} className={styles.childTag}>{c.name}</span>
                      ))}
                      {p.children.length > 3 && (
                        <span className={styles.childMore}>+{p.children.length - 3}</span>
                      )}
                    </div>
                  </div>

                  <div className={styles.cellPlan}>
                    <span className={styles.planBadge}>{p.plan_type_name}</span>
                    {p.plan_expires_at && (
                      <span className={styles.planExpiry}>
                        {Math.ceil((new Date(p.plan_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}d
                      </span>
                    )}
                  </div>

                  <div className={styles.cellActions}>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={(e) => { e.stopPropagation(); setDetailParent(p); }}
                      aria-label="View details"
                    >
                      <Eye size={15} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </section>
        )}

        <div className={styles.bottomPad} />
      </div>

      <ParentDetailModal
        parent={detailParent!}
        open={detailParent !== null}
        onClose={() => setDetailParent(null)}
      />
      <AddParentModal open={showAddModal} onClose={() => setShowAddModal(false)} />
    </main>
  );
}
