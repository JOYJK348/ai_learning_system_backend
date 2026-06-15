'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  BookOpen,
  Hash,
  ChevronDown,
  User,
  Loader2,
} from 'lucide-react';
import { useUpdateStudent, useSchoolStudents } from '@/hooks/useSchoolStudents';
import type { StudentDetail } from './StudentDetailModal';
import styles from './AddStudentModal.module.css';

type Props = {
  student: StudentDetail;
  open: boolean;
  onClose: () => void;
};

export default function EditStudentModal({ student, open, onClose }: Props) {
  const [grade, setGrade] = useState(student.grade_name ?? '');
  const [section, setSection] = useState(student.section ?? '');
  const { data: studentsRes } = useSchoolStudents();
  const updateStudent = useUpdateStudent();
  const students = studentsRes?.data ?? [];

  const gradeOptions = useMemo(() => {
    const map = new Map<string, string>();
    (students as Array<{ grade_id: string | null; grade_name: string | null }>).forEach((s) => {
      if (s.grade_id && s.grade_name) map.set(s.grade_id, s.grade_name);
    });
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [students]);

  const sections = useMemo(() => {
    const set = new Set<string>();
    (students as Array<{ grade_name: string | null; section: string | null }>).forEach((s) => {
      if (s.grade_name === grade && s.section) set.add(s.section);
    });
    return Array.from(set).sort();
  }, [students, grade]);

  useEffect(() => {
    if (open) {
      setGrade(student.grade_name ?? '');
      setSection(student.section ?? '');
    }
  }, [open, student]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateStudent.mutateAsync({
        id: student.id,
        grade_id: gradeOptions.find((g) => g.name === grade)?.id,
        section: section || undefined,
      });
      onClose();
    } catch {
      // handled by mutation state
    }
  };

  return (
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
            className={styles.modal}
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
          >
            <div className={styles.header}>
              <h2 className={styles.heading}>Edit Student</h2>
              <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <form className={styles.body} onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label className={styles.label}>Student</label>
                <div className={styles.inputWrap}>
                  <User size={16} className={styles.inputIcon} />
                  <input className={styles.input} value={student.full_name ?? ''} disabled />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Grade</label>
                  <div className={styles.selectWrap}>
                    <BookOpen size={16} className={styles.inputIcon} />
                    <select
                      className={styles.select}
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      required
                    >
                      <option value="">Select Grade</option>
                      {gradeOptions.map((g) => <option key={g.id} value={g.name}>{g.name}</option>)}
                    </select>
                    <ChevronDown size={16} className={styles.chevron} />
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Section</label>
                  <div className={styles.selectWrap}>
                    <Hash size={16} className={styles.inputIcon} />
                    <select
                      className={styles.select}
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      disabled={!grade}
                    >
                      <option value="">Select</option>
                      {sections.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <ChevronDown size={16} className={styles.chevron} />
                  </div>
                </div>
              </div>

              {updateStudent.error && (
                <div className={styles.error}>
                  {updateStudent.error.message}
                </div>
              )}

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={updateStudent.isPending}
              >
                {updateStudent.isPending ? (
                  <><Loader2 size={18} className={styles.spin} /> Saving...</>
                ) : (
                  'Save Changes'
                )}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
