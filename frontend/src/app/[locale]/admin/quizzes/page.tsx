'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Manrope } from 'next/font/google';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  ChevronRight,
  Clock,
  Eye,
  Layers,
  Plus,
  Pencil,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Settings,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Timer,
  Filter,
  Search,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminKeys } from '@/core/constants/queryKeys';
import { adminApi } from '@/core/services/adminApi';
import styles from './page.module.css';

const adminFont = Manrope({
  subsets: ['latin'],
  variable: '--admin-font',
  display: 'swap',
});

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? '';


type Quiz = {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  lesson_id: string;
  lesson_title?: string;
  grade_name?: string;
  subject_name?: string;
  status_id: number;
  difficulty: 'easy' | 'medium' | 'hard';
  time_limit_seconds?: number;
  points: number;
  explanation?: string;
  created_at: string;
};

async function apiFetch<T>(path: string): Promise<T[]> {
  const res = await fetch(`${API_BASE}${path}`, { credentials: 'include' });
  const data = await res.json();
  if (!res.ok || !Array.isArray(data.data)) {
    throw new Error(`Failed to load ${path}`);
  }
  return data.data;
}

type Lesson = {
  id: string;
  title: string;
  chapter_id: string;
};

type Chapter = {
  id: string;
  name: string;
  subject_id: string;
};

type Subject = {
  id: string;
  name: string;
  grade_id: string;
};

type Grade = {
  id: string;
  name: string;
  board_id: string;
};

type Board = {
  id: string;
  name: string;
};

const correctAnswerOptions = [
  { label: 'Option A', value: 'A' },
  { label: 'Option B', value: 'B' },
  { label: 'Option C', value: 'C' },
  { label: 'Option D', value: 'D' },
];

const difficultyOptions = [
  { label: 'Easy', value: 'easy' },
  { label: 'Medium', value: 'medium' },
  { label: 'Hard', value: 'hard' },
];

const statusOptions = [
  { label: 'Active', value: 1 },
  { label: 'Inactive', value: 2 },
];

export default function QuizAdminPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const { user, loading } = useAuth();

  // Filters
  const [selectedBoardId, setSelectedBoardId] = useState('');
  const [selectedGradeId, setSelectedGradeId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');

  // Form
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Quiz | null>(null);
  const [previewItem, setPreviewItem] = useState<Quiz | null>(null);
  const [formValues, setFormValues] = useState({
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A' as 'A' | 'B' | 'C' | 'D',
    lesson_id: '',
    status_id: 1,
    difficulty: 'easy' as 'easy' | 'medium' | 'hard',
    time_limit_seconds: '',
    points: '10',
    explanation: '',
  });

  const queryClient = useQueryClient();

  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { data: quizzesData } = useQuery({
    queryKey: adminKeys.quizzes,
    queryFn: () => adminApi.quizzes() as Promise<any>,
    staleTime: 60_000,
    enabled: !!user,
  });
  const rawQuizzes = (quizzesData as any)?.data ?? quizzesData ?? [];
  const quizzes: Quiz[] = Array.isArray(rawQuizzes) ? rawQuizzes : [];

  const { data: boards = [] } = useQuery<Board[]>({
    queryKey: [...adminKeys.curriculum, 'boards'],
    queryFn: () => fetch(`${API_BASE}/api/admin/boards`, { credentials: 'include' }).then(r => r.json()).then(d => d.data ?? []),
  });

  const { data: grades = [] } = useQuery<Grade[]>({
    queryKey: [...adminKeys.curriculum, 'grades', selectedBoardId],
    queryFn: () => fetch(`${API_BASE}/api/admin/grades?board_id=${selectedBoardId}`, { credentials: 'include' }).then(r => r.json()).then(d => d.data ?? []),
    enabled: !!selectedBoardId,
  });

  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: [...adminKeys.curriculum, 'subjects', selectedGradeId],
    queryFn: () => fetch(`${API_BASE}/api/admin/subjects?grade_id=${selectedGradeId}`, { credentials: 'include' }).then(r => r.json()).then(d => d.data ?? []),
    enabled: !!selectedGradeId,
  });

  const { data: chapters = [] } = useQuery<Chapter[]>({
    queryKey: [...adminKeys.curriculum, 'chapters', selectedSubjectId],
    queryFn: () => fetch(`${API_BASE}/api/admin/subjects?subject_id=${selectedSubjectId}`, { credentials: 'include' }).then(r => r.json()).then(d => d.data ?? []),
    enabled: !!selectedSubjectId,
  });

  const { data: lessons = [] } = useQuery<Lesson[]>({
    queryKey: [...adminKeys.curriculum, 'lessons', selectedChapterId],
    queryFn: () => fetch(`${API_BASE}/api/admin/lessons?chapter_id=${selectedChapterId}`, { credentials: 'include' }).then(r => r.json()).then(d => d.data ?? []),
    enabled: !!selectedChapterId,
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/${locale}/login`);
    }
  }, [loading, locale, router, user]);

  const filteredQuizzes = useMemo(() => {
    let filtered = [...quizzes];
    
    if (selectedLessonId) {
      filtered = filtered.filter(q => q.lesson_id === selectedLessonId);
    } else if (selectedChapterId && lessons.length > 0) {
      const lessonIds = lessons.map(l => l.id);
      filtered = filtered.filter(q => lessonIds.includes(q.lesson_id));
    } else if (selectedSubjectId && chapters.length > 0 && lessons.length > 0) {
      const chapterIds = chapters.map(c => c.id);
      const lessonIds = lessons.filter(l => chapterIds.includes(l.chapter_id)).map(l => l.id);
      filtered = filtered.filter(q => lessonIds.includes(q.lesson_id));
    }
    
    if (difficultyFilter) {
      filtered = filtered.filter(q => q.difficulty === difficultyFilter);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(q => 
        q.question_text.toLowerCase().includes(query) ||
        q.explanation?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [quizzes, selectedLessonId, selectedChapterId, selectedSubjectId, difficultyFilter, searchQuery, lessons, chapters]);







  const openForm = (item?: Quiz) => {
    setEditingItem(item ?? null);
    setFormOpen(true);
    if (item) {
      setFormValues({
        question_text: item.question_text,
        option_a: item.option_a,
        option_b: item.option_b,
        option_c: item.option_c,
        option_d: item.option_d,
        correct_answer: item.correct_answer,
        lesson_id: item.lesson_id,
        status_id: item.status_id,
        difficulty: item.difficulty,
        time_limit_seconds: item.time_limit_seconds?.toString() ?? '',
        points: item.points?.toString() ?? '10',
        explanation: item.explanation ?? '',
      });
      // Auto-select hierarchy based on lesson
      const lesson = lessons.find(l => l.id === item.lesson_id);
      if (lesson) {
        setSelectedChapterId(lesson.chapter_id);
        const chapter = chapters.find(c => c.id === lesson.chapter_id);
        if (chapter) {
          setSelectedSubjectId(chapter.subject_id);
          const subject = subjects.find(s => s.id === chapter.subject_id);
          if (subject) {
            setSelectedGradeId(subject.grade_id);
            const grade = grades.find(g => g.id === subject.grade_id);
            if (grade) setSelectedBoardId(grade.board_id);
          }
        }
      }
    } else {
      setFormValues({
        question_text: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_answer: 'A',
        lesson_id: '',
        status_id: 1,
        difficulty: 'easy',
        time_limit_seconds: '',
        points: '10',
        explanation: '',
      });
    }
  };

  // Bulk upload state
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkPreview, setBulkPreview] = useState<Quiz[] | null>(null);
  const [bulkUploading, setBulkUploading] = useState(false);

  const parseCSV = (text: string): Quiz[] => {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return [];
    const header = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1).map(line => line.split(',').map(cell => cell.trim()));
    const out: any[] = [];
    for (const r of rows) {
      const obj: any = {};
      header.forEach((h, i) => { obj[h] = r[i] ?? ''; });
      // map minimal fields
      out.push({
        question_text: obj.question_text || obj.question || '',
        option_a: obj.option_a || obj.a || '',
        option_b: obj.option_b || obj.b || '',
        option_c: obj.option_c || obj.c || '',
        option_d: obj.option_d || obj.d || '',
        correct_answer: (obj.correct_answer || obj.correct || 'A') as 'A'|'B'|'C'|'D',
        lesson_id: obj.lesson_id || obj.lesson || '',
        points: Number(obj.points) || 10,
        explanation: obj.explanation || ''
      });
    }
    return out;
  };

  const handleBulkFile = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const txt = String(e.target?.result || '');
      const parsed = parseCSV(txt);
      setBulkPreview(parsed);
      setBulkOpen(true);
    };
    reader.readAsText(file);
  };

  const uploadBulk = async () => {
    if (!bulkPreview || bulkPreview.length === 0) return showFeedback('No questions to upload');
    setBulkUploading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/quizzes/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: bulkPreview }),
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) {
        console.error('Bulk upload failed', response.status, data);
        showFeedback(data?.error ?? 'Bulk upload failed');
      } else {
        showFeedback(`Uploaded ${bulkPreview.length} questions`);
        setBulkOpen(false);
        setBulkPreview(null);
        queryClient.invalidateQueries({ queryKey: adminKeys.quizzes });
      }
    } catch (e) {
      console.error('Bulk upload exception', e);
      showFeedback('Bulk upload failed');
    } finally {
      setBulkUploading(false);
    }
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingItem(null);
  };

  const showFeedback = (message: string) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(null), 3500);
  };

  const saveQuiz = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formValues.lesson_id) {
      showFeedback('Please select a lesson first.');
      return;
    }

    setIsSaving(true);
    const method = editingItem ? 'PUT' : 'POST';
    const endpoint = editingItem 
      ? `${API_BASE}/api/admin/quizzes/${editingItem.id}` 
      : `${API_BASE}/api/admin/quizzes`;

    const payload = {
      question_text: formValues.question_text,
      option_a: formValues.option_a,
      option_b: formValues.option_b,
      option_c: formValues.option_c,
      option_d: formValues.option_d,
      correct_answer: formValues.correct_answer,
      lesson_id: formValues.lesson_id,
      status_id: Number(formValues.status_id),
      difficulty: formValues.difficulty,
      time_limit_seconds: Number(formValues.time_limit_seconds) || null,
      points: Number(formValues.points) || 10,
      explanation: formValues.explanation || null,
    };

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) {
        console.error('Failed to save quiz', response.status, data);
        showFeedback(data?.error ?? 'Could not save quiz');
      } else {
        showFeedback(`Quiz ${editingItem ? 'updated' : 'created'} successfully`);
        closeForm();
        queryClient.invalidateQueries({ queryKey: adminKeys.quizzes });
      }
    } catch (error) {
      console.error('Save quiz exception', error);
      showFeedback('Save failed, try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteQuiz = async (item: Quiz) => {
    const confirm = window.confirm(`Delete quiz question?\n\n"${item.question_text}"`);
    if (!confirm) return;
    try {
      const response = await fetch(`${API_BASE}/api/admin/quizzes/${item.id}`, { 
        method: 'DELETE', 
        credentials: 'include' 
      });
      const data = await response.json();
      if (!response.ok) {
        showFeedback(data?.error ?? 'Delete failed');
      } else {
        showFeedback('Quiz deleted');
        queryClient.invalidateQueries({ queryKey: adminKeys.quizzes });
      }
    } catch (error) {
      showFeedback('Delete failed, try again.');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return styles.difficultyEasy;
      case 'medium': return styles.difficultyMedium;
      case 'hard': return styles.difficultyHard;
      default: return '';
    }
  };

  const getCorrectAnswerLabel = (answer: string) => {
    switch (answer) {
      case 'A': return formValues.option_a || 'A';
      case 'B': return formValues.option_b || 'B';
      case 'C': return formValues.option_c || 'C';
      case 'D': return formValues.option_d || 'D';
      default: return answer;
    }
  };

  const stats = useMemo(() => ({
    total: quizzes.length,
    active: quizzes.filter(q => q.status_id === 1).length,
    easy: quizzes.filter(q => q.difficulty === 'easy').length,
    medium: quizzes.filter(q => q.difficulty === 'medium').length,
    hard: quizzes.filter(q => q.difficulty === 'hard').length,
  }), [quizzes]);

  return (
    <main className={`${adminFont.variable} ${styles.shell}`}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Quiz manager</p>
          <h1 className={styles.title}>Question bank</h1>
          <p className={styles.subtitle}>
            Create, edit and manage quiz questions for every lesson. Set difficulty, time limits, and correct answers with full curriculum linking.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Link href={`/${locale}/admin`} className={styles.secondaryButton}>
            <ChevronRight size={16} /> Back to dashboard
          </Link>
          <Link href={`/${locale}/admin/quizzes/settings`} className={styles.secondaryButton}>
            <Settings size={16} /> Quiz settings
          </Link>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => openForm()}
          >
            <Plus size={18} /> Add question
          </button>
          <label className={styles.secondaryButton} style={{ cursor: 'pointer', marginLeft: 8 }}>
            <input type="file" accept=".csv" style={{ display: 'none' }} onChange={(e) => handleBulkFile(e.target.files?.[0] ?? null)} />
            <Plus size={16} /> Bulk upload
          </label>
          <button type="button" className={`${styles.secondaryButton} ${styles.smallButton}`} onClick={() => {
            const headers = 'question_text,option_a,option_b,option_c,option_d,correct_answer,lesson_id,points,explanation\n';
            const sample = 'What is 2+2?,1,2,3,4,D,REPLACE_WITH_LESSON_ID,10,Simple math example\n';
            const blob = new Blob([headers+sample], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'quiz_bulk_template.csv';
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
          }} style={{ marginLeft: 8 }}>
            Download CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <section className={styles.selectorSection}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.panelEyebrow}>Filter questions</p>
            <h2 className={styles.sectionTitle}>Find by curriculum path</h2>
          </div>
          <p className={styles.sectionNote}>Narrow down to a specific lesson or filter by difficulty to manage questions efficiently.</p>
        </div>

        <div className={styles.selectorPanel}>
          <div className={styles.selectorGroup}>
            <label className={styles.fieldLabel}>Board</label>
            <select
              value={selectedBoardId}
              onChange={(e) => {
                setSelectedBoardId(e.target.value);
                setSelectedGradeId('');
                setSelectedSubjectId('');
                setSelectedChapterId('');
                setSelectedLessonId('');
              }}
            >
              <option value="">All boards</option>
              {boards.map((board) => (
                <option key={board.id} value={board.id}>{board.name}</option>
              ))}
            </select>
          </div>
          <div className={styles.selectorGroup}>
            <label className={styles.fieldLabel}>Grade</label>
            <select
              value={selectedGradeId}
              onChange={(e) => {
                setSelectedGradeId(e.target.value);
                setSelectedSubjectId('');
                setSelectedChapterId('');
                setSelectedLessonId('');
              }}
              disabled={!selectedBoardId}
            >
              <option value="">All grades</option>
              {grades.map((grade) => (
                <option key={grade.id} value={grade.id}>{grade.name}</option>
              ))}
            </select>
          </div>
          <div className={styles.selectorGroup}>
            <label className={styles.fieldLabel}>Subject</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => {
                setSelectedSubjectId(e.target.value);
                setSelectedChapterId('');
                setSelectedLessonId('');
              }}
              disabled={!selectedGradeId}
            >
              <option value="">All subjects</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
          </div>
          <div className={styles.selectorGroup}>
            <label className={styles.fieldLabel}>Chapter</label>
            <select
              value={selectedChapterId}
              onChange={(e) => {
                setSelectedChapterId(e.target.value);
                setSelectedLessonId('');
              }}
              disabled={!selectedSubjectId}
            >
              <option value="">All chapters</option>
              {chapters.map((chapter) => (
                <option key={chapter.id} value={chapter.id}>{chapter.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.filterRow}>
          <div className={styles.searchGroup}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.filterGroup}>
            <Filter size={16} />
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">All difficulties</option>
              {difficultyOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className={styles.lessonFilterGroup}>
            <label className={styles.fieldLabel}>Lesson</label>
            <select
              value={selectedLessonId}
              onChange={(e) => setSelectedLessonId(e.target.value)}
              disabled={!selectedChapterId}
            >
              <option value="">All lessons</option>
              {lessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>{lesson.title}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className={styles.summaryGrid}>
        <article className={styles.summaryCard}>
          <div className={styles.summaryCardHead}>
            <HelpCircle size={18} />
          </div>
          <p className={styles.summaryLabel}>Total questions</p>
          <h2>{stats.total}</h2>
          <p className={styles.summaryMeta}>In question bank</p>
        </article>
        <article className={styles.summaryCard}>
          <div className={styles.summaryCardHead}>
            <CheckCircle2 size={18} />
          </div>
          <p className={styles.summaryLabel}>Active</p>
          <h2>{stats.active}</h2>
          <p className={styles.summaryMeta}>Published questions</p>
        </article>
        <article className={styles.summaryCard}>
          <div className={styles.summaryCardHead}>
            <Layers size={18} />
          </div>
          <p className={styles.summaryLabel}>Difficulty mix</p>
          <h2>{stats.easy}/{stats.medium}/{stats.hard}</h2>
          <p className={styles.summaryMeta}>Easy / Medium / Hard</p>
        </article>
      </section>

      {/* Table */}
      <div className={styles.panelGrid}>
        <section className={styles.tablePanel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.panelEyebrow}>Question bank</p>
              <h2 className={styles.panelTitle}>All questions</h2>
            </div>
            <div className={styles.tableActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => openForm()}
              >
                <Plus size={16} /> New question
              </button>
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Question</th>
                  <th>Lesson</th>
                  <th>Difficulty</th>
                  <th>Correct</th>
                  <th>Status</th>
                  <th className={styles.actionsCell}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuizzes.length > 0 ? (
                  filteredQuizzes.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className={styles.itemLabel}>
                          <span>{item.question_text}</span>
                          <span className={styles.mutedText}>
                            {item.points} pts • {item.time_limit_seconds ? `${item.time_limit_seconds}s` : 'No timer'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={styles.codeText}>
                          {item.lesson_title || item.lesson_id}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.difficultyPill} ${getDifficultyColor(item.difficulty)}`}>
                          {item.difficulty}
                        </span>
                      </td>
                      <td>
                        <span className={styles.correctAnswer}>
                          <CheckCircle2 size={14} /> {item.correct_answer}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.statusPill} ${item.status_id !== 1 ? styles.statusInactive : ''}`}>
                          {item.status_id === 1 ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className={styles.actionsCell}>
                        <div className={styles.actionRow}>
                          <button 
                            type="button" 
                            className={styles.iconButton} 
                            onClick={() => setPreviewItem(item)}
                            title="Preview"
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            type="button" 
                            className={styles.iconButton} 
                            onClick={() => openForm(item)}
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          <button 
                            type="button" 
                            className={styles.iconButtonDanger} 
                            onClick={() => deleteQuiz(item)}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className={styles.emptyState}>
                      {quizzes.length === 0 
                        ? 'No questions yet. Create your first quiz question!' 
                        : 'No questions match your filters.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Side Panel */}
        <aside className={styles.sidePanel}>
          <article className={styles.infoCard}>
            <div className={styles.infoHead}>
              <div>
                <p className={styles.panelEyebrow}>Quiz guide</p>
                <h3 className={styles.infoTitle}>Question structure</h3>
              </div>
              <HelpCircle size={22} />
            </div>
            <p className={styles.infoText}>
              Each question needs 4 options and 1 correct answer. Link to a specific lesson so students see it after watching the video.
            </p>
          </article>

          <article className={styles.infoCardAccent}>
            <div className={styles.infoHead}>
              <div>
                <p className={styles.panelEyebrow}>Pro tips</p>
                <h3 className={styles.infoTitle}>Best practices</h3>
              </div>
              <ShieldCheck size={22} />
            </div>
            <ul className={styles.keyList}>
              <li><span>•</span>Keep questions clear and age-appropriate</li>
              <li><span>•</span>Use explanations to teach from mistakes</li>
              <li><span>•</span>Mix difficulties for balanced assessment</li>
              <li><span>•</span>Set time limits to build confidence</li>
            </ul>
          </article>
        </aside>
      </div>

      {/* Create/Edit Modal */}
      {formOpen && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalCard} ${styles.modalWide}`}>
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.panelEyebrow}>Edit question</p>
                <h2 className={styles.modalTitle}>{editingItem ? 'Update' : 'Create'} quiz question</h2>
              </div>
              <button type="button" className={styles.closeButton} onClick={closeForm} aria-label="Close form">
                ✕
              </button>
            </div>
            
            <form onSubmit={saveQuiz} className={styles.formGrid}>
              {/* Curriculum Path */}
              <div className={styles.formFieldWide}>
                <label className={styles.formLabel}>Curriculum Path</label>
                <div className={styles.pathSelectors}>
                  <select
                    value={selectedBoardId}
                    onChange={(e) => {
                      setSelectedBoardId(e.target.value);
                      setSelectedGradeId('');
                      setSelectedSubjectId('');
                      setSelectedChapterId('');
                      setSelectedLessonId('');
                      setFormValues({...formValues, lesson_id: ''});
                    }}
                    required
                  >
                    <option value="">Select board</option>
                    {boards.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                  <select
                    value={selectedGradeId}
                    onChange={(e) => {
                      setSelectedGradeId(e.target.value);
                      setSelectedSubjectId('');
                      setSelectedChapterId('');
                      setSelectedLessonId('');
                      setFormValues({...formValues, lesson_id: ''});
                    }}
                    disabled={!selectedBoardId}
                    required
                  >
                    <option value="">Select grade</option>
                    {grades.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => {
                      setSelectedSubjectId(e.target.value);
                      setSelectedChapterId('');
                      setSelectedLessonId('');
                      setFormValues({...formValues, lesson_id: ''});
                    }}
                    disabled={!selectedGradeId}
                    required
                  >
                    <option value="">Select subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <select
                    value={selectedChapterId}
                    onChange={(e) => {
                      setSelectedChapterId(e.target.value);
                      setSelectedLessonId('');
                      setFormValues({...formValues, lesson_id: ''});
                    }}
                    disabled={!selectedSubjectId}
                    required
                  >
                    <option value="">Select chapter</option>
                    {chapters.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <select
                    value={formValues.lesson_id}
                    onChange={(e) => setFormValues({...formValues, lesson_id: e.target.value})}
                    disabled={!selectedChapterId}
                    required
                  >
                    <option value="">Select lesson</option>
                    {lessons.map((l) => (
                      <option key={l.id} value={l.id}>{l.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Question */}
              <div className={styles.formFieldWide}>
                <label className={styles.formLabel}>Question *</label>
                <textarea
                  rows={3}
                  value={formValues.question_text}
                  onChange={(e) => setFormValues({...formValues, question_text: e.target.value})}
                  placeholder="What is the capital of France?"
                  required
                />
              </div>

              {/* Options */}
              <div className={styles.formField}>
                <label className={styles.formLabel}>Option A *</label>
                <input
                  value={formValues.option_a}
                  onChange={(e) => setFormValues({...formValues, option_a: e.target.value})}
                  placeholder="Paris"
                  required
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Option B *</label>
                <input
                  value={formValues.option_b}
                  onChange={(e) => setFormValues({...formValues, option_b: e.target.value})}
                  placeholder="London"
                  required
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Option C *</label>
                <input
                  value={formValues.option_c}
                  onChange={(e) => setFormValues({...formValues, option_c: e.target.value})}
                  placeholder="Berlin"
                  required
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Option D *</label>
                <input
                  value={formValues.option_d}
                  onChange={(e) => setFormValues({...formValues, option_d: e.target.value})}
                  placeholder="Madrid"
                  required
                />
              </div>

              {/* Correct Answer & Settings */}
              <div className={styles.formField}>
                <label className={styles.formLabel}>Correct Answer *</label>
                <select
                  value={formValues.correct_answer}
                  onChange={(e) => setFormValues({...formValues, correct_answer: e.target.value as 'A' | 'B' | 'C' | 'D'})}
                  required
                >
                  {correctAnswerOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} ({formValues[`option_${opt.value.toLowerCase()}` as keyof typeof formValues] || opt.value})
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Difficulty</label>
                <select
                  value={formValues.difficulty}
                  onChange={(e) => setFormValues({...formValues, difficulty: e.target.value as 'easy' | 'medium' | 'hard'})}
                >
                  {difficultyOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Time Limit (seconds)</label>
                <input
                  type="number"
                  value={formValues.time_limit_seconds}
                  onChange={(e) => setFormValues({...formValues, time_limit_seconds: e.target.value})}
                  placeholder="30"
                  min="5"
                  max="300"
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Points</label>
                <input
                  type="number"
                  value={formValues.points}
                  onChange={(e) => setFormValues({...formValues, points: e.target.value})}
                  placeholder="10"
                  min="1"
                  max="100"
                />
              </div>

              {/* Explanation */}
              <div className={styles.formFieldWide}>
                <label className={styles.formLabel}>Explanation (shown after answer)</label>
                <textarea
                  rows={3}
                  value={formValues.explanation}
                  onChange={(e) => setFormValues({...formValues, explanation: e.target.value})}
                  placeholder="Explain why the correct answer is right..."
                />
              </div>

              {/* Status */}
              <div className={styles.formField}>
                <label className={styles.formLabel}>Status</label>
                <select
                  value={formValues.status_id}
                  onChange={(e) => setFormValues({...formValues, status_id: Number(e.target.value)})}
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formActions}>
                <button type="button" className={styles.secondaryButton} onClick={closeForm}>
                  Cancel
                </button>
                <button type="submit" className={styles.primaryButton} disabled={isSaving}>
                  {editingItem ? 'Save changes' : 'Create question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewItem && (
        <div className={styles.modalOverlay} onClick={() => setPreviewItem(null)}>
          <div className={`${styles.modalCard} ${styles.previewCard}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.panelEyebrow}>Student preview</p>
                <h2 className={styles.modalTitle}>Quiz preview</h2>
              </div>
              <button type="button" className={styles.closeButton} onClick={() => setPreviewItem(null)}>
                ✕
              </button>
            </div>
            <div className={styles.previewContent}>
              <div className={styles.previewQuestion}>
                <span className={styles.previewBadge}>{previewItem.difficulty}</span>
                {previewItem.time_limit_seconds && (
                  <span className={styles.previewTimer}>
                    <Timer size={14} /> {previewItem.time_limit_seconds}s
                  </span>
                )}
                <h3>{previewItem.question_text}</h3>
                <p className={styles.previewMeta}>{previewItem.points} points</p>
              </div>
              <div className={styles.previewOptions}>
                {['A', 'B', 'C', 'D'].map((opt) => (
                  <button 
                    key={opt} 
                    className={`${styles.previewOption} ${opt === previewItem.correct_answer ? styles.previewCorrect : ''}`}
                  >
                    <span className={styles.optionLabel}>{opt}</span>
                    <span>{previewItem[`option_${opt.toLowerCase()}` as keyof Quiz]}</span>
                    {opt === previewItem.correct_answer && <CheckCircle2 size={18} className={styles.correctIcon} />}
                  </button>
                ))}
              </div>
              {previewItem.explanation && (
                <div className={styles.previewExplanation}>
                  <h4>Explanation</h4>
                  <p>{previewItem.explanation}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {feedback && <div className={styles.toast}>{feedback}</div>}
    </main>
  );
}
