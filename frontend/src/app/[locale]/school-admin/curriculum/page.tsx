'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Manrope } from 'next/font/google';
import {
  BookOpen,
  BookMarked,
  ChevronRight,
  Sparkles,
  GraduationCap,
  FileQuestion,
  Library,
  BookA,
  ArrowLeft,
  Trophy,
  MonitorSmartphone,
  BrainCircuit,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSchoolCurriculumOverview, useSchoolCurriculum, type GradeSummary, type CurriculumOverview } from '@/hooks/useSchoolCurriculum';
import styles from './page.module.css';

const adminFont = Manrope({
  subsets: ['latin'],
  variable: '--admin-font',
  display: 'swap',
});

const CONTAINER = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const ITEM = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

const GRADE_MASCOTS: Record<string, string> = {
  LKG: '\u{1f476}',
  UKG: '\u{1f9D2}',
  'Grade 1': '\u{1F393}',
};

const SUBJECT_GRADIENTS: Record<string, string> = {
  English: 'linear-gradient(135deg, #dbeafe, #eff6ff)',
  Mathematics: 'linear-gradient(135deg, #d1fae5, #ecfdf5)',
  Tamil: 'linear-gradient(135deg, #fce7f3, #fdf2f8)',
  Hindi: 'linear-gradient(135deg, #fef3c7, #fffbeb)',
  'Environmental Studies': 'linear-gradient(135deg, #ede9fe, #f5f3ff)',
  'General Knowledge': 'linear-gradient(135deg, #e0e7ff, #eef2ff)',
  Science: 'linear-gradient(135deg, #cffafe, #ecfeff)',
  'Computer Science': 'linear-gradient(135deg, #f0fdf4, #f7fee7)',
};

const SUBJECT_ICONS: Record<string, React.ReactNode> = {
  English: <BookOpen size={15} />,
  Mathematics: <BrainCircuit size={15} />,
  Tamil: <BookMarked size={15} />,
  Hindi: <BookMarked size={15} />,
  Science: <Sparkles size={15} />,
  'Computer Science': <MonitorSmartphone size={15} />,
  default: <Library size={15} />,
};

function getFunColor(score: number) {
  return score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';
}

function getScoreEmoji(score: number) {
  return score >= 70 ? '\u{1f929}' : score >= 40 ? '\u{1f44d}' : '\u{1f4aa}';
}

function KpiGrid({ overview }: { overview: CurriculumOverview }) {
  const kpiData = [
    { icon: BookA, label: 'Subjects', value: overview.total_subjects, change: 'Total', color: '#2563eb', bg: 'var(--kpi1)' },
    { icon: BookOpen, label: 'Lessons', value: overview.total_lessons, change: 'Total', color: '#16a34a', bg: 'var(--kpi2)' },
    { icon: FileQuestion, label: 'Quizzes', value: overview.total_quizzes, change: 'Total', color: '#d97706', bg: 'var(--kpi3)' },
    { icon: Trophy, label: 'Fun Score', value: `${overview.avg_fun_score}%`, change: 'Avg', color: '#db2777', bg: 'var(--kpi4)' },
  ];

  return (
    <section className={styles.kpiGrid}>
      {kpiData.map((k, i) => (
        <motion.div
          key={k.label}
          className={styles.kpiCard}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07, duration: 0.35 }}
        >
          <div className={styles.kpiTop}>
            <div className={styles.kpiIcon}>
              <k.icon size={17} />
            </div>
            <span className={styles.kpiChange}>{k.change}</span>
          </div>
          <p className={styles.kpiLabel}>{k.label}</p>
          <h2 className={styles.kpiValue}>{typeof k.value === 'number' ? k.value.toLocaleString('en-IN') : k.value}</h2>
        </motion.div>
      ))}
    </section>
  );
}

function GradeCard({ grade, onSelect, isSelected }: { grade: GradeSummary; onSelect: () => void; isSelected: boolean }) {
  const emoji = GRADE_MASCOTS[grade.name] || '\u{1F4DA}';
  const scoreColor = getFunColor(grade.fun_score);
  const mascotBg = `linear-gradient(135deg, ${grade.fun_score >= 70 ? '#d1fae5,#ecfdf5' : grade.fun_score >= 40 ? '#fef3c7,#fffbeb' : '#fce7f3,#fdf2f8'})`;

  return (
    <motion.button
      className={`${styles.gradeCard} ${isSelected ? styles.gradeCardActive : ''}`}
      onClick={onSelect}
      variants={ITEM}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className={styles.gradeMascotBox} style={{ background: mascotBg }}>
        {emoji}
      </div>
      <div className={styles.gradeInfo}>
        <h3 className={styles.gradeName}>{grade.name}</h3>
        <div className={styles.gradeStats}>
          <span className={styles.gradeStatPill}>
            <BookA /> {grade.subjects_count}
          </span>
          <span className={styles.gradeStatPill}>
            <BookOpen /> {grade.lessons_count}
          </span>
          <span className={styles.gradeStatPill}>
            <FileQuestion /> {grade.quizzes_count}
          </span>
        </div>
      </div>
      <span className={styles.gradeFunScore} style={{ background: `${scoreColor}20`, color: scoreColor }}>
        {getScoreEmoji(grade.fun_score)} {grade.fun_score}%
      </span>
      <div className={styles.gradeArrow}>
        <ChevronRight size={16} />
      </div>
    </motion.button>
  );
}

function SubjectCard({
  subject,
  isExpanded,
  onToggle,
}: {
  subject: import('@/hooks/useSchoolCurriculum').CurriculumSubject;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const scoreColor = getFunColor(subject.fun_score);

  return (
    <motion.div className={styles.subjectCard} variants={ITEM}>
      <button type="button" className={styles.subjectHeader} onClick={onToggle}>
        <div
          className={styles.subjectIcon}
          style={{ background: SUBJECT_GRADIENTS[subject.name] ?? 'linear-gradient(135deg, #f1f5f9, #f8fafc)' }}
        >
          {SUBJECT_ICONS[subject.name] ?? SUBJECT_ICONS.default}
        </div>
        <div className={styles.subjectInfo}>
          <p className={styles.subjectName}>{subject.name}</p>
          <p className={styles.subjectMeta}>
            {subject.chapters_count} chapters | {subject.lessons_count} lessons
          </p>
        </div>
        <div className={styles.subjectScore}>
          <span className={styles.subjectFunBadge} style={{ background: scoreColor }}>
            {getScoreEmoji(subject.fun_score)} {subject.fun_score}%
          </span>
          <motion.div
            className={styles.subjectChevron}
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight size={15} />
          </motion.div>
        </div>
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className={styles.chapterList}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {subject.chapters.map((chapter, ci) => (
              <div key={ci} className={styles.chapterRow}>
                <div className={styles.chapterHeader}>
                  <BookMarked size={12} />
                  <span>{chapter.name}</span>
                  <span className={styles.chapterCount}>{chapter.lessons.length} lessons</span>
                </div>
                <div className={styles.lessonList}>
                  {chapter.lessons.map((lesson, li) => (
                    <div key={li} className={styles.lessonRow}>
                      <span className={styles.lessonTitle}>{lesson.title}</span>
                      <div className={styles.lessonBadges}>
                        {lesson.has_quiz && (
                          <span className={styles.badgeQuiz}>
                            <FileQuestion size={9} />
                            Quiz
                          </span>
                        )}
                        {lesson.has_activity && (
                          <span className={styles.badgeActivity}>
                            <Sparkles size={9} />
                            Act
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function CurriculumPage() {
  const { user } = useAuth();
  const { data: overviewData, isLoading: overviewLoading, isError: overviewError, refetch: refetchOverview } = useSchoolCurriculumOverview();
  const [selectedGradeId, setSelectedGradeId] = useState<string | null>(null);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);



  const { data: curriculum, isLoading: curriculumLoading, isError: curriculumError, refetch: refetchCurriculum } = useSchoolCurriculum(selectedGradeId);

  const selectedGrade = useMemo(() => {
    if (!selectedGradeId || !overviewData?.grades) return null;
    return overviewData.grades.find((g) => g.id === selectedGradeId) ?? null;
  }, [overviewData, selectedGradeId]);

  const handleGradeSelect = (id: string) => {
    setExpandedSubject(null);
    setSelectedGradeId((prev) => (prev === id ? null : id));
  };

  const handleBack = () => {
    setSelectedGradeId(null);
    setExpandedSubject(null);
  };

  const totalLessons = useMemo(() =>
    curriculum?.subjects.reduce((a, s) => a + s.lessons_count, 0) ?? 0,
  [curriculum]);

  if (overviewLoading || !user?.schoolId) {
    return (
      <main className={`${adminFont.variable} ${styles.shell}`}>
        <div className={styles.loading}><div className={styles.loader} /></div>
      </main>
    );
  }

  if (overviewError) {
    return (
      <main className={`${adminFont.variable} ${styles.shell}`}>
        <div className={styles.content}>
          <div className={styles.header}>
            <h1 className={styles.title}>Curriculum</h1>
            <p className={styles.subtitle}>CBSE-aligned syllabus explorer</p>
          </div>
          <div className={styles.prompt}>
            <div className={styles.promptIcon}><GraduationCap size={28} /></div>
            <p className={styles.promptTitle}>Failed to load curriculum</p>
            <p className={styles.promptText}>Something went wrong. Try again.</p>
            <button type="button" className={styles.retryBtn} onClick={() => refetchOverview()}>
              Retry
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!overviewData?.overview || !overviewData?.grades?.length) {
    return (
      <main className={`${adminFont.variable} ${styles.shell}`}>
        <div className={styles.content}>
          <div className={styles.header}>
            <h1 className={styles.title}>Curriculum</h1>
            <p className={styles.subtitle}>CBSE-aligned syllabus explorer</p>
          </div>
          <div className={styles.prompt}>
            <div className={styles.promptIcon}><GraduationCap size={28} /></div>
            <p className={styles.promptTitle}>No curriculum data</p>
            <p className={styles.promptText}>No curriculum has been configured yet</p>
          </div>
        </div>
      </main>
    );
  }

  if (selectedGradeId) {
    if (curriculumLoading) {
      return (
        <main className={`${adminFont.variable} ${styles.shell}`}>
          <div className={styles.loading}><div className={styles.loader} /></div>
        </main>
      );
    }

    if (curriculumError) {
      return (
        <main className={`${adminFont.variable} ${styles.shell}`}>
          <div className={styles.content}>
            <div className={styles.header}>
              <button type="button" className={styles.backBtn} onClick={handleBack} aria-label="Back to overview">
                <ArrowLeft size={18} />
              </button>
              <h1 className={styles.title}>Failed to load</h1>
            </div>
            <div className={styles.prompt}>
              <p className={styles.promptText}>Could not load grade details. Try again.</p>
              <button type="button" className={styles.retryBtn} onClick={() => refetchCurriculum()}>
                Retry
              </button>
            </div>
          </div>
        </main>
      );
    }

    if (curriculum) {
      return (
        <main className={`${adminFont.variable} ${styles.shell}`}>
          <div className={styles.bgGlow} />
          <div className={styles.content}>
            <div className={styles.header}>
              <div className={styles.headerLeft}>
                <button type="button" className={styles.backBtn} onClick={handleBack} aria-label="Back to overview">
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <h1 className={styles.title}>{curriculum.grade}</h1>
                  <p className={styles.subtitle}>{curriculum.subjects.length} subjects | {totalLessons} lessons</p>
                </div>
              </div>
              {selectedGrade && (
                <div
                  className={styles.gradeBadge}
                  style={{ background: `linear-gradient(135deg, ${selectedGrade.fun_score >= 70 ? '#d1fae5,#ecfdf5' : selectedGrade.fun_score >= 40 ? '#fef3c7,#fffbeb' : '#fce7f3,#fdf2f8'})` }}
                >
                  {GRADE_MASCOTS[curriculum.grade] || '\u{1F4DA}'}
                </div>
              )}
            </div>

            <motion.div className={styles.subjectsGrid} variants={CONTAINER} initial="hidden" animate="show">
              {curriculum.subjects.map((subject) => (
                <SubjectCard
                  key={subject.id}
                  subject={subject}
                  isExpanded={expandedSubject === subject.id}
                  onToggle={() => setExpandedSubject(expandedSubject === subject.id ? null : subject.id)}
                />
              ))}
            </motion.div>

            <div className={styles.bottomPad} />
          </div>
        </main>
      );
    }
  }

  return (
    <main className={`${adminFont.variable} ${styles.shell}`}>
      <div className={styles.bgGlow} />
      <div className={styles.content}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Curriculum</h1>
            <p className={styles.subtitle}>CBSE-aligned syllabus explorer</p>
          </div>
        </div>

        {/* KPI Grid */}
        {overviewData.overview && <KpiGrid overview={overviewData.overview} />}

        {/* Grades */}
        <section className={styles.gradesSection}>
          <div className={styles.gradesSectionHeader}>
            <GraduationCap size={16} className={styles.gradesSectionIcon} />
            <h2 className={styles.gradesSectionTitle}>Select a Grade</h2>
            <span className={styles.gradesSectionCount}>{(overviewData.grades || []).length} grades</span>
          </div>

          <motion.div className={styles.gradesGrid} variants={CONTAINER} initial="hidden" animate="show">
            {(overviewData.grades || []).map((grade) => (
              <GradeCard
                key={grade.id}
                grade={grade}
                isSelected={selectedGradeId === grade.id}
                onSelect={() => handleGradeSelect(grade.id)}
              />
            ))}
          </motion.div>
        </section>

        <div className={styles.bottomPad} />
      </div>
    </main>
  );
}
