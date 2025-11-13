import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import 'leaflet-rotate';
import './MapPage.css';

import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { toast } from 'react-hot-toast';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
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
    <svg viewBox="0 0 24 24" width="28" height="28" fill="${color}" stroke="white" stroke-width="1">
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
    <svg viewBox="0 0 24 24" width="36" height="36" fill="#17a2b8" stroke="white" stroke-width="1.5">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
    <div class="highlight-pulse"></div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36]
});

// NUEVO: Icono para punto marcado manualmente
const manualMarkerIcon = new L.DivIcon({
  className: 'manual-marker-icon',
  html: `
    <svg viewBox="0 0 24 24" width="30" height="30" fill="#dc3545" stroke="white" stroke-width="2">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30]
});

// Marcador de usuario SIMPLE - solo círculo azul
const UserMarker = ({ position }) => {
  const markerIcon = React.useMemo(() => {
    return new L.DivIcon({
      className: 'user-location-simple-icon',
      html: `<div style="
        width: 16px; 
        height: 16px; 
        background-color: #1a73e8; 
        border: 3px solid white; 
        border-radius: 50%; 
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
  }, []);

  return (
    <Marker 
      position={position} 
      icon={markerIcon} 
      zIndexOffset={1000}
    >
      <Popup>
        <div>
          <strong>Tu ubicación</strong>
        </div>
      </Popup>
    </Marker>
  );
};

// NUEVO: Componente para manejar eventos de clic del mapa
const MapClickHandler = ({ onMapClick, markingMode }) => {
  useMapEvents({
    click: (e) => {
      // Solo permitir marcado si el modo está activo
      if (!markingMode) {
        return;
      }
      
      // VERIFICAR que el clic no venga de un control o botón
      if (e.originalEvent && e.originalEvent.target) {
        const target = e.originalEvent.target;
        
        // Ignorar clics en controles, botones y otros elementos de UI
        if (target.closest('.leaflet-control') || 
            target.closest('.navigation-controls-mobile') ||
            target.closest('button') ||
            target.closest('.leaflet-marker-pane') ||
            target.closest('.leaflet-popup')) {
          return;
        }
      }
      
      onMapClick(e);
    },
  });
  return null;
};

// MapController SIMPLE - maneja el centrado del mapa
const MapController = React.forwardRef(({ center, isFollowing, initialSelectedSite, hasActiveRoute, defaultCenter }, mapRef) => {
  const map = useMap();
  
  // CORRECCIÓN: Usar React.useImperativeHandle para exponer la función
  React.useImperativeHandle(mapRef, () => ({
      centerMapToDefault: () => {
          map.setView(defaultCenter, 13); // Centrar en el zoom por defecto
      }
  }), [map, defaultCenter]); // Dependencia agregada: defaultCenter y map

  useEffect(() => {
    // Si hay ruta activa, NO hacer NADA - navegación completamente libre
    if (hasActiveRoute) {
      return;
    }
    
    // PRIORIDAD 1: Si hay sitio inicial, centrar en él (solo una vez)
    if (initialSelectedSite) {
      const lat = initialSelectedSite.latitude || initialSelectedSite.lat;
      const lng = initialSelectedSite.longitude || initialSelectedSite.lng;
      
      if (lat && lng) {
        map.setView([lat, lng], 14);
        return;
      }
    }
    
    // PRIORIDAD 2: Solo seguir ubicación si está activado
    if (isFollowing && center) {
      map.panTo(center, { animate: true, duration: 0.3 });
    }
  }, [center, isFollowing, map, initialSelectedSite, hasActiveRoute]);

  return null;
});


const RoutingMachine = ({ start, end, onRoutesFound }) => {
  const map = useMap();
  const routingControlRef = React.useRef(null);
  const hasAutoFittedRef = React.useRef(false); // NUEVO: Control para fitBounds automático

  useEffect(() => {
    if (!map) return;
    
    const instance = L.Routing.control({
      waypoints: [],
      routeWhileDragging: false,
      show: false,
      addWaypoints: false,
      createMarker: () => null,
      fitSelectedRoutes: false, // IMPORTANTE: Desactivar fitBounds automático
      
      router: L.Routing.osrmv1({
        serviceUrl: 'https://routing.openstreetmap.de/routed-car/route/v1',
        timeout: 15000,
        profile: 'driving'
      }),
      
      showAlternatives: true,
      altLineOptions: {
        styles: [
          { color: 'black', opacity: 0.15, weight: 9 },
          { color: 'white', opacity: 0.8, weight: 6 },
          { color: '#4a89f8', opacity: 0.8, weight: 4 }
        ]
      },
      lineOptions: {
        styles: [
          { color: 'black', opacity: 0.15, weight: 9 },
          { color: 'white', opacity: 0.8, weight: 6 },
          { color: '#0056b3', opacity: 1, weight: 5 }
        ]
      },
    })
    .on('routesfound', function(e) {
      onRoutesFound(e.routes);
      
      // NUEVO: Centrar en la ruta solo la primera vez
      if (e.routes.length > 0 && !hasAutoFittedRef.current) {
        const route = e.routes[0];
        const bounds = L.latLngBounds(route.coordinates);
        map.fitBounds(bounds, { padding: [20, 20] });
        hasAutoFittedRef.current = true;
      }
    })
    .on('routingerror', function(e) {
      toast.error('No se pudo calcular la ruta. Intenta de nuevo.', { duration: 4000 });
      onRoutesFound([]);
    })
    .addTo(map);

    routingControlRef.current = instance;

    return () => {
      if (routingControlRef.current) {
        map.removeControl(routingControlRef.current);
      }
    };
  }, [map, onRoutesFound]);

  useEffect(() => {
    if (routingControlRef.current) {
      if (start && end) {
        hasAutoFittedRef.current = false; // RESETEAR: Permitir autofit para nueva ruta
        routingControlRef.current.setWaypoints([
          L.latLng(start[0], start[1]),
          L.latLng(end[0], end[1])
        ]);
      } else {
        routingControlRef.current.setWaypoints([]);
        hasAutoFittedRef.current = false; // RESETEAR al limpiar ruta
        onRoutesFound([]);
      }
    }
  }, [start, end, onRoutesFound]);

  return null;
};

function MapPage() {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Referencia para MapController
  const mapRef = React.useRef(null); 

  const location = useLocation();
  const initialSelectedSite = location.state?.selectedSite;
  const navigate = useNavigate();

  const [userLocation, setUserLocation] = useState(null);
  
  const [routingDestination, setRoutingDestination] = useState(null);
  const [manualDestination, setManualDestination] = useState(null); // NUEVO: Punto marcado manualmente

  const [routes, setRoutes] = useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  
  const [isFollowing, setIsFollowing] = useState(false); 
  const [markingMode, setMarkingMode] = useState(false); // NUEVO: Modo de marcado manual
  const [mapLayer, setMapLayer] = useState('satellite'); // NUEVO: Control de capas
  
  const lastPositionTime = React.useRef(0);
  const routeToastShownRef = React.useRef(false);
  
  // Flags para evitar repetición de toasts
  const geolocationWatchErrorToastRef = React.useRef(false);
  
  // Centro inicial en San Antonio Palopó
  const SAN_ANTONIO_PALOPO = [14.7004, -91.1355]; 
  const defaultInitialCenter = SAN_ANTONIO_PALOPO; 
  
  const initialCenter = initialSelectedSite && (initialSelectedSite.latitude || initialSelectedSite.lat) && (initialSelectedSite.longitude || initialSelectedSite.lng) ? 
    [initialSelectedSite.latitude || initialSelectedSite.lat, initialSelectedSite.longitude || initialSelectedSite.lng] : defaultInitialCenter;
  const mapZoom = initialSelectedSite && (initialSelectedSite.latitude || initialSelectedSite.lat) && (initialSelectedSite.longitude || initialSelectedSite.longitude) ? 14 : 13; 

  // EFFECT 1: Carga de sitios de Firebase (se mantiene intacto)
  useEffect(() => {
    const q = query(collection(db, 'sites'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sitesData = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.latitude && data.longitude) {
          sitesData.push({ id: doc.id, ...data });
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

  // Función de validación de coordenadas (se mantiene tu lógica de Guatemala)
  const isInsideGuatemala = (lat, lng) => {
    // Guatemala: Lat 13.5-17.5, Lng -92.5 a -88.0
    return lat >= 13.5 && lat <= 17.5 && lng >= -92.5 && lng <= -88.0;
  };
  
  // EFFECT 2: SEGUIMIENTO DE UBICACIÓN (watchPosition) - En segundo plano
  // CORRECCIÓN: Se añade SAN_ANTONIO_PALOPO al array de dependencias
  useEffect(() => {
    if (!navigator.geolocation) {
      console.error('La geolocalización no es soportada por tu navegador.');
      return;
    }
    
    // Alerta de permiso denegado una única vez
    let userDeniedToastShown = false; 

    // Inicio de seguimiento de ubicación con ALTA PRECISIÓN en segundo plano
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        // La ubicación es exitosa, se obtiene una posición real
        geolocationWatchErrorToastRef.current = false; // Resetear error
        userDeniedToastShown = false; // Resetear denegación si cambia de opinión

        const now = Date.now();
        
        // FILTRO DE TIEMPO: Actualizar ubicación cada 3 segundos
        if (now - lastPositionTime.current < 3000) return; 
        lastPositionTime.current = now;

        const { latitude, longitude } = position.coords;
        
        if (!isInsideGuatemala(latitude, longitude)) {
          console.warn('Coordenadas fuera del rango esperado, ignorando actualización');
          return;
        }
        
        const newLocation = [latitude, longitude];

        // Filtro de distancia mínima para evitar movimientos menores
        if (userLocation) {
          const oldPos = L.latLng(userLocation[0], userLocation[1]);
          const newPos = L.latLng(latitude, longitude);
          const distance = oldPos.distanceTo(newPos);
          
          // Solo actualizar si hay un desplazamiento real de al menos 10 metros
          if (distance < 10) {
            return;
          }
        }

        // GUARDAR la ubicación real del usuario
        setUserLocation(newLocation);

        // Verificar llegada a destino (se mantiene la funcionalidad)
        if (routingDestination) {
          const destination = L.latLng(routingDestination.lat, routingDestination.lng);
          const user = L.latLng(latitude, longitude);
          const distance = user.distanceTo(destination);

          if (distance < 50) {
            toast.success(`¡Has llegado a tu destino!`, {
              duration: 5000,
            });
          }
        }
      },
      (error) => {
        const errorMessages = {
          1: 'Permisos de ubicación denegados. No se puede usar la ubicación.',
          2: 'Posición no disponible. Verifica el GPS.',
          3: 'Tiempo de espera agotado.'
        };
        
        // El código 1 es permiso denegado. Solo mostrar una vez
        if (error.code === 1 && !userDeniedToastShown) {
            toast.error(errorMessages[error.code], { duration: 4000 });
            userDeniedToastShown = true;
        } 
        // Mostrar otros errores de seguimiento solo si no son timeouts y no se han mostrado
        else if (error.code !== 3 && !geolocationWatchErrorToastRef.current) { 
            toast.error(errorMessages[error.code] || 'Error al obtener la ubicación.', { duration: 4000 });
            geolocationWatchErrorToastRef.current = true;
        }
        console.error('Error watchPosition:', error);
      },
      {
        enableHighAccuracy: true, // ALTA PRECISIÓN para mejor fijación
        timeout: 20000,           // Más tiempo para que el GPS se fije
        maximumAge: 0             // Pide la posición más fresca en cada intervalo
      }
    );

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [userLocation, routingDestination, SAN_ANTONIO_PALOPO]); // <-- Dependencia agregada


  // Función para centrar el mapa en San Antonio Palopó
  const handleCenterMapToDefault = (e) => {
      e.stopPropagation();
      if (mapRef.current) {
          mapRef.current.centerMapToDefault();
          setIsFollowing(false); // Desactivar el seguimiento al regresar a la vista inicial
      }
  };


  const handleClearSelection = () => {
    setRoutingDestination(null);
    setManualDestination(null); // Limpiar también punto manual
    setRoutes([]);
    routeToastShownRef.current = false;
    setSelectedRouteIndex(0);
    navigate('/mapa', { replace: true, state: {} });
  };

  // NUEVO: Función para limpiar solo el sitio inicial
  const handleClearSiteView = () => {
    navigate('/mapa', { replace: true, state: {} });
  };

  // Condición para saber si tenemos una ubicación real (no la de San Antonio)
  const isRealLocationAvailable = userLocation && !(userLocation[0] === SAN_ANTONIO_PALOPO[0] && userLocation[1] === SAN_ANTONIO_PALOPO[1]);
  
  // NUEVO: Manejar clic en el mapa para marcar punto B
  const handleMapClick = (e) => {
    if (!isRealLocationAvailable) {
        toast.error('Ubicación real no disponible. Activa la geolocalización y espera a que se fije.', { duration: 4000 });
        return;
    }
    
    const { lat, lng } = e.latlng;
    const newDestination = {
      lat: lat,
      lng: lng,
      name: `Punto seleccionado (${lat.toFixed(4)}, ${lng.toFixed(4)})`
    };
    
    // Marcar el punto y calcular ruta inmediatamente
    setManualDestination(newDestination);
    setRoutingDestination(newDestination);
    setRoutes([]);
    setSelectedRouteIndex(0);
    routeToastShownRef.current = false;
    setIsFollowing(false); // IMPORTANTE: Desactivar seguimiento al marcar punto manual
    setMarkingMode(false); // NUEVO: Desactivar modo marcado después de marcar
  };

  const handleSetRouting = (site) => {
    if (!isRealLocationAvailable) {
      toast.error('Tu ubicación no está fijada. Activa la geolocalización para trazar la ruta.', { duration: 4000 });
      return;
    }
    
    // Cerrar todos los popups inmediatamente
    setTimeout(() => {
      const popups = document.querySelectorAll('.leaflet-popup');
      popups.forEach(popup => popup.remove());
    }, 0);
    
    setRoutingDestination({ lat: site.latitude, lng: site.longitude, name: site.name });
    setRoutes([]);
    setSelectedRouteIndex(0);
    routeToastShownRef.current = false;
    setIsFollowing(false); // IMPORTANTE: Desactivar seguimiento al calcular ruta
  };

  const handleRoutesFound = React.useCallback((foundRoutes) => {
    setRoutes(foundRoutes);
    // ELIMINADO: toast de "¡Ruta calculada!" para ahorrar espacio en móvil
    if (foundRoutes.length > 0 && !routeToastShownRef.current) {
      routeToastShownRef.current = true;
    }
  }, []);

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

  // Condición de carga
  if (loading) return <p>Cargando mapa...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="map-page-container">
      <h1>Sitios Turísticos</h1>

      {/* NUEVO: Banner para sitio inicial sin ruta */}
      {initialSelectedSite && !routingDestination && !manualDestination && (
        <div className="map-info-banner">
          <p>Viendo sitio</p>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleClearSiteView();
            }} 
            className="map-info-banner-close"
          >
            x
          </button>
        </div>
      )}

      {/* Banner para rutas */}
      {(routingDestination || manualDestination) && (
        <div className="map-info-banner">
          <p>
            {manualDestination ? 
              'Ruta punto marcado' : 
              'Mostrando ruta'
            }
          </p>
          <button 
            onClick={(e) => {
              e.stopPropagation(); // EVITAR propagación al mapa
              handleClearSelection();
            }} 
            className="map-info-banner-close"
          >
            x
          </button>
        </div>
      )}

      <MapContainer 
        center={initialCenter} 
        zoom={mapZoom} 
        className="map-view" 
        zoomControl={false}
        whenCreated={mapInstance => {
          // Solo desactivar seguimiento en drag si NO hay rutas activas
          mapInstance.on('dragstart', () => {
            if (routes.length === 0) { // Solo si no hay rutas
              setIsFollowing(false);
            }
          });
        }}
      >
        {/* CORRECCIÓN: Usar MapController (que ahora usa forwardRef) */}
        <MapController 
          ref={mapRef} // Aquí se adjunta la referencia
          center={userLocation} 
          isFollowing={isFollowing} 
          initialSelectedSite={initialSelectedSite}
          hasActiveRoute={routes.length > 0} 
          defaultCenter={defaultInitialCenter} // Pasar el centro por defecto
        />

        {/* NUEVO: Manejador de clics del mapa */}
        <MapClickHandler onMapClick={handleMapClick} markingMode={markingMode} />

        <div className="leaflet-top leaflet-right">
          <div className="navigation-controls-unified">
            {/* 1. Botón de capas simplificado */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setMapLayer(mapLayer === 'satellite' ? 'streets' : 'satellite');
              }} 
              className="control-button"
              title={mapLayer === 'satellite' ? 'Cambiar a vista de calles' : 'Cambiar a vista satélite'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                <polyline points="2,17 12,22 22,17"></polyline>
                <polyline points="2,12 12,17 22,12"></polyline>
              </svg>
            </button>
            
            {/* 2. Botón UBICACIÓN (Seguimiento) */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (isRealLocationAvailable) {
                  setIsFollowing(!isFollowing);
                  // Centrar el mapa si se activa el seguimiento
                  if (!isFollowing && mapRef.current) {
                      mapRef.current.centerMapToDefault(); 
                  }
                } else {
                  toast.error("La ubicación real aún no está disponible o el acceso fue denegado.", { duration: 4000 });
                }
              }} 
              className={`control-button ${isFollowing && isRealLocationAvailable ? 'active' : ''}`}
              title="Seguir mi ubicación"
              disabled={!isRealLocationAvailable} // Desactivar si la ubicación del usuario no es la real
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
              </svg>
            </button>

            {/* 3. Botón CENTRAR EN SAN ANTONIO */}
            <button
                onClick={handleCenterMapToDefault}
                className="control-button"
                title="Centrar en San Antonio Palopó"
                style={{ fontSize: '1.2em', fontWeight: 'bold' }} // Estilo simple
            >
                SAP
            </button>
            
            {/* 4. Botón A→B con tooltip */}
            <div className="marking-mode-container">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setMarkingMode(!markingMode);
                }} 
                className={`control-button ${markingMode ? 'active' : ''}`}
                title={markingMode ? "Clic en el mapa para marcar destino" : "Activar marcado manual"}
                disabled={!isRealLocationAvailable} // Desactivar si la ubicación no es la real
              >
                A→B
              </button>
              <div className="marking-mode-help">
                <span className="help-text">más..</span>
                <div className="help-tooltip">
                  <strong>Marcado Manual</strong><br/>
                  1. Activa este botón<br/>
                  2. Haz clic en cualquier punto del mapa<br/>
                  3. Se calculará la ruta automáticamente<br/>
                  <small>Útil para marcar destinos específicos</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <RoutingMachine 
          start={isRealLocationAvailable ? userLocation : null} // Solo trazar ruta si la ubicación es real
          end={routingDestination ? [routingDestination.lat, routingDestination.lng] : null} 
          onRoutesFound={handleRoutesFound}
          key="routing-machine" 
        />

        {routes.length > 1 && (
          <div className="leaflet-bottom leaflet-right alternative-routes-panel">
            <div className="leaflet-control leaflet-bar alternative-routes-control">
              <h4>Rutas Alternas</h4>
              {routes.map((route, i) => (
                <button key={i} onClick={() => setSelectedRouteIndex(i)} className={i === selectedRouteIndex ? 'selected' : ''}>
                  Ruta {i + 1}: {(route.summary.totalDistance / 1000).toFixed(1)} km, {formatTime(route.summary.totalTime)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CAPAS CONDICIONALES - Sin duplicados */}
        {mapLayer === 'satellite' ? (
          <>
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='Tiles &copy; Esri'
            />
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              pane="shadowPane"
            />
          </>
        ) : (
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
        )}

        {/* El marcador del usuario solo se muestra si la ubicación es real */}
        {isRealLocationAvailable && (
          <UserMarker 
            position={userLocation} 
          />
        )}

        {/* Marcador para punto seleccionado manualmente */}
        {manualDestination && (
          <Marker 
            position={[manualDestination.lat, manualDestination.lng]} 
            icon={manualMarkerIcon}
          >
            <Popup>
              <div className="custom-popup">
                <h4>📍 Destino seleccionado</h4>
                <p style={{ margin: '4px 0', fontSize: '0.9em', color: '#666' }}>
                  {manualDestination.lat.toFixed(4)}, {manualDestination.lng.toFixed(4)}
                </p>
                <button 
                  onClick={(e) => {
                    e.stopPropagation(); // EVITAR propagación al mapa
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

        {sites.map(site => (
          <Marker 
            key={site.id} 
            position={[site.latitude, site.longitude]} 
            icon={initialSelectedSite && (initialSelectedSite.id === site.id || 
                  (initialSelectedSite.lat === site.latitude && initialSelectedSite.lng === site.longitude)) ? 
                      highlightedIcon : getIconForCategory(site.parentCategory)}
          >
            <Popup>
              <div className="custom-popup">
                <h4 title={site.name}>{truncateTitle(site.name)}</h4>
                <p style={{ margin: '4px 0', fontSize: '0.9em', color: '#666' }}>{site.category}</p>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation(); // EVITAR propagación al mapa
                    handleSetRouting(site);
                  }} 
                  className="popup-route-button"
                  disabled={!isRealLocationAvailable}
                  title={!isRealLocationAvailable ? "Activa tu ubicación para usar esta función" : "Calcular ruta desde tu ubicación"}
                >
                  Cómo llegar
                </button>
                <Link to={`/categoria/${site.category}/${site.slug}`} className="popup-link">Ver detalles</Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default MapPage;