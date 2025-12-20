import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot, collection, query, where, getDocs, limit, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import SEO from '../components/SEO'; // Importación de SEO
import "slick-carousel/slick/slick-theme.css";
import './EventDetailPage.css';

function EventDetailPage() {
  const { identifier } = useParams(); // parámetro unificado
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Estados para el modal de la imagen
  const [isImageModalOpen, setIsImageModalOpen] = useState(false); // Para saber si está abierto
  const [selectedImageIndex, setSelectedImageIndex] = useState(null); // Usamos el índice para navegar

  useEffect(() => {
    window.scrollTo(0, 0);

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

  if (loading) return <p>Cargando detalles del evento...</p>;
  if (error) return <p className="error-message">{error}</p>;
  if (!event) return <p>No se encontró el evento.</p>;

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
  
  // 1. Generar el objeto JSON-LD para el evento
  const jsonLdData = {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": event.title,
    "startDate": event.startDate,
    "endDate": event.endDate || event.startDate,
    "description": event.description ? event.description.replace(/<[^>]*>?/gm, '').substring(0, 250) : `Detalles sobre ${event.title}`,
    "image": allImages.length > 0 ? allImages[0] : null,
    "eventStatus": new Date(event.endDate || event.startDate) < new Date() ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
    "location": {
      "@type": "Place",
      "name": "San Antonio Palopó",
      "address": "San Antonio Palopó, Sololá, Guatemala"
    }
  };

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
                    onClick={() => openImageModal(index)} style={{cursor: 'pointer'}}/>
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