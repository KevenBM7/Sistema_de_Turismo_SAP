'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Circle, Polyline, GeoJSON } from 'react-leaflet';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useSearchParams, useRouter } from 'next/navigation';
import 'leaflet/dist/leaflet.css';
import 'leaflet-rotate';
import './MapPage.css';
import { createSlug } from '@/lib/slugUtils';
import { Search, X, Navigation, Footprints, Car, Clock, MapPin } from 'lucide-react';
import { reverseGeocode, autocompletePlaces, getIsolineArea, calculateRoutes, calculateRoute } from '@/lib/geoapify';

import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { toast } from 'react-hot-toast';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon.src,
  iconRetinaUrl: markerIcon2x.src,
  shadowUrl: markerShadow.src,
});

const parentCategoryColors = { 
  'Atracciones y Cultura': '#4CAF50',
  'Servicios y Logística': '#FFC107',
  'Movilidad y Transporte': '#2196F3', 
  'default': '#9E9E9E'
};

const getIconForCategory = (parentCategory) => {
  const color = parentCategoryColors[parentCategory] || parentCategoryColors.default;
  const markerHtml = `
    <svg viewBox="0 0 24 24" width="28" height="28" fill="${color}" stroke="white" stroke-width="1" style="pointer-events: none;">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>`;

  return new L.DivIcon({
    html: markerHtml,
    className: 'custom-leaflet-div-icon',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28]
  });
};

const highlightedIcon = new L.DivIcon({
  className: 'highlighted-marker-icon',
  html: `
    <svg viewBox="0 0 24 24" width="36" height="36" fill="#17a2b8" stroke="white" stroke-width="1.5" style="pointer-events: none;">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
    <div class="highlight-pulse"></div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36]
});

const manualMarkerIcon = new L.DivIcon({
  className: 'manual-marker-icon',
  html: `
    <svg viewBox="0 0 24 24" width="30" height="30" fill="#dc3545" stroke="white" stroke-width="2" style="pointer-events: none;">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30]
});

const pointAIcon = new L.DivIcon({
  className: 'custom-point-a-icon',
  html: `
    <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 2px 5px rgba(0,0,0,0.45));">
      <svg viewBox="0 0 24 24" width="32" height="32" fill="#16a34a" stroke="white" stroke-width="1.8" style="pointer-events: none;">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      </svg>
      <span style="position: absolute; top: 3px; color: white; font-size: 11.5px; font-weight: 900; font-family: system-ui, sans-serif;">A</span>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const pointBIcon = new L.DivIcon({
  className: 'custom-point-b-icon',
  html: `
    <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 2px 5px rgba(0,0,0,0.45));">
      <svg viewBox="0 0 24 24" width="32" height="32" fill="#dc2626" stroke="white" stroke-width="1.8" style="pointer-events: none;">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      </svg>
      <span style="position: absolute; top: 3px; color: white; font-size: 11.5px; font-weight: 900; font-family: system-ui, sans-serif;">B</span>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const toRad = (deg) => (deg * Math.PI) / 180;
const toDeg = (rad) => (rad * 180) / Math.PI;

const calculateBearing = (lat1, lon1, lat2, lon2) => {
  const dLon = toRad(lon2 - lon1);
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);

  const y = Math.sin(dLon) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLon);

  const brng = toDeg(Math.atan2(y, x));
  return (brng + 360) % 360;
};

const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaPhi = toRad(lat2 - lat1);
  const deltaLambda = toRad(lon2 - lon1);

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

const formatDistanceStr = (meters) => {
  if (meters === null || meters === undefined || isNaN(meters)) return null;
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
};

// Cálculo de distancia de un punto a un segmento de línea en metros
const distToPathSegment = (p, a, b) => {
  const cosLat = Math.cos((p[0] * Math.PI) / 180);
  const px = p[1] * 111000 * cosLat;
  const py = p[0] * 111000;
  const ax = a[1] * 111000 * cosLat;
  const ay = a[0] * 111000;
  const bx = b[1] * 111000 * cosLat;
  const by = b[0] * 111000;

  const dx = bx - ax;
  const dy = by - ay;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return Math.hypot(px - ax, py - ay);

  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2));
  const projX = ax + t * dx;
  const projY = ay + t * dy;
  return Math.hypot(px - projX, py - projY);
};

// Distancia mínima desde un punto a cualquier tramo de la polilínea
const minDistanceToPolyline = (point, polyline) => {
  let minD = Infinity;
  for (let i = 0; i < polyline.length - 1; i++) {
    const d = distToPathSegment(point, polyline[i], polyline[i + 1]);
    if (d < minD) minD = d;
    if (minD < 5) break; // Si está a menos de 5m es coincidencia directa
  }
  return minD;
};

/**
 * Extrae únicamente los tramos donde la segunda ruta se separa de la principal.
 * En los tramos donde ambas van por la misma calle o sentido, NO se dibuja la segunda
 * para no tapar ni ensuciar la ruta principal seleccionada en azul.
 */
const getDivergentSegments = (altCoords, mainCoords, thresholdMeters = 20) => {
  if (!altCoords || altCoords.length < 2 || !mainCoords || mainCoords.length < 2) {
    return [altCoords || []];
  }

  const isDivergent = altCoords.map(p => minDistanceToPolyline(p, mainCoords) > thresholdMeters);
  const segments = [];
  let current = [];

  for (let i = 0; i < altCoords.length; i++) {
    if (isDivergent[i]) {
      // Al inicio de la bifurcación, agregamos el punto previo para conectar limpiamente con la principal
      if (current.length === 0 && i > 0) {
        current.push(altCoords[i - 1]);
      }
      current.push(altCoords[i]);
    } else {
      // Al reincorporarse a la ruta principal, agregamos el punto de empalme y cerramos el tramo
      if (current.length > 0) {
        current.push(altCoords[i]);
        if (current.length >= 2) {
          segments.push(current);
        }
        current = [];
      }
    }
  }

  if (current.length >= 2) {
    segments.push(current);
  }

  return segments.length > 0 ? segments : [altCoords];
};

const getCardinalDirection = (deg) => {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
  const index = Math.round(((deg % 360) + 360) % 360 / 45) % 8;
  return directions[index];
};

const UserMarker = ({ position, isFollowing, isCompassMode, currentMapBearing = 0, deviceHeading = null }) => {
  const map = useMap();
  const markerRef = React.useRef(null);
  const circleRef = React.useRef(null);

  const currentCoordsRef = React.useRef([position.lat, position.lng]);
  const startCoordsRef = React.useRef([position.lat, position.lng]);
  const targetCoordsRef = React.useRef([position.lat, position.lng]);
  const animStartTimeRef = React.useRef(0);
  const animFrameIdRef = React.useRef(null);

  // Interpolación ultra suave tipo Google Maps a 60fps con requestAnimationFrame
  useEffect(() => {
    if (!position?.lat || !position?.lng) return;

    const prevLat = currentCoordsRef.current[0];
    const prevLng = currentCoordsRef.current[1];
    const newLat = position.lat;
    const newLng = position.lng;

    // Si la variación es prácticamente nula, no reiniciar animación
    if (Math.abs(prevLat - newLat) < 0.000001 && Math.abs(prevLng - newLng) < 0.000001) {
      return;
    }

    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
    }

    startCoordsRef.current = [prevLat, prevLng];
    targetCoordsRef.current = [newLat, newLng];
    animStartTimeRef.current = performance.now();

    // 850ms cubre con fluidez el intervalo de refresco de GPS móvil
    const duration = 850;

    const animate = (time) => {
      const elapsed = time - animStartTimeRef.current;
      const progress = Math.min(1, elapsed / duration);
      // Curva cúbica suave para desaceleración orgánica
      const ease = 1 - Math.pow(1 - progress, 3);

      const curLat = startCoordsRef.current[0] + (targetCoordsRef.current[0] - startCoordsRef.current[0]) * ease;
      const curLng = startCoordsRef.current[1] + (targetCoordsRef.current[1] - startCoordsRef.current[1]) * ease;

      currentCoordsRef.current = [curLat, curLng];

      if (markerRef.current) {
        markerRef.current.setLatLng([curLat, curLng]);
      }
      if (circleRef.current) {
        circleRef.current.setLatLng([curLat, curLng]);
      }

      // Desplazamiento fluido de cámara sin tirones cuando se está siguiendo la ubicación
      if (isFollowing && map) {
        map.panTo([curLat, curLng], { animate: false });
      }

      if (progress < 1) {
        animFrameIdRef.current = requestAnimationFrame(animate);
      }
    };

    animFrameIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [position?.lat, position?.lng, isFollowing, map]);

  // Movimiento activo: velocidad reportada superior a ~2.9 km/h (0.8 m/s)
  const isMoving = typeof position.speed === 'number' && position.speed > 0.8;

  // Rumbo efectivo:
  // - Si está en modo brújula: toma la orientación del dispositivo o posición para rotar con el teléfono.
  // - Si NO está en brújula: SOLO muestra la flecha direccional si nos desplazamos activamente (> 0.8 m/s).
  // - Si estamos detenidos / estáticos: se muestra siempre el círculo azul limpio sin giros erráticos.
  const effectiveHeading = isCompassMode
    ? (typeof position.heading === 'number' && !isNaN(position.heading) ? position.heading : deviceHeading)
    : (isMoving && typeof position.heading === 'number' && !isNaN(position.heading) ? position.heading : null);

  const hasHeading = typeof effectiveHeading === 'number' && !isNaN(effectiveHeading);
  // Ángulo de rotación del puntero en pantalla teniendo en cuenta la rotación activa del mapa
  const screenHeading = hasHeading ? ((effectiveHeading - currentMapBearing + 360) % 360) : 0;

  const markerIcon = React.useMemo(() => {
    if (hasHeading) {
      return new L.DivIcon({
        className: 'user-nav-div-icon',
        html: `
          <div class="user-nav-marker-wrapper" style="transform: rotate(${screenHeading}deg);">
            <div class="nav-vision-beam"></div>
            <div class="user-nav-direction-dot">
              <svg viewBox="0 0 32 32" width="32" height="32" style="overflow: visible; filter: drop-shadow(0 2px 5px rgba(0,0,0,0.35));">
                <!-- Anillo blanco protector exterior -->
                <circle cx="16" cy="16" r="9.5" fill="#ffffff" />
                <!-- Círculo azul oficial de ubicación -->
                <circle cx="16" cy="16" r="7.5" fill="#2563eb" />
                <!-- Puntero direccional formal integrado (estilo Google Maps) -->
                <path d="M16 2.5 L21.5 13 L16 10 L10.5 13 Z" fill="#2563eb" stroke="#ffffff" stroke-width="1.2" stroke-linejoin="round" />
                <!-- Núcleo central blanco -->
                <circle cx="16" cy="16" r="2.8" fill="#ffffff" />
              </svg>
            </div>
          </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18]
      });
    }

    return new L.DivIcon({
      className: 'user-location-container',
      html: `
        <div class="user-static-marker-wrapper">
          <div class="user-static-marker-pulse"></div>
          <div class="user-static-marker-dot"></div>
        </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12]
    });
  }, [hasHeading, screenHeading]);

  const speedKmh = position.speed ? Math.round(position.speed * 3.6) : 0;
  const cardinal = hasHeading ? getCardinalDirection(effectiveHeading) : '';

  return (
    <>
      <Circle
        ref={circleRef}
        center={currentCoordsRef.current}
        radius={Math.min(position.accuracy || 20, 80)}
        pathOptions={{
          color: '#1a73e8',
          fillColor: '#1a73e8',
          fillOpacity: 0.12,
          weight: 1.5,
          interactive: false
        }}
      />

      <Marker 
        ref={markerRef}
        position={currentCoordsRef.current} 
        icon={markerIcon} 
        zIndexOffset={1000}
        eventHandlers={{
          click: (e) => {
            L.DomEvent.stopPropagation(e);
          }
        }}
      >
        <Popup>
          <div className="custom-popup user-popup">
            <strong>Tu ubicación actual</strong>
            {speedKmh > 1 && (
              <div style={{ marginTop: '3px', fontSize: '0.9em', color: '#16a34a', fontWeight: 'bold' }}>
                Velocidad: {speedKmh} km/h
              </div>
            )}
            {hasHeading && (
              <div style={{ marginTop: '2px', fontSize: '0.85em', color: '#2563eb' }}>
                Rumbo: {effectiveHeading}° ({cardinal})
              </div>
            )}
            <div style={{ marginTop: '2px' }}>
              <small style={{ color: '#64748b' }}>Precisión estimada: ±{Math.round(position.accuracy || 10)} m</small>
            </div>
          </div>
        </Popup>
      </Marker>
    </>
  );
};

const MapClickHandler = ({ onMapClick, markingMode }) => {  
  useMapEvents({
    click: (e) => {
      if (!markingMode) {
        return;
      }
      
      // VERIFICACIÓN ESTRICTA: Si el clic provino de un botón, control, menú o banner flotante,
      // NUNCA procesarlo como clic en el mapa (evita que desactivar un botón marque un punto debajo)
      const target = e.originalEvent?.target;
      if (target && target.closest('.control-button, .navigation-controls-unified, .marking-mode-container, .leaflet-control, .leaflet-top, .leaflet-bottom, .map-info-banner, .route-banner-compact, .alternative-routes-floating-bar, .map-search-fab-btn, .map-search-container, button')) {
        return;
      }
      
      onMapClick(e);
      if (e.originalEvent) {
        L.DomEvent.stopPropagation(e.originalEvent);
      }
    },
    // Si está en modo de marcado, bloqueamos el doble clic (zoom).
    dblclick: (e) => {
      if (markingMode) {
        L.DomEvent.stopPropagation(e);
      }
    }
  });
  
  return null;
};

const MapController = React.forwardRef(({ center, isFollowing, initialSelectedSite, hasActiveRoute, defaultCenter, onManualPan, onRotate }, mapRef) => {
  const map = useMap();
  
  React.useImperativeHandle(mapRef, () => ({
      centerMapToDefault: () => {
          map.setView(defaultCenter, 13);
      },
      flyToLocation: (coords, zoom = 16) => {
          map.flyTo(coords, zoom, { duration: 1.2 });
      },
      fitBoundsToCoords: (coords) => {
          if (coords && coords.length > 0) {
              const bounds = L.latLngBounds(coords);
              map.fitBounds(bounds, { padding: [40, 40] });
          }
      },
      setBearing: (bearing) => {
          if (map && typeof map.setBearing === 'function') {
              map.setBearing(bearing);
          }
      },
      getBearing: () => {
          return (map && typeof map.getBearing === 'function') ? map.getBearing() : 0;
      }
  }), [map, defaultCenter]);

  // Capturar rotación del mapa para actualizar brújula
  useEffect(() => {
    if (!map) return;
    const handleRotate = () => {
      if (onRotate && typeof map.getBearing === 'function') {
        onRotate(Math.round(map.getBearing()));
      }
    };
    map.on('rotate', handleRotate);
    return () => {
      map.off('rotate', handleRotate);
    };
  }, [map, onRotate]);

  useEffect(() => {
    if (!map) return;
    const handleUserInteraction = () => {
      if (onManualPan) {
        onManualPan();
      }
    };
    map.on('dragstart', handleUserInteraction);
    map.on('zoomstart', handleUserInteraction);
    return () => {
      map.off('dragstart', handleUserInteraction);
      map.off('zoomstart', handleUserInteraction);
    };
  }, [map, onManualPan]);

  useEffect(() => {
    if (hasActiveRoute) {
      return;
    }
    
    if (initialSelectedSite) {
      const lat = initialSelectedSite.latitude || initialSelectedSite.lat;
      const lng = initialSelectedSite.longitude || initialSelectedSite.lng;
      
      if (lat && lng) {
        map.setView([lat, lng], 14);
        return;
      }
    }
  }, [initialSelectedSite, hasActiveRoute, map]);

  return null;
});

function MapPage() {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const mapRef = React.useRef(null); 

  const searchParams = useSearchParams();
  const router = useRouter();

  const [selectedSite, setSelectedSite] = useState(null);

  useEffect(() => {
    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');
    const idParam = searchParams.get('id');

    if (latParam && lngParam) {
      setSelectedSite({ 
        lat: parseFloat(latParam), 
        lng: parseFloat(lngParam), 
        id: idParam 
      });
    } else {
      setSelectedSite(null);
    }
  }, [searchParams]);

  const initialSelectedSite = selectedSite;
  
  const [userLocation, setUserLocation] = useState(null);
  
  const [routingDestination, setRoutingDestination] = useState(null);
  const [manualDestination, setManualDestination] = useState(null);
  const [pointA, setPointA] = useState(null);
  const [routeOrigin, setRouteOrigin] = useState(null);
  const routeOriginRef = React.useRef(null);
  useEffect(() => {
    routeOriginRef.current = routeOrigin;
  }, [routeOrigin]);

  const [isFollowing, setIsFollowing] = useState(false); 
  const [markingMode, setMarkingMode] = useState(null); // null | 'ab' | 'my_location_to_b'
  const [mapLayer, setMapLayer] = useState('satellite'); // 'satellite' | 'streets' | 'pure-satellite'
  const [showLayersMenu, setShowLayersMenu] = useState(false);
  const layersMenuRef = React.useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (layersMenuRef.current && !layersMenuRef.current.contains(e.target)) {
        setShowLayersMenu(false);
      }
    };
    if (showLayersMenu) {
      document.addEventListener('click', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [showLayersMenu]);

  const [showHelp, setShowHelp] = useState(false);
  const helpContainerRef = React.useRef(null);

  useEffect(() => {
    const handleOutsideHelpClick = (e) => {
      if (helpContainerRef.current && !helpContainerRef.current.contains(e.target)) {
        setShowHelp(false);
      }
    };
    if (showHelp) {
      document.addEventListener('click', handleOutsideHelpClick);
    }
    return () => {
      document.removeEventListener('click', handleOutsideHelpClick);
    };
  }, [showHelp]);

  // Modo Brújula y Orientación Dinámica
  const [isCompassMode, setIsCompassMode] = useState(false);
  const [mapBearing, setMapBearing] = useState(0);
  const [deviceHeading, setDeviceHeading] = useState(null);

  const prevLocationRef = React.useRef(null);
  const lastCalculatedHeadingRef = React.useRef(null);
  const routingDestinationRef = React.useRef(null);

  // Control de saltos anómalos de GPS (Outlier Rejection)
  const lastValidPosRef = React.useRef(null);
  const lastValidTimeRef = React.useRef(0);
  const consecutiveOutliersRef = React.useRef(0);

  // Referencia al contenedor de controles para desactivar propagación de clics al mapa
  const controlsContainerRef = React.useRef(null);
  useEffect(() => {
    if (controlsContainerRef.current) {
      L.DomEvent.disableClickPropagation(controlsContainerRef.current);
      L.DomEvent.disableScrollPropagation(controlsContainerRef.current);
    }
  }, []);

  // Estado de conectividad a internet (Online / Offline)
  const [isOnline, setIsOnline] = useState(true);

  // Geoapify: Modo de transporte ('walk' | 'drive'), rutas evaluadas y activa - Predeterminado en vehículo (drive)
  const [routeTransportMode, setRouteTransportMode] = useState('drive');
  const [availableRoutes, setAvailableRoutes] = useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const geoapifyRoute = availableRoutes[selectedRouteIndex] || null;
  const hasFittedRouteRef = React.useRef(false);

  // Estado de llegada al destino
  const [hasArrived, setHasArrived] = useState(false);

  // Geoapify: Zona caminable a 10 min (Isócrona)
  const [isolineActive, setIsolineActive] = useState(false);
  const [isolinePolygon, setIsolinePolygon] = useState(null);
  const [isolineLoading, setIsolineLoading] = useState(false);

  // Geoapify: Búsqueda y autocompletado inteligente
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = React.useRef(null);

  // Registro transparente del Service Worker para caché automático de mapas
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('[SW] Error al registrar service worker:', err);
      });
    }
  }, []);

  // Detector de conectividad en tiempo real (Online / Offline)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Conexión a internet restablecida', { duration: 3000 });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast('Modo Satelital activo', { duration: 4000 });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sensor de orientación física del smartphone (brújula electrónica)
  useEffect(() => {
    const handleOrientation = (e) => {
      let heading = null;
      if (typeof e.webkitCompassHeading === 'number') {
        // iOS Safari
        heading = e.webkitCompassHeading;
      } else if (typeof e.alpha === 'number') {
        // Android y navegadores estándar
        heading = (360 - e.alpha) % 360;
        if (typeof window !== 'undefined' && window.screen?.orientation?.angle) {
          heading = (heading + window.screen.orientation.angle) % 360;
        }
      }

      if (heading !== null && !isNaN(heading)) {
        setDeviceHeading(Math.round(heading));
      }
    };

    if (typeof window !== 'undefined' && window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientationabsolute', handleOrientation, true);
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
        window.removeEventListener('deviceorientation', handleOrientation, true);
      }
    };
  }, []);

  // Suprimir errores arrojados por extensiones del navegador del usuario (como adblockers o scripts inyectados)
  useEffect(() => {
    const handleExtensionError = (event) => {
      const src = event.filename || (event.error && event.error.stack) || '';
      if (
        src.includes('chrome-extension://') ||
        src.includes('moz-extension://') ||
        event.message?.includes('M_ID')
      ) {
        event.stopImmediatePropagation();
        event.preventDefault();
        return true;
      }
    };

    window.addEventListener('error', handleExtensionError, true);
    return () => {
      window.removeEventListener('error', handleExtensionError, true);
    };
  }, []);

  const lastPositionTime = React.useRef(0);
  const badSignalCounterRef = React.useRef(0);
  
  const routeToastShownRef = React.useRef(false);
  const arrivedToastShownRef = React.useRef(false);
  
  const geolocationWatchErrorToastRef = React.useRef(false);
  
  const SAN_ANTONIO_PALOPO = [14.6920, -91.1172]; 
  const defaultInitialCenter = SAN_ANTONIO_PALOPO; 
  
  const initialCenter = initialSelectedSite ? 
    [initialSelectedSite.lat, initialSelectedSite.lng] : defaultInitialCenter;
  const mapZoom = initialSelectedSite ? 15 : 14;
  
  useEffect(() => {
    const q = query(collection(db, 'sites'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sitesData = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Soporta todas las variantes de coordenadas en Firestore (latitud/longitud directos, GeoPoints o anidados)
        const rawLat = data.latitude ?? data.coordinates?.latitude ?? data.coordinates?._latitude ?? data.coordinates?.lat ?? data.lat;
        const rawLng = data.longitude ?? data.coordinates?.longitude ?? data.coordinates?._longitude ?? data.coordinates?.lng ?? data.lng;

        const lat = typeof rawLat === 'string' ? parseFloat(rawLat) : Number(rawLat);
        const lng = typeof rawLng === 'string' ? parseFloat(rawLng) : Number(rawLng);

        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
          sitesData.push({
            id: doc.id,
            ...data,
            latitude: lat,
            longitude: lng,
          });
        }
      });
      setSites(sitesData);
      setLoading(false);
    }, (err) => {
      setError("No se pudieron cargar los datos para el mapa.");
      setLoading(false);
    });

    window.scrollTo(0, 0);
    return () => unsubscribe();
  }, []);

  const isInsideGuatemala = (lat, lng) => {
    return lat >= 13.5 && lat <= 17.5 && lng >= -92.5 && lng <= -88.0;
  };

  useEffect(() => {
    routingDestinationRef.current = routingDestination;
    if (routingDestination) {
      arrivedToastShownRef.current = false;
      setHasArrived(false);
    }
  }, [routingDestination]);
  
  // Watch de geolocalización de alta frecuencia sin reinicios innecesarios
  useEffect(() => {
    if (!navigator.geolocation) {
      console.error('La geolocalización no es soportada por tu navegador.');
      return;
    }
    
    let userDeniedToastShown = false; 

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        geolocationWatchErrorToastRef.current = false;
        badSignalCounterRef.current = 0;
        userDeniedToastShown = false;

        const now = Date.now();
        // Throttling a 250ms: permite hasta 4 actualizaciones fluidas por segundo
        if (now - lastPositionTime.current < 250) return; 
        lastPositionTime.current = now;

        const { latitude, longitude, accuracy, heading, speed } = position.coords;
        const isNear = isInsideGuatemala(latitude, longitude);

        // --- FILTRO ANTI-SALTOS CINEMÁTICO (OUTLIER REJECTION) ---
        // 1. Descartar lecturas con margen de error inaceptable (> 65m) si ya teníamos una posición previa confiable
        if (accuracy > 65 && lastValidPosRef.current && lastValidPosRef.current.accuracy <= 40) {
          return;
        }

        // 2. Filtro de velocidad física máxima (detecta rebote de antena celular o pérdida de satélites)
        if (lastValidPosRef.current) {
          const dtSeconds = Math.max((now - lastValidTimeRef.current) / 1000, 0.25);
          const jumpDistance = calculateDistanceMeters(
            lastValidPosRef.current.lat,
            lastValidPosRef.current.lng,
            latitude,
            longitude
          );
          const calculatedSpeedKmh = (jumpDistance / dtSeconds) * 3.6;

          // En las carreteras y curvas de Atitlán, velocidades instantáneas superiores a 130 km/h
          // indican un salto espurio (antena celular lejana o rebote de señal en montañas).
          if (calculatedSpeedKmh > 130) {
            consecutiveOutliersRef.current += 1;
            // Si la anomalía se repite 4 veces seguidas con buena precisión, aceptamos el nuevo punto
            if (consecutiveOutliersRef.current < 4) {
              return;
            }
          }
        }

        consecutiveOutliersRef.current = 0;
        lastValidPosRef.current = { lat: latitude, lng: longitude, accuracy };
        lastValidTimeRef.current = now;

        const currentSpeed = (typeof speed === 'number' && !isNaN(speed) && speed > 0) ? speed : 0;
        let dist = 0;
        if (prevLocationRef.current) {
          dist = calculateDistanceMeters(
            prevLocationRef.current.lat, 
            prevLocationRef.current.lng, 
            latitude, 
            longitude
          );
        }

        // Calibración anti-deriva y detección de movimiento real:
        // Se considera desplazamiento activo si la velocidad GPS es > 0.8 m/s (~2.9 km/h)
        // o si hay un avance neto de coordenadas >= 4.0 metros (evitando micro-deriva de GPS estático en interiores).
        const isActivelyMoving = currentSpeed > 0.8 || (dist >= 4.0 && (!speed || currentSpeed > 0.3));

        let activeHeading = null;

        if (isActivelyMoving) {
          // 1. Si el sensor GPS reporta rumbo nativo válido mientras nos movemos
          if (typeof heading === 'number' && !isNaN(heading) && heading >= 0) {
            activeHeading = Math.round(heading);
            lastCalculatedHeadingRef.current = activeHeading;
          } 
          // 2. Si nos movemos y hay avance continuo, calculamos el vector de desplazamiento
          else if (prevLocationRef.current && dist >= 3.0) {
            activeHeading = Math.round(calculateBearing(
              prevLocationRef.current.lat, 
              prevLocationRef.current.lng, 
              latitude, 
              longitude
            ));
            lastCalculatedHeadingRef.current = activeHeading;
          } else {
            activeHeading = lastCalculatedHeadingRef.current;
          }
          prevLocationRef.current = { lat: latitude, lng: longitude };
        } else {
          // Usuario estacionario / quieto: reseteamos rumbo para mantener el círculo limpio y estático
          lastCalculatedHeadingRef.current = null;
          activeHeading = null;
          if (dist >= 3.5) {
            prevLocationRef.current = { lat: latitude, lng: longitude };
          }
        }

        const newLocation = {
          lat: latitude,
          lng: longitude,
          accuracy: accuracy || 25,
          heading: activeHeading,
          speed: currentSpeed,
          isInsideGuatemala: isNear,
        };

        setUserLocation(newLocation);

        const currentDest = routingDestinationRef.current;
        if (currentDest && !arrivedToastShownRef.current && !routeOriginRef.current) {
          const destination = L.latLng(currentDest.lat, currentDest.lng);
          const user = L.latLng(latitude, longitude);
          const distance = user.distanceTo(destination);

          // Umbral de precisión exacta: únicamente al estar en el punto exacto (<= 10 metros)
          if (distance <= 10) {
            const destName = currentDest.name || 'tu destino';
            toast.success(`Has llegado a tu destino: ${destName}`, {
              id: 'arrival-toast',
              duration: 6000,
            });

            // Vibración háptica en teléfonos móviles
            if (typeof window !== 'undefined' && 'vibrate' in navigator) {
              try { navigator.vibrate([250, 100, 250, 100, 400]); } catch (_) {}
            }

            // Anuncio por voz
            if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
              try {
                const utterance = new SpeechSynthesisUtterance(`Has llegado a tu destino, ${destName}`);
                utterance.lang = 'es-ES';
                utterance.rate = 1.0;
                window.speechSynthesis.speak(utterance);
              } catch (_) {}
            }

            arrivedToastShownRef.current = true;
            setHasArrived(true);
          }
        }
      },
      (error) => {
        const errorMessages = {
          1: 'Permisos de ubicación denegados. No se puede usar la ubicación.',
          2: 'Posición no disponible. Verifica el GPS.',
          3: 'Tiempo de espera agotado.'
        };
        
        if (error.code === 1 && !userDeniedToastShown) {
            toast.error(errorMessages[error.code], { duration: 4000 });
            userDeniedToastShown = true;
        }
        else if (error.code === 3) {
            badSignalCounterRef.current += 1;
            if (badSignalCounterRef.current === 3) {
                toast('Buscando señal GPS... Puede tardar un momento.', { duration: 4000 });
            }
        }
        else if (!geolocationWatchErrorToastRef.current) { 
            toast.error(errorMessages[error.code] || 'Error al obtener la ubicación.', { duration: 4000 });
            geolocationWatchErrorToastRef.current = true;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  // Manejador del botón de brújula / orientación activa
  const handleToggleCompass = async () => {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission !== 'granted') {
          toast('Permiso de orientación no concedido');
        }
      } catch (err) {
        console.warn('Permiso de orientación:', err);
      }
    }

    if (isCompassMode) {
      setIsCompassMode(false);
      if (mapRef.current) {
        mapRef.current.setBearing(0);
      }
      toast('Orientación restablecida al Norte (0°)');
    } else {
      // Si el mapa ya tenía rotación manual, al hacer clic se restablece al Norte
      if (mapBearing !== 0) {
        if (mapRef.current) {
          mapRef.current.setBearing(0);
        }
        toast('Orientación restablecida al Norte (0°)');
        return;
      }

      setIsCompassMode(true);
      setIsFollowing(true);
      const heading = (typeof userLocation?.heading === 'number' && userLocation.heading >= 0)
        ? userLocation.heading
        : (deviceHeading ?? 0);
      if (mapRef.current) {
        mapRef.current.setBearing(heading);
      }
      toast.success('Modo brújula activado: el mapa se orienta a tu dirección');
    }
  };

  // Mantener el mapa rotado hacia la dirección del usuario si el modo brújula está activo
  useEffect(() => {
    if (!isCompassMode || !mapRef.current) return;
    const effectiveHeading = (typeof userLocation?.heading === 'number' && (userLocation?.speed > 0.5 || deviceHeading === null))
      ? userLocation.heading
      : (deviceHeading ?? userLocation?.heading);

    if (typeof effectiveHeading === 'number' && !isNaN(effectiveHeading)) {
      mapRef.current.setBearing(effectiveHeading);
    }
  }, [isCompassMode, userLocation?.heading, userLocation?.speed, deviceHeading]);

  const handleCenterMapToDefault = (e) => {
      e.stopPropagation();
      if (mapRef.current) {
          mapRef.current.centerMapToDefault();
          setIsFollowing(false);
      }
  };

  const handleClearSelection = () => {
    setRoutingDestination(null);
    setManualDestination(null);
    setPointA(null);
    setRouteOrigin(null);
    setMarkingMode(null);
    setAvailableRoutes([]);
    setSelectedRouteIndex(0);
    setHasArrived(false);
    routeToastShownRef.current = false;
    arrivedToastShownRef.current = false;
    setSelectedSite(null);
    window.history.replaceState(null, '', '/mapa');
  };

  const handleClearSiteView = () => {
    setSelectedSite(null);
    window.history.replaceState(null, '', '/mapa');
  };

  const isRealLocationAvailable = Boolean(userLocation && typeof userLocation.lat === 'number' && typeof userLocation.lng === 'number');
  
  const memoizedCenter = React.useMemo(() => {
    return userLocation ? [userLocation.lat, userLocation.lng] : null;
  }, [userLocation?.lat, userLocation?.lng]);

  // Distancia exacta restante en metros al destino seleccionado
  const distanceToDestMeters = React.useMemo(() => {
    const dest = routingDestination || manualDestination;
    if (!dest || typeof dest.lat !== 'number') {
      return null;
    }
    // Si hay un Punto A personalizado, medimos de A a B
    if (routeOrigin && typeof routeOrigin.lat === 'number') {
      const origin = L.latLng(routeOrigin.lat, routeOrigin.lng);
      const destination = L.latLng(dest.lat, dest.lng);
      return Math.round(origin.distanceTo(destination));
    }
    // Si es desde Mi Ubicación
    if (userLocation && typeof userLocation.lat === 'number') {
      const user = L.latLng(userLocation.lat, userLocation.lng);
      const destination = L.latLng(dest.lat, dest.lng);
      return Math.round(user.distanceTo(destination));
    }
    return null;
  }, [userLocation?.lat, userLocation?.lng, routeOrigin?.lat, routeOrigin?.lng, routingDestination?.lat, routingDestination?.lng, manualDestination?.lat, manualDestination?.lng]);

  // Manejo de clics en el mapa según el modo activo
  const handleMapClick = (e) => {
    const { lat, lng } = e.latlng;

    // --- MODO 1: Selección A → B (Dos puntos independientes en el mapa) ---
    if (markingMode === 'ab') {
      if (!pointA) {
        // Primer clic: Fijar Punto A (Origen)
        const initialPointA = {
          lat: lat,
          lng: lng,
          name: `Punto A (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
          address: 'Identificando nombre de calle...'
        };
        setPointA(initialPointA);
        setRouteOrigin(initialPointA);
        toast.success('Punto A fijado. Ahora haz clic en el mapa para marcar el Punto B (Destino).', { id: 'point-a-toast', duration: 4500 });

        reverseGeocode(lat, lng).then(info => {
          if (info) {
            const friendlyName = info.name || info.street || info.formatted;
            setPointA(prev => (prev && Math.abs(prev.lat - lat) < 0.0001 && Math.abs(prev.lng - lng) < 0.0001) ? {
              ...prev,
              name: friendlyName,
              address: info.formatted || info.street || ''
            } : prev);
            setRouteOrigin(prev => (prev && Math.abs(prev.lat - lat) < 0.0001 && Math.abs(prev.lng - lng) < 0.0001) ? {
              ...prev,
              name: friendlyName,
              address: info.formatted || info.street || ''
            } : prev);
          }
        }).catch(err => console.warn('Error reverse geocode A:', err));
        return;
      } else {
        // Segundo clic: Fijar Punto B (Destino) y calcular ruta A-B
        const initialPointB = {
          lat: lat,
          lng: lng,
          name: `Punto B (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
          address: 'Identificando nombre de calle...'
        };
        setManualDestination(initialPointB);
        setRoutingDestination(initialPointB);
        setMarkingMode(null);
        setHasArrived(false);
        hasFittedRouteRef.current = false;
        routeToastShownRef.current = false;
        arrivedToastShownRef.current = false;
        setIsFollowing(false);
        toast.loading('Calculando ruta entre Punto A y Punto B...', { id: 'calc-route-toast', duration: 2500 });

        reverseGeocode(lat, lng).then(info => {
          if (info) {
            const friendlyName = info.name || info.street || info.formatted;
            setManualDestination(prev => (prev && Math.abs(prev.lat - lat) < 0.0001 && Math.abs(prev.lng - lng) < 0.0001) ? {
              ...prev,
              name: friendlyName,
              address: info.formatted || info.street || ''
            } : prev);
            setRoutingDestination(prev => (prev && Math.abs(prev.lat - lat) < 0.0001 && Math.abs(prev.lng - lng) < 0.0001) ? {
              ...prev,
              name: friendlyName,
              address: info.formatted || info.street || ''
            } : prev);
          }
        }).catch(err => console.warn('Error reverse geocode B:', err));
        return;
      }
    }

    // --- MODO 2: Mi Ubicación → B (Desde GPS del usuario hacia un punto del mapa) ---
    if (markingMode === 'my_location_to_b') {
      if (!isRealLocationAvailable) {
        toast.error('Ubicación real no disponible. Activa la geolocalización y espera a que se fije.', { duration: 4000 });
        return;
      }

      const initialDestination = {
        lat: lat,
        lng: lng,
        name: `Punto (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        address: 'Identificando nombre de lugar...'
      };

      setPointA(null);
      setRouteOrigin(null); // Origen será userLocation
      setManualDestination(initialDestination);
      setRoutingDestination(initialDestination);
      setHasArrived(false);
      hasFittedRouteRef.current = false;
      routeToastShownRef.current = false;
      arrivedToastShownRef.current = false;
      setIsFollowing(false);
      setMarkingMode(null);
      toast.loading('Trazando ruta desde tu ubicación...', { id: 'calc-route-toast', duration: 2000 });

      reverseGeocode(lat, lng).then(info => {
        if (info) {
          const friendlyName = info.name || info.street || info.formatted;
          setManualDestination(prev => (prev && Math.abs(prev.lat - lat) < 0.0001 && Math.abs(prev.lng - lng) < 0.0001) ? {
            ...prev,
            name: friendlyName,
            address: info.formatted || info.street || ''
          } : prev);
          setRoutingDestination(prev => (prev && Math.abs(prev.lat - lat) < 0.0001 && Math.abs(prev.lng - lng) < 0.0001) ? {
            ...prev,
            name: friendlyName,
            address: info.formatted || info.street || ''
          } : prev);
        }
      }).catch(err => {
        console.warn('Error en reverse geocoding:', err);
      });
      return;
    }
  };

  const handleSetRouting = (site) => {
    if (!isRealLocationAvailable) {
      toast.error('Tu ubicación no está fijada. Activa la geolocalización para trazar la ruta.', { duration: 4000 });
      return;
    }
    
    setTimeout(() => {
      const popups = document.querySelectorAll('.leaflet-popup');
      popups.forEach(popup => popup.remove());
    }, 0);
    
    hasFittedRouteRef.current = false;
    setPointA(null);
    setRouteOrigin(null);
    setManualDestination(null);
    setRoutingDestination({ lat: site.latitude, lng: site.longitude, name: site.name });
    setHasArrived(false);
    routeToastShownRef.current = false;
    arrivedToastShownRef.current = false;
    setIsFollowing(false);
  };

  useEffect(() => {
    hasFittedRouteRef.current = false;
  }, [routingDestination, routeOrigin, routeTransportMode]);

  // 2. Cálculo de ruta con Geoapify (Evalúa opciones y alternativas)
  useEffect(() => {
    if (!routingDestination) {
      setAvailableRoutes([]);
      setSelectedRouteIndex(0);
      hasFittedRouteRef.current = false;
      return;
    }

    const originCoords = routeOrigin 
      ? [routeOrigin.lat, routeOrigin.lng]
      : (isRealLocationAvailable ? [userLocation.lat, userLocation.lng] : null);

    if (!originCoords) {
      setAvailableRoutes([]);
      setSelectedRouteIndex(0);
      hasFittedRouteRef.current = false;
      return;
    }

    let isMounted = true;
    const start = originCoords;
    const end = [routingDestination.lat, routingDestination.lng];

    calculateRoutes(start, end, routeTransportMode).then(results => {
      if (!isMounted) return;
      if (results && results.length > 0) {
        setAvailableRoutes(results);
        setSelectedRouteIndex(0);
        // Encuadrar la vista en la ruta SOLO la primera vez para permitir zoom manual libre sin regresos
        if (!hasFittedRouteRef.current && mapRef.current && results[0]?.coordinates?.length > 0) {
          mapRef.current.fitBoundsToCoords(results[0].coordinates);
          hasFittedRouteRef.current = true;
        }
      } else {
        setAvailableRoutes([]);
        setSelectedRouteIndex(0);
        toast.error('No se encontró una ruta vial para el trayecto seleccionado.', { id: 'no-route' });
      }
    }).catch(err => {
      console.warn('Error calculando ruta con Geoapify:', err);
      setAvailableRoutes([]);
      setSelectedRouteIndex(0);
    });

    return () => {
      isMounted = false;
    };
  }, [routingDestination, routeOrigin, routeTransportMode, isRealLocationAvailable]);

  // Sitios recomendados (ordenados por cercanía en tiempo real si el GPS está disponible)
  const recommendedSites = React.useMemo(() => {
    if (!sites || sites.length === 0) return [];
    let list = sites
      .filter(s => s.latitude && s.longitude)
      .map(s => {
        const distM = (isRealLocationAvailable && userLocation)
          ? calculateDistanceMeters(userLocation.lat, userLocation.lng, s.latitude, s.longitude)
          : null;
        return {
          id: `site-${s.id}`,
          type: 'local',
          title: s.name,
          subtitle: s.category || s.parentCategory || 'Sitio turístico',
          lat: s.latitude,
          lng: s.longitude,
          distMeters: distM,
          siteData: s
        };
      });

    if (isRealLocationAvailable && userLocation) {
      list.sort((a, b) => (a.distMeters ?? Infinity) - (b.distMeters ?? Infinity));
    }
    return list.slice(0, 5);
  }, [sites, isRealLocationAvailable, userLocation]);

  // 3. Búsqueda y autocompletado inteligente (Sitios Firebase + Lugares Geoapify)
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      const q = searchQuery.toLowerCase().trim();

      // Sitios turísticos registrados en Firebase
      let localMatches = (sites || []).filter(site => 
        (site.name && site.name.toLowerCase().includes(q)) ||
        (site.category && site.category.toLowerCase().includes(q)) ||
        (site.parentCategory && site.parentCategory.toLowerCase().includes(q))
      ).map(s => {
        const distM = (isRealLocationAvailable && userLocation && s.latitude && s.longitude)
          ? calculateDistanceMeters(userLocation.lat, userLocation.lng, s.latitude, s.longitude)
          : null;
        return {
          id: `site-${s.id}`,
          type: 'local',
          title: s.name,
          subtitle: s.category || s.parentCategory || 'Sitio turístico',
          lat: s.latitude,
          lng: s.longitude,
          distMeters: distM,
          siteData: s
        };
      });

      if (isRealLocationAvailable && userLocation) {
        localMatches.sort((a, b) => (a.distMeters ?? Infinity) - (b.distMeters ?? Infinity));
      }
      localMatches = localMatches.slice(0, 5);

      // Lugares, calles y comercios en Atitlán mediante Geoapify
      let geoMatches = [];
      try {
        const places = await autocompletePlaces(searchQuery, { 
          lat: SAN_ANTONIO_PALOPO[0], 
          lon: SAN_ANTONIO_PALOPO[1] 
        });
        geoMatches = (places || []).map(p => {
          const distM = (isRealLocationAvailable && userLocation && p.lat && p.lng)
            ? calculateDistanceMeters(userLocation.lat, userLocation.lng, p.lat, p.lng)
            : null;
          return {
            id: `geo-${p.id}`,
            type: 'geoapify',
            title: p.title,
            subtitle: p.subtitle,
            lat: p.lat,
            lng: p.lng,
            distMeters: distM
          };
        }).slice(0, 5);
      } catch (err) {
        console.warn('Error en autocompletado:', err);
      }

      setSearchResults([...localMatches, ...geoMatches]);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, sites, isRealLocationAvailable, userLocation]);

  const handleSelectSearchResult = (result) => {
    if (!result || !result.lat || !result.lng) return;

    if (mapRef.current) {
      mapRef.current.flyToLocation([result.lat, result.lng], 16);
    }

    if (result.type === 'local' && result.siteData) {
      setSelectedSite({
        lat: result.lat,
        lng: result.lng,
        id: result.siteData.id
      });
      toast.success(`Ubicado: ${result.title}`);
    } else {
      const newDest = {
        lat: result.lat,
        lng: result.lng,
        name: result.title,
        address: result.subtitle || ''
      };
      setManualDestination(newDest);
      if (isRealLocationAvailable) {
        setHasArrived(false);
        arrivedToastShownRef.current = false;
        setRoutingDestination(newDest);
        toast.success(`Destino fijado: ${result.title}`);
      } else {
        toast(`Ubicado en el mapa: ${result.title}`);
      }
    }

    setSearchQuery('');
    setSearchResults([]);
    setIsSearchOpen(false);
  };

  // Cerrar buscador flotante al hacer clic fuera o presionar Escape
  useEffect(() => {
    if (!isSearchOpen) return;
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSearchOpen]);

  // 4. Zona caminable a 10 min (Isócrona de Geoapify)
  const handleToggleIsoline = async () => {
    if (!isRealLocationAvailable) {
      toast.error("Activa tu ubicación GPS para calcular tu área caminable.", { duration: 4000 });
      return;
    }

    if (isolineActive) {
      setIsolineActive(false);
      setIsolinePolygon(null);
      toast("Zona caminable desactivada", { icon: '⏱️' });
      return;
    }

    setIsolineLoading(true);
    const toastId = toast.loading("Calculando zona caminable a 10 min...");

    try {
      const feature = await getIsolineArea(userLocation.lat, userLocation.lng, 10, 'walk');
      toast.dismiss(toastId);
      if (feature) {
        setIsolinePolygon(feature);
        setIsolineActive(true);
        toast.success("Mostrando área accesible a 10 minutos a pie", { duration: 4000 });
      } else {
        toast.error("No se pudo calcular la zona caminable para esta ubicación.");
      }
    } catch (err) {
      toast.dismiss(toastId);
      console.warn('Error al obtener isoline:', err);
      toast.error("Error al obtener la zona caminable.");
    } finally {
      setIsolineLoading(false);
    }
  };



  const formatTime = (seconds) => {
    const minutes = Math.round(seconds / 60);
    return `${minutes} min`;
  }

  const truncateTitle = (title, wordLimit = 5) => {
    const words = title.split(' ');
    if (words.length > wordLimit) {
      return words.slice(0, wordLimit).join(' ') + '...';
    }
    return title;
  };

  if (loading) return <p>Cargando mapa...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="map-page-container">
      {/* Buscador Flotante Desplegable (Firebase + Geoapify) */}
      {!isSearchOpen ? (
        <button
          type="button"
          className="map-search-fab-btn"
          onClick={(e) => {
            e.stopPropagation();
            setIsSearchOpen(true);
          }}
          title="Buscar sitios, hoteles o direcciones en el mapa"
          aria-label="Abrir buscador en el mapa"
        >
          <Search size={19} />
        </button>
      ) : (
        <div className="map-search-container expanded" ref={searchContainerRef}>
          <div className="map-search-input-wrapper">
            <Search size={17} className="map-search-icon" />
            <input
              type="text"
              className="map-search-input"
              placeholder="Buscar sitios, hoteles, miradores..."
              value={searchQuery}
              autoFocus
              onChange={(e) => {
                setSearchQuery(e.target.value);
              }}
            />
            {searchQuery && (
              <button
                type="button"
                className="map-search-clear"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                title="Borrar texto"
              >
                <X size={15} />
              </button>
            )}
            <button
              type="button"
              className="map-search-close-btn"
              onClick={() => {
                setIsSearchOpen(false);
                setSearchQuery('');
                setSearchResults([]);
              }}
              title="Cerrar buscador"
            >
              <X size={16} />
            </button>
          </div>

          {/* Desplegable de Recomendaciones y Resultados */}
          <div className="map-search-dropdown">
            {searchQuery.trim().length < 2 ? (
              <div className="map-search-recommended-section">
                <div className="map-search-section-header">
                  <span className="map-search-section-title">
                    {isRealLocationAvailable 
                      ? 'Lugares recomendados cerca de ti' 
                      : 'Lugares destacados en San Antonio Palopó'}
                  </span>
                </div>
                {recommendedSites.length > 0 ? (
                  <div className="map-search-results-list">
                    {recommendedSites.map((item) => {
                      const distStr = formatDistanceStr(item.distMeters);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className="map-search-item"
                          onClick={() => handleSelectSearchResult(item)}
                        >
                          <div className="map-search-item-icon">
                            <MapPin size={17} color="#10b981" />
                          </div>
                          <div className="map-search-item-info">
                            <div className="map-search-item-title">{item.title}</div>
                            <div className="map-search-item-subtitle">{item.subtitle}</div>
                          </div>
                          <div className="map-search-item-badges">
                            {distStr && (
                              <span className="map-search-dist-badge">a {distStr}</span>
                            )}
                            <span className="map-search-badge local">Turismo</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="map-search-empty">No hay sitios registrados aún.</div>
                )}
              </div>
            ) : (
              <>
                {isSearching && (
                  <div className="map-search-loading">
                    <span>Buscando en San Antonio Palopó...</span>
                  </div>
                )}
                {!isSearching && searchResults.length === 0 && (
                  <div className="map-search-empty">
                    No se encontraron resultados para "{searchQuery}"
                  </div>
                )}
                {!isSearching && searchResults.length > 0 && (
                  <div className="map-search-results-list">
                    {searchResults.map((item) => {
                      const distStr = formatDistanceStr(item.distMeters);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className="map-search-item"
                          onClick={() => handleSelectSearchResult(item)}
                        >
                          <div className="map-search-item-icon">
                            {item.type === 'local' ? (
                              <MapPin size={17} color="#10b981" />
                            ) : (
                              <Navigation size={17} color="#2563eb" />
                            )}
                          </div>
                          <div className="map-search-item-info">
                            <div className="map-search-item-title">{item.title}</div>
                            <div className="map-search-item-subtitle">{item.subtitle}</div>
                          </div>
                          <div className="map-search-item-badges">
                            {distStr && (
                              <span className="map-search-dist-badge">a {distStr}</span>
                            )}
                            <span className={`map-search-badge ${item.type}`}>
                              {item.type === 'local' ? 'Turismo' : 'Lugar'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <h1 className="map-page-title">Sitios Turísticos</h1>

      {!isOnline && (
        <div className="map-offline-status-banner">
          <span className="offline-pulse-dot"></span>
          <span>Modo Satelital</span>
        </div>
      )}

      {initialSelectedSite && !routingDestination && !manualDestination && (
        <div className="map-info-banner">
          <p>Viendo sitio seleccionado</p>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleClearSiteView();
            }} 
            className="map-info-banner-close"
          >
            ✕
          </button>
        </div>
      )}

      {(routingDestination || manualDestination || pointA) && (
        <div className={`map-info-banner route-banner-compact ${hasArrived ? 'arrived-banner' : ''}`}>
          {/* Selector compacto de modo a pie / auto */}
          {!hasArrived && routingDestination && (
            <div className="route-mode-switcher-compact">
              <button 
                type="button" 
                className={`mode-icon-btn ${routeTransportMode === 'walk' ? 'active' : ''}`}
                onClick={() => setRouteTransportMode('walk')}
                title="Ruta a pie (senderos y callejones)"
                aria-label="A pie"
              >
                <Footprints size={15} />
              </button>
              <button 
                type="button" 
                className={`mode-icon-btn ${routeTransportMode === 'drive' ? 'active' : ''}`}
                onClick={() => setRouteTransportMode('drive')}
                title="Ruta en vehículo (calles y carreteras)"
                aria-label="En vehículo"
              >
                <Car size={15} />
              </button>
            </div>
          )}

          {/* Nombre de Destino / Información de ruta y Distancia en vivo */}
          <div className="route-compact-main">
            <span className="route-dest-name-compact" title={pointA && !routingDestination ? pointA.name : (pointA ? `${pointA.name} ➔ ${routingDestination?.name}` : (manualDestination ? manualDestination.name : routingDestination?.name))}>
              {hasArrived ? `¡Has llegado a tu destino!` : (
                pointA && !routingDestination 
                  ? `Punto A fijado: Haz clic para Punto B`
                  : (pointA 
                      ? `A: ${pointA.name} ➔ B: ${routingDestination?.name || 'Destino'}`
                      : (manualDestination ? manualDestination.name : routingDestination?.name)
                    )
              )}
            </span>
            {geoapifyRoute && !hasArrived && (
              <span className="route-stats-badge-compact">
                {distanceToDestMeters !== null && !pointA && distanceToDestMeters <= 200 
                  ? `A ${distanceToDestMeters} m` 
                  : `${Math.round(geoapifyRoute.timeSeconds / 60)} min • ${geoapifyRoute.distanceMeters >= 1000 ? `${(geoapifyRoute.distanceMeters / 1000).toFixed(1)} km` : `${Math.round(geoapifyRoute.distanceMeters)} m`}`}
              </span>
            )}
          </div>

          {/* Botón Cerrar / Finalizar */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleClearSelection();
            }} 
            className="route-banner-close-btn"
            title={hasArrived ? "Finalizar ruta" : "Cerrar ruta"}
          >
            {hasArrived ? 'Finalizar' : '✕'}
          </button>
        </div>
      )}

      {/* Cuadro flotante separado e independiente para alternar rutas (Ruta 1 / Ruta 2) */}
      {!hasArrived && availableRoutes.length > 1 && (
        <div className="alternative-routes-floating-bar">
          <div className="routes-floating-pill-group">
            {availableRoutes.map((rt, idx) => {
              const isSelected = idx === selectedRouteIndex;
              const timeMin = Math.round(rt.timeSeconds / 60);
              const distStr = rt.distanceMeters >= 1000 
                ? `${(rt.distanceMeters / 1000).toFixed(1)} km` 
                : `${Math.round(rt.distanceMeters)} m`;

              const routeColor = isSelected 
                ? (routeTransportMode === 'walk' ? '#10b981' : '#2563eb')
                : '#38bdf8';

              return (
                <button
                  key={rt.id || idx}
                  type="button"
                  className={`route-pill-btn route-pill-${idx === 0 ? 'primary' : 'alternate'} ${isSelected ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedRouteIndex(idx);
                    if (mapRef.current && rt.coordinates?.length > 0) {
                      mapRef.current.fitBoundsToCoords(rt.coordinates);
                    }
                  }}
                >
                  <span 
                    className="route-pill-indicator-dot" 
                    style={{ backgroundColor: routeColor }}
                  ></span>
                  <span className="route-pill-btn-label">{idx === 0 ? 'Ruta 1' : 'Ruta 2'}</span>
                  <span className="route-pill-btn-stats">{timeMin} min ({distStr})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <MapContainer 
        center={initialCenter} 
        zoom={mapZoom} 
        maxZoom={21}
        className="map-view" 
        zoomControl={false}
        rotate={true}
        touchRotate={true}
        rotateControl={false}
        preferCanvas={true}
      >
        <MapController 
          ref={mapRef}
          center={memoizedCenter}
          isFollowing={isFollowing} 
          initialSelectedSite={initialSelectedSite}
          hasActiveRoute={Boolean(geoapifyRoute)} 
          defaultCenter={defaultInitialCenter}
          onManualPan={() => setIsFollowing(false)}
          onRotate={(bearing) => setMapBearing(bearing)}
        />

        <MapClickHandler onMapClick={handleMapClick} markingMode={markingMode} />

        <div className="leaflet-top leaflet-right">
          <div className="navigation-controls-unified" ref={controlsContainerRef}>
            {/* Botón y Menú de Capas Desplegable */}
            <div className="map-layers-container" ref={layersMenuRef}>
              <button 
                type="button"
                onClick={(e) => {
                  L.DomEvent.stopPropagation(e);
                  setShowLayersMenu(prev => !prev);
                }} 
                className={`control-button ${showLayersMenu ? 'active' : ''}`}
                title="Capas del mapa"
                aria-label="Seleccionar capa del mapa"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                  <polyline points="2,17 12,22 22,17"></polyline>
                  <polyline points="2,12 12,17 22,12"></polyline>
                </svg>
              </button>

              {showLayersMenu && (
                <div className="map-layers-dropdown" onClick={(e) => L.DomEvent.stopPropagation(e)}>
                  <div className="map-layers-header">
                    <span>Capas del Mapa</span>
                    <button 
                      type="button" 
                      onClick={() => setShowLayersMenu(false)}
                      className="layers-close-btn"
                      aria-label="Cerrar menú de capas"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="map-layers-list">
                    {/* Capa 1: Satélite Híbrido HD (Google) */}
                    <button
                      type="button"
                      className={`map-layer-item ${mapLayer === 'satellite' ? 'selected' : ''}`}
                      onClick={() => {
                        setMapLayer('satellite');
                        setShowLayersMenu(false);
                      }}
                    >
                      <div className="map-layer-icon-badge">🛰️</div>
                      <div className="map-layer-text">
                        <span className="map-layer-name">Satélite Híbrido HD</span>
                        <span className="map-layer-desc">Google Maps con calles y nombres</span>
                      </div>
                      {mapLayer === 'satellite' && <span className="map-layer-check">✓</span>}
                    </button>

                    {/* Capa 2: Calles Oficial (OpenStreetMap) - El original sin tocar */}
                    <button
                      type="button"
                      className={`map-layer-item ${mapLayer === 'streets' ? 'selected' : ''}`}
                      onClick={() => {
                        setMapLayer('streets');
                        setShowLayersMenu(false);
                      }}
                    >
                      <div className="map-layer-icon-badge">🗺️</div>
                      <div className="map-layer-text">
                        <span className="map-layer-name">Calles (OpenStreetMap)</span>
                        <span className="map-layer-desc">Mapa vectorial oficial libre y rápido</span>
                      </div>
                      {mapLayer === 'streets' && <span className="map-layer-check">✓</span>}
                    </button>

                    {/* Capa 3: Satélite Puro (Google) */}
                    <button
                      type="button"
                      className={`map-layer-item ${mapLayer === 'pure-satellite' ? 'selected' : ''}`}
                      onClick={() => {
                        setMapLayer('pure-satellite');
                        setShowLayersMenu(false);
                      }}
                    >
                      <div className="map-layer-icon-badge">📷</div>
                      <div className="map-layer-text">
                        <span className="map-layer-name">Satélite Puro (Google)</span>
                        <span className="map-layer-desc">Fotografía aérea limpia sin textos</span>
                      </div>
                      {mapLayer === 'pure-satellite' && <span className="map-layer-check">✓</span>}
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Botón Seguir mi Ubicación (Icono formal de mira/GPS) */}
            <button 
              type="button"
              onClick={(e) => {
                L.DomEvent.stopPropagation(e);
                if (isRealLocationAvailable) {
                  const nextFollowing = !isFollowing;
                  setIsFollowing(nextFollowing);
                  if (nextFollowing && mapRef.current) {
                    mapRef.current.flyToLocation([userLocation.lat, userLocation.lng], 16); 
                  }
                } else {
                  toast.error("La ubicación aún no está disponible o el acceso fue denegado en tu navegador.", { duration: 4000 });
                }
              }} 
              className={`control-button ${isFollowing && isRealLocationAvailable ? 'active' : ''}`}
              title="Centrar en mi ubicación GPS"
              disabled={!isRealLocationAvailable}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="7" />
                <circle cx="12" cy="12" r="2.5" fill="currentColor" />
                <line x1="12" y1="1" x2="12" y2="4" />
                <line x1="12" y1="20" x2="12" y2="23" />
                <line x1="1" y1="12" x2="4" y2="12" />
                <line x1="20" y1="12" x2="23" y2="12" />
              </svg>
            </button>

            {/* Botón de Brújula / Navegación */}
            <button 
              type="button"
              onClick={(e) => {
                L.DomEvent.stopPropagation(e);
                handleToggleCompass();
              }} 
              className={`control-button compass-button ${isCompassMode ? 'active' : ''}`}
              title={
                isCompassMode 
                  ? "Desactivar modo navegación (Restablecer Norte arriba)" 
                  : (mapBearing !== 0 
                      ? "Restablecer Norte arriba (0°)" 
                      : "Activar modo brújula / orientación hacia adelante")
              }
            >
              <svg 
                width="22" 
                height="22" 
                viewBox="0 0 24 24" 
                fill="none" 
                style={{ 
                  transform: `rotate(${-mapBearing}deg)`, 
                  transition: 'transform 0.25s ease-out' 
                }}
              >
                <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
                <polygon points="12,3 15,12 12,10 9,12" fill="#ef4444" />
                <polygon points="12,21 15,12 12,14 9,12" fill="#94a3b8" />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" />
              </svg>
            </button>

            <button
                type="button"
                onClick={(e) => {
                  L.DomEvent.stopPropagation(e);
                  handleCenterMapToDefault(e);
                }}
                className="control-button"
                title="Centrar en San Antonio Palopó"
                style={{ fontSize: '1.2em', fontWeight: 'bold' }}
            >
                SAP
            </button>
            
            {/* Botón A→B: Ruta entre dos puntos del mapa */}
            <div className="marking-mode-container">
              <button 
                type="button"
                onClick={(e) => {
                  L.DomEvent.stopPropagation(e);
                  if (markingMode === 'ab') {
                    setMarkingMode(null);
                    setPointA(null);
                    toast('Modo A→B cancelado');
                  } else {
                    setMarkingMode('ab');
                    setPointA(null);
                    setRouteOrigin(null);
                    toast('Haz clic en el mapa para marcar el Punto A (Origen)', { duration: 4000 });
                  }
                }} 
                className={`control-button ${markingMode === 'ab' ? 'active' : ''}`}
                title={markingMode === 'ab' ? "Modo A→B activo (Clic para cancelar)" : "Ruta A→B: Selecciona Punto A y Punto B en el mapa"}
              >
                A→B
              </button>
            </div>

            {/* Nuevo Botón: Mi Ubicación → B */}
            <div className="marking-mode-container">
              <button 
                type="button"
                onClick={(e) => {
                  L.DomEvent.stopPropagation(e);
                  if (!isRealLocationAvailable) {
                    toast.error('Ubicación GPS no disponible. Activa la geolocalización en tu navegador.', { duration: 4000 });
                    return;
                  }
                  if (markingMode === 'my_location_to_b') {
                    setMarkingMode(null);
                    toast('Modo Mi Ubicación→B cancelado');
                  } else {
                    setMarkingMode('my_location_to_b');
                    setPointA(null);
                    setRouteOrigin(null);
                    toast('Haz clic en el mapa para fijar el Destino B desde tu ubicación actual', { duration: 4000 });
                  }
                }} 
                className={`control-button loc-b-button ${markingMode === 'my_location_to_b' ? 'active' : ''}`}
                title={markingMode === 'my_location_to_b' ? "Modo Mi Ubicación→B activo (Clic para cancelar)" : "Mi Ubicación → B: Ruta desde tu GPS a un punto del mapa"}
                disabled={!isRealLocationAvailable}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="13" 
                  height="13" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  style={{ flexShrink: 0 }}
                >
                  <circle cx="12" cy="12" r="7" />
                  <circle cx="12" cy="12" r="2.5" fill="currentColor" />
                  <line x1="12" y1="1" x2="12" y2="4" />
                  <line x1="12" y1="20" x2="12" y2="23" />
                  <line x1="1" y1="12" x2="4" y2="12" />
                  <line x1="20" y1="12" x2="23" y2="12" />
                </svg>
                <span className="loc-b-label">→B</span>
              </button>
            </div>

            {/* Zona Caminable a 10 min (Isócrona Geoapify) */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleToggleIsoline();
              }} 
              className={`control-button ${isolineActive ? 'active' : ''}`}
              title={isolineActive ? "Ocultar zona caminable" : "Ver zona caminable a 10 min a pie (Isócrona)"}
              disabled={!isRealLocationAvailable || isolineLoading}
            >
              {isolineLoading ? (
                <span className="loading-spinner-char">⌛</span>
              ) : (
                <Clock size={18} />
              )}
            </button>

            {/* --- BOTÓN Y MODAL/TOOLTIP DE AYUDA --- */}
            <div className="map-help-container" ref={helpContainerRef}>
              <button 
                type="button" 
                className={`control-button help-button ${showHelp ? 'active' : ''}`} 
                aria-label="Ayuda del mapa"
                title="Guía de funciones del mapa"
                onClick={(e) => {
                  L.DomEvent.stopPropagation(e);
                  setShowHelp(prev => !prev);
                }}
              >
                ?
              </button>
              <div className={`help-tooltip ${showHelp ? 'show' : ''}`}>
                <div className="help-tooltip-header">
                  <h4>Guía del Mapa Turístico</h4>
                  <button 
                    type="button" 
                    className="help-close-btn"
                    onClick={(e) => {
                      L.DomEvent.stopPropagation(e);
                      setShowHelp(false);
                    }}
                    aria-label="Cerrar guía"
                  >
                    ✕
                  </button>
                </div>
                <ul>
                  <li>
                    <div className="help-item-label">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2,17 12,22 22,17"></polyline><polyline points="2,12 12,17 22,12"></polyline></svg>
                      <span>Vistas:</span>
                    </div>
                    <div className="help-item-desc">Alterna entre Satélite Híbrido HD, Calles y Satélite Puro.</div>
                  </li>
                  <li>
                    <div className="help-item-label">
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <circle cx="12" cy="12" r="7" />
                        <circle cx="12" cy="12" r="2.5" fill="currentColor" />
                        <line x1="12" y1="1" x2="12" y2="4" />
                        <line x1="12" y1="20" x2="12" y2="23" />
                        <line x1="1" y1="12" x2="4" y2="12" />
                        <line x1="20" y1="12" x2="23" y2="12" />
                      </svg>
                      <span>Seguir:</span>
                    </div>
                    <div className="help-item-desc">Centra y sigue tu ubicación GPS en tiempo real.</div>
                  </li>
                  <li>
                    <div className="help-item-label">
                      <span>Brújula:</span>
                    </div>
                    <div className="help-item-desc">Gira el mapa con tu orientación o fija Norte.</div>
                  </li>
                  <li>
                    <div className="help-item-label">
                      <span>SAP:</span>
                    </div>
                    <div className="help-item-desc">Vuelve al centro de San Antonio Palopó.</div>
                  </li>
                  <li>
                    <div className="help-item-label">
                      <span>A→B:</span>
                    </div>
                    <div className="help-item-desc">Marca Punto A (inicio) y Punto B (fin) en el mapa para trazar ruta.</div>
                  </li>
                  <li>
                    <div className="help-item-label">
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <circle cx="12" cy="12" r="7" />
                        <circle cx="12" cy="12" r="2.5" fill="currentColor" />
                        <line x1="12" y1="1" x2="12" y2="4" />
                        <line x1="12" y1="20" x2="12" y2="23" />
                        <line x1="1" y1="12" x2="4" y2="12" />
                        <line x1="20" y1="12" x2="23" y2="12" />
                      </svg>
                      <span>→B:</span>
                    </div>
                    <div className="help-item-desc">Traza ruta directa desde tu GPS actual a cualquier punto del mapa.</div>
                  </li>
                  <li>
                    <div className="help-item-label">
                      <Clock size={13} style={{ flexShrink: 0 }} />
                      <span>10 min:</span>
                    </div>
                    <div className="help-item-desc">Polígono de alcance a pie (isócrona caminable).</div>
                  </li>
                  <li>
                    <div className="help-item-label">
                      <Footprints size={13} style={{ flexShrink: 0 }} />
                      <span>Modos:</span>
                    </div>
                    <div className="help-item-desc">Alterna entre ruta peatonal y vehículo.</div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Polígono de Zona Caminable a 10 min (GeoJSON Geoapify) */}
        {isolineActive && isolinePolygon && (
          <GeoJSON 
            key={`isoline-${isolinePolygon.id || JSON.stringify(isolinePolygon.geometry?.coordinates?.[0]?.[0] || 'iso')}`}
            data={isolinePolygon}
            style={{
              color: '#10b981',
              weight: 2.5,
              opacity: 0.85,
              fillColor: '#10b981',
              fillOpacity: 0.18,
              dashArray: '5, 5'
            }}
          />
        )}

        {/* Trazado de Rutas Alternativas (Únicamente en tramos donde se desvía de la principal, en celeste claro vibrante) */}
        {availableRoutes && availableRoutes.length > 1 && geoapifyRoute && availableRoutes.map((altRt, altIdx) => {
          if (altIdx === selectedRouteIndex) return null;

          // Extraer SOLO los tramos que divergen de la ruta principal seleccionada
          // En los tramos compartidos (donde ambas rutas van por la misma calle o sentido), NO se dibuja para no tapar la ruta azul
          const divergentSegments = getDivergentSegments(altRt.coordinates, geoapifyRoute.coordinates, 22);

          const altColor = '#38bdf8'; // Celeste claro vibrante y visible
          const altBorderColor = '#0369a1'; // Contorno azul profundo para contraste sobre satélite y calles

          return (
            <React.Fragment key={`alt-route-${altRt.id || altIdx}`}>
              {divergentSegments.map((segCoords, segIdx) => (
                <React.Fragment key={`alt-seg-${altRt.id || altIdx}-${segIdx}`}>
                  {/* Contorno protector sutil para contraste nítido */}
                  <Polyline 
                    positions={segCoords} 
                    pathOptions={{
                      color: altBorderColor,
                      weight: 6.5,
                      opacity: 0.45,
                      lineCap: 'round',
                      lineJoin: 'round'
                    }} 
                  />
                  {/* Trazo celeste claro que muestra la vía alterna conectando con la principal */}
                  <Polyline 
                    positions={segCoords} 
                    pathOptions={{
                      color: altColor,
                      weight: 4.5,
                      opacity: 0.95,
                      dashArray: '8, 6',
                      lineCap: 'round',
                      lineJoin: 'round'
                    }} 
                    eventHandlers={{
                      click: (e) => {
                        L.DomEvent.stopPropagation(e);
                        setSelectedRouteIndex(altIdx);
                        toast.success(`Cambiando a ${altRt.title}`, { id: 'route-switch-toast', duration: 2500 });
                      }
                    }}
                  />
                </React.Fragment>
              ))}
            </React.Fragment>
          );
        })}

        {/* Trazado de Ruta Inteligente Geoapify (Principal / Activa en azul intenso o verde) */}
        {geoapifyRoute && geoapifyRoute.coordinates && geoapifyRoute.coordinates.length > 0 && (
          <>
            <Polyline 
              positions={geoapifyRoute.coordinates} 
              pathOptions={{
                color: '#0f172a',
                weight: 7.5,
                opacity: 0.35,
                lineCap: 'round',
                lineJoin: 'round'
              }} 
            />
            <Polyline 
              positions={geoapifyRoute.coordinates} 
              pathOptions={{
                color: routeTransportMode === 'walk' ? '#10b981' : '#2563eb',
                weight: 5.5,
                opacity: 0.98,
                lineCap: 'round',
                lineJoin: 'round'
              }} 
            />
          </>
        )}



        {mapLayer === 'satellite' ? (
          <TileLayer
            key="google-hybrid-hd"
            url="https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
            subdomains={['0', '1', '2', '3']}
            attribution='&copy; Google Maps'
            maxNativeZoom={20}
            maxZoom={21}
            keepBuffer={15}
            updateWhenIdle={false}
            updateWhenZooming={false}
            updateInterval={80}
            crossOrigin="anonymous"
          />
        ) : mapLayer === 'streets' ? (
          <TileLayer
            key="osm-streets"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            maxNativeZoom={19}
            maxZoom={21}
            keepBuffer={15}
            updateWhenIdle={false}
            updateWhenZooming={false}
            updateInterval={80}
            crossOrigin="anonymous"
          />
        ) : (
          <TileLayer
            key="google-satellite-pure"
            url="https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
            subdomains={['0', '1', '2', '3']}
            attribution='&copy; Google Maps'
            maxNativeZoom={20}
            maxZoom={21}
            keepBuffer={15}
            updateWhenIdle={false}
            updateWhenZooming={false}
            updateInterval={80}
            crossOrigin="anonymous"
          />
        )}

        {isRealLocationAvailable && (
          <UserMarker 
            position={userLocation} 
            isFollowing={isFollowing}
            isCompassMode={isCompassMode}
            currentMapBearing={mapBearing}
            deviceHeading={deviceHeading}
          />
        )}

        {/* Marcador para Punto A (en modo A-B) */}
        {pointA && (
          <Marker 
            position={[pointA.lat, pointA.lng]} 
            icon={pointAIcon}
            eventHandlers={{
              click: (e) => {
                L.DomEvent.stopPropagation(e);
              }
            }}
          >
            <Popup>
              <div className="custom-popup">
                <h4>Punto A (Origen)</h4>
                {pointA.address && (
                  <p style={{ margin: '4px 0', fontSize: '0.85em', color: '#4b5563' }}>
                    {pointA.address}
                  </p>
                )}
                <p style={{ margin: '2px 0 8px 0', fontSize: '0.75em', color: '#9ca3af' }}>
                  {pointA.lat.toFixed(5)}, {pointA.lng.toFixed(5)}
                </p>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearSelection();
                  }} 
                  className="popup-route-button"
                  style={{ backgroundColor: '#dc3545' }}
                >
                  Eliminar punto
                </button>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marcador para Punto B o destino seleccionado manualmente */}
        {manualDestination && (
          <Marker 
            position={[manualDestination.lat, manualDestination.lng]} 
            icon={pointA ? pointBIcon : manualMarkerIcon}
            eventHandlers={{
              click: (e) => {
                L.DomEvent.stopPropagation(e);
              }
            }}
          >
            <Popup>
              <div className="custom-popup">
                <h4>{pointA ? 'Punto B (Destino)' : 'Destino seleccionado'}</h4>
                {manualDestination.address && (
                  <p style={{ margin: '4px 0', fontSize: '0.85em', color: '#4b5563' }}>
                    {manualDestination.address}
                  </p>
                )}
                <p style={{ margin: '2px 0 8px 0', fontSize: '0.75em', color: '#9ca3af' }}>
                  {manualDestination.lat.toFixed(5)}, {manualDestination.lng.toFixed(5)}
                </p>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearSelection();
                  }} 
                  className="popup-route-button"
                  style={{ backgroundColor: '#dc3545' }}
                >
                  Eliminar punto
                </button>
              </div>
            </Popup>
          </Marker>
        )}

        {sites.map(site => {
          const catSlug = createSlug(site.category || site.parentCategory || 'general');
          const siteSlug = site.slug || site.id;

          return (
            <Marker 
              key={site.id} 
              position={[site.latitude, site.longitude]} 
              icon={initialSelectedSite && (initialSelectedSite.id === site.id || 
                    (initialSelectedSite.lat === site.latitude && initialSelectedSite.lng === site.longitude)) ?
                highlightedIcon : getIconForCategory(site.parentCategory)}
              eventHandlers={{
                click: (e) => {
                  L.DomEvent.stopPropagation(e);
                }
              }}
            >
              <Popup>
                <div className="custom-popup compact-site-popup">
                  <h4 title={site.name}>{site.name}</h4>
                  <p className="popup-site-category">{site.category}</p>
                  
                  <div className="popup-buttons-row">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetRouting(site);
                      }} 
                      className="popup-route-button"
                      disabled={!isRealLocationAvailable}
                      title={!isRealLocationAvailable ? "Activa tu ubicación para usar esta función" : "Calcular ruta en vehículo"}
                    >
                      <Navigation size={13} style={{ flexShrink: 0 }} />
                      <span>Cómo llegar</span>
                    </button>
                    <Link 
                      href={`/categoria/${catSlug}/${siteSlug}`} 
                      className="popup-link"
                    >
                      <span>Ver detalles</span>
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
export default MapPage;