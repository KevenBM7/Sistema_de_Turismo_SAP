import React, { useState, useEffect } from 'react';
import './AdBanner.css';

function AdBanner() {
  const [isVisible, setIsVisible] = useState(false);

  const handleScroll = () => {
    // Aparece después de hacer scroll 150px hacia abajo
    if (window.scrollY > 150) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    // Limpiar el listener cuando el componente se desmonte
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`ad-banner ${isVisible ? 'visible' : ''}`}>
      {/* Reemplaza esta URL con la imagen de tu publicidad */}
      <img src="https://placehold.co/1200x100/007bff/FFF?text=¡Promociona+tu+negocio+aquí!" alt="Publicidad" />
    </div>
  );
}

export default AdBanner;