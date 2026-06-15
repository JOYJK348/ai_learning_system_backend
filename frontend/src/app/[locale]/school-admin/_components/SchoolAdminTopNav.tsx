'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSchoolBranding, clearSchoolBrandingCache } from '@/hooks/useSchoolBranding';
import SchoolSettingsModal from './SchoolSettingsModal';
import styles from './SchoolAdminTopNav.module.css';

export default function SchoolAdminTopNav() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const { school, reload: reloadSchool } = useSchoolBranding(user?.schoolId);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const handler = () => reloadSchool();
    window.addEventListener('school-branding-updated', handler);
    return () => window.removeEventListener('school-branding-updated', handler);
  }, [reloadSchool]);

  const handleLogout = async () => {
    clearSchoolBrandingCache(user?.schoolId);
    await logout();
    router.push(`/${locale}/login`);
  };

  return (
    <>
      <header className={styles.topbar}>
        <div className={styles.brandIdentity}>
          {school?.logo_url ? (
            <Image src={school.logo_url} alt={school.name} width={44} height={44} className={styles.brandLogo} priority unoptimized />
          ) : (
            <Image src="/assets/img/logo-removebg-preview.png" alt="ZHI Learn" width={44} height={44} className={styles.brandLogo} priority />
          )}
          <div>
            <p className={styles.brandTitle}>{school?.name || 'ZHI Learn'}</p>
            <p className={styles.brandMeta}>School Admin</p>
          </div>
        </div>
        <div className={styles.spacer} />
        <div className={styles.profile}>
          <div className={styles.profileText}>
            <p className={styles.profileName}>{user?.name || 'School Admin'}</p>
            <p className={styles.brandMeta}>Online</p>
          </div>
          <div className={styles.avatar}>{(user?.name || user?.email || 'SA').slice(0, 2).toUpperCase()}</div>
          <button type="button" className={styles.desktopSettings} onClick={() => setShowSettings(true)} aria-label="Settings">
            <Settings size={17} />
          </button>
          <button type="button" className={styles.desktopLogout} onClick={handleLogout} aria-label="Sign out">
            <LogOut size={17} />
          </button>
        </div>
      </header>

      <SchoolSettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
}
