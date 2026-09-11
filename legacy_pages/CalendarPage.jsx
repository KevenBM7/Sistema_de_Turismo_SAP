'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {  useRouter } from 'next/navigation';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import es from 'date-fns/locale/es';
import SEO from '../components/SEO'; // Importación de SEO
import { ArrowLeft } from 'lucide-react';
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

// Función auxiliar universal para limpiar HTML de las descripciones en tarjetas (SSR seguro)
const stripHtml = (html) => {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
};

function CalendarPage({ initialEvents = [] }) {
  // Pre-calcular si hay eventos futuros para evitar renderizar lista vacía
  const nowIso = new Date().toISOString().split('T')[0];
  const hasUpcomingInitial = initialEvents.some(e => (e.endDate ? e.endDate >= nowIso : e.startDate >= nowIso));

  const [events, setEvents] = useState(initialEvents);
  const [loading, setLoading] = useState(initialEvents.length === 0);
  
  // Filtro por defecto inteligente: Si hay próximos muestra 'upcoming', si todos son pasados muestra 'past'
  const [filter, setFilter] = useState(hasUpcomingInitial || initialEvents.length === 0 ? 'upcoming' : 'past');
  const [showCalendar, setShowCalendar] = useState(false);
  
  // Vista por defecto: Agenda (segura para SSR, adaptada en useEffect)
  const [calendarView, setCalendarView] = useState('agenda');
  
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
      if (window.innerWidth >= 768) {
        setCalendarView('month');
      }
    }
    
    // Escuchar cambios de tamaño de pantalla para ajustar vista si es necesario
    const handleResize = () => {
       if (typeof window !== 'undefined' && window.innerWidth >= 768) {
         // Ajuste responsivo seguro
       }
    };
    window.addEventListener('resize', handleResize);

    const fetchEvents = () => {
      try {
        const q = query(collection(db, 'events'), orderBy('startDate', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const eventsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setEvents(eventsData);
          
          // Auto-cambiar a eventos pasados si no hay próximos
          const today = new Date().toISOString().split('T')[0];
          const hasUpcoming = eventsData.some(e => (e.endDate ? e.endDate >= today : e.startDate >= today));
          if (!hasUpcoming && eventsData.length > 0) {
            setFilter('past');
          }
          
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
      return events.filter(e => (e.endDate ? e.endDate >= today : e.startDate >= today));
    } else if (filter === 'past') {
      return events.filter(e => (e.endDate ? e.endDate < today : e.startDate < today)).reverse(); // Ordenar los pasados del más reciente al más antiguo
    }
    return events.filter(e => (e.endDate ? e.endDate >= today : e.startDate >= today));
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
    router.push(`/evento/${event.slug || event.id}`);
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

      {/* Botón Volver */}
      <div className="calendar-back-nav">
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined' && window.history.length > 1) {
              router.back();
            } else {
              router.push('/');
            }
          }}
          className="calendar-back-button"
          aria-label="Volver al inicio"
        >
          <ArrowLeft size={18} />
          <span>Volver al Inicio</span>
        </button>
      </div>

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
                  <Link href={`/evento/${event.slug || event.id}`} key={event.id} className="event-card">
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