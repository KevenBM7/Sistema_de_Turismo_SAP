// src/hooks/usePageTracking.js
// Hook para rastrear visitas de página con Google Analytics

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { logEvent } from 'firebase/analytics';
import { analytics } from '../services/firebase';

export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    logEvent(analytics, 'page_view', {
      page_path: location.pathname,
      page_title: document.title
    });
  }, [location]);
};
