'use client';

import { Manrope } from 'next/font/google';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, Mail, Phone, BookOpen, GraduationCap, Building2, Zap, Award } from 'lucide-react';
import { parentApi } from '@/core/services/parentApi';
import { parentKeys } from '@/core/constants/queryKeys';
import styles from './page.module.css';

const adminFont = Manrope({
  subsets: ['latin'],
  variable: '--admin-font',
  display: 'swap',
});

export default function ProfilePage() {
  const [activeChildId, setActiveChildId] = useState<string | null>(null);

  const meRaw = useQuery({
    queryKey: parentKeys.me, queryFn: parentApi.me, staleTime: 5 * 60 * 1000,
  });
  const parentProfile = meRaw.data?.parent ?? null;

  const { data: childrenData } = useQuery({
    queryKey: parentKeys.children, queryFn: parentApi.children, staleTime: 5 * 60 * 1000,
  });
  const children = childrenData?.children ?? [];

  useEffect(() => {
    if (!activeChildId && children.length > 0) setActiveChildId(children[0].id);
  }, [children, activeChildId]);

  const activeChild = children.find((c: any) => c.id === activeChildId) ?? null;

  const { data: progressData } = useQuery({
    queryKey: parentKeys.childProgress(activeChildId ?? ''),
    queryFn: () => parentApi.childProgress(activeChildId!),
    enabled: !!activeChildId, staleTime: 60_000,
  });
  const childProgress = progressData as any;

  return (
    <div className={`${adminFont.variable} ${styles.shell}`}>
      <div className={styles.content}>
        <header className={styles.header}>
          <h1 className={styles.title}>Profile</h1>
        </header>

        {/* Parent Card */}
        <section className={styles.insightBox}>
          <div className={styles.insightHeader}>
            <Users size={17} color="#12312f" />
            <h3>Parent Account</h3>
          </div>
          <div className={styles.profileCard}>
            <div className={styles.avatar}>
              {(parentProfile?.name || 'P').slice(0, 2).toUpperCase()}
            </div>
            <div className={styles.profileInfo}>
              <p className={styles.profileName}>{parentProfile?.name || 'Parent'}</p>
              <div className={styles.profileRow}>
                <Mail size={14} />
                <span>{parentProfile?.email || 'N/A'}</span>
              </div>
              <div className={styles.profileRow}>
                <Phone size={14} />
                <span>{parentProfile?.phone || 'Not set'}</span>
              </div>
              <div className={styles.profileRow}>
                <Award size={14} />
                <span>{parentProfile?.plan_type === 'free' ? 'Free Plan' : (parentProfile?.plan_type || 'Free')}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Child Card */}
        {activeChild && (
          <section className={styles.insightBox}>
            <div className={styles.insightHeader}>
              <GraduationCap size={17} color="#2563eb" />
              <h3>{activeChild.name}</h3>
            </div>
            <div className={styles.childGrid}>
              <div className={styles.childStat}>
                <BookOpen size={16} color="#64748b" />
                <div>
                  <p className={styles.childStatValue}>{activeChild.grade || 'LKG'}</p>
                  <p className={styles.childStatLabel}>Grade</p>
                </div>
              </div>
              <div className={styles.childStat}>
                <Building2 size={16} color="#64748b" />
                <div>
                  <p className={styles.childStatValue}>{activeChild.school || 'N/A'}</p>
                  <p className={styles.childStatLabel}>School</p>
                </div>
              </div>
              <div className={styles.childStat}>
                <Zap size={16} color="#64748b" />
                <div>
                  <p className={styles.childStatValue}>{activeChild.current_streak || 0}d</p>
                  <p className={styles.childStatLabel}>Streak</p>
                </div>
              </div>
              <div className={styles.childStat}>
                <Award size={16} color="#64748b" />
                <div>
                  <p className={styles.childStatValue}>{childProgress?.student?.total_stars || 0}</p>
                  <p className={styles.childStatLabel}>Stars</p>
                </div>
              </div>
              <div className={styles.childStat}>
                <BookOpen size={16} color="#64748b" />
                <div>
                  <p className={styles.childStatValue}>{activeChild.lessons_completed || 0}</p>
                  <p className={styles.childStatLabel}>Lessons</p>
                </div>
              </div>
              <div className={styles.childStat}>
                <Award size={16} color="#64748b" />
                <div>
                  <p className={styles.childStatValue}>{activeChild.badges_earned || 0}</p>
                  <p className={styles.childStatLabel}>Badges</p>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
