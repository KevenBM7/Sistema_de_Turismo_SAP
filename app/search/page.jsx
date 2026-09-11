'use client';
import { Suspense } from 'react';
import SearchResults from '@/legacy_pages/SearchResults';

export default function Page() {
  return (
    <Suspense
      fallback={
        <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
          <p>Cargando resultados de búsqueda...</p>
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  );
}