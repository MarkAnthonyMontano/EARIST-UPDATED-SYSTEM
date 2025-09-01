// ProtectedRoute.jsx
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const [isAuthorized, setIsAuthorized] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      setIsAuthorized(false);
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userRole = payload.role;

      console.log('User Role:', userRole); // ✅ for debugging
      console.log('Allowed Roles:', allowedRoles);

      if (allowedRoles.length === 0 || allowedRoles.includes(userRole)) {
        setIsAuthorized(true);
      } else {
        setIsAuthorized('unauthorized');
      }
    } catch (error) {
      console.error('Error decoding token:', error);
      setIsAuthorized(false);
    }
  }, [allowedRoles]);

  if (isAuthorized === null) return <div>Loading...</div>;

  if (isAuthorized === true) return children;

  if (isAuthorized === 'unauthorized') return <Navigate to="/unauthorized" />;

  return <Navigate to="/" />;
};

export default ProtectedRoute;
