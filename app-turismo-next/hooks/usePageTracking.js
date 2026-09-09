'use client';

// src/hooks/usePageTracking.js
// Hook para rastrear visitas de página con Google Analytics

import { useEffect } from 'react';
import { useLocation } from 'next/navigation';
import { logEvent } from 'firebase/analytics';
import { analytics } from '@/lib/firebase';

export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    logEvent(analytics, 'page_view', {
      page_path: location.pathname,
      page_title: document.title
    });
  }, [location]);
};
