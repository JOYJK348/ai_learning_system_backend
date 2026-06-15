'use client';

import { useParams, useRouter } from 'next/navigation';
import { Manrope } from 'next/font/google';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  ChevronRight,
  Layers,
  Plus,
  Pencil,
  ShieldCheck,
  Trash2,
  Video,
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


type Level = 'boards' | 'grades' | 'subjects' | 'chapters' | 'lessons';

type CurriculumItem = Record<string, any>;

const levelConfig: Record<Level, { label: string; parentLabel?: string; api: string; placeholder: string }> = {
  boards: { label: 'Board', api: 'boards', placeholder: 'State board, CBSE, IBSE' },
  grades: { label: 'Grade', parentLabel: 'Board', api: 'grades', placeholder: 'Grade 1, Grade 5, Grade 9' },
  subjects: { label: 'Subject', parentLabel: 'Grade', api: 'subjects', placeholder: 'Math, Science, English' },
  chapters: { label: 'Chapter', parentLabel: 'Subject', api: 'chapters', placeholder: 'Numbers, Plant Biology, Grammar' },
  lessons: { label: 'Lesson', parentLabel: 'Chapter', api: 'lessons', placeholder: 'YouTube lesson, practice module or demo' },
};

const statusOptions = [
  { label: 'Active', value: 1 },
  { label: 'Inactive', value: 2 },
];

const resourceOrder: Level[] = ['boards', 'grades', 'subjects', 'chapters', 'lessons'];

function getPreviewImage(videoId: string) {
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

function normalizeYoutubeId(url: string) {
  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
  return match?.[1] ?? url;
}

export default function CurriculumAdminPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const { user, loading } = useAuth();

  const [activeLevel, setActiveLevel] = useState<Level>('boards');

  const [selectedBoardId, setSelectedBoardId] = useState('');
  const [selectedGradeId, setSelectedGradeId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CurriculumItem | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string | number>>({
    name: '',
    code: '',
    description: '',
    age_range: '',
    title: '',
    youtube_video_id: '',
    thumbnail_url: '',
    duration_seconds: '',
    status_id: 1,
  });

  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/${locale}/login`);
    }
  }, [loading, locale, router, user]);

  const queryClient = useQueryClient();

  const { data: boards = [] as CurriculumItem[] } = useQuery<CurriculumItem[]>({
    queryKey: [...adminKeys.boards],
    queryFn: () => adminApi.boards() as Promise<CurriculumItem[]>,
    enabled: !loading && Boolean(user),
    staleTime: 60_000,
  });

  const { data: grades = [] as CurriculumItem[] } = useQuery<CurriculumItem[]>({
    queryKey: [...adminKeys.grades, selectedBoardId, user?.id],
    queryFn: () => adminApi.grades(selectedBoardId) as Promise<CurriculumItem[]>,
    enabled: !!selectedBoardId,
    staleTime: 60_000,
  });

  const { data: subjects = [] as CurriculumItem[] } = useQuery<CurriculumItem[]>({
    queryKey: [...adminKeys.subjects, selectedGradeId, user?.id],
    queryFn: () => adminApi.subjects(selectedGradeId) as Promise<CurriculumItem[]>,
    enabled: !!selectedGradeId,
    staleTime: 60_000,
  });

  const { data: chapters = [] as CurriculumItem[] } = useQuery<CurriculumItem[]>({
    queryKey: [...adminKeys.chapters, selectedSubjectId, user?.id],
    queryFn: () => adminApi.chapters(selectedSubjectId) as Promise<CurriculumItem[]>,
    enabled: !!selectedSubjectId,
    staleTime: 60_000,
  });

  const { data: lessons = [] as CurriculumItem[] } = useQuery<CurriculumItem[]>({
    queryKey: [...adminKeys.lessons, selectedChapterId, user?.id],
    queryFn: () => adminApi.lessons(selectedChapterId) as Promise<CurriculumItem[]>,
    enabled: !!selectedChapterId,
    staleTime: 60_000,
  });

  const currentItems = useMemo(() => {
    switch (activeLevel) {
      case 'boards':
        return boards;
      case 'grades':
        return grades;
      case 'subjects':
        return subjects;
      case 'chapters':
        return chapters;
      case 'lessons':
        return lessons;
      default:
        return [];
    }
  }, [activeLevel, boards, grades, subjects, chapters, lessons]);

  const activeParentId = useMemo(() => {
    switch (activeLevel) {
      case 'grades':
        return selectedBoardId;
      case 'subjects':
        return selectedGradeId;
      case 'chapters':
        return selectedSubjectId;
      case 'lessons':
        return selectedChapterId;
      default:
        return '';
    }
  }, [activeLevel, selectedBoardId, selectedGradeId, selectedSubjectId, selectedChapterId]);

  const parentLabel = levelConfig[activeLevel].parentLabel;
  const canAddCurrent = activeLevel === 'boards' || Boolean(activeParentId);
  const primaryLabel = levelConfig[activeLevel].label;

  const selectedPath = [
    boards.find((board) => board.id === selectedBoardId),
    grades.find((grade) => grade.id === selectedGradeId),
    subjects.find((subject) => subject.id === selectedSubjectId),
    chapters.find((chapter) => chapter.id === selectedChapterId),
  ]
    .filter(Boolean)
    .map((item) => item?.name || item?.title)
    .join(' › ');

  const handleSelectLevel = (level: Level) => {
    setActiveLevel(level);
  };

  const openForm = (item?: CurriculumItem) => {
    setEditingItem(item ?? null);
    setFormOpen(true);
    if (item) {
      setFormValues({
        name: item.name ?? '',
        code: item.code ?? '',
        description: item.description ?? '',
        age_range: item.age_range ?? '',
        title: item.title ?? item.name ?? '',
        youtube_video_id: item.youtube_video_id ?? '',
        thumbnail_url: item.thumbnail_url ?? '',
        duration_seconds: item.duration_seconds ?? '',
        status_id: item.status_id ?? 1,
      });
    } else {
      setFormValues({
        name: '',
        code: '',
        description: '',
        age_range: '',
        title: '',
        youtube_video_id: '',
        thumbnail_url: '',
        duration_seconds: '',
        status_id: 1,
      });
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

  const saveResource = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!primaryLabel) return;
    if (!canAddCurrent) {
      showFeedback(`Select ${parentLabel?.toLowerCase()} first.`);
      return;
    }

    setIsSaving(true);
    const api = levelConfig[activeLevel].api;
    const method = editingItem ? 'PUT' : 'POST';
    const endpoint = editingItem ? `${API_BASE}/api/admin/${api}/${editingItem.id}` : `${API_BASE}/api/admin/${api}`;

    const payload: Record<string, unknown> = {
      name: formValues.name,
      code: formValues.code,
      description: formValues.description,
      age_range: formValues.age_range,
      title: formValues.title,
      youtube_video_id: normalizeYoutubeId(String(formValues.youtube_video_id || '')).trim() || undefined,
      thumbnail_url: formValues.thumbnail_url,
      duration_seconds: Number(formValues.duration_seconds) || undefined,
      status_id: Number(formValues.status_id) || undefined,
    };

    if (activeLevel === 'grades') payload.board_id = selectedBoardId;
    if (activeLevel === 'subjects') payload.grade_id = selectedGradeId;
    if (activeLevel === 'chapters') payload.subject_id = selectedSubjectId;
    if (activeLevel === 'lessons') payload.chapter_id = selectedChapterId;

    if (activeLevel !== 'lessons') {
      payload.title = formValues.name;
    }

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) {
        showFeedback(data?.error ?? 'Could not save item');
      } else {
        showFeedback(`${primaryLabel} ${editingItem ? 'updated' : 'created'} successfully`);
        closeForm();
        queryClient.invalidateQueries({ queryKey: adminKeys.boards });
        queryClient.invalidateQueries({ queryKey: adminKeys.grades });
        queryClient.invalidateQueries({ queryKey: adminKeys.subjects });
        queryClient.invalidateQueries({ queryKey: adminKeys.chapters });
        queryClient.invalidateQueries({ queryKey: adminKeys.lessons });
      }
    } catch (error) {
      showFeedback('Save failed, try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteResource = async (item: CurriculumItem) => {
    const confirm = window.confirm(`Delete ${primaryLabel} “${item.name || item.title}”?`);
    if (!confirm) return;
    const api = levelConfig[activeLevel].api;
    try {
      const response = await fetch(`${API_BASE}/api/admin/${api}/${item.id}`, { method: 'DELETE', credentials: 'include' });
      const data = await response.json();
      if (!response.ok) {
        showFeedback(data?.error ?? 'Delete failed');
      } else {
        showFeedback(`${primaryLabel} deleted`);
        queryClient.invalidateQueries({ queryKey: adminKeys.boards });
        queryClient.invalidateQueries({ queryKey: adminKeys.grades });
        queryClient.invalidateQueries({ queryKey: adminKeys.subjects });
        queryClient.invalidateQueries({ queryKey: adminKeys.chapters });
        queryClient.invalidateQueries({ queryKey: adminKeys.lessons });
      }
    } catch (error) {
      showFeedback('Delete failed, try again.');
    }
  };

  const swapOrder = async (index: number, direction: 'up' | 'down') => {
    const list = [...currentItems];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    const source = list[index];
    const target = list[targetIndex];
    const sourceOrder = Number(source.sort_order ?? index + 1);
    const targetOrder = Number(target.sort_order ?? targetIndex + 1);
    const api = levelConfig[activeLevel].api;

    const first = await fetch(`${API_BASE}/api/admin/${api}/${source.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sort_order: targetOrder }), credentials: 'include',
    });
    const second = await fetch(`${API_BASE}/api/admin/${api}/${target.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sort_order: sourceOrder }), credentials: 'include',
    });
    if (first.ok && second.ok) {
      queryClient.invalidateQueries({ queryKey: adminKeys.boards });
      queryClient.invalidateQueries({ queryKey: adminKeys.grades });
      queryClient.invalidateQueries({ queryKey: adminKeys.subjects });
      queryClient.invalidateQueries({ queryKey: adminKeys.chapters });
      queryClient.invalidateQueries({ queryKey: adminKeys.lessons });
      showFeedback(`${primaryLabel} reordered`);
    }
  };

  if (loading || !user) return null;

  return (
    <main className={`${adminFont.variable} ${styles.shell}`}>
      <div className={styles.breadcrumbs}>
        {resourceOrder.map((level) => {
          const config = levelConfig[level];
          const isActive = level === activeLevel;
          const isComplete =
            (level === 'boards' && Boolean(selectedBoardId)) ||
            (level === 'grades' && Boolean(selectedGradeId)) ||
            (level === 'subjects' && Boolean(selectedSubjectId)) ||
            (level === 'chapters' && Boolean(selectedChapterId)) ||
            level === 'lessons';
          return (
            <button
              key={level}
              type="button"
              className={`${styles.breadcrumbChip} ${isActive ? styles.breadcrumbActive : ''}`}
              onClick={() => handleSelectLevel(level)}
            >
              <span>{config.label}</span>
              {isComplete && <ChevronRight size={14} />}
            </button>
          );
        })}
      </div>

      <section className={styles.pathBanner}>
        <div>
          <p className={styles.pathLabel}>Current path</p>
          <h2 className={styles.pathTitle}>{selectedPath || `Select a ${parentLabel ?? 'Board'} to begin`}</h2>
        </div>
        <p className={styles.pathHint}>
          Manage the selected curriculum level with clean controls for create, update, delete, and reorder.
        </p>
      </section>

      <section className={styles.selectorSection}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.panelEyebrow}>Refine your selection</p>
            <h2 className={styles.sectionTitle}>Choose the active curriculum branch</h2>
          </div>
          <p className={styles.sectionNote}>Select a board, then drill into grade, subject and chapter to unlock the next level of edits and lesson management.</p>
        </div>

        <div className={styles.selectorPanel}>
          <div className={styles.selectorGroup}>
            <label className={styles.fieldLabel}>Board</label>
            <select
              value={selectedBoardId}
              onChange={(event) => {
                setSelectedBoardId(event.target.value);
                setSelectedGradeId('');
                setSelectedSubjectId('');
                setSelectedChapterId('');
              }}
            >
              <option value="">Choose board</option>
              {boards.map((board) => (
                <option key={board.id} value={board.id}>
                  {board.name} {board.code ? `• ${board.code}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.selectorGroup}>
            <label className={styles.fieldLabel}>Grade</label>
            <select
              value={selectedGradeId}
              onChange={(event) => {
                setSelectedGradeId(event.target.value);
                setSelectedSubjectId('');
                setSelectedChapterId('');
              }}
              disabled={!selectedBoardId}
            >
              <option value="">Choose grade</option>
              {grades.map((grade) => (
                <option key={grade.id} value={grade.id}>
                  {grade.name} {grade.code ? `• ${grade.code}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.selectorGroup}>
            <label className={styles.fieldLabel}>Subject</label>
            <select
              value={selectedSubjectId}
              onChange={(event) => {
                setSelectedSubjectId(event.target.value);
                setSelectedChapterId('');
              }}
              disabled={!selectedGradeId}
            >
              <option value="">Choose subject</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name} {subject.code ? `• ${subject.code}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.selectorGroup}>
            <label className={styles.fieldLabel}>Chapter</label>
            <select
              value={selectedChapterId}
              onChange={(event) => setSelectedChapterId(event.target.value)}
              disabled={!selectedSubjectId}
            >
              <option value="">Choose chapter</option>
              {chapters.map((chapter) => (
                <option key={chapter.id} value={chapter.id}>
                  {chapter.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className={styles.summaryGrid}>
        <article className={styles.summaryCard}>
          <div className={styles.summaryCardHead}>
            <BookOpen size={18} />
          </div>
          <p className={styles.summaryLabel}>Boards ready</p>
          <h2>{boards.length}</h2>
          <p className={styles.summaryMeta}>Core curriculum foundations</p>
        </article>
        <article className={styles.summaryCard}>
          <div className={styles.summaryCardHead}>
            <Layers size={18} />
          </div>
          <p className={styles.summaryLabel}>Active path</p>
          <h2>{resourceOrder.indexOf(activeLevel) + 1}/5</h2>
          <p className={styles.summaryMeta}>{primaryLabel} workspace</p>
        </article>
        <article className={styles.summaryCard}>
          <div className={styles.summaryCardHead}>
            <ShieldCheck size={18} />
          </div>
          <p className={styles.summaryLabel}>Current node</p>
          <h2>{currentItems.length}</h2>
          <p className={styles.summaryMeta}>{levelConfig[activeLevel].label}s in view</p>
        </article>
      </section>

      <div className={styles.panelGrid}>
        <section className={styles.tablePanel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.panelEyebrow}>{primaryLabel} table</p>
              <h2 className={styles.panelTitle}>{levelConfig[activeLevel].label} list</h2>
            </div>
            <div className={styles.tableActions}>
              <button
                type="button"
                className={styles.createButton}
                onClick={() => openForm()}
                disabled={!canAddCurrent}
              >
                <Plus size={18} />
                <span>Create {primaryLabel}</span>
              </button>
              {!canAddCurrent && parentLabel && (
                <p className={styles.actionHint}>Select a {parentLabel.toLowerCase()} first</p>
              )}
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{primaryLabel}</th>
                  <th>Status</th>
                  <th>Code / Meta</th>
                  <th className={styles.actionsCell}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length > 0 ? (
                  currentItems.map((item, index) => (
                    <tr key={item.id}>
                      <td>
                        <div className={styles.itemLabel}>
                          <span>{item.name || item.title}</span>
                          <span className={styles.mutedText}>{item.description || item.age_range || item.youtube_video_id || ''}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`${styles.statusPill} ${item.status_id !== 1 ? styles.statusInactive : ''}`}>
                          {item.status_id === 1 ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <span className={styles.codeText}>{item.code || item.youtube_video_id || '—'}</span>
                      </td>
                      <td className={styles.actionsCell}>
                        <div className={styles.actionRow}>
                          {['grades', 'chapters', 'lessons'].includes(activeLevel) && (
                            <>
                              <button type="button" className={styles.iconButton} onClick={() => swapOrder(index, 'up')}>
                                <ArrowUp size={16} />
                              </button>
                              <button type="button" className={styles.iconButton} onClick={() => swapOrder(index, 'down')}>
                                <ArrowDown size={16} />
                              </button>
                            </>
                          )}
                          <button type="button" className={styles.iconButton} onClick={() => openForm(item)}>
                            <Pencil size={16} />
                          </button>
                          <button type="button" className={styles.iconButtonDanger} onClick={() => deleteResource(item)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className={styles.emptyState}>
                      {activeParentId ? `No ${primaryLabel.toLowerCase()} found yet.` : `Select ${parentLabel?.toLowerCase()} to load this level.`}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <aside className={styles.sidePanel}>
          <article className={styles.infoCard}>
            <div className={styles.infoHead}>
              <div>
                <p className={styles.panelEyebrow}>Hierarchy guide</p>
                <h3 className={styles.infoTitle}>Curriculum tree</h3>
              </div>
              <Layers size={22} />
            </div>
            <p className={styles.infoText}>
              Manage your syllabus in one screen. Choose a board first, then narrow down grade, subject and chapter to unlock lesson controls.
            </p>
          </article>

          {activeLevel === 'lessons' && selectedChapterId && (
            <article className={styles.infoCard}>
              <div className={styles.infoHead}>
                <div>
                  <p className={styles.panelEyebrow}>Lesson preview</p>
                  <h3 className={styles.infoTitle}>Media & URL</h3>
                </div>
                <Video size={22} />
              </div>
              {formValues.youtube_video_id ? (
                <div className={styles.lessonPreview}>
                  <img src={getPreviewImage(String(formValues.youtube_video_id)) ?? ''} alt="Lesson thumbnail" />
                  <p className={styles.previewCaption}>Paste a YouTube URL when adding a lesson and preview content instantly.</p>
                </div>
              ) : (
                <p className={styles.infoText}>Pick a chapter and add a lesson to preview the video thumbnail.</p>
              )}
            </article>
          )}

          <article className={styles.infoCardAccent}>
            <div className={styles.infoHead}>
              <div>
                <p className={styles.panelEyebrow}>Pro workflow</p>
                <h3 className={styles.infoTitle}>Fast actions</h3>
              </div>
              <ShieldCheck size={22} />
            </div>
            <ul className={styles.keyList}>
              <li><span>•</span>Select board first to enable grade creation.</li>
              <li><span>•</span>Add chapters after subject selection.</li>
              <li><span>•</span>Lessons support YouTube URL and reorder controls.</li>
            </ul>
          </article>
        </aside>
      </div>

      {formOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.panelEyebrow}>Edit {primaryLabel}</p>
                <h2 className={styles.modalTitle}>{editingItem ? 'Update' : 'Create'} {primaryLabel}</h2>
              </div>
              <button type="button" className={styles.closeButton} onClick={closeForm} aria-label="Close form">
                ✕
              </button>
            </div>
            <form onSubmit={saveResource} className={styles.formGrid}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>{activeLevel === 'lessons' ? 'Lesson title' : 'Name'}</label>
                <input
                  value={formValues.name}
                  onChange={(event) => setFormValues({ ...formValues, name: event.target.value, title: event.target.value })}
                  placeholder={levelConfig[activeLevel].placeholder}
                  required
                />
              </div>
              {['boards', 'grades', 'subjects'].includes(activeLevel) && (
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Code</label>
                  <input
                    value={formValues.code}
                    onChange={(event) => setFormValues({ ...formValues, code: event.target.value })}
                    placeholder="CBSE, IBSE, STEM, HSC"
                  />
                </div>
              )}
              {activeLevel === 'grades' && (
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Age range</label>
                  <input
                    value={formValues.age_range}
                    onChange={(event) => setFormValues({ ...formValues, age_range: event.target.value })}
                    placeholder="8-10 years"
                  />
                </div>
              )}
              {['boards', 'grades', 'subjects', 'chapters', 'lessons'].includes(activeLevel) && (
                <div className={styles.formFieldWide}>
                  <label className={styles.formLabel}>Description</label>
                  <textarea
                    rows={4}
                    value={formValues.description}
                    onChange={(event) => setFormValues({ ...formValues, description: event.target.value })}
                    placeholder="Add a crisp curriculum description."
                  />
                </div>
              )}
              {activeLevel === 'lessons' && (
                <>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>YouTube URL</label>
                    <input
                      value={formValues.youtube_video_id}
                      onChange={(event) => setFormValues({ ...formValues, youtube_video_id: event.target.value })}
                      placeholder="https://youtu.be/VIDEO_ID"
                    />
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Duration (sec)</label>
                    <input
                      value={formValues.duration_seconds}
                      onChange={(event) => setFormValues({ ...formValues, duration_seconds: event.target.value })}
                      placeholder="250"
                      type="number"
                    />
                  </div>
                </>
              )}
              <div className={styles.formField}>
                <label className={styles.formLabel}>Status</label>
                <select
                  value={formValues.status_id}
                  onChange={(event) => setFormValues({ ...formValues, status_id: Number(event.target.value) })}
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formActions}>
                <button type="button" className={styles.secondaryButton} onClick={closeForm}>
                  Cancel
                </button>
                <button type="submit" className={styles.primaryButton} disabled={isSaving}>
                  {editingItem ? 'Save changes' : `Create ${primaryLabel}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {feedback && <div className={styles.toast}>{feedback}</div>}
    </main>
  );
}
