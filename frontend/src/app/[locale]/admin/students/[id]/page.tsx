'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Manrope } from 'next/font/google';
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Star,
  Trophy,
  BookOpen,
  Clock,
  Calendar,
  TrendingUp,
  Award,
  Activity,
  GraduationCap,
  User,
  Target,
  Flame,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

const adminFont = Manrope({
  subsets: ['latin'],
  variable: '--admin-font',
  display: 'swap',
});

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? '';

type StudentDetail = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  grade_name?: string;
  school_name?: string;
  parent_name?: string;
  date_of_birth?: string;
  photo_url?: string;
  status_id: number;
  total_stars: number;
  badges_count: number;
  lessons_completed: number;
  total_lessons: number;
  quizzes_taken: number;
  quizzes_passed: number;
  avg_score: number;
  total_time_spent_minutes: number;
  streak_days: number;
  last_active?: string;
  joined_at: string;
  subject_progress: {
    subject_name: string;
    completed: number;
    total: number;
    percentage: number;
  }[];
  recent_activity: {
    type: 'lesson' | 'quiz' | 'badge';
    title: string;
    score?: number;
    earned_at: string;
  }[];
  badges: {
    name: string;
    image_url?: string;
    earned_at: string;
  }[];
};

export default function StudentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const studentId = params?.id as string;
  const { user, loading } = useAuth();

  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/${locale}/login`);
    }
  }, [loading, locale, router, user]);

  useEffect(() => {
    if (studentId) {
      loadStudentDetail();
    }
  }, [studentId]);

  const loadStudentDetail = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/students/${studentId}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setStudent(data.data);
      }
    } catch (e) {
      console.error('Failed to load student detail');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <main className={`${adminFont.variable} ${styles.shell}`}>
        <div className={styles.loading}>Loading student profile...</div>
      </main>
    );
  }

  if (!student) {
    return (
      <main className={`${adminFont.variable} ${styles.shell}`}>
        <div className={styles.error}>Student not found</div>
      </main>
    );
  }

  const completionRate = student.total_lessons > 0 
    ? Math.round((student.lessons_completed / student.total_lessons) * 100) 
    : 0;

  return (
    <main className={`${adminFont.variable} ${styles.shell}`}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerTop}>
          <Link href={`/${locale}/admin/students`} className={styles.backLink}>
            <ArrowLeft size={16} /> Back to students
          </Link>
        </div>
        <div className={styles.profileHeader}>
          <div className={styles.profileAvatar}>
            {student.photo_url ? (
              <img src={student.photo_url} alt={student.name} />
            ) : (
              <User size={40} />
            )}
          </div>
          <div className={styles.profileInfo}>
            <h1 className={styles.title}>{student.name}</h1>
            <p className={styles.subtitle}>{student.email}</p>
            <div className={styles.profileMeta}>
              <span><GraduationCap size={14} /> {student.grade_name || '—'}</span>
              <span><Calendar size={14} /> {student.date_of_birth || '—'}</span>
              <span><User size={14} /> {student.parent_name || 'No parent'}</span>
              {student.school_name && <span><BookOpen size={14} /> {student.school_name}</span>}
            </div>
          </div>
          <div className={styles.profileStatus}>
            <span className={student.status_id === 1 ? styles.statusActive : styles.statusInactive}>
              {student.status_id === 1 ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <section className={styles.statsGrid}>
        <article className={styles.statCard}>
          <div className={styles.statIcon}><Star size={20} /></div>
          <p className={styles.statLabel}>Total Stars</p>
          <h2>{student.total_stars}</h2>
        </article>
        <article className={styles.statCard}>
          <div className={styles.statIcon}><Trophy size={20} /></div>
          <p className={styles.statLabel}>Badges</p>
          <h2>{student.badges_count}</h2>
        </article>
        <article className={styles.statCard}>
          <div className={styles.statIcon}><BookOpen size={20} /></div>
          <p className={styles.statLabel}>Lessons</p>
          <h2>{student.lessons_completed}/{student.total_lessons}</h2>
        </article>
        <article className={styles.statCard}>
          <div className={styles.statIcon}><Target size={20} /></div>
          <p className={styles.statLabel}>Quiz Score</p>
          <h2>{student.avg_score}%</h2>
        </article>
        <article className={styles.statCard}>
          <div className={styles.statIcon}><Clock size={20} /></div>
          <p className={styles.statLabel}>Time Spent</p>
          <h2>{Math.round(student.total_time_spent_minutes / 60)}h</h2>
        </article>
        <article className={styles.statCard}>
          <div className={styles.statIcon}><Flame size={20} /></div>
          <p className={styles.statLabel}>Streak</p>
          <h2>{student.streak_days} days</h2>
        </article>
      </section>

      {/* Progress Section */}
      <div className={styles.detailGrid}>
        <section className={styles.mainPanel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Subject Progress</h2>
            <p className={styles.panelSubtitle}>Overall completion: {completionRate}%</p>
          </div>
          
          <div className={styles.overallProgress}>
            <div className={styles.progressRing}>
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(15,23,42,0.06)" strokeWidth="8" />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="45" 
                  fill="none" 
                  stroke="url(#progressGradient)" 
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${completionRate * 2.83} 283`}
                  transform="rotate(-90 50 50)"
                />
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#12312f" />
                    <stop offset="100%" stopColor="#16a085" />
                  </linearGradient>
                </defs>
              </svg>
              <div className={styles.progressCenter}>
                <span>{completionRate}%</span>
              </div>
            </div>
          </div>

          <div className={styles.subjectList}>
            {student.subject_progress.map((subject, index) => (
              <div key={index} className={styles.subjectItem}>
                <div className={styles.subjectHeader}>
                  <span className={styles.subjectName}>{subject.subject_name}</span>
                  <span className={styles.subjectPercent}>{subject.percentage}%</span>
                </div>
                <div className={styles.subjectBar}>
                  <div 
                    className={styles.subjectFill} 
                    style={{ width: `${subject.percentage}%` }}
                  />
                </div>
                <span className={styles.subjectMeta}>
                  {subject.completed} of {subject.total} lessons
                </span>
              </div>
            ))}
          </div>
        </section>

        <aside className={styles.sidePanel}>
          {/* Recent Activity */}
          <article className={styles.infoCard}>
            <div className={styles.infoHead}>
              <h3 className={styles.infoTitle}>Recent Activity</h3>
              <Activity size={20} />
            </div>
            <div className={styles.activityList}>
              {student.recent_activity.map((activity, index) => (
                <div key={index} className={styles.activityItem}>
                  <div className={`${styles.activityIcon} ${styles[activity.type]}`}>
                    {activity.type === 'lesson' && <BookOpen size={14} />}
                    {activity.type === 'quiz' && <Target size={14} />}
                    {activity.type === 'badge' && <Award size={14} />}
                  </div>
                  <div className={styles.activityInfo}>
                    <span className={styles.activityTitle}>{activity.title}</span>
                    {activity.score !== undefined && (
                      <span className={styles.activityScore}>{activity.score}%</span>
                    )}
                    <span className={styles.activityTime}>{activity.earned_at}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>

          {/* Badges */}
          <article className={styles.infoCardAccent}>
            <div className={styles.infoHead}>
              <h3 className={styles.infoTitle}>Badges Earned</h3>
              <Trophy size={20} />
            </div>
            <div className={styles.badgeGrid}>
              {student.badges.map((badge, index) => (
                <div key={index} className={styles.badgeItem}>
                  {badge.image_url ? (
                    <img src={badge.image_url} alt={badge.name} />
                  ) : (
                    <Award size={24} />
                  )}
                  <span className={styles.badgeName}>{badge.name}</span>
                  <span className={styles.badgeDate}>{badge.earned_at}</span>
                </div>
              ))}
            </div>
          </article>
        </aside>
      </div>
    </main>
  );
}