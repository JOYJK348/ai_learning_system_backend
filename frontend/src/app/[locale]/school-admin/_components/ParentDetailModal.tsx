'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, User, Mail, Phone, Baby, Star, CreditCard, Clock,
  GraduationCap, Trash2, Link, AlertTriangle, Loader2, Circle, Hash, Activity,
  CheckCircle2, Search, Plus,
} from 'lucide-react';
import { useSchoolParent, useDeleteParent, useLinkChild, useUnlinkChild } from '@/hooks/useSchoolParents';
import EditParentModal from './EditParentModal';
import styles from './StudentDetailModal.module.css';

export type ParentDetail = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  plan_type_name: string;
  children_count: number;
  children: { student_id: string; name: string; grade_name?: string; is_primary: boolean }[];
};

type Props = {
  parent: ParentDetail;
  open: boolean;
  onClose: () => void;
};

export default function ParentDetailModal({ parent, open, onClose }: Props) {
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const deleteParent = useDeleteParent();
  const linkChild = useLinkChild();
  const unlinkChild = useUnlinkChild();

  const { data: freshParentRaw, isLoading: parentLoading } = useSchoolParent(open ? parent.id : '');

  const freshParent = freshParentRaw?.data ?? freshParentRaw;
  const raw = (freshParent || parent) as ParentDetail;
  const current = useMemo(() => ({
    ...raw,
    children: (raw?.children || []).map((c) => ({
      ...c,
      student_id: (c as any).student_id || (c as any).id || '',
    })),
  }), [raw]);

  const [allStudents, setAllStudents] = useState<{ id: string; student_id: string; full_name: string; grade_name: string; section: string }[]>([]);

  useEffect(() => {
    if (open) {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? '';
      fetch(`${base}/api/school-admin/students`, { credentials: 'include' })
        .then((r) => r.json())
        .then((res) => {
          if (res.data) setAllStudents(res.data);
        })
        .catch(() => {});
    }
  }, [open]);

  const linkedStudentIds = useMemo(() => {
    return new Set(current?.children?.map((c: { student_id: string }) => c.student_id) || []);
  }, [current]);

  const [linkSearch, setLinkSearch] = useState('');
  const [linkGradeFilter, setLinkGradeFilter] = useState<string[]>([]);
  const [linkSectionFilter, setLinkSectionFilter] = useState('');

  const LINK_GRADES = ['LKG', 'UKG', 'Grade 1'];

  const toggleLinkGrade = (grade: string) => {
    setLinkGradeFilter((prev) =>
      prev.includes(grade) ? prev.filter((g) => g !== grade) : [...prev, grade]
    );
  };

  const linkSections = useMemo(() => {
    const set = new Set<string>();
    allStudents.forEach((s) => { if (s.section) set.add(s.section); });
    return Array.from(set).sort();
  }, [allStudents]);

  const filteredStudents = useMemo(() => {
    let list = allStudents;
    if (linkSearch.trim()) {
      const q = linkSearch.toLowerCase();
      list = list.filter((s) => s.full_name.toLowerCase().includes(q));
    }
    if (linkGradeFilter.length > 0) {
      list = list.filter((s) => s.grade_name && linkGradeFilter.includes(s.grade_name));
    }
    if (linkSectionFilter) {
      list = list.filter((s) => s.section === linkSectionFilter);
    }
    return list.slice(0, 30);
  }, [allStudents, linkSearch, linkGradeFilter, linkSectionFilter]);

  const handleDelete = async () => {
    try {
      await deleteParent.mutateAsync(current.id);
      setShowDeleteConfirm(false);
      onClose();
    } catch { /* handled */ }
  };

  useEffect(() => {
    if (!open) {
      setShowDeleteConfirm(false);
      setShowLinkModal(false);
      setLinkSearch('');
      setLinkGradeFilter([]);
      setLinkSectionFilter('');
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && !showDeleteConfirm && !showLinkModal) onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, showDeleteConfirm, showLinkModal]);

  const handleLink = async (studentId: string) => {
    try {
      await linkChild.mutateAsync({ parentId: current.id, studentId });
      setLinkSearch('');
    } catch { /* handled */ }
  };

  const handleUnlink = async (studentId: string) => {
    try {
      await unlinkChild.mutateAsync({ parentId: current.id, studentId });
    } catch { /* handled */ }
  };

  return (
    <>
      <AnimatePresence>
        {open && (
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
              <div className={styles.header}>
                <h2 className={styles.heading}>Parent Details</h2>
                <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
                  <X size={20} />
                </button>
              </div>

              <div className={styles.body}>
                {/* Profile */}
                <div className={styles.profile}>
                  <div className={styles.avatarLarge} style={{ background: '#1e293b' }}>
                    {current.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className={styles.name}>{current.name}</h3>
                    <p className={styles.meta}>
                      <CreditCard size={12} />
                      {current.plan_type_name}
                    </p>
                  </div>
                </div>

                <div className={styles.statGrid}>
                  <Stat icon={Mail} label="Email" value={current.email} />
                  <Stat icon={Phone} label="Phone" value={current.phone ?? '\u2014'} />
                  <Stat icon={Baby} label="Children" value={current.children.length} />
                  <Stat icon={Clock} label="Status" value="Active" />
                </div>

                {/* Linked Children */}
                <div className={styles.section}>
                  <h4 className={styles.sectionTitle}>
                    <GraduationCap size={16} color="#3b82f6" /> Linked Children
                  </h4>
                  <div className={styles.childrenList}>
                    {current.children.length === 0 ? (
                      <p className={styles.logEmpty}>No children linked</p>
                    ) : (
                      current.children.map((child: { student_id: string; name: string; grade_name?: string; is_primary: boolean }) => (
                        <div key={child.student_id} className={styles.childCard}>
                          <div className={styles.childInfo}>
                            <div className={styles.childAvatar}>{child.name.charAt(0)}</div>
                            <div>
                              <p className={styles.childName}>{child.name}</p>
                              <p className={styles.childGrade}>{child.grade_name || '\u2014'}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            className={styles.unlinkBtn}
                            onClick={() => handleUnlink(child.student_id)}
                            disabled={unlinkChild.isPending}
                            aria-label="Unlink child"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))
                    )}
                    <button
                      type="button"
                      className={styles.linkBtn}
                      onClick={() => setShowLinkModal(true)}
                    >
                      <Link size={14} />
                      Link Another Child
                    </button>
                  </div>
                </div>

                {/* Link Modal Inline */}
                {showLinkModal && (
                  <div className={styles.linkSection}>
                    <div className={styles.inputWrap}>
                      <input
                        className={styles.linkSearch}
                        placeholder="Search students..."
                        value={linkSearch}
                        onChange={(e) => setLinkSearch(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div className={styles.linkFilters}>
                      {LINK_GRADES.map((g) => (
                        <button
                          key={g}
                          type="button"
                          className={`${styles.linkFilterPill} ${linkGradeFilter.includes(g) ? styles.linkFilterPillActive : ''}`}
                          onClick={() => toggleLinkGrade(g)}
                        >
                          {g === 'Grade 1' ? 'G1' : g}
                        </button>
                      ))}
                      <select
                        className={styles.linkFilterSelect}
                        value={linkSectionFilter}
                        onChange={(e) => setLinkSectionFilter(e.target.value)}
                      >
                        <option value="">All Sections</option>
                        {linkSections.map((s) => (
                          <option key={s} value={s}>Section {s}</option>
                        ))}
                      </select>
                      {(linkGradeFilter.length > 0 || linkSectionFilter || linkSearch) && (
                        <button
                          type="button"
                          className={styles.linkFilterClear}
                          onClick={() => { setLinkGradeFilter([]); setLinkSectionFilter(''); setLinkSearch(''); }}
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                    <div className={styles.linkList}>
                      {linkChild.error && (
                        <p className={styles.linkError}>{(linkChild.error as Error).message}</p>
                      )}
                      {unlinkChild.error && (
                        <p className={styles.linkError}>{(unlinkChild.error as Error).message}</p>
                      )}
                      {filteredStudents.length === 0 ? (
                        <p className={styles.logEmpty}>No matching students</p>
                      ) : (
                          filteredStudents.map((s) => {
                          const alreadyLinked = linkedStudentIds.has(s.student_id);
                          return (
                            <div key={s.id} className={styles.linkRow} style={{ opacity: alreadyLinked ? 0.6 : 1 }}>
                              <div className={styles.linkInfo}>
                                <span className={styles.linkName}>{s.full_name}</span>
                                <span className={styles.linkGrade}>{s.grade_name} {s.section ? `\u00b7 ${s.section}` : ''}</span>
                              </div>
                              {alreadyLinked ? (
                                <span className={styles.mappedBadge}>
                                  <CheckCircle2 size={12} /> Mapped
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  className={styles.linkActionBtn}
                                  onClick={() => handleLink(s.student_id)}
                                  disabled={linkChild.isPending}
                                >
                                  {linkChild.isPending ? <Loader2 size={13} className={styles.spin} /> : 'Link'}
                                </button>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                    <button
                      type="button"
                      className={styles.linkCancelBtn}
                      onClick={() => { setShowLinkModal(false); setLinkSearch(''); setLinkGradeFilter([]); setLinkSectionFilter(''); }}
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* Action Buttons */}
                <div className={styles.actionRow}>
                  <button
                    type="button"
                    className={styles.editBtn}
                    onClick={() => setShowEdit(true)}
                  >
                    <User size={15} />
                    Edit
                  </button>
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 size={15} />
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <>
            <motion.div
              className={styles.confirmOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
            />
            <motion.div
              className={styles.confirmBox}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
            >
              <div className={styles.confirmIcon}><AlertTriangle size={28} color="#ef4444" /></div>
              <h3 className={styles.confirmTitle}>Delete Parent?</h3>
              <p className={styles.confirmText}>
                This will permanently remove <strong>{current.name}</strong>. Children linked to this parent will not be affected.
              </p>
              <div className={styles.confirmActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                <button type="button" className={styles.confirmDeleteBtn} onClick={handleDelete} disabled={deleteParent.isPending}>
                  {deleteParent.isPending ? <Loader2 size={16} className={styles.spin} /> : null} Delete
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <EditParentModal
        parent={current}
        open={showEdit}
        onClose={() => setShowEdit(false)}
      />
    </>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ size: number }>; label: string; value: string | number }) {
  return (
    <div className={styles.statBox}>
      <Icon size={16} />
      <div>
        <p className={styles.statLabel}>{label}</p>
        <p className={styles.statValue}>{value}</p>
      </div>
    </div>
  );
}
