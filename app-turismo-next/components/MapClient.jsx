'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { db } from '@/lib/firebase';
import { enableIndexedDbPersistence } from 'firebase/firestore';

/**
 * Activa la persistencia offline de Firestore UNA SOLA VEZ cuando el usuario
 * visita la página del mapa. Los datos cargados previamente estarán disponibles
 * aunque el turista pierda señal en el Lago Atitlán.
 */
function useOfflineFirestore() {
  useEffect(() => {
    /* Desactivado temporalmente para Next.js
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('[Offline] Varias pestañas abiertas, persistencia desactivada.');
      } else if (err.code === 'unimplemented') {
        console.warn('[Offline] Navegador no soporta persistencia offline.');
      }
    });
    */
  }, []);
}

// ─── Carga dinámica sin SSR: Leaflet usa window/document directamente ─────────
const MapPageInner = dynamic(() => import('./MapPageInner'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1a1a2e',
        color: '#fff',
        fontSize: '1rem',
      }}
    >
      🗺️ Cargando mapa...
    </div>
  ),
});

export default function MapClient(props) {
  useOfflineFirestore();
  return <MapPageInner {...props} />;
}
