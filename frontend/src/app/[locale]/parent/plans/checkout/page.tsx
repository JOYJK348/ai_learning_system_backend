'use client';

import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Manrope } from 'next/font/google';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { parentKeys } from '@/core/constants/queryKeys';
import { parentApi } from '@/core/services/parentApi';
import styles from './page.module.css';

const adminFont = Manrope({ subsets: ['latin'], variable: '--admin-font', display: 'swap' });

export default function CheckoutPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) || 'en';
  const queryClient = useQueryClient();
  const orderId = searchParams.get('order_id');

  const [status, setStatus] = useState<'processing' | 'success' | 'failed'>('processing');
  const [pollCount, setPollCount] = useState(0);

  // Simulate Razorpay payment verification (to be replaced with actual Razorpay)
  useEffect(() => {
    if (!orderId) {
      setStatus('failed');
      return;
    }

    const interval = setInterval(() => {
      setPollCount(prev => {
        const next = prev + 1;
        if (next >= 40) { // 40 × 3s = 2 min timeout
          clearInterval(interval);
          setStatus('failed');
          return next;
        }
        return next;
      });
    }, 3000);

    // Simulate success after 3 seconds (replace with Razorpay handler)
    const timer = setTimeout(() => {
      clearInterval(interval);
      setStatus('success');
      queryClient.invalidateQueries({ queryKey: parentKeys.subscription });
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [orderId, queryClient]);

  return (
    <main className={`${adminFont.variable} ${styles.shell}`}>
      <button type="button" className={styles.backBtn} onClick={() => router.push(`/${locale}/parent`)}>
        <ArrowLeft size={18} />
      </button>

      <motion.div
        className={styles.card}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {status === 'processing' && (
          <>
            <div className={styles.iconWrap}>
              <Loader2 size={48} className={styles.spinner} />
            </div>
            <h2 className={styles.title}>Processing Payment</h2>
            <p className={styles.text}>Please wait while we confirm your payment...</p>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${Math.min(pollCount * 5, 95)}%` }} />
            </div>
            <p className={styles.hint}>Don&apos;t close this page</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className={styles.iconWrap} style={{ color: '#059669', background: '#d1fae5' }}>
              <CheckCircle2 size={48} />
            </div>
            <h2 className={styles.title}>Payment Successful!</h2>
            <p className={styles.text}>Your plan has been activated. Start learning now!</p>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => router.push(`/${locale}/parent`)}
            >
              Go to Dashboard
            </button>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className={styles.iconWrap} style={{ color: '#dc2626', background: '#fee2e2' }}>
              <XCircle size={48} />
            </div>
            <h2 className={styles.title}>Payment Failed</h2>
            <p className={styles.text}>
              We couldn&apos;t process your payment. Your card has not been charged.
            </p>
            <div className={styles.warningCard}>
              <AlertTriangle size={16} />
              <span>If money was deducted, it will be refunded within 5-7 business days.</span>
            </div>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => router.push(`/${locale}/parent/plans`)}
            >
              Try Again
            </button>
          </>
        )}
      </motion.div>
    </main>
  );
}
