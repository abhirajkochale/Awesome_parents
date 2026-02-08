import type { ReactNode } from 'react';
import ParentLayout from '@/components/layouts/ParentLayout';
import AdminLayout from '@/components/layouts/AdminLayout';

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
import SupportPage from '@/pages/SupportPage';
import AdminQueriesPage from '@/pages/admin/AdminQueriesPage';

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
      <ParentLayout>
        <DashboardPage />
      </ParentLayout>
    ),
  },
  {
    name: 'Admission',
    path: '/admission',
    element: (
      <ParentLayout>
        <AdmissionPage />
      </ParentLayout>
    ),
  },
  {
    name: 'Payments',
    path: '/payments',
    element: (
      <ParentLayout>
        <PaymentsPage />
      </ParentLayout>
    ),
  },
  {
    name: 'Events',
    path: '/events',
    element: (
      <ParentLayout>
        <EventsPage />
      </ParentLayout>
    ),
  },
  {
    name: 'Announcements',
    path: '/announcements',
    element: (
      <ParentLayout>
        <AnnouncementsPage />
      </ParentLayout>
    ),
  },
  {
    name: 'Support',
    path: '/support',
    element: (
      <ParentLayout>
        <SupportPage />
      </ParentLayout>
    ),
  },
  {
    name: 'Admin Dashboard',
    path: '/admin',
    element: (
      <AdminLayout>
        <AdminDashboardPage />
      </AdminLayout>
    ),
  },
  {
    name: 'Admin Admissions',
    path: '/admin/admissions',
    element: (
      <AdminLayout>
        <AdminAdmissionsPage />
      </AdminLayout>
    ),
  },
  {
    name: 'Admin Payments',
    path: '/admin/payments',
    element: (
      <AdminLayout>
        <AdminPaymentsPage />
      </AdminLayout>
    ),
  },
  {
    name: 'Admin Events',
    path: '/admin/events',
    element: (
      <AdminLayout>
        <AdminEventsPage />
      </AdminLayout>
    ),
  },
  {
    name: 'Admin Announcements',
    path: '/admin/announcements',
    element: (
      <AdminLayout>
        <AdminAnnouncementsPage />
      </AdminLayout>
    ),
  },
  {
    name: 'Admin Users',
    path: '/admin/users',
    element: (
      <AdminLayout>
        <AdminUsersPage />
      </AdminLayout>
    ),
  },
  {
    name: 'Admin Queries',
    path: '/admin/queries',
    element: (
      <AdminLayout>
        <AdminQueriesPage />
      </AdminLayout>
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
