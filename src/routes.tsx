import type { ReactNode } from 'react';
import AppLayout from '@/components/layouts/AppLayout';

// Pages
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import AdmissionPage from '@/pages/AdmissionPage';
import PaymentsPage from '@/pages/PaymentsPage';
import EventsPage from '@/pages/EventsPage';
import AnnouncementsPage from '@/pages/AnnouncementsPage';

// Admin Pages
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import AdminAdmissionsPage from '@/pages/admin/AdminAdmissionsPage';
import AdminPaymentsPage from '@/pages/admin/AdminPaymentsPage';
import AdminEventsPage from '@/pages/admin/AdminEventsPage';
import AdminAnnouncementsPage from '@/pages/admin/AdminAnnouncementsPage';
import AdminUsersPage from '@/pages/admin/AdminUsersPage';

import NotFound from '@/pages/NotFound';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

const routes: RouteConfig[] = [
  {
    name: 'Login',
    path: '/login',
    element: <LoginPage />,
    visible: false,
  },
  {
    name: 'Dashboard',
    path: '/',
    element: (
      <AppLayout>
        <DashboardPage />
      </AppLayout>
    ),
  },
  {
    name: 'Admission',
    path: '/admission',
    element: (
      <AppLayout>
        <AdmissionPage />
      </AppLayout>
    ),
  },
  {
    name: 'Payments',
    path: '/payments',
    element: (
      <AppLayout>
        <PaymentsPage />
      </AppLayout>
    ),
  },
  {
    name: 'Events',
    path: '/events',
    element: (
      <AppLayout>
        <EventsPage />
      </AppLayout>
    ),
  },
  {
    name: 'Announcements',
    path: '/announcements',
    element: (
      <AppLayout>
        <AnnouncementsPage />
      </AppLayout>
    ),
  },
  {
    name: 'Admin Dashboard',
    path: '/admin',
    element: (
      <AppLayout>
        <AdminDashboardPage />
      </AppLayout>
    ),
  },
  {
    name: 'Admin Admissions',
    path: '/admin/admissions',
    element: (
      <AppLayout>
        <AdminAdmissionsPage />
      </AppLayout>
    ),
  },
  {
    name: 'Admin Payments',
    path: '/admin/payments',
    element: (
      <AppLayout>
        <AdminPaymentsPage />
      </AppLayout>
    ),
  },
  {
    name: 'Admin Events',
    path: '/admin/events',
    element: (
      <AppLayout>
        <AdminEventsPage />
      </AppLayout>
    ),
  },
  {
    name: 'Admin Announcements',
    path: '/admin/announcements',
    element: (
      <AppLayout>
        <AdminAnnouncementsPage />
      </AppLayout>
    ),
  },
  {
    name: 'Admin Users',
    path: '/admin/users',
    element: (
      <AppLayout>
        <AdminUsersPage />
      </AppLayout>
    ),
  },
  {
    name: 'Not Found',
    path: '*',
    element: <NotFound />,
    visible: false,
  },
];

export default routes;
