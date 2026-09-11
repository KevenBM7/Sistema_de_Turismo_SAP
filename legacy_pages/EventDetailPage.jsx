'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { doc, onSnapshot, collection, query, where, getDocs, limit, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import SEO from '../components/SEO'; // Importación de SEO
import { generateEventJsonLd } from '@/lib/eventSchema';
import './EventDetailPage.css';

function EventDetailPage({ initialEvent = null }) {
  const { identifier } = useParams(); // parámetro unificado
  const router = useRouter();
  const [event, setEvent] = useState(initialEvent);
  const [loading, setLoading] = useState(!initialEvent);
  const [error, setError] = useState(null);
  // Estados para el modal de la imagen
  const [isImageModalOpen, setIsImageModalOpen] = useState(false); // Para saber si está abierto
  const [selectedImageIndex, setSelectedImageIndex] = useState(null); // Usamos el índice para navegar

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/eventos');
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);

    // Si ya fue provisto por SSR y coincide con el identificador actual, evitar refetch redundante
    if (initialEvent && (initialEvent.slug === identifier || initialEvent.id === identifier)) {
      setEvent(initialEvent);
      setLoading(false);
      return;
    }

    const fetchEvent = async () => {
      setLoading(true);
      setError('');
      // Expresión regular para detectar un ID de Firestore (20 caracteres alfanuméricos)
      const isFirestoreId = (str) => /^[a-zA-Z0-9]{20}$/.test(str);

      try {
        let eventDoc;
        const eventsRef = collection(db, 'events');

        // Lógica corregida: Si el identificador es un ID, busca por ID. Si no, busca por slug.
        if (isFirestoreId(identifier)) {
          const docRef = doc(db, 'events', identifier);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            eventDoc = docSnap;
          }
        } else if (identifier) {
          const q = query(eventsRef, where("slug", "==", identifier), limit(1));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            eventDoc = querySnapshot.docs[0];
          }
        }

        if (eventDoc) {
          const data = { id: eventDoc.id, ...eventDoc.data() };
          data.imageUrls = data.imageUrls || (data.imageUrl ? [data.imageUrl] : []);
          setEvent(data);
        } else {
          setError('El evento no fue encontrado.');
        }
      } catch (err) {
        console.error("Error al obtener el evento:", err);
        setError('Ocurrió un error al cargar la información del evento.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [identifier]);

  if (loading) {
    return (
      <div className="site-detail-container" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
        <p>Cargando detalles del evento...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="site-detail-container" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
        <p className="error-message">{error || 'No se encontró el evento solicitado.'}</p>
        <button
          type="button"
          onClick={handleBack}
          className="event-detail-back-button"
          style={{ marginTop: '1.5rem' }}
        >
          <ArrowLeft size={18} />
          <span>Volver a eventos</span>
        </button>
      </div>
    );
  }

  // Función corregida para evitar problemas de zona horaria
  const formatDate = (dateString) => {
    if (!dateString) return '';
    // Añadir 'T00:00:00' para asegurar que se interprete como la hora local
    const date = new Date(`${dateString}T00:00:00`);
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const allImages = event.imageUrls || (event.imageUrl ? [event.imageUrl] : []);

  // Funciones para manejar el modal de la imagen
  const openImageModal = (index) => {
    setSelectedImageIndex(index);
    setIsImageModalOpen(true);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
    setSelectedImageIndex(null);
  };

  const hasMultipleImages = allImages.length > 1;

  const sliderSettings = {
    dots: true,
    infinite: hasMultipleImages,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    adaptiveHeight: true,
    autoplay: hasMultipleImages,
    arrows: hasMultipleImages, // Muestra las flechas solo si hay más de una imagen
  };

  const modalSliderSettings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    adaptiveHeight: true,
    autoplay: false, // Aseguramos que no se desplace solo
    arrows: true,
    initialSlide: selectedImageIndex,
    // Para evitar que el clic en la imagen cierre el modal
    customPaging: () => <div />,
  };

  // Generar el objeto JSON-LD para el evento (100% compliant con Google Rich Results)
  const jsonLdData = generateEventJsonLd(event);

  return (
    <div className="site-detail-container">
      {/* --- SEO para el Detalle del Evento --- */}
      <SEO
        title={event.title}
        description={event.description ? event.description.substring(0, 155) : `Detalles sobre el evento ${event.title} en San Antonio Palopó.`}
        image={allImages.length > 0 ? allImages[0] : null}
        url={`/evento/${event.slug || event.id}`}
        type="article"
        keywords={`${event.title}, evento, san antonio palopó, calendario, cultura`}
        jsonLd={jsonLdData} // <-- 2. Pasar los datos al componente SEO
      />

      {/* Botón Volver Superior */}
      <div className="event-detail-back-container">
        <button
          type="button"
          onClick={handleBack}
          className="event-detail-back-button"
          aria-label="Volver a eventos"
        >
          <ArrowLeft size={18} />
          <span>Volver</span>
        </button>
      </div>

      <h1 className="site-detail-title">{event.title}</h1>

      <div className="site-detail-header-actions">
        <span className="site-detail-category">
          {formatDate(event.startDate)}
          {event.endDate && ` - ${formatDate(event.endDate)}`}
        </span>
      </div>

      {/* Carrusel de Imágenes (con fallback para imageUrl) */}
      {(event.imageUrls && event.imageUrls.length > 0) || event.imageUrl ? (
        <div className="carousel-container"> {/* Contenedor general */}
          <Slider {...sliderSettings} className="site-carousel"> {/* La clase importante va en el Slider */}
            {(event.imageUrls || [event.imageUrl]).map((url, index) => (
              <div key={index}>
                {url && (
                  <img
                    src={url}
                    alt={`${event.title} - Imagen ${index + 1}`}
                    className="site-detail-image"
                    onClick={() => openImageModal(index)} style={{ cursor: 'pointer' }} />
                )}
              </div>
            ))}
          </Slider>
        </div>
      ) : null}

      {/* Mostrar la descripción general interpretando HTML */}
      {event.description && (
        <div className="site-detail-description">
          <div dangerouslySetInnerHTML={{ __html: event.description }} />
        </div>
      )}

      {/* Mostrar la programación del evento si existe */}
      {event.schedule && event.schedule.length > 0 && (
        <div className="event-schedule-section">
          <h2>Programación del Evento</h2>
          {event.schedule.map((day, dayIndex) => (
            <div key={dayIndex} className="schedule-day-container">
              <div className="schedule-day-header">
                <h3>Día {day.day}: {day.dayTitle}</h3>
                <span className="schedule-day-date">{formatDate(day.date)}</span>
              </div>
              <ul className="schedule-activities-list">
                {day.activities.map((activity, actIndex) => (
                  <li key={actIndex} className="schedule-activity-item">
                    <div className="activity-time">{activity.time}</div>
                    <div className="activity-details">
                      <div className="activity-title">{activity.title}</div>
                      {activity.description && (
                        <div className="activity-description">{activity.description}</div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Botón Volver Inferior */}
      <div className="event-detail-bottom-back">
        <button
          type="button"
          onClick={handleBack}
          className="event-detail-back-button"
        >
          <ArrowLeft size={18} />
          <span>Volver a eventos</span>
        </button>
      </div>

      {/* Modal para ver la imagen en pantalla completa */}
      {isImageModalOpen && (
        <div className="image-modal-overlay" onClick={closeImageModal}>
          <button className="close-image-modal-button" onClick={closeImageModal}>✕</button>
          <div className="image-modal-slider-container" onClick={(e) => e.stopPropagation()}>
            <Slider {...modalSliderSettings}>
              {allImages.map((url, index) => (
                <div key={index} className="image-modal-slide">
                  <img src={url} alt={`Vista ampliada ${index + 1}`} className="image-modal-content" />
                </div>
              ))}
            </Slider>
          </div>
        </div>
      )}
    </div>
  );
}

export default EventDetailPage;