import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import es from 'date-fns/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './CalendarPage.css';

// --- Configuración del Calendario ---
const locales = {
  'es': es,
};

// Usamos el localizador de date-fns
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

function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'upcoming', 'past'
  const [showCalendar, setShowCalendar] = useState(false); // Estado para mostrar/ocultar el calendario
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    
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
    return () => unsubscribe && unsubscribe();
  }, []);

  // Filtrar eventos según el filtro seleccionado
  const getFilteredEvents = () => {
    const today = new Date().toISOString().split('T')[0];
    
    if (filter === 'upcoming') {
      return events.filter(event => event.startDate >= today);
    } else if (filter === 'past') {
      return events.filter(event => event.startDate < today);
    }
    return events;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(`${dateString}T00:00:00`);
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getMonthYear = (dateString) => {
    const date = new Date(`${dateString}T00:00:00`);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric', 
      month: 'long'
    });
  };

  // Agrupar eventos por mes
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

  // Preparar eventos para react-big-calendar
  const calendarEvents = events.map(event => ({
    id: event.id,
    title: event.title,
    start: event.startDate ? new Date(`${event.startDate}T00:00:00`) : new Date(),
    end: event.endDate ? new Date(`${event.endDate}T23:59:59`) : new Date(`${event.startDate || new Date()}T23:59:59`),
    allDay: true,
  }));

  const handleSelectEvent = (event) => {
    setShowCalendar(false); // Cierra el modal del calendario
    navigate(`/evento/${event.id}`);
  };

  if (loading) {
    return <p style={{ textAlign: 'center', marginTop: '2rem' }}>Cargando eventos...</p>;
  }

  const filteredEvents = getFilteredEvents();
  const groupedEvents = groupEventsByMonth(filteredEvents);

  const handleToggleCalendar = (e) => {
    e.stopPropagation();
    setShowCalendar(!showCalendar);
  };

  return (
    <div className="calendar-page-container">
      <header className="calendar-header">
        <h1>Calendario de Eventos</h1>
        <p>Descubre las festividades, ferias y eventos culturales de San Antonio Palopó</p>
      </header>

      {/* Filtros */}
      <div className="event-filters">
        <button 
          className={`filter-button ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Todos los eventos
        </button>
        <button 
          className={`filter-button ${filter === 'upcoming' ? 'active' : ''}`}
          onClick={() => setFilter('upcoming')}
        >
          Próximos eventos
        </button>
        <button 
          className={`filter-button ${filter === 'past' ? 'active' : ''}`}
          onClick={() => setFilter('past')}
        >
          Eventos pasados
        </button>
      </div>

      {/* Botón flotante para abrir el calendario */}
      <button className="floating-calendar-button" onClick={handleToggleCalendar}>
        📅
      </button>

      {/* Modal del Calendario */}
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
                style={{ height: '70vh' }}
                messages={messages}
                onSelectEvent={handleSelectEvent}
                popup
                views={['month', 'agenda']}
              />
            </div>
          </div>
        </div>
      )}

      {/* Lista de eventos agrupados por mes */}
      {filteredEvents.length === 0 ? (
        <div className="no-events-message">
          <p>No hay eventos {filter === 'upcoming' ? 'próximos' : filter === 'past' ? 'pasados' : ''} registrados.</p>
        </div>
      ) : (
        <div className="events-by-month">
          {Object.entries(groupedEvents).map(([monthYear, monthEvents]) => (
            <div key={monthYear} className="month-section">
              <h2 className="month-title">{monthYear}</h2>
              <div className="events-grid">
                {monthEvents.map(event => (
                  <Link 
                    to={`/evento/${event.id}`} 
                    key={event.id} 
                    className="event-card"
                  >
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
                      <p className="event-card-date">
                        {formatDate(event.startDate)}
                        {event.endDate && event.endDate !== event.startDate && (
                          <> - {formatDate(event.endDate)}</>
                        )}
                      </p>
                      {event.description && (
                        <p className="event-card-description">
                          {event.description.substring(0, 100)}
                          {event.description.length > 100 && '...'}
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