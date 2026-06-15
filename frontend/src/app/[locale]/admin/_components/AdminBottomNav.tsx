'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import {
  Activity,
  BookOpen,
  Building2,
  CircleDollarSign,
  ClipboardList,
  FileBarChart,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  PlaySquare,
  Settings,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import styles from './AdminBottomNav.module.css';

const allNavItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: 'admin' },
  { label: 'Schools', icon: Building2, href: 'admin/schools' },
  { label: 'Students', icon: GraduationCap, href: 'admin/students' },
  { label: 'Parents', icon: Users, href: 'admin/parents' },
  { label: 'Payments', icon: CircleDollarSign, href: 'admin/payments' },
  { label: 'Curriculum', icon: BookOpen, href: 'admin/curriculum' },
  { label: 'Videos', icon: PlaySquare, href: 'admin/videos' },
  { label: 'Activities', icon: Activity, href: 'admin/activities' },
  { label: 'Quizzes', icon: ClipboardList, href: 'admin/quizzes' },
  { label: 'Reports', icon: FileBarChart, href: 'admin/reports' },
  { label: 'Settings', icon: Settings, href: 'admin/settings' },
];

const SPLIT_INDEX = 3;

export default function AdminBottomNav() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const locale = (params?.locale as string) || 'en';
  const { logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = async () => {
    closeDrawer();
    await logout();
    router.push(`/${locale}/login`);
  };

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  useEffect(() => {
    closeDrawer();
  }, [pathname, closeDrawer]);

  useEffect(() => {
    if (!drawerOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDrawer(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [drawerOpen, closeDrawer]);

  const isActive = (href: string) => {
    const path = `/${locale}/${href}`;
    return href === 'admin' ? pathname === path : pathname.startsWith(path);
  };

  const prefetch = (href: string) => {
    router.prefetch(`/${locale}/${href}`);
  };

  return (
    <>
      <nav className={styles.bottomBar} aria-label="Admin navigation">
        {allNavItems.slice(0, SPLIT_INDEX).map((item, idx) => (
          <Link
            key={item.label}
            href={`/${locale}/${item.href}`}
            className={`${styles.bottomItem} ${isActive(item.href) ? styles.bottomItemActive : ''} ${idx >= SPLIT_INDEX ? styles.desktopOnly : ''}`}
            onPointerEnter={() => prefetch(item.href)}
            onFocus={() => prefetch(item.href)}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </Link>
        ))}
        {allNavItems.slice(SPLIT_INDEX).map((item) => (
          <Link
            key={item.label}
            href={`/${locale}/${item.href}`}
            className={`${styles.bottomItem} ${styles.desktopOnly} ${isActive(item.href) ? styles.bottomItemActive : ''}`}
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
          <span className={styles.drawerTitle}>Navigation</span>
          <button type="button" className={styles.drawerClose} onClick={closeDrawer} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>
        <div className={styles.drawerBody}>
          <div className={styles.drawerMain}>
            {allNavItems.slice(SPLIT_INDEX).map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={`/${locale}/${item.href}`}
                  className={`${styles.drawerItem} ${isActive(item.href) ? styles.drawerItemActive : ''}`}
                  onClick={closeDrawer}
                  onPointerEnter={() => prefetch(item.href)}
                  onFocus={() => prefetch(item.href)}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
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
