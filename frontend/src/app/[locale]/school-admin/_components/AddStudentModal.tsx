'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  User,
  Mail,
  Phone,
  BookOpen,
  Hash,
  ChevronDown,
  Copy,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import { useCreateStudent, useSchoolStudents } from '@/hooks/useSchoolStudents';
import type { CreateStudentResult } from '@/hooks/useSchoolStudents';
import styles from './AddStudentModal.module.css';

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function AddStudentModal({ open, onClose }: Props) {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState<'none' | 'username' | 'password'>('none');

  const { data: studentsRes } = useSchoolStudents();
  const createStudent = useCreateStudent();

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
    (students as Array<{ grade_id: string | null; section: string | null }>).forEach((s) => {
      if (s.grade_id === grade && s.section) set.add(s.section);
    });
    return Array.from(set).sort();
  }, [students, grade]);

  useEffect(() => {
    if (!open) {
      setStep('form');
      setFullName('');
      setEmail('');
      setMobile('');
      setGrade('');
      setSection('');
      setRollNumber('');
      setCopied('none');
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const generatedPassword = mobile.length >= 6 ? mobile.slice(-6) : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !mobile || !grade) return;
    try {
      await createStudent.mutateAsync({
        full_name: fullName,
        email,
        mobile,
        grade_id: grade,
        section: section || undefined,
        roll_number: rollNumber || undefined,
      });
      setStep('success');
    } catch {
      // error handled by mutation state
    }
  };

  const handleCopy = (field: 'username' | 'password') => {
    const text = field === 'username' ? email : generatedPassword;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(field);
      setTimeout(() => setCopied('none'), 2000);
    });
  };

  const resultData = createStudent.data as CreateStudentResult | undefined;

  const isLoading = createStudent.isPending;

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
              <h2 className={styles.heading}>
                {step === 'form' ? 'Add New Student' : 'Student Created'}
              </h2>
              <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
                <X size={20} />
              </button>
            </div>

            {step === 'form' ? (
              <form className={styles.body} onSubmit={handleSubmit}>
                <div className={styles.field}>
                  <label className={styles.label}>Full Name</label>
                  <div className={styles.inputWrap}>
                    <User size={16} className={styles.inputIcon} />
                    <input
                      className={styles.input}
                      placeholder="e.g. Ravi Kumar"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Email <span className={styles.hint}>(login username)</span></label>
                  <div className={styles.inputWrap}>
                    <Mail size={16} className={styles.inputIcon} />
                    <input
                      className={styles.input}
                      type="email"
                      placeholder="e.g. ravi@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>
                    Mobile <span className={styles.hint}>(last 6 digits = password)</span>
                  </label>
                  <div className={styles.inputWrap}>
                    <Phone size={16} className={styles.inputIcon} />
                    <input
                      className={styles.input}
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  {mobile.length >= 6 && (
                    <div className={styles.passwordPreview}>
                      <span>Password: </span>
                      <code className={styles.passwordCode}>
                        {showPassword ? generatedPassword : '••••••'}
                      </code>
                      <button
                        type="button"
                        className={styles.togglePw}
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  )}
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
                        {gradeOptions.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
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

                <div className={styles.field}>
                  <label className={styles.label}>Roll Number <span className={styles.hint}>(optional)</span></label>
                  <div className={styles.inputWrap}>
                    <Hash size={16} className={styles.inputIcon} />
                    <input
                      className={styles.input}
                      placeholder="e.g. 101"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                    />
                  </div>
                </div>

                {createStudent.error && (
                  <div className={styles.error}>
                    {createStudent.error.message}
                  </div>
                )}

                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={isLoading || !fullName || !email || !mobile || !grade}
                >
                  {isLoading ? (
                    <><Loader2 size={18} className={styles.spin} /> Creating...</>
                  ) : (
                    'Create Student'
                  )}
                </button>
              </form>
            ) : (
              <div className={styles.body}>
                <div className={styles.successIcon}>
                  <CheckCircle2 size={40} color="#22c55e" />
                </div>
                <p className={styles.successText}>Student account created successfully!</p>
                <p className={styles.successSub}>Share these credentials with the parent:</p>

                <div className={styles.credBox}>
                  <div className={styles.credRow}>
                    <Mail size={16} />
                    <div className={styles.credContent}>
                      <p className={styles.credLabel}>Username (Email)</p>
                      <p className={styles.credValue}>{resultData?.username || email}</p>
                    </div>
                    <button
                      type="button"
                      className={styles.copyBtn}
                      onClick={() => handleCopy('username')}
                      aria-label="Copy username"
                    >
                      {copied === 'username' ? <CheckCircle2 size={16} color="#22c55e" /> : <Copy size={16} />}
                    </button>
                  </div>
                  <div className={styles.credRow}>
                    <Eye size={16} />
                    <div className={styles.credContent}>
                      <p className={styles.credLabel}>Password</p>
                      <p className={styles.credValue}>{generatedPassword}</p>
                    </div>
                    <button
                      type="button"
                      className={styles.copyBtn}
                      onClick={() => handleCopy('password')}
                      aria-label="Copy password"
                    >
                      {copied === 'password' ? <CheckCircle2 size={16} color="#22c55e" /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>

                <button type="button" className={styles.submitBtn} onClick={onClose}>
                  Done
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
