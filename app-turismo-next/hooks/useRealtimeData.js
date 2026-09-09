'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const POLL_INTERVAL = 30000;
const STALE_THRESHOLD = 60000;

let lastFetchTime = 0;
let cachedVersion = null;
const versionCache = new Map();

async function checkForChanges(collection) {
  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'turismo-municipal';
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}?pageSize=1&mask.fieldPaths=updatedAt`;

    const res = await fetch(url, {
      headers: { 'Cache-Control': 'no-cache' }
    });

    if (!res.ok) return false;

    const data = await res.json();
    if (!data.documents || data.documents.length === 0) return false;

    const latestUpdate = data.documents[0]?.updateTime;
    if (!latestUpdate) return false;

    const cached = versionCache.get(collection);
    if (!cached) {
      versionCache.set(collection, latestUpdate);
      return false;
    }

    if (cached !== latestUpdate) {
      versionCache.set(collection, latestUpdate);
      return true;
    }

    return false;
  } catch (error) {
    return false;
  }
}

export function useRealtimeData(collection, options = {}) {
  const {
    initialData = null,
    enabled = true,
    onDataChange,
    pollInterval = POLL_INTERVAL
  } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(null);
  const [isStale, setIsStale] = useState(false);
  const intervalRef = useRef(null);
  const lastUpdateRef = useRef(Date.now());

  const fetchData = useCallback(async (force = false) => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;

    if (!force && timeSinceLastUpdate < 5000) {
      return;
    }

    try {
      const hasChanges = await checkForChanges(collection);

      if (hasChanges || force) {
        setIsStale(true);

        const res = await fetch(`/api/data?collection=${collection}`, {
          next: { revalidate: 0 }
        });

        if (res.ok) {
          const newData = await res.json();
          setData(newData);
          lastUpdateRef.current = Date.now();
          setIsStale(false);

          if (onDataChange && newData !== data) {
            onDataChange(newData);
          }
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [collection, data, onDataChange]);

  useEffect(() => {
    if (!enabled || !collection) return;

    fetchData(true);

    intervalRef.current = setInterval(() => {
      fetchData(false);
    }, pollInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [collection, enabled, pollInterval, fetchData]);

  const refresh = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  const forceRefresh = useCallback(() => {
    setIsStale(true);
    return fetchData(true);
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    isStale,
    refresh,
    forceRefresh
  };
}

export function useSiteRefresh() {
  const [needsRefresh, setNeedsRefresh] = useState(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setNeedsRefresh(prev => !prev);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return needsRefresh;
}

export function invalidateClientCache() {
  versionCache.clear();
  lastFetchTime = 0;
}