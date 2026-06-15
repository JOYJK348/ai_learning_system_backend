'use client';

import { Manrope } from 'next/font/google';
import { useParams, useRouter } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Brush,
  CheckCircle2,
  Gamepad2,
  Hand,
  Layers,
  MousePointer2,
  Pencil,
  Plus,
  Puzzle,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminKeys } from '@/core/constants/queryKeys';
import { adminApi } from '@/core/services/adminApi';
import styles from './page.module.css';

const adminFont = Manrope({ subsets: ['latin'], variable: '--admin-font', display: 'swap' });
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? '';


type Item = Record<string, any>;
type FormState = {
  id?: string;
  name: string;
  activity_type_id: string;
  lesson_id: string;
  status_id: number;
  difficulty: string;
  theme: string;
  time_limit: string;
  attempts: string;
  pass_accuracy: string;
  reward_stars: string;
  mechanic: string;
};

const initialForm: FormState = {
  name: '',
  activity_type_id: '',
  lesson_id: '',
  status_id: 1,
  difficulty: 'easy',
  theme: 'rainbow',
  time_limit: '60',
  attempts: '3',
  pass_accuracy: '80',
  reward_stars: '3',
  mechanic: 'Guided first try with instant feedback',
};

const typeIcons: Record<string, any> = {
  tracing: Brush,
  drag_drop: Hand,
  match: Puzzle,
  tap_select: MousePointer2,
};

async function api(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...options,
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

export default function ActivitiesPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [preview, setPreview] = useState<FormState | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push(`/${locale}/login`);
  }, [loading, locale, router, user]);

  const { data: activitiesData } = useQuery({
    queryKey: adminKeys.activities,
    queryFn: () => adminApi.activities() as Promise<any>,
    staleTime: 60_000,
    enabled: !!user,
  });
  const activities: Item[] = Array.isArray(activitiesData) ? activitiesData : Array.isArray((activitiesData as any)?.data) ? (activitiesData as any).data : [];

  const { data: typesData } = useQuery({
    queryKey: [...adminKeys.activities, 'types'],
    queryFn: () => fetch(`${API_BASE}/api/admin/activity-types`, { credentials: 'include' }).then(r => r.json()).then(d => d.data ?? []),
    staleTime: 60_000,
    enabled: !!user,
  });
  const types: Item[] = Array.isArray(typesData) ? typesData : [];

  const { data: lessonsData } = useQuery({
    queryKey: [...adminKeys.activities, 'lessons'],
    queryFn: () => fetch(`${API_BASE}/api/admin/lessons`, { credentials: 'include' }).then(r => r.json()).then(d => d.data ?? []),
    staleTime: 60_000,
    enabled: !!user,
  });
  const lessons: Item[] = Array.isArray(lessonsData) ? lessonsData : [];

  const stats = useMemo(() => ({
    total: activities.length,
    live: activities.filter((a) => Number(a.status_id) === 1).length,
    types: new Set(activities.map((a) => a.activity_type_id)).size,
    lessons: new Set(activities.map((a) => a.lesson_id)).size,
  }), [activities]);

  const toast = (message: string) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(null), 3000);
  };

  const openCreate = () => {
    setForm({ ...initialForm, activity_type_id: types[0]?.id ? String(types[0].id) : '' });
    setFormOpen(true);
  };

  const openEdit = (activity: Item) => {
    const config = activity.config ?? {};
    setForm({
      id: activity.id,
      name: activity.name ?? '',
      activity_type_id: String(activity.activity_type_id ?? ''),
      lesson_id: activity.lesson_id ?? '',
      status_id: Number(activity.status_id) || 1,
      difficulty: config.difficulty ?? 'easy',
      theme: config.theme ?? 'rainbow',
      time_limit: String(config.time_limit ?? '60'),
      attempts: String(config.attempts ?? '3'),
      pass_accuracy: String(config.pass_accuracy ?? '80'),
      reward_stars: String(config.reward_stars ?? '3'),
      mechanic: config.mechanic ?? 'Guided first try with instant feedback',
    });
    setFormOpen(true);
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name || !form.lesson_id || !form.activity_type_id) return toast('Name, type and lesson are required.');
    setSaving(true);
    const payload = {
      name: form.name,
      lesson_id: form.lesson_id,
      activity_type_id: Number(form.activity_type_id),
      status_id: form.status_id,
      config: {
        difficulty: form.difficulty,
        theme: form.theme,
        time_limit: Number(form.time_limit) || 0,
        attempts: Number(form.attempts) || 0,
        pass_accuracy: Number(form.pass_accuracy) || 80,
        reward_stars: Number(form.reward_stars) || 3,
        mechanic: form.mechanic,
      },
    };
    const path = form.id ? `/api/admin/activities/${form.id}` : '/api/admin/activities';
    const { res, data } = await api(path, { method: form.id ? 'PUT' : 'POST', body: JSON.stringify(payload) });
    setSaving(false);
    if (!res.ok) return toast(data.error ?? 'Save failed');
    setFormOpen(false);
    toast(form.id ? 'Activity updated' : 'Activity created');
    queryClient.invalidateQueries({ queryKey: adminKeys.activities });
  };

  const remove = async (activity: Item) => {
    if (!window.confirm(`Delete ${activity.name}?`)) return;
    const { res, data } = await api(`/api/admin/activities/${activity.id}`, { method: 'DELETE' });
    if (!res.ok) return toast(data.error ?? 'Delete failed');
    toast('Activity deleted');
    queryClient.invalidateQueries({ queryKey: adminKeys.activities });
  };

  if (loading || !user) return null;

  return (
    <main className={`${adminFont.variable} ${styles.shell}`}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Play Lab</p>
          <h1>Activity Management</h1>
          <p>Design learn-while-playing tasks that feel like mini games, not homework.</p>
          <button className={styles.primaryButton} onClick={openCreate}><Plus size={18} /> Create activity</button>
        </div>
        <div className={styles.playStage}>
          <Sparkles size={32} />
          <strong>Play first</strong>
          <span>Trace, drag, match, tap, reward</span>
        </div>
      </section>

      <section className={styles.stats}>
        <article><Gamepad2 size={20} /><span>Total</span><b>{stats.total}</b></article>
        <article><CheckCircle2 size={20} /><span>Live</span><b>{stats.live}</b></article>
        <article><Wand2 size={20} /><span>Types used</span><b>{stats.types}</b></article>
        <article><Layers size={20} /><span>Lessons linked</span><b>{stats.lessons}</b></article>
      </section>

      <section className={styles.board}>
        <div className={styles.boardHead}>
          <div><p className={styles.eyebrow}>Activity library</p><h2>Game-like practice hub</h2></div>
          <button className={styles.primaryButton} onClick={openCreate}><Plus size={18} /> New</button>
        </div>
        <div className={styles.grid}>
          {activities.length ? activities.map((activity) => {
            const type = activity.type;
            const Icon = typeIcons[type?.code] ?? Gamepad2;
            return (
              <article key={activity.id} className={styles.card}>
                <div className={styles.cardIcon}><Icon size={24} /></div>
                <div>
                  <p>{type?.name ?? 'Activity'}</p>
                  <h3>{activity.name}</h3>
                  <span>{activity.lesson?.title ?? 'Linked lesson'}</span>
                </div>
                <div className={styles.configLine}>
                  <b>{activity.config?.theme ?? 'creative'}</b>
                  <b>{activity.config?.difficulty ?? 'easy'}</b>
                  <b>{activity.config?.reward_stars ?? 3} stars</b>
                </div>
                <div className={styles.cardActions}>
                  <button onClick={() => setPreview({
                    ...initialForm,
                    ...activity.config,
                    name: activity.name,
                    activity_type_id: String(activity.activity_type_id),
                    lesson_id: activity.lesson_id,
                  })}>Preview</button>
                  <button onClick={() => openEdit(activity)}><Pencil size={16} /></button>
                  <button onClick={() => remove(activity)}><Trash2 size={16} /></button>
                </div>
              </article>
            );
          }) : (
            <div className={styles.empty}><Gamepad2 size={42} /><h3>No activities yet</h3><p>Create the first mini game from real lesson data.</p></div>
          )}
        </div>
      </section>

      {formOpen && (
        <div className={styles.modal}>
          <form className={styles.form} onSubmit={save}>
            <div className={styles.modalHead}><div><p className={styles.eyebrow}>{form.id ? 'Edit' : 'Create'}</p><h2>Activity builder</h2></div><button type="button" onClick={() => setFormOpen(false)}><X /></button></div>
            <label className={styles.wide}><span>Name</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Rainbow Letter Trace" /></label>
            <label><span>Type</span><select value={form.activity_type_id} onChange={(e) => setForm({ ...form, activity_type_id: e.target.value })}>{types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
            <label><span>Lesson</span><select value={form.lesson_id} onChange={(e) => setForm({ ...form, lesson_id: e.target.value })}><option value="">Choose lesson</option>{lessons.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}</select></label>
            <label><span>Difficulty</span><select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label>
            <label><span>Theme</span><select value={form.theme} onChange={(e) => setForm({ ...form, theme: e.target.value })}><option value="rainbow">Rainbow</option><option value="sand">Sand</option><option value="glow">Glow</option><option value="space">Space</option><option value="garden">Garden</option></select></label>
            <label><span>Time limit</span><input value={form.time_limit} onChange={(e) => setForm({ ...form, time_limit: e.target.value })} type="number" /></label>
            <label><span>Attempts</span><input value={form.attempts} onChange={(e) => setForm({ ...form, attempts: e.target.value })} type="number" /></label>
            <label><span>Pass %</span><input value={form.pass_accuracy} onChange={(e) => setForm({ ...form, pass_accuracy: e.target.value })} type="number" /></label>
            <label><span>Stars</span><input value={form.reward_stars} onChange={(e) => setForm({ ...form, reward_stars: e.target.value })} type="number" /></label>
            <label className={styles.wide}><span>Play mechanic</span><textarea value={form.mechanic} onChange={(e) => setForm({ ...form, mechanic: e.target.value })} rows={4} /></label>
            <div className={styles.formActions}><button type="button" onClick={() => setPreview(form)}>Preview</button><button disabled={saving}>{saving ? 'Saving...' : 'Save to DB'}</button></div>
          </form>
        </div>
      )}

      {preview && (
        <div className={styles.modal}>
          <div className={styles.preview}>
            <button className={styles.previewClose} onClick={() => setPreview(null)}><X /></button>
            <p className={styles.eyebrow}>Student preview</p>
            <h2>{preview.name || 'Activity preview'}</h2>
            <div className={styles.gameCanvas}><Sparkles /><strong>{preview.theme}</strong><span>{preview.mechanic}</span></div>
            <div className={styles.rewardRow}><b>{preview.reward_stars} stars</b><b>{preview.pass_accuracy}% pass</b><b>{preview.time_limit}s</b></div>
          </div>
        </div>
      )}

      {feedback && <div className={styles.toast}>{feedback}</div>}
    </main>
  );
}
