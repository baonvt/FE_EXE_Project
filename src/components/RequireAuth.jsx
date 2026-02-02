import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function RequireAuth({ children, roles = [] }) {
  const { currentUser, isAuthenticated } = useAuth();
  const location = useLocation();

  // Not authenticated -> redirect to landing
  if (!isAuthenticated()) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // If roles specified, ensure currentUser has one of them
  if (roles && roles.length > 0) {
    const role = (currentUser?.role || '').toString().toLowerCase();
    const normalized = roles.map(r => r.toString().toLowerCase());
    if (!normalized.includes(role)) {
      // Not authorized for this route
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
