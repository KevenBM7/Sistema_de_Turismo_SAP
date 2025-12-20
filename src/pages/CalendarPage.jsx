import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import es from 'date-fns/locale/es';
import SEO from '../components/SEO'; // Importación de SEO
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './CalendarPage.css';

// --- Configuración del Calendario ---
const locales = {
  'es': es,
};

const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const messages = {
  allDay: 'Todo el día',
  previous: 'Anterior',
  next: 'Siguiente',
  today: 'Hoy',
  month: 'Mes',
  week: 'Semana',
  day: 'Día',
  agenda: 'Agenda',
  date: 'Fecha',
  time: 'Hora',
  event: 'Evento',
  noEventsInRange: 'No hay eventos en este rango.',
  showMore: total => `+ Ver más (${total})`
};

// Función auxiliar para limpiar HTML de las descripciones en tarjetas
const stripHtml = (html) => {
   if (!html) return "";
   const tmp = document.createElement("DIV");
   tmp.innerHTML = html;
   return tmp.textContent || tmp.innerText || "";
};

function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtro por defecto: Próximos eventos
  const [filter, setFilter] = useState('upcoming');
  const [showCalendar, setShowCalendar] = useState(false);
  
  // Vista por defecto: Agenda en móvil, Mes en PC
  const [calendarView, setCalendarView] = useState(window.innerWidth < 768 ? 'agenda' : 'month');
  
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Escuchar cambios de tamaño de pantalla para ajustar vista si es necesario
    const handleResize = () => {
       if (window.innerWidth < 768 && calendarView === 'month') {
         // Opcional: Si rota la pantalla, podrías forzar agenda, 
         // pero mejor dejamos que el usuario decida si ya lo cambió.
       }
    };
    window.addEventListener('resize', handleResize);

    const fetchEvents = () => {
      try {
        const q = query(collection(db, 'events'), orderBy('startDate', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const eventsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setEvents(eventsData);
          setLoading(false);
        });
        return unsubscribe;
      } catch (error) {
        console.error("Error al cargar eventos:", error);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = fetchEvents();
    return () => {
      unsubscribe && unsubscribe();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Filtrado
  const getFilteredEvents = () => {
    const today = new Date().toISOString().split('T')[0];
    
    if (filter === 'upcoming') {
      return events.filter(event => event.startDate >= today);
    } else if (filter === 'past') {
      return events.filter(event => event.startDate < today);
    }
    return events.filter(event => event.startDate >= today);
  };

  // Helpers de fecha
  const getMonthYear = (dateString) => {
    const date = new Date(`${dateString}T00:00:00`);
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
  };

  const groupEventsByMonth = (eventsList) => {
    const grouped = {};
    eventsList.forEach(event => {
      const monthYear = getMonthYear(event.startDate);
      if (!grouped[monthYear]) {
        grouped[monthYear] = [];
      }
      grouped[monthYear].push(event);
    });
    return grouped;
  };

  const calendarEvents = events.map(event => ({
    id: event.id,
    title: event.title,
    start: event.startDate ? new Date(`${event.startDate}T00:00:00`) : new Date(),
    end: event.endDate ? new Date(`${event.endDate}T23:59:59`) : new Date(`${event.startDate || new Date()}T23:59:59`),
    allDay: true,
  }));

  const handleSelectEvent = (event) => {
    setShowCalendar(false); 
    navigate(`/evento/${event.slug || event.id}`);
  };

  if (loading) return <p style={{ textAlign: 'center', marginTop: '2rem' }}>Cargando eventos...</p>;

  const filteredEvents = getFilteredEvents();
  const groupedEvents = groupEventsByMonth(filteredEvents);

  const handleToggleCalendar = (e) => {
    e.stopPropagation();
    setShowCalendar(!showCalendar);
  };

  return (
    <div className="calendar-page-container">
      {/* --- SEO para la Página de Calendario --- */}
      <SEO 
        title="Calendario de Eventos"
        description="Descubre las festividades, ferias y eventos culturales de San Antonio Palopó. Mantente al día con nuestro calendario oficial."
        url="/eventos"
        keywords="eventos, calendario, festividades, ferias, cultura, san antonio palopó"
      />

      <header className="calendar-header">
        <h2>Calendario de Eventos</h2>
        <p>Descubre las festividades, ferias y eventos culturales de San Antonio Palopó</p>
      </header>

      {/* Filtro Dropdown */}
      <div className="event-filters-container">
        <div className="select-wrapper">
          <label htmlFor="eventFilter" className="filter-label">Mostrar:</label>
          <select 
            id="eventFilter"
            className="filter-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="upcoming">Próximos eventos</option>
            <option value="past">Eventos pasados</option>
          </select>
        </div>
      </div>

      {/* Botón flotante */}
      <button className="floating-calendar-button" onClick={handleToggleCalendar}>
        📅
      </button>

      {/* MODAL DEL CALENDARIO */}
      {showCalendar && (
        <div className="calendar-modal-overlay" onClick={() => setShowCalendar(false)}>
          <div className="calendar-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="calendar-modal-header">
              <h2>Calendario Visual</h2>
              <button className="close-modal-button" onClick={() => setShowCalendar(false)}>
                ✕
              </button>
            </div>
            
            <div className="calendar-container">
              <Calendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                
                // CONTROL DE VISTAS
                view={calendarView}
                onView={setCalendarView} // Permite cambiar entre mes/agenda
                views={['month', 'agenda']} // Limitamos a estas dos
                
                // ALTURA CONTROLADA (Más cuadrada)
                style={{ height: 500 }} 
                
                messages={messages}
                onSelectEvent={handleSelectEvent}
                popup
              />
            </div>
          </div>
        </div>
      )}

      {/* LISTA DE TARJETAS */}
      {filteredEvents.length === 0 ? (
        <div className="no-events-message">
          <p>No hay eventos {filter === 'upcoming' ? 'próximos' : 'pasados'} registrados.</p>
        </div>
      ) : (
        <div className="events-by-month">
          {Object.entries(groupedEvents).map(([monthYear, monthEvents]) => (
            <div key={monthYear} className="month-section">
              <h2 className="month-title">{monthYear}</h2>
              <div className="events-grid">
                {monthEvents.map(event => (                  
                  <Link to={`/evento/${event.slug || event.id}`} key={event.id} className="event-card">
                    <div className="event-card-image-container">
                      <img 
                        src={(event.imageUrls && event.imageUrls[0]) || "https://placehold.co/400x300/EEE/31343C?text=Sin+Imagen"} 
                        alt={event.title} 
                        className="event-card-image"
                        loading="lazy"
                      />
                      <div className="event-card-date-badge">
                        <span className="date-day">
                          {new Date(`${event.startDate}T00:00:00`).getDate()}
                        </span>
                        <span className="date-month">
                          {new Date(`${event.startDate}T00:00:00`).toLocaleDateString('es-ES', { month: 'short' }).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="event-card-content">
                      <h3 className="event-card-title">{event.title}</h3>
                      {event.description && (
                        <p className="event-card-description">
                          {/* Limpiamos el HTML para la vista previa */}
                          {stripHtml(event.description).substring(0, 100)}
                          {stripHtml(event.description).length > 100 && '...'}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CalendarPage;