'use client';

import { Manrope } from 'next/font/google';
import { MessageSquare, Lightbulb, ArrowRight } from 'lucide-react';
import styles from './page.module.css';

const adminFont = Manrope({
  subsets: ['latin'],
  variable: '--admin-font',
  display: 'swap',
});

export default function MentorPage() {
  return (
    <div className={`${adminFont.variable} ${styles.shell}`}>
      <div className={styles.content}>
        <div className={styles.hero}>
          <div className={styles.iconWrap}>
            <MessageSquare size={32} />
          </div>
          <h1 className={styles.title}>AI Mentor</h1>
          <p className={styles.subtitle}>Smart guidance for your child's learning journey</p>
          <div className={styles.card}>
            <Lightbulb size={20} className={styles.cardIcon} />
            <div>
              <p className={styles.cardTitle}>Coming Soon</p>
              <p className={styles.cardDesc}>Personalized study tips, weak area analysis, and weekly progress reports from your AI mentor.</p>
            </div>
          </div>
          <div className={styles.featureList}>
            <div className={styles.feature}>
              <div className={styles.featureDot} />
              <span>Weekly performance reports</span>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureDot} />
              <span>Smart weak area detection</span>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureDot} />
              <span>Personalized study recommendations</span>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureDot} />
              <span>Real-time learning insights</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
