'use client';

/**
 * ─── Punto 2: Rutas Privadas — Skeleton durante resolución de Auth ────────────
 *
 * En Next.js SSR el servidor no conoce el estado de autenticación del usuario
 * (el token Firebase vive en el browser). Por eso:
 * 1. AuthContext inicia con loading=true y NO renderiza children hasta saber el estado.
 * 2. Este wrapper muestra un skeleton mientras loading=true.
 * 3. Si después de resolverse el Auth el usuario NO cumple la condición, redirige.
 *
 * Uso:
 *   <ProtectedRoute>          → requiere estar logueado
 *   <AdminRoute>              → requiere role === 'admin'
 *   <LoggedInRoute>           → redirige si YA está logueado (ej: /login)
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

function AuthSkeleton() {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        className="skeleton-line"
        style={{ width: '200px', height: '24px', borderRadius: '8px' }}
      />
    </div>
  );
}

export function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.replace('/login');
    }
  }, [currentUser, loading, router]);

  if (loading || !currentUser) return <AuthSkeleton />;
  return children;
}

export function AdminRoute({ children }) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!currentUser) router.replace('/login');
      else if (currentUser.role !== 'admin') router.replace('/');
    }
  }, [currentUser, loading, router]);

  if (loading || !currentUser || currentUser.role !== 'admin') return <AuthSkeleton />;
  return children;
}

export function LoggedInRoute({ children }) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && currentUser) {
      router.replace('/');
    }
  }, [currentUser, loading, router]);

  if (loading || currentUser) return <AuthSkeleton />;
  return children;
}
