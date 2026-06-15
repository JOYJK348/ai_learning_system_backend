'use client';

import type { ReactNode } from 'react';
import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, GraduationCap, Star, Activity, Clock3, Hash, User, Circle,
  Pencil, Trash2, AlertTriangle, Loader2, Users, ChevronRight,
} from 'lucide-react';
import { useDeleteStudent } from '@/hooks/useSchoolStudents';
import { useSchoolParents } from '@/hooks/useSchoolParents';
import EditStudentModal from './EditStudentModal';
import styles from './StudentDetailModal.module.css';

export type StudentDetail = {
  id: string;
  student_id: string;
  full_name: string | null;
  grade_name: string | null;
  section: string | null;
  roll_number: string | null;
  total_stars_earned: number;
  overall_progress: number;
  last_activity_at: string | null;
};

type Props = {
  student: StudentDetail;
  open: boolean;
  onClose: () => void;
};

export default function StudentDetailModal({ student, open, onClose }: Props) {
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const deleteStudent = useDeleteStudent();
  const { data: parentsRes } = useSchoolParents();

  const linkedParents = useMemo(() => {
    if (!student || !parentsRes?.data) return [];
    const list = parentsRes.data as Array<{ id: string; name: string; email: string; phone: string | null; children: { student_id: string }[] }>;
    return list.filter((p) => p.children.some((c) => c.student_id === student.student_id));
  }, [parentsRes, student?.student_id]);

  useEffect(() => {
    if (!open) {
      setShowEdit(false);
      setShowDeleteConfirm(false);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && !showDeleteConfirm) onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, showDeleteConfirm]);

  if (!student) return null;

  const isOnline = student.last_activity_at
    ? Date.now() - new Date(student.last_activity_at).getTime() < 30 * 60 * 1000
    : false;

  const lastActive = student.last_activity_at
    ? new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(student.last_activity_at))
    : 'Never';

  const progressColor = student.overall_progress >= 70 ? '#22c55e'
    : student.overall_progress >= 40 ? '#f59e0b'
    : '#ef4444';

  const handleDelete = async () => {
    try {
      await deleteStudent.mutateAsync(student.id);
      setShowDeleteConfirm(false);
      onClose();
    } catch {
      // handled by mutation
    }
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
                <h2 className={styles.heading}>Student Details</h2>
                <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
                  <X size={20} />
                </button>
              </div>

              <div className={styles.body}>
                <div className={styles.profile}>
                  <div className={styles.avatarLarge}>{(student.full_name ?? '?').charAt(0)}</div>
                  <div>
                    <h3 className={styles.name}>{student.full_name}</h3>
                    <p className={styles.meta}>{student.grade_name} · {student.section}</p>
                  </div>
                  <span className={`${styles.badge} ${isOnline ? styles.online : ''}`}>
                    <Circle size={8} fill="currentColor" />
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>

                <div className={styles.statGrid}>
                  <Stat icon={Hash} label="Roll No." value={student.roll_number ?? '—'} />
                  <Stat icon={GraduationCap} label="Grade" value={student.grade_name ?? '—'} />
                  <Stat icon={Hash} label="Section" value={student.section ?? '—'} />
                  <Stat icon={Clock3} label="Last Activity" value={lastActive} />
                </div>

                <div className={styles.section}>
                  <h4 className={styles.sectionTitle}><Star size={16} color="#f59e0b" /> Performance</h4>
                  <div className={styles.perfRow}>
                    <div className={styles.perfCard}>
                      <p className={styles.perfLabel}>Progress</p>
                      <p className={styles.perfValue} style={{ color: progressColor }}>{student.overall_progress}%</p>
                      <div className={styles.progressTrack}>
                        <div className={styles.progressFill} style={{ width: `${student.overall_progress}%`, background: progressColor }} />
                      </div>
                    </div>
                    <div className={styles.perfCard}>
                      <p className={styles.perfLabel}>Stars Earned</p>
                      <p className={styles.perfValue}>{student.total_stars_earned}</p>
                      <div className={styles.starRow}>
                        {Array.from({ length: Math.min(student.total_stars_earned, 5) }).map((_, i) => (
                          <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.section}>
                  <h4 className={styles.sectionTitle}><Users size={16} color="#8b5cf6" /> Parents / Guardians</h4>
                  <div className={styles.parentList}>
                    {linkedParents.length === 0 ? (
                      <div className={styles.parentEmpty}>
                        <p className={styles.logEmpty}>No parents linked</p>
                        <a href="/en/school-admin/parents" className={styles.parentLinkBtn}>Link a parent</a>
                      </div>
                    ) : (
                      linkedParents.map((p) => (
                        <a key={p.id} href={`/en/school-admin/parents`} className={styles.parentCard}>
                          <div className={styles.parentAvatar}>{p.name.charAt(0)}</div>
                          <div className={styles.parentInfo}>
                            <p className={styles.parentName}>{p.name}</p>
                            <p className={styles.parentContact}>{p.email}{p.phone ? ` · ${p.phone}` : ''}</p>
                          </div>
                          <ChevronRight size={16} className={styles.parentChevron} />
                        </a>
                      ))
                    )}
                  </div>
                </div>

                <div className={styles.section}>
                  <h4 className={styles.sectionTitle}><Activity size={16} color="#3b82f6" /> Activity Log</h4>
                  <div className={styles.activityLog}>
                    <p className={styles.logEmpty}>Detailed activity log coming soon</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className={styles.actionRow}>
                  <button
                    type="button"
                    className={styles.editBtn}
                    onClick={() => setShowEdit(true)}
                  >
                    <Pencil size={15} />
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
              <div className={styles.confirmIcon}>
                <AlertTriangle size={28} color="#ef4444" />
              </div>
              <h3 className={styles.confirmTitle}>Delete Student?</h3>
              <p className={styles.confirmText}>
                This will permanently remove <strong>{student.full_name}</strong> and all associated data. This action cannot be undone.
              </p>
              <div className={styles.confirmActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.confirmDeleteBtn}
                  onClick={handleDelete}
                  disabled={deleteStudent.isPending}
                >
                  {deleteStudent.isPending ? <Loader2 size={16} className={styles.spin} /> : null}
                  Delete
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <EditStudentModal
        student={student}
        open={showEdit}
        onClose={() => setShowEdit(false)}
      />
    </>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ size: number }>; label: string; value: string | number; children?: ReactNode }) {
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
