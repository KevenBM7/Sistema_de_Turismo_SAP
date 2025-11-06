import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function LoggedInRoute({ children }) {
  const { currentUser } = useAuth();

  if (currentUser) {
    // Si el usuario ya ha iniciado sesión, redirígelo a la página de inicio.
    return <Navigate to="/" />;
  }

  // Si el usuario no ha iniciado sesión, muestra el componente hijo (la página de Login).
  return children;
}

export default LoggedInRoute;