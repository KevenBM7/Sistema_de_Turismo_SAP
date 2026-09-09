'use client';

import { ProtectedRoute } from '@/components/AuthGuards';
import Profile from '@/components/Profile';

export default function PerfilPage() {
  return (
    <ProtectedRoute>
      <Profile />
    </ProtectedRoute>
  );
}
