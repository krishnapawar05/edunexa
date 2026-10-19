import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { getStoredUser, getStoredAuthToken } from '../services/api.js';

interface ProtectedRouteProps {
  allowedRoles?: string[];
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const location = useLocation();
  const token = localStorage.getItem('edunexa_access_token') || localStorage.getItem('edunexa_token');
  const user = getStoredUser();

  // If no token or no user session, redirect to login with return path
  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If allowedRoles is specified, ensure user's role is permitted
  if (allowedRoles && allowedRoles.length > 0) {
    const isAuthorized = allowedRoles.includes(user.role);
    if (!isAuthorized) {
      // Map role to their authorized landing page
      const roleLandingPages: Record<string, string> = {
        SUPER_ADMIN: '/superadmin',
        SCHOOL_ADMIN: '/admin',
        PRINCIPAL: '/admin',
        TEACHER: '/teacher',
        STUDENT: '/student',
        PARENT: '/parent',
        EXAM_COORDINATOR: '/examinations',
        HR_STAFF: '/hr',
        ACCOUNTS: '/accounts',
      };
      const redirectUrl = roleLandingPages[user.role] || '/login';
      return <Navigate to={redirectUrl} replace />;
    }
  }

  return children ? <>{children}</> : <Outlet />;
};
