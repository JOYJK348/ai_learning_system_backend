'use client';

import { Manrope } from 'next/font/google';
import { useParams, useRouter } from 'next/navigation';
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clapperboard,
  Eye,
  Film,
  Layers,
  Link2,
  Pencil,
  Play,
  Plus,
  Upload,
  X,
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


type Item = Record<string, any>;
type StatusValue = 1 | 2;

type FormState = {
  mode: 'attach' | 'create';
  board_id: string;
  grade_id: string;
  subject_id: string;
  chapter_id: string;
  lesson_id: string;
  title: string;
  youtube_url: string;
  duration_seconds: string;
  status_id: StatusValue;
};

const initialForm: FormState = {
  mode: 'attach',
  board_id: '',
  grade_id: '',
  subject_id: '',
  chapter_id: '',
  lesson_id: '',
  title: '',
  youtube_url: '',
  duration_seconds: '',
  status_id: 1,
};

function extractYoutubeId(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
  return match?.[1] ?? trimmed;
}

function youtubeThumb(id: string) {
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
}

function youtubeWatch(id: string) {
  return id ? `https://www.youtube.com/watch?v=${id}` : '';
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

export default function VideoManagementPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const { user, loading } = useAuth();

  const queryClient = useQueryClient();

  const [grades, setGrades] = useState<Item[]>([]);
  const [subjects, setSubjects] = useState<Item[]>([]);
  const [chapters, setChapters] = useState<Item[]>([]);
  const [lessons, setLessons] = useState<Item[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [formOpen, setFormOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Item | null>(null);
  const [previewLesson, setPreviewLesson] = useState<Item | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');

  useEffect(() => {
    if (!loading && !user) router.push(`/${locale}/login`);
  }, [loading, locale, router, user]);

  const { data: boards = [] } = useQuery<Item[]>({
    queryKey: [...adminKeys.videos, 'boards'],
    queryFn: () => fetch(`${API_BASE}/api/admin/boards`, { credentials: 'include' }).then(r => r.json()).then(d => d.data ?? []),
    staleTime: 60_000,
  });

  const { data: libraryData } = useQuery({
    queryKey: adminKeys.videos,
    queryFn: () => adminApi.videos() as Promise<any>,
    staleTime: 60_000,
    enabled: !!user,
  });
  const library: Item[] = Array.isArray(libraryData) ? libraryData : Array.isArray((libraryData as any)?.data) ? (libraryData as any).data : [];

  useEffect(() => {
    if (!form.board_id) {
      setGrades([]);
      return;
    }
    apiFetch(`/api/admin/grades?board_id=${form.board_id}`).then(({ response, data }) => {
      if (response.ok) setGrades(data.data ?? []);
    });
  }, [form.board_id]);

  useEffect(() => {
    if (!form.grade_id) {
      setSubjects([]);
      return;
    }
    apiFetch(`/api/admin/subjects?grade_id=${form.grade_id}`).then(({ response, data }) => {
      if (response.ok) setSubjects(data.data ?? []);
    });
  }, [form.grade_id]);

  useEffect(() => {
    if (!form.subject_id) {
      setChapters([]);
      return;
    }
    apiFetch(`/api/admin/chapters?subject_id=${form.subject_id}`).then(({ response, data }) => {
      if (response.ok) setChapters(data.data ?? []);
    });
  }, [form.subject_id]);

  useEffect(() => {
    if (!form.chapter_id) {
      setLessons([]);
      return;
    }
    apiFetch(`/api/admin/lessons?chapter_id=${form.chapter_id}`).then(({ response, data }) => {
      if (response.ok) setLessons(data.data ?? []);
    });
  }, [form.chapter_id]);

  const stats = useMemo(() => {
    const withVideo = library.filter((lesson) => lesson.youtube_video_id).length;
    const active = library.filter((lesson) => Number(lesson.status_id) === 1).length;
    return {
      total: library.length,
      withVideo,
      missing: Math.max(library.length - withVideo, 0),
      active,
    };
  }, [library]);

  const showFeedback = (message: string) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(null), 3500);
  };

  const resetChildren = (updates: Partial<FormState>) => {
    setForm((current) => ({ ...current, ...updates }));
  };

  const openCreate = () => {
    setEditingLesson(null);
    setForm(initialForm);
    setFormOpen(true);
  };

  const openEdit = (lesson: Item) => {
    setEditingLesson(lesson);
    setForm({
      ...initialForm,
      mode: 'attach',
      chapter_id: lesson.chapter_id ?? '',
      lesson_id: lesson.id,
      title: lesson.title ?? '',
      youtube_url: lesson.youtube_video_id ? youtubeWatch(lesson.youtube_video_id) : '',
      duration_seconds: lesson.duration_seconds ? String(lesson.duration_seconds) : '',
      status_id: Number(lesson.status_id) === 2 ? 2 : 1,
    });
    setFormOpen(true);
  };

  const saveVideo = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const videoId = extractYoutubeId(form.youtube_url);
    if (!videoId) {
      showFeedback('Paste a valid YouTube URL or video ID.');
      return;
    }

    setSaving(true);
    const payload = {
      title: form.title.trim(),
      youtube_video_id: videoId,
      thumbnail_url: youtubeThumb(videoId),
      duration_seconds: Number(form.duration_seconds) || undefined,
      status_id: form.status_id,
    };

    try {
      if (editingLesson || form.mode === 'attach') {
        const lessonId = editingLesson?.id ?? form.lesson_id;
        if (!lessonId) {
          showFeedback('Select a lesson to attach this video.');
          return;
        }
        const { response, data } = await apiFetch(`/api/admin/lessons/${lessonId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        if (!response.ok) showFeedback(data.error ?? 'Video update failed');
        else {
          showFeedback('Video linked to lesson');
          setFormOpen(false);
          queryClient.invalidateQueries({ queryKey: adminKeys.videos });
        }
      } else {
        if (!form.chapter_id || !form.title.trim()) {
          showFeedback('Select a chapter and enter a title.');
          return;
        }
        const { response, data } = await apiFetch('/api/admin/lessons', {
          method: 'POST',
          body: JSON.stringify({ ...payload, chapter_id: form.chapter_id }),
        });
        if (!response.ok) showFeedback(data.error ?? 'Video lesson creation failed');
        else {
          showFeedback('Video lesson created');
          setFormOpen(false);
          queryClient.invalidateQueries({ queryKey: adminKeys.videos });
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleBulkUpload = async () => {
    const rows = bulkText
      .split(/\r?\n/)
      .map((row) => row.trim())
      .filter(Boolean)
      .map((row) => row.split(',').map((cell) => cell.trim()));

    if (!rows.length) {
      showFeedback('Paste CSV rows first.');
      return;
    }

    setSaving(true);
    let success = 0;
    for (const [title, youtubeUrl, chapterId, statusId] of rows) {
      const videoId = extractYoutubeId(youtubeUrl ?? '');
      if (!title || !videoId || !chapterId) continue;
      const { response } = await apiFetch('/api/admin/lessons', {
        method: 'POST',
        body: JSON.stringify({
          title,
          chapter_id: chapterId,
          youtube_video_id: videoId,
          thumbnail_url: youtubeThumb(videoId),
          status_id: Number(statusId) || 1,
        }),
      });
      if (response.ok) success += 1;
    }
    setSaving(false);
    setBulkOpen(false);
    setBulkText('');
    showFeedback(`${success} video lesson${success === 1 ? '' : 's'} imported`);
    queryClient.invalidateQueries({ queryKey: adminKeys.videos });
  };

  if (loading || !user) return null;

  return (
    <main className={`${adminFont.variable} ${styles.shell}`}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Animation Video Hub</p>
          <h1 className={styles.title}>Video Management</h1>
          <p className={styles.subtitle}>
            A production desk for every animated learning video linked to your curriculum lessons.
          </p>
          <div className={styles.heroActions}>
            <button type="button" className={styles.primaryButton} onClick={openCreate}>
              <Plus size={18} /> Add video
            </button>
            <button type="button" className={styles.secondaryButton} onClick={() => setBulkOpen(true)}>
              <Upload size={18} /> Bulk CSV
            </button>
          </div>
        </div>
        <div className={styles.previewStage}>
          <div className={styles.reelCard}>
            <Film size={34} />
            <strong>{stats.withVideo}</strong>
            <span>videos online</span>
          </div>
          <div className={styles.reelStrip}>
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      </section>

      <section className={styles.statsGrid}>
        <article><Clapperboard size={20} /><span>Total lessons</span><strong>{stats.total}</strong></article>
        <article><Play size={20} /><span>Videos linked</span><strong>{stats.withVideo}</strong></article>
        <article><Link2 size={20} /><span>Needs video</span><strong>{stats.missing}</strong></article>
        <article><CheckCircle2 size={20} /><span>Active</span><strong>{stats.active}</strong></article>
      </section>

      <section className={styles.libraryPanel}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.eyebrow}>Video Library</p>
            <h2>Lesson-linked video catalogue</h2>
          </div>
          <button type="button" className={styles.primaryButton} onClick={openCreate}>
            <Plus size={18} /> Add video
          </button>
        </div>

        <div className={styles.videoGrid}>
          {library.length ? (
            library.map((lesson) => {
              const videoId = lesson.youtube_video_id ?? '';
              return (
                <article key={lesson.id} className={styles.videoCard}>
                  <div className={styles.thumb}>
                    {videoId ? <img src={youtubeThumb(videoId)} alt="" /> : <BookOpen size={34} />}
                    {videoId && (
                      <button type="button" className={styles.playButton} onClick={() => setPreviewLesson(lesson)} aria-label="Preview video">
                        <Play size={18} />
                      </button>
                    )}
                  </div>
                  <div className={styles.videoBody}>
                    <div>
                      <p className={styles.videoMeta}>Linked Lesson</p>
                      <h3>{lesson.title}</h3>
                    </div>
                    <p className={styles.videoUrl}>{videoId ? youtubeWatch(videoId) : 'No YouTube video linked yet'}</p>
                    <div className={styles.cardFooter}>
                      <span className={Number(lesson.status_id) === 1 ? styles.statusActive : styles.statusInactive}>
                        {Number(lesson.status_id) === 1 ? 'Active' : 'Inactive'}
                      </span>
                      <div className={styles.cardActions}>
                        {videoId && <button type="button" onClick={() => setPreviewLesson(lesson)}><Eye size={16} /></button>}
                        <button type="button" onClick={() => openEdit(lesson)}><Pencil size={16} /></button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div className={styles.emptyState}>
              <Film size={42} />
              <h3>No lessons found</h3>
              <p>Create curriculum lessons first, then attach animation videos here.</p>
            </div>
          )}
        </div>
      </section>

      {formOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.eyebrow}>{editingLesson ? 'Edit video' : 'Add video'}</p>
                <h2>{editingLesson ? 'Update linked lesson video' : 'Create or attach a lesson video'}</h2>
              </div>
              <button type="button" className={styles.closeButton} onClick={() => setFormOpen(false)}><X size={20} /></button>
            </div>

            {!editingLesson && (
              <div className={styles.modeSwitch}>
                <button type="button" className={form.mode === 'attach' ? styles.modeActive : ''} onClick={() => setForm({ ...form, mode: 'attach' })}>
                  Attach to lesson
                </button>
                <button type="button" className={form.mode === 'create' ? styles.modeActive : ''} onClick={() => setForm({ ...form, mode: 'create' })}>
                  Create video lesson
                </button>
              </div>
            )}

            <form className={styles.formGrid} onSubmit={saveVideo}>
              {!editingLesson && (
                <>
                  <label>
                    <span>Board</span>
                    <select value={form.board_id} onChange={(event) => resetChildren({ board_id: event.target.value, grade_id: '', subject_id: '', chapter_id: '', lesson_id: '' })}>
                      <option value="">Choose board</option>
                      {boards.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                  </label>
                  <label>
                    <span>Grade</span>
                    <select value={form.grade_id} disabled={!form.board_id} onChange={(event) => resetChildren({ grade_id: event.target.value, subject_id: '', chapter_id: '', lesson_id: '' })}>
                      <option value="">Choose grade</option>
                      {grades.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                  </label>
                  <label>
                    <span>Subject</span>
                    <select value={form.subject_id} disabled={!form.grade_id} onChange={(event) => resetChildren({ subject_id: event.target.value, chapter_id: '', lesson_id: '' })}>
                      <option value="">Choose subject</option>
                      {subjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                  </label>
                  <label>
                    <span>Chapter</span>
                    <select value={form.chapter_id} disabled={!form.subject_id} onChange={(event) => resetChildren({ chapter_id: event.target.value, lesson_id: '' })}>
                      <option value="">Choose chapter</option>
                      {chapters.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                  </label>
                  {form.mode === 'attach' && (
                    <label className={styles.wideField}>
                      <span>Linked lesson</span>
                      <select value={form.lesson_id} disabled={!form.chapter_id} onChange={(event) => {
                        const lesson = lessons.find((item) => item.id === event.target.value);
                        setForm({ ...form, lesson_id: event.target.value, title: lesson?.title ?? '' });
                      }}>
                        <option value="">Choose lesson</option>
                        {lessons.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                      </select>
                    </label>
                  )}
                </>
              )}

              <label className={styles.wideField}>
                <span>Title</span>
                <input value={form.title} disabled={form.mode === 'attach' && !editingLesson} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Animated Numbers Intro" required />
              </label>
              <label className={styles.wideField}>
                <span>YouTube URL</span>
                <input value={form.youtube_url} onChange={(event) => setForm({ ...form, youtube_url: event.target.value })} placeholder="https://youtu.be/VIDEO_ID" required />
              </label>
              <label>
                <span>Duration seconds</span>
                <input type="number" value={form.duration_seconds} onChange={(event) => setForm({ ...form, duration_seconds: event.target.value })} placeholder="180" />
              </label>
              <label>
                <span>Status</span>
                <select value={form.status_id} onChange={(event) => setForm({ ...form, status_id: Number(event.target.value) as StatusValue })}>
                  <option value={1}>Active</option>
                  <option value={2}>Inactive</option>
                </select>
              </label>
              <div className={styles.formActions}>
                <button type="button" className={styles.secondaryButton} onClick={() => setFormOpen(false)}>Cancel</button>
                <button type="submit" className={styles.primaryButton} disabled={saving}>{saving ? 'Saving...' : 'Save video'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {previewLesson?.youtube_video_id && (
        <div className={styles.modalOverlay}>
          <div className={styles.playerModal}>
            <button type="button" className={styles.closeButton} onClick={() => setPreviewLesson(null)}><X size={20} /></button>
            <iframe
              src={`https://www.youtube.com/embed/${previewLesson.youtube_video_id}`}
              title={previewLesson.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {bulkOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.eyebrow}>Bulk upload</p>
                <h2>CSV animation importer</h2>
              </div>
              <button type="button" className={styles.closeButton} onClick={() => setBulkOpen(false)}><X size={20} /></button>
            </div>
            <div className={styles.bulkBody}>
              <p>CSV format: <strong>title,youtube_url,chapter_id,status_id</strong></p>
              <textarea value={bulkText} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setBulkText(event.target.value)} rows={9} placeholder="Numbers Intro,https://youtu.be/VIDEO_ID,chapter_uuid,1" />
              <button type="button" className={styles.primaryButton} onClick={handleBulkUpload} disabled={saving}>
                Import videos
              </button>
            </div>
          </div>
        </div>
      )}

      {feedback && <div className={styles.toast}>{feedback}</div>}
    </main>
  );
}
