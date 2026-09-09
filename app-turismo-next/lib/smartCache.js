const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'turismo-municipal';

const cache = new Map();

const CACHE_TTL = 5 * 60 * 1000;
const STALE_TTL = 15 * 60 * 1000;

function getCacheKey(collection, id = null) {
  return id ? `${collection}/${id}` : collection;
}

async function getFirestoreTimestamp(collection, docId = null) {
  try {
    const url = docId
      ? `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${docId}?updateMask.fieldPaths=updatedAt`
      : `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}?pageSize=1`;

    const res = await fetch(url, {
      headers: { 'Cache-Control': 'no-cache' }
    });

    if (!res.ok) return null;

    if (docId) {
      const data = await res.json();
      return data.updateTime || data.createTime || null;
    }

    return Date.now().toString();
  } catch (error) {
    console.error('[SmartCache] Error getting timestamp:', error);
    return null;
  }
}

async function fetchFromFirestore(collection, docId = null, fields = null) {
  try {
    let url;
    let params = [];

    if (docId) {
      url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${docId}`;
    } else {
      url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}?pageSize=1000`;
      params.push('pageSize=1000');
    }

    if (fields) {
      params.push(`mask.fieldPaths=${fields.join(',')}`);
    }

    if (params.length > 0) {
      url += (url.includes('?') ? '&' : '?') + params.join('&');
    }

    const res = await fetch(url, { next: { revalidate: false } });

    if (!res.ok) return null;

    const data = await res.json();

    if (docId) {
      return parseDocument(data);
    }

    return (data.documents || []).map(parseDocument);
  } catch (error) {
    console.error('[SmartCache] Error fetching from Firestore:', error);
    return null;
  }
}

function parseDocument(doc) {
  if (!doc) return null;
  const id = doc.name?.split('/').pop();
  const result = { id, _updatedAt: doc.updateTime || doc.createTime || null };

  if (doc.fields) {
    for (const [key, field] of Object.entries(doc.fields)) {
      result[key] = extractValue(field);
    }
  }
  return result;
}

function extractValue(field) {
  if (!field) return null;
  if (field.stringValue !== undefined) return field.stringValue;
  if (field.integerValue !== undefined) return Number(field.integerValue);
  if (field.doubleValue !== undefined) return Number(field.doubleValue);
  if (field.booleanValue !== undefined) return field.booleanValue;
  if (field.timestampValue !== undefined) return field.timestampValue;
  if (field.arrayValue !== undefined) {
    return (field.arrayValue.values || []).map(extractValue);
  }
  if (field.mapValue !== undefined) {
    const result = {};
    if (field.mapValue.fields) {
      for (const [key, val] of Object.entries(field.mapValue.fields)) {
        result[key] = extractValue(val);
      }
    }
    return result;
  }
  if (field.referenceValue !== undefined) return field.referenceValue;
  if (field.nullValue !== undefined) return null;
  return null;
}

export async function getSmartCollection(collectionName, options = {}) {
  const { forceRefresh = false, staleWhileRevalidate = true } = options;
  const key = getCacheKey(collectionName);
  const cached = cache.get(key);

  const now = Date.now();

  if (cached && !forceRefresh) {
    const age = now - cached.timestamp;

    if (age < CACHE_TTL) {
      return cached.data;
    }

    if (age < STALE_TTL && staleWhileRevalidate) {
      setTimeout(() => refreshCache(collectionName), 0);
      return cached.data;
    }

    const isFresh = await verifyFreshness(collectionName);
    if (isFresh) {
      cached.timestamp = now;
      cache.set(key, cached);
      return cached.data;
    }
  }

  const data = await fetchFromFirestore(collectionName);
  cache.set(key, { data, timestamp: now, version: now });
  return data;
}

export async function getSmartDocument(collectionName, docId, options = {}) {
  const { forceRefresh = false, staleWhileRevalidate = true } = options;
  const key = getCacheKey(collectionName, docId);
  const cached = cache.get(key);
  const now = Date.now();

  if (cached && !forceRefresh) {
    const age = now - cached.timestamp;

    if (age < CACHE_TTL) {
      return cached.data;
    }

    if (age < STALE_TTL && staleWhileRevalidate) {
      setTimeout(() => refreshDocumentCache(collectionName, docId), 0);
      return cached.data;
    }

    const isFresh = await verifyFreshness(collectionName, docId);
    if (isFresh) {
      cached.timestamp = now;
      cache.set(key, cached);
      return cached.data;
    }
  }

  const data = await fetchFromFirestore(collectionName, docId);
  cache.set(key, { data, timestamp: now, version: now });
  return data;
}

export async function smartQuery(collectionName, fieldName, value, options = {}) {
  const { forceRefresh = false } = options;
  const cacheKey = `query_${collectionName}_${fieldName}_${value}`;
  const cached = cache.get(cacheKey);
  const now = Date.now();

  if (cached && !forceRefresh && (now - cached.timestamp) < CACHE_TTL) {
    return cached.data;
  }

  try {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;

    let valueObj = {};
    if (typeof value === 'string') valueObj = { stringValue: value };
    else if (typeof value === 'boolean') valueObj = { booleanValue: value };
    else if (typeof value === 'number') {
      valueObj = Number.isInteger(value)
        ? { integerValue: value.toString() }
        : { doubleValue: value };
    }

    const body = {
      structuredQuery: {
        from: [{ collectionId: collectionName }],
        where: {
          fieldFilter: {
            field: { fieldPath: fieldName },
            op: 'EQUAL',
            value: valueObj
          }
        },
        limit: 100
      }
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      next: { revalidate: false }
    });

    if (!res.ok) return [];

    const data = await res.json();
    const results = data
      .map(item => item.document ? parseDocument(item.document) : null)
      .filter(Boolean);

    cache.set(cacheKey, { data: results, timestamp: now });
    return results;
  } catch (error) {
    console.error('[SmartCache] Query error:', error);
    return cached?.data || [];
  }
}

async function verifyFreshness(collection, docId = null) {
  try {
    const serverTimestamp = await getFirestoreTimestamp(collection, docId);
    if (!serverTimestamp) return true;

    const cached = cache.get(getCacheKey(collection, docId));
    return cached?.version === serverTimestamp;
  } catch {
    return true;
  }
}

async function refreshCache(collection) {
  try {
    const data = await fetchFromFirestore(collection);
    const key = getCacheKey(collection);
    const now = Date.now();

    cache.set(key, { data, timestamp: now, version: now });
  } catch (error) {
    console.error('[SmartCache] Refresh error:', error);
  }
}

async function refreshDocumentCache(collection, docId) {
  try {
    const data = await fetchFromFirestore(collection, docId);
    const key = getCacheKey(collection, docId);
    const now = Date.now();

    cache.set(key, { data, timestamp: now, version: now });
  } catch (error) {
    console.error('[SmartCache] Refresh doc error:', error);
  }
}

export function invalidateCache(collection, docId = null) {
  if (docId) {
    cache.delete(getCacheKey(collection, docId));
  } else {
    cache.delete(getCacheKey(collection));
  }

  const prefix = docId ? `${collection}/${docId}` : collection;
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

export function invalidateAllCache() {
  cache.clear();
}

export function getCacheStats() {
  const stats = { entries: cache.size, collections: new Set(), documents: new Set() };

  for (const key of cache.keys()) {
    if (key.includes('/')) {
      const [collection] = key.split('/');
      stats.collections.add(collection);
      stats.documents.add(key);
    } else {
      stats.collections.add(key);
    }
  }

  return {
    totalEntries: stats.entries,
    collections: stats.collections.size,
    documents: stats.documents.size
  };
}