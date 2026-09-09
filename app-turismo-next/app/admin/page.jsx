import { AdminRoute } from '@/components/AuthGuards';
import Dashboard from '@/components/Admin/Dashboard';
import { Suspense } from 'react';

export default function AdminPage() {
  return (
    <AdminRoute>
      <Suspense fallback={<div className="dashboard-container"><p>Cargando panel de administración...</p></div>}>
        <Dashboard />
      </Suspense>
    </AdminRoute>
  );
}
