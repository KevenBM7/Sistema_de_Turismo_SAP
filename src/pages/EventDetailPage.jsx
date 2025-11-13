import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import './EventDetailPage.css';

function EventDetailPage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Estados para el modal de la imagen
  const [isImageModalOpen, setIsImageModalOpen] = useState(false); // Para saber si está abierto
  const [selectedImageIndex, setSelectedImageIndex] = useState(null); // Usamos el índice para navegar

  useEffect(() => {
    window.scrollTo(0, 0);
    const docRef = doc(db, 'events', id);
    const unsubscribe = onSnapshot(docRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() };
        // Las URLs ya vienen completas desde Firestore, no es necesario procesarlas.
        // Aseguramos que imageUrls sea siempre un array.
        data.imageUrls = data.imageUrls || (data.imageUrl ? [data.imageUrl] : []);
        setEvent(data);
      } else {
        setError('El evento no fue encontrado.');
      }
      setLoading(false);
    }, (err) => {
      console.error("Error al obtener el evento:", err);
      setError('Ocurrió un error al cargar la información del evento.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

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

  return (
    <div className="site-detail-container">
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
      
      {/* Mostrar la descripción general si existe */}
      {event.description && (
        <div className="site-detail-description">
          <p>{event.description}</p>
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