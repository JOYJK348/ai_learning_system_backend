'use client';

import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { Bell, LogOut, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import styles from './AdminTopNav.module.css';

export default function AdminTopNav() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const handleLogout = async () => {
    await logout();
    router.push(`/${locale}/login`);
  };

  return (
    <header className={styles.topbar}>
      <div className={styles.brandIdentity}>
        <Image src="/assets/img/logo-removebg-preview.png" alt="ZHI" width={44} height={44} className={styles.logo} />
        <div>
          <p className={styles.brandTitle}>ZHI Learn</p>
          <p className={styles.brandMeta}>Super Admin</p>
        </div>
      </div>
      <div className={styles.search}>
        <Search size={18} />
        <input placeholder="Search students, schools, payments" type="search" />
      </div>
      <div className={styles.profile}>
        <button type="button" className={styles.iconButton} aria-label="Notifications">
          <Bell size={20} />
        </button>
        <button type="button" className={styles.logoutButton} onClick={handleLogout} aria-label="Sign out">
          <LogOut size={18} />
        </button>
        <div className={styles.profileText}>
          <p className={styles.profileName} suppressHydrationWarning>{user?.name || 'Admin User'}</p>
          <p className={styles.brandMeta}>Online</p>
        </div>
        <div className={styles.avatar} suppressHydrationWarning>{(user?.name || user?.email || 'AU').slice(0, 2).toUpperCase()}</div>
      </div>
    </header>
  );
}
