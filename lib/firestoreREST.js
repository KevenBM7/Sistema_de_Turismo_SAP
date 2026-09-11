import { getSmartCollection, getSmartDocument, smartQuery, invalidateCache } from './smartCache';

export const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'turismo-municipal';

function extractValue(field) {
  if (!field) return null;
  if (field.stringValue !== undefined) return field.stringValue;
  if (field.integerValue !== undefined) return Number(field.integerValue);
  if (field.doubleValue !== undefined) return Number(field.doubleValue);
  if (field.booleanValue !== undefined) return field.booleanValue === true;
  if (field.timestampValue !== undefined) return field.timestampValue;

  if (field.arrayValue !== undefined) {
    if (!field.arrayValue.values) return [];
    return field.arrayValue.values.map(extractValue);
  }

  if (field.mapValue !== undefined) {
    if (!field.mapValue.fields) return {};
    const result = {};
    for (const [key, val] of Object.entries(field.mapValue.fields)) {
      result[key] = extractValue(val);
    }
    return result;
  }

  if (field.referenceValue !== undefined) return field.referenceValue;
  if (field.geoPointValue !== undefined) return field.geoPointValue;
  if (field.nullValue !== undefined) return null;

  return null;
}

function parseRestDocument(doc) {
  if (!doc) return null;
  const id = doc.name.split('/').pop();
  const data = { id };

  if (doc.fields) {
    for (const [key, field] of Object.entries(doc.fields)) {
      data[key] = extractValue(field);
    }
  }
  return data;
}

export async function getCollectionREST(collectionName, options = {}) {
  const { forceRefresh = false } = options;
  try {
    return await getSmartCollection(collectionName, { forceRefresh });
  } catch (error) {
    console.error(`[REST] Error obteniendo colección ${collectionName}:`, error);
    return [];
  }
}

export async function getDocumentREST(collectionName, documentId, options = {}) {
  const { forceRefresh = false } = options;
  try {
    return await getSmartDocument(collectionName, documentId, { forceRefresh });
  } catch (error) {
    console.error(`[REST] Error obteniendo doc ${documentId}:`, error);
    return null;
  }
}

export async function queryCollectionREST(collectionName, fieldName, operator, value, options = {}) {
  const { forceRefresh = false } = options;
  try {
    return await smartQuery(collectionName, fieldName, value, { forceRefresh });
  } catch (error) {
    console.error(`[REST] Error en query a ${collectionName}:`, error);
    return [];
  }
}

export function invalidateCacheREST(collection, docId = null) {
  invalidateCache(collection, docId);
}
