import React from 'react';
import { Navigate } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <p>Cargando...</p>; // Muestra un mensaje mientras se verifica la autenticación
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return children;
}

export default ProtectedRoute;