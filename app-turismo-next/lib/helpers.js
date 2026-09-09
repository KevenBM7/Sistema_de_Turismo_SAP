/**
 * Normaliza un imagePath que puede ser:
 *  - string directa (URL de Storage) → datos nuevos
 *  - objeto { original, medium, thumbnail } → datos heredados / legacy
 *  - objeto con .original que puede ser una ruta o URL
 *
 * Siempre devuelve un string (la mejor URL disponible) o null.
 * @param {string|object|null} pathData
 * @returns {string|null}
 */
export function normalizeImagePath(pathData) {
  if (!pathData) return null;

  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const getPublicUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;

    // Firebase Storage Extension elimina el original y deja versiones WebP optimizadas.
    // Reemplazamos la extensión original por la versión que estamos seguros que existe en el bucket.
    let optimizedPath = path;
    // IMPORTANTE: Las imágenes de 'settings/' (portada) y 'events/' no son procesadas por la extensión, no modificarlas.
    if (!path.includes('settings/') && !path.includes('events/') && !path.includes('_1200x1200.webp') && !path.includes('_800x800.webp') && !path.includes('_150x150.webp')) {
      // Remover cualquier prefijo "gs://turismo-municipal.firebasestorage.app/" si existe
      optimizedPath = optimizedPath.replace(/^gs:\/\/[\w.-]+\//, '');
      optimizedPath = optimizedPath.replace(/(\.[\w\d_-]+)$/i, '_800x800.webp');
    }

    // Convertir a URL pública de Firebase Storage REST API
    const encodedPath = encodeURIComponent(optimizedPath);
    return `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${encodedPath}?alt=media`;
  };

  // Caso 1: ya es una string
  if (typeof pathData === 'string') {
    return getPublicUrl(pathData);
  }

  // Caso 2: objeto legacy con múltiples tamaños
  if (typeof pathData === 'object') {
    const rawPath =
      pathData.original ||
      pathData.large ||
      pathData.medium ||
      pathData.thumbnail ||
      null;

    return getPublicUrl(rawPath);
  }

  return null;
}

/**
 * Normaliza el array completo de imagePaths de un documento de Firestore.
 * Filtra nulls y duplicados.
 * @param {Array} imagePaths - Array de paths (strings u objetos legacy)
 * @returns {string[]} Array de URLs válidas
 */
export function normalizeImagePaths(imagePaths) {
  if (!Array.isArray(imagePaths) || imagePaths.length === 0) return [];

  const urls = imagePaths
    .map(normalizeImagePath)
    .filter(Boolean); // elimina nulls

  // Eliminar duplicados
  return [...new Set(urls)];
}

/**
 * Serializa datos de Firestore para pasarlos de Server → Client Component.
 * Convierte Timestamps a milisegundos y elimina funciones/objetos no serializables.
 * PUNTO 4 del plan: evita errores de hidratación.
 * @param {object} data
 * @returns {object}
 */
export function serializeFirestoreData(data) {
  if (!data || typeof data !== 'object') return data;

  const serialized = {};

  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) {
      serialized[key] = null;
    } else if (typeof value === 'function') {
      // Omitir funciones
    } else if (value?.toMillis && typeof value.toMillis === 'function') {
      // Firestore Timestamp → número de milisegundos
      serialized[key] = value.toMillis();
    } else if (value?.toDate && typeof value.toDate === 'function') {
      // También acepta .toDate()
      serialized[key] = value.toDate().toISOString();
    } else if (Array.isArray(value)) {
      serialized[key] = value.map((item) =>
        typeof item === 'object' && item !== null
          ? serializeFirestoreData(item)
          : item
      );
    } else if (typeof value === 'object' && value.constructor === Object) {
      serialized[key] = serializeFirestoreData(value);
    } else {
      serialized[key] = value;
    }
  }

  return serialized;
}
