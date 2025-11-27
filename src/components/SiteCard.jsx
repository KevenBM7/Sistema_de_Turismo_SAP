import React from 'react';
import { Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import './SiteList.css';

// Función para limpiar y obtener texto plano de la descripción HTML
const getPlainText = (html) => {
  const cleanHtml = DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = cleanHtml;
  return tempDiv.textContent || tempDiv.innerText || "";
};

function SiteCard({ site, showRemoveButton, onRemoveFavorite }) {
  const siteUrl = site.category && site.slug 
    ? `/categoria/${site.category}/${site.slug}` 
    : `/sitio/${site.id}`;

  const plainTextDescription = getPlainText(site.description || site.description_es);
  
  const handleRemoveClick = (e) => {
    e.preventDefault(); // Evita la navegación al hacer clic en el botón de quitar
    onRemoveFavorite(site.id);
  };

  return (
    <Link to={siteUrl} className="site-card-link">
      <div className="site-card">
        <div className="site-image-container">
          <img 
            src={site.imageUrls?.original || 'https://placehold.co/400x225/EEE/31343C?text=Sin+Imagen'}
            srcSet={site.imageUrls?.srcset}
            sizes={site.imageUrls?.sizes}
            alt={site.name} 
            className="site-image" 
            loading="lazy"
            width="400"
            height="225"
          />
        </div>
        
        <div className="site-info">
          {/* El CSS limitará esto a 2 líneas y letra más pequeña */}
          <h3>{site.name}</h3>
          
          {/* El CSS limitará esto a 3 líneas */}
          <p className="site-description">{plainTextDescription}</p>
          
          {/* Este footer se irá siempre al fondo gracias a margin-top: auto */}
          <div className="site-card-footer">
            {site.category && <span className="site-card-category">{site.category}</span>}
          </div>
          
          {showRemoveButton && (
            <button onClick={handleRemoveClick} className="remove-favorite-button">
              Quitar
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}

export default SiteCard;