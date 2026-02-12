import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface RouteGuardProps {
  children: React.ReactNode;
}

// Routes accessible without login
const PUBLIC_ROUTES = ['/login', '/forgot-password', '/update-password'];

function matchPublicRoute(path: string, patterns: string[]) {
  return patterns.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
      return regex.test(path);
    }
    return path === pattern;
  });
}

export function RouteGuard({ children }: RouteGuardProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    const isPublic = matchPublicRoute(location.pathname, PUBLIC_ROUTES);

    if (!user && !isPublic) {
      navigate('/login', { replace: true });
      return;
    }

    if (user) {
      // If user is logged in and tries to access login page, redirect to appropriate dashboard
      if (location.pathname === '/login') {
        if (user.role === 'admin') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
        return;
      }

      // If user is admin and at root, redirect to admin dashboard
      if (location.pathname === '/' && user.role === 'admin') {
        navigate('/admin', { replace: true });
        return;
      }

      // Prevent non-admins from accessing admin routes
      if (location.pathname.startsWith('/admin') && user.role !== 'admin') {
        navigate('/', { replace: true });
        return;
      }
    }
  }, [user, loading, location.pathname, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Use a fragment to avoid adding extra DOM nodes
  return <>{children}</>;
}