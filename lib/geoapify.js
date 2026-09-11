/**
 * Utilidades para la suite de APIs de Geoapify
 * Soporta: Geocodificación Inversa, Búsqueda/Autocompletado, Rutas (Peatonal/Auto) e Isocronas
 */

export const GEOAPIFY_API_KEY = 
  process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY || '935f6d0f5be241cca4df80ae04edcfb1';

const SAN_ANTONIO_PROXIMITY = { lat: 14.6920, lon: -91.1172 };

const geocodeCache = new Map();
const routeCache = new Map();
const isolineCache = new Map();

/**
 * Convierte coordenadas (lat, lng) en un nombre de calle/barrio legible
 */
export async function reverseGeocode(lat, lon) {
  if (!GEOAPIFY_API_KEY || !lat || !lon) return null;
  const cacheKey = `${Number(lat).toFixed(4)},${Number(lon).toFixed(4)}`;
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey);
  }

  try {
    const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=${GEOAPIFY_API_KEY}&lang=es`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const props = data.features?.[0]?.properties;
    if (!props) return null;

    // Preferir dirección concisa: Nombre + Calle + Ciudad
    const parts = [];
    if (props.name && props.name !== props.street) parts.push(props.name);
    if (props.street) parts.push(props.street);
    if (props.suburb && props.suburb !== props.city) parts.push(props.suburb);
    if (props.city) parts.push(props.city);

    const result = {
      formatted: parts.length > 0 ? parts.join(', ') : props.formatted,
      full: props.formatted,
      name: props.name || props.street || 'Ubicación seleccionada',
      street: props.street,
      city: props.city || 'San Antonio Palopó'
    };

    geocodeCache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.warn('Error en reverseGeocode de Geoapify:', err);
    return null;
  }
}

/**
 * Autocompleta lugares o direcciones con prioridad en el Lago de Atitlán y Guatemala
 */
export async function autocompletePlaces(text, proximity = SAN_ANTONIO_PROXIMITY) {
  if (!GEOAPIFY_API_KEY || !text || text.trim().length < 2) return [];
  try {
    const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(text.trim())}&bias=proximity:${proximity.lon},${proximity.lat}&filter=countrycode:gt&apiKey=${GEOAPIFY_API_KEY}&lang=es`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.features || []).map(f => ({
      id: f.properties.place_id || `${f.properties.lat}-${f.properties.lon}`,
      title: f.properties.name || f.properties.address_line1 || f.properties.formatted,
      subtitle: f.properties.address_line2 || `${f.properties.city || ''}, ${f.properties.state || ''}`,
      lat: f.properties.lat,
      lng: f.properties.lon,
      category: f.properties.category,
      formatted: f.properties.formatted
    }));
  } catch (err) {
    console.warn('Error en autocompletePlaces de Geoapify:', err);
    return [];
  }
}

/**
 * Obtiene el polígono de área caminable (isócrona) en minutos
 * @param {number} lat 
 * @param {number} lon 
 * @param {number} minutes (ej: 10 o 15 minutos)
 * @param {'walk' | 'drive'} mode 
 */
export async function getIsolineArea(lat, lon, minutes = 10, mode = 'walk') {
  if (!GEOAPIFY_API_KEY || !lat || !lon) return null;
  const cacheKey = `${Number(lat).toFixed(4)},${Number(lon).toFixed(4)}_${minutes}_${mode}`;
  if (isolineCache.has(cacheKey)) {
    return isolineCache.get(cacheKey);
  }

  try {
    const rangeSeconds = Math.max(60, minutes * 60);
    const url = `https://api.geoapify.com/v1/isoline?lat=${lat}&lon=${lon}&type=time&mode=${mode}&range=${rangeSeconds}&apiKey=${GEOAPIFY_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.features && data.features.length > 0) {
      const feat = data.features[0];
      isolineCache.set(cacheKey, feat);
      return feat;
    }
    return null;
  } catch (err) {
    console.warn('Error en getIsolineArea de Geoapify:', err);
    return null;
  }
}

function parseGeoapifyFeature(feature, mode) {
  if (!feature) return null;
  const props = feature.properties;
  const geometry = feature.geometry;
  if (!geometry || !props) return null;

  // Convertir coordenadas [lng, lat] de GeoJSON a [lat, lng] para Leaflet
  let latLngCoordinates = [];
  if (geometry.type === 'LineString') {
    latLngCoordinates = geometry.coordinates.map(coord => [coord[1], coord[0]]);
  } else if (geometry.type === 'MultiLineString') {
    latLngCoordinates = geometry.coordinates.flat().map(coord => [coord[1], coord[0]]);
  }

  const steps = props.legs?.[0]?.steps || [];

  return {
    coordinates: latLngCoordinates,
    distanceMeters: props.distance,
    timeSeconds: props.time,
    mode: mode,
    steps: steps.map(s => ({
      instruction: s.instruction?.text,
      distance: s.distance,
      time: s.time
    }))
  };
}

function areRoutesDifferent(r1, r2) {
  if (!r1 || !r2) return false;
  const c1 = r1.coordinates || [];
  const c2 = r2.coordinates || [];
  if (c1.length < 4 || c2.length < 4) return false;

  const dDist = Math.abs(r1.distanceMeters - r2.distanceMeters);
  const dTime = Math.abs(r1.timeSeconds - r2.timeSeconds);

  // Muestrear puntos clave a lo largo del recorrido (25%, 50%, 75%)
  const samples = [0.25, 0.5, 0.75];
  let maxSeparationMeters = 0;
  for (const ratio of samples) {
    const p1 = c1[Math.floor(c1.length * ratio)];
    const p2 = c2[Math.floor(c2.length * ratio)];
    if (p1 && p2) {
      // Cálculo aproximado en metros (~111,000m por grado)
      const dist = Math.hypot(
        (p1[0] - p2[0]) * 111000, 
        (p1[1] - p2[1]) * 111000 * Math.cos(p1[0] * Math.PI / 180)
      );
      if (dist > maxSeparationMeters) maxSeparationMeters = dist;
    }
  }

  // Una ruta alterna real debe desviarse físicamente de la principal al menos 70 metros,
  // o tener una diferencia notable de distancia (>120m) con separación visual comprobada (>=35m).
  // Si ambas van por la misma calle o sentido único, no se genera una segunda ruta falsa.
  return (maxSeparationMeters >= 70) || (dDist >= 120 && maxSeparationMeters >= 35) || (dTime >= 60 && maxSeparationMeters >= 35);
}

/**
 * Evalúa y calcula rutas (hasta 2 opciones cuando existen caminos alternos)
 * @param {[number, number]} start [lat, lng]
 * @param {[number, number]} end [lat, lng]
 * @param {'walk' | 'drive'} mode
 * @returns {Promise<Array>} Lista de 1 o 2 rutas con título y etiqueta
 */
export async function calculateRoutes(start, end, mode = 'drive') {
  if (!GEOAPIFY_API_KEY || !start || !end) return [];
  const cacheKey = `multi_${Number(start[0]).toFixed(4)},${Number(start[1]).toFixed(4)}_${Number(end[0]).toFixed(4)},${Number(end[1]).toFixed(4)}_${mode}`;
  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey);
  }

  try {
    const waypoints = `${start[0]},${start[1]}|${end[0]},${end[1]}`;
    
    // Consulta en paralelo: balanced (más rápida/óptima) y short (más corta en distancia)
    const [resBalanced, resShort] = await Promise.all([
      fetch(`https://api.geoapify.com/v1/routing?waypoints=${waypoints}&mode=${mode}&type=balanced&apiKey=${GEOAPIFY_API_KEY}&lang=es`).catch(() => null),
      fetch(`https://api.geoapify.com/v1/routing?waypoints=${waypoints}&mode=${mode}&type=short&apiKey=${GEOAPIFY_API_KEY}&lang=es`).catch(() => null)
    ]);

    const jsonBalanced = resBalanced?.ok ? await resBalanced.json() : null;
    const primaryRoute = parseGeoapifyFeature(jsonBalanced?.features?.[0], mode);
    if (!primaryRoute || !primaryRoute.coordinates || primaryRoute.coordinates.length === 0) {
      return [];
    }

    primaryRoute.id = 'route-1';
    primaryRoute.title = 'Ruta 1 (Principal)';
    primaryRoute.label = 'Recomendada';

    let alternativeRoute = null;
    const jsonShort = resShort?.ok ? await resShort.json() : null;
    const shortRoute = parseGeoapifyFeature(jsonShort?.features?.[0], mode);

    if (shortRoute && areRoutesDifferent(primaryRoute, shortRoute)) {
      alternativeRoute = shortRoute;
      alternativeRoute.id = 'route-2';
      alternativeRoute.title = 'Ruta 2 (Alternativa)';
      alternativeRoute.label = shortRoute.distanceMeters < primaryRoute.distanceMeters ? 'Más corta' : 'Vía alterna';
    } else {
      // Si balanced y short son idénticos, evaluar less_maneuvers (menos giros)
      try {
        const resLess = await fetch(`https://api.geoapify.com/v1/routing?waypoints=${waypoints}&mode=${mode}&type=less_maneuvers&apiKey=${GEOAPIFY_API_KEY}&lang=es`);
        if (resLess.ok) {
          const jsonLess = await resLess.json();
          const lessRoute = parseGeoapifyFeature(jsonLess?.features?.[0], mode);
          if (lessRoute && areRoutesDifferent(primaryRoute, lessRoute)) {
            alternativeRoute = lessRoute;
            alternativeRoute.id = 'route-2';
            alternativeRoute.title = 'Ruta 2 (Alternativa)';
            alternativeRoute.label = 'Menos giros';
          }
        }
      } catch (_) {}
    }

    const result = alternativeRoute ? [primaryRoute, alternativeRoute] : [primaryRoute];
    routeCache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.warn('Error en calculateRoutes de Geoapify:', err);
    return [];
  }
}

/**
 * Calcula una ruta precisa paso a paso (peatonal o en vehículo) - Retorna la principal
 */
export async function calculateRoute(start, end, mode = 'drive') {
  const routes = await calculateRoutes(start, end, mode);
  return routes.length > 0 ? routes[0] : null;
}
