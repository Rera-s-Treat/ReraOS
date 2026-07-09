'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { getMe } from '@/lib/api';
import { Logo } from '../../components/brand/Logo';
import { NotificationBell } from '../../components/notifications/NotificationBell';

interface LoggedInUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  roleId: string;
  status: string;
}

interface DashboardLayoutProps {
  children: ReactNode;
}

const navItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Analytics', href: '/dashboard/analytics' },
  { label: 'Users', href: '/dashboard/users' },
  { label: 'Products', href: '/dashboard/products' },
  { label: 'Orders', href: '/dashboard/orders' },
  { label: 'Customers', href: '/dashboard/customers' },
  { label: 'Inventory', href: '/dashboard/inventory' },
  { label: 'Settings', href: '/dashboard/settings' },
];

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': {
    title: 'Dashboard',
    subtitle: 'Welcome back to your operations overview.',
  },
  '/dashboard/users': {
    title: 'Users',
    subtitle: 'Manage admin users and team access.',
  },
  '/dashboard/products': {
    title: 'Products',
    subtitle: 'Manage menu items, pricing, and availability.',
  },
  '/dashboard/orders': {
    title: 'Orders',
    subtitle: 'Track and manage customer orders.',
  },
  '/dashboard/customers': {
    title: 'Customers',
    subtitle: 'See who your customers are and how they order.',
  },
  '/dashboard/analytics': {
    title: 'Analytics',
    subtitle: 'All-time and month-on-month performance.',
  },
  '/dashboard/inventory': {
    title: 'Inventory',
    subtitle: 'Monitor stock levels and item availability.',
  },
  '/dashboard/settings': {
    title: 'Settings',
    subtitle: 'Manage system and business configuration.',
  },
  '/dashboard/notifications': {
    title: 'Notifications',
    subtitle: 'Full history of admin notifications.',
  },
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<LoggedInUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        router.replace('/');
        return;
      }

      try {
        const data = await getMe(token);
        setUser(data);
      } catch {
        localStorage.removeItem('accessToken');
        router.replace('/');
      } finally {
        setLoading(false);
      }
    }

    void loadUser();
  }, [router]);

  const currentPage = useMemo(() => {
    return (
      pageMeta[pathname] ?? {
        title: 'Dashboard',
        subtitle: "Manage your Rera's Treat operations.",
      }
    );
  }, [pathname]);

  function openLogoutModal() {
    setShowLogoutModal(true);
  }

  function closeLogoutModal() {
    setShowLogoutModal(false);
  }

  function confirmLogout() {
    localStorage.removeItem('accessToken');
    router.replace('/');
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading dashboard...</p>
      </main>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-100">
        <div className="flex min-h-screen">
          <aside className="w-64 bg-(--color-brand-green) text-white">
            <div className="border-b border-white/10 px-6 py-6">
              <Logo variant="light" showTagline={false} className="h-10" />
              <p className="mt-2 text-sm text-(--color-brand-leaf)">
                Admin Console
              </p>
            </div>

            <nav className="px-4 py-6">
              <ul className="space-y-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;

                  return (
                    <li key={item.href}>
                      <button
                        type="button"
                        onClick={() => router.push(item.href)}
                        className={`w-full rounded-md px-4 py-3 text-left text-sm font-medium transition ${
                          isActive
                            ? 'bg-white text-(--color-brand-green)'
                            : 'text-white/80 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {item.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>

          <div className="flex flex-1 flex-col">
            <header className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-5">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {currentPage.title}
                </h2>
                <p className="text-sm text-gray-500">{currentPage.subtitle}</p>
              </div>

              <div className="flex items-center gap-4">
                <NotificationBell />

                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>

                <button
                  type="button"
                  onClick={openLogoutModal}
                  className="rounded-md bg-(--color-brand-orange) px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                >
                  Logout
                </button>
              </div>
            </header>

            <main className="flex-1 p-8">{children}</main>
          </div>
        </div>
      </div>

      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">
              Log out of Rera&apos;s Treat?
            </h3>

            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to log out of your admin session?
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeLogoutModal}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
              >
                No
              </button>

              <button
                type="button"
                onClick={confirmLogout}
                className="rounded-md bg-(--color-brand-orange) px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
              >
                Yes, log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}