'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Manrope } from 'next/font/google';
import { FormEvent, useEffect, useState } from 'react';
import {
  ChevronRight,
  Save,
  Settings,
  ShieldCheck,
  RotateCcw,
  Clock,
  Target,
  Award,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

const adminFont = Manrope({
  subsets: ['latin'],
  variable: '--admin-font',
  display: 'swap',
});

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? '';

type QuizSettings = {
  pass_mark_percentage: number;
  retry_allowed: boolean;
  max_retries: number;
  default_time_limit_seconds: number;
  randomize_questions: boolean;
  show_explanation: boolean;
  show_correct_answer: boolean;
  points_per_question: number;
  bonus_points_perfect: number;
  negative_marking: boolean;
  negative_mark_value: number;
};

export default function QuizSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const { user, loading } = useAuth();

  const [settings, setSettings] = useState<QuizSettings>({
    pass_mark_percentage: 60,
    retry_allowed: true,
    max_retries: 3,
    default_time_limit_seconds: 30,
    randomize_questions: true,
    show_explanation: true,
    show_correct_answer: true,
    points_per_question: 10,
    bonus_points_perfect: 5,
    negative_marking: false,
    negative_mark_value: 0,
  });

  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/${locale}/login`);
    }
  }, [loading, locale, router, user]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/quizzes/settings`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setSettings(data.data);
      } else {
        console.error('Failed to load settings: bad response', res.status, data);
      }
    } catch (e) {
      console.error('Failed to load settings', e);
    }
  };

  const showFeedback = (message: string) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(null), 3500);
  };

  const saveSettings = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const res = await fetch(`${API_BASE}/api/admin/quizzes/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        showFeedback(data?.error ?? 'Failed to save settings');
      } else {
        showFeedback('Quiz settings saved successfully');
      }
    } catch (e) {
      showFeedback('Save failed, try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSetting = (key: keyof QuizSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <main className={`${adminFont.variable} ${styles.shell}`}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Quiz configuration</p>
          <h1 className={styles.title}>Quiz settings</h1>
          <p className={styles.subtitle}>
            Configure global quiz behavior — pass marks, retries, time limits, scoring rules, and display options for all platform quizzes.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Link href={`/${locale}/admin/quizzes`} className={styles.secondaryButton}>
            <ChevronRight size={16} /> Back to questions
          </Link>
        </div>
      </div>

      <form onSubmit={saveSettings} className={styles.settingsGrid}>
        {/* Pass Mark */}
        <section className={styles.settingsCard}>
          <div className={styles.settingsHeader}>
            <div className={styles.settingsIcon}>
              <Target size={20} />
            </div>
            <div>
              <h3 className={styles.settingsTitle}>Pass criteria</h3>
              <p className={styles.settingsDesc}>Minimum score to pass a quiz</p>
            </div>
          </div>
          <div className={styles.settingsBody}>
            <div className={styles.inputGroup}>
              <label>Pass mark percentage</label>
              <div className={styles.numberInput}>
                <input
                  type="number"
                  value={settings.pass_mark_percentage}
                  onChange={(e) => setSettings({...settings, pass_mark_percentage: Number(e.target.value)})}
                  min="0"
                  max="100"
                />
                <span>%</span>
              </div>
            </div>
          </div>
        </section>

        {/* Retries */}
        <section className={styles.settingsCard}>
          <div className={styles.settingsHeader}>
            <div className={styles.settingsIcon}>
              <RotateCcw size={20} />
            </div>
            <div>
              <h3 className={styles.settingsTitle}>Retry policy</h3>
              <p className={styles.settingsDesc}>Allow students to retake failed quizzes</p>
            </div>
          </div>
          <div className={styles.settingsBody}>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={settings.retry_allowed}
                onChange={() => toggleSetting('retry_allowed')}
              />
              <span className={styles.toggle}></span>
              <span>Allow retries</span>
            </label>
            {settings.retry_allowed && (
              <div className={styles.inputGroup}>
                <label>Max retries</label>
                <input
                  type="number"
                  value={settings.max_retries}
                  onChange={(e) => setSettings({...settings, max_retries: Number(e.target.value)})}
                  min="1"
                  max="10"
                />
              </div>
            )}
          </div>
        </section>

        {/* Time Limit */}
        <section className={styles.settingsCard}>
          <div className={styles.settingsHeader}>
            <div className={styles.settingsIcon}>
              <Clock size={20} />
            </div>
            <div>
              <h3 className={styles.settingsTitle}>Time limits</h3>
              <p className={styles.settingsDesc}>Default timer for each question</p>
            </div>
          </div>
          <div className={styles.settingsBody}>
            <div className={styles.inputGroup}>
              <label>Default time limit (seconds)</label>
              <input
                type="number"
                value={settings.default_time_limit_seconds}
                onChange={(e) => setSettings({...settings, default_time_limit_seconds: Number(e.target.value)})}
                min="5"
                max="300"
              />
            </div>
          </div>
        </section>

        {/* Scoring */}
        <section className={styles.settingsCard}>
          <div className={styles.settingsHeader}>
            <div className={styles.settingsIcon}>
              <Award size={20} />
            </div>
            <div>
              <h3 className={styles.settingsTitle}>Scoring rules</h3>
              <p className={styles.settingsDesc}>Points and bonus configuration</p>
            </div>
          </div>
          <div className={styles.settingsBody}>
            <div className={styles.inputGroup}>
              <label>Points per question</label>
              <input
                type="number"
                                value={settings.points_per_question}
                onChange={(e) => setSettings({...settings, points_per_question: Number(e.target.value)})}
                min="1"
                max="100"
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Bonus for perfect score</label>
              <input
                type="number"
                value={settings.bonus_points_perfect}
                onChange={(e) => setSettings({...settings, bonus_points_perfect: Number(e.target.value)})}
                min="0"
                max="50"
              />
            </div>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={settings.negative_marking}
                onChange={() => toggleSetting('negative_marking')}
              />
              <span className={styles.toggle}></span>
              <span>Enable negative marking</span>
            </label>
            {settings.negative_marking && (
              <div className={styles.inputGroup}>
                <label>Negative mark value</label>
                <input
                  type="number"
                  value={settings.negative_mark_value}
                  onChange={(e) => setSettings({...settings, negative_mark_value: Number(e.target.value)})}
                  min="0"
                  max="10"
                  step="0.5"
                />
              </div>
            )}
          </div>
        </section>

        {/* Display Options */}
        <section className={styles.settingsCard}>
          <div className={styles.settingsHeader}>
            <div className={styles.settingsIcon}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className={styles.settingsTitle}>Display options</h3>
              <p className={styles.settingsDesc}>What students see after answering</p>
            </div>
          </div>
          <div className={styles.settingsBody}>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={settings.randomize_questions}
                onChange={() => toggleSetting('randomize_questions')}
              />
              <span className={styles.toggle}></span>
              <span>Randomize question order</span>
            </label>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={settings.show_explanation}
                onChange={() => toggleSetting('show_explanation')}
              />
              <span className={styles.toggle}></span>
              <span>Show explanation after answer</span>
            </label>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={settings.show_correct_answer}
                onChange={() => toggleSetting('show_correct_answer')}
              />
              <span className={styles.toggle}></span>
              <span>Highlight correct answer</span>
            </label>
          </div>
        </section>

        {/* Save Button */}
        <div className={styles.formActions}>
          <button type="button" className={styles.secondaryButton} onClick={() => router.push(`/${locale}/admin/quizzes`)}>
            Cancel
          </button>
          <button type="submit" className={styles.primaryButton} disabled={isSaving}>
            <Save size={16} /> {isSaving ? 'Saving...' : 'Save settings'}
          </button>
        </div>
      </form>

      {feedback && <div className={styles.toast}>{feedback}</div>}
    </main>
  );
}