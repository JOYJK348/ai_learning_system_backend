'use client';

import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { Bell, LogOut, Users } from 'lucide-react';
import styles from './ParentTopNav.module.css';

export default function ParentTopNav({ onLogout }: { onLogout?: () => void }) {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const handleLogout = async () => {
    if (onLogout) {
      await onLogout();
    } else {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      router.push(`/${locale}/login`);
    }
  };

  return (
    <header className={styles.topbar}>
      <div className={styles.brandIdentity}>
        <Image src="/assets/img/logo-removebg-preview.png" alt="ZHI" width={44} height={44} className={styles.logo} />
        <div>
          <p className={styles.brandTitle}>ZHI Learn</p>
          <p className={styles.brandMeta}>Parent Portal</p>
        </div>
      </div>
      <div className={styles.profile}>
        <button type="button" className={styles.iconButton} aria-label="Notifications">
          <Bell size={20} />
        </button>
        <button type="button" className={styles.logoutButton} onClick={handleLogout} aria-label="Sign out">
          <LogOut size={18} />
        </button>
        <div className={styles.profileText}>
          <p className={styles.profileName}>Parent</p>
          <p className={styles.brandMeta}>Online</p>
        </div>
        <div className={styles.avatar}>PA</div>
      </div>
    </header>
  );
}
