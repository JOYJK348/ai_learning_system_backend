'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import {
  BookOpen,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Users,
  Menu,
  X,
  Sparkles,
  Settings,
} from 'lucide-react';
import styles from './ParentBottomNav.module.css';

const allNavItems = [
  { label: 'Hub', icon: LayoutDashboard, href: 'parent' },
  { label: 'Quizzes', icon: BookOpen, href: 'parent/quizzes' },
  { label: 'Mentor', icon: MessageSquare, href: 'parent/mentor' },
  { label: 'Profile', icon: Users, href: 'parent/profile' },
];

const SPLIT_INDEX = 3;

export default function ParentBottomNav({ onLogout }: { onLogout?: () => void }) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const locale = (params?.locale as string) || 'en';
  const [drawerOpen, setDrawerOpen] = useState(false);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  useEffect(() => { closeDrawer(); }, [pathname, closeDrawer]);

  useEffect(() => {
    if (!drawerOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDrawer(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [drawerOpen, closeDrawer]);

  const isActive = (href: string) => {
    const path = `/${locale}/${href}`;
    return href === 'parent' ? pathname === path : pathname.startsWith(path);
  };

  const prefetch = (href: string) => router.prefetch(`/${locale}/${href}`);

  const handleLogout = async () => {
    closeDrawer();
    if (onLogout) await onLogout();
    else router.push(`/${locale}/login`);
  };

  return (
    <>
      <nav className={styles.bottomBar} aria-label="Parent navigation">
        {allNavItems.slice(0, SPLIT_INDEX + 1).map((item, idx) => (
          <Link
            key={item.label}
            href={`/${locale}/${item.href}`}
            className={`${styles.bottomItem} ${isActive(item.href) ? styles.bottomItemActive : ''}`}
            onPointerEnter={() => prefetch(item.href)}
            onFocus={() => prefetch(item.href)}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </Link>
        ))}
        <button
          type="button"
          className={`${styles.bottomItem} ${styles.menuBtn}`}
          onClick={() => setDrawerOpen(true)}
          aria-label="More menu"
        >
          <Menu size={18} />
          <span>More</span>
        </button>
      </nav>

      {drawerOpen && <div className={styles.overlay} onClick={closeDrawer} />}

      <aside className={`${styles.drawer} ${drawerOpen ? styles.drawerOpen : ''}`}>
        <div className={styles.drawerHeader}>
          <span className={styles.drawerTitle}>Quick Links</span>
          <button type="button" className={styles.drawerClose} onClick={closeDrawer} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>
        <div className={styles.drawerBody}>
          <div className={styles.drawerMain}>
            <Link
              href={`/${locale}/parent/plans`}
              className={styles.drawerItem}
              onClick={closeDrawer}
            >
              <Sparkles size={20} />
              <span>Plans</span>
            </Link>
            <Link
              href={`/${locale}/parent/plans/my-plan`}
              className={styles.drawerItem}
              onClick={closeDrawer}
            >
              <Settings size={20} />
              <span>My Plan</span>
            </Link>
          </div>
          <button
            type="button"
            className={`${styles.drawerItem} ${styles.drawerLogout}`}
            onClick={handleLogout}
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
