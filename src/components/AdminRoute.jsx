import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AdminRoute({ children }) {
  const { currentUser } = useAuth();

  if (!currentUser) {
    // Si no está logueado, lo mandamos a login
    return <Navigate to="/login" />;
  }

  if (currentUser.role !== 'admin') {
    // Si está logueado pero no es admin, lo mandamos al inicio
    return <Navigate to="/" />;
  }

  return children;
}

export default AdminRoute;