import Link from 'next/link';
import React from 'react';
import { createSlug } from '@/lib/slugUtils';
import { MapPin, ArrowRight } from 'lucide-react';
import './SiteList.css';

/**
 * Extrae texto plano de HTML sin usar DOMParser ni document (compatible con SSR).
 * ✅ FIX 3: La versión anterior usaba DOMPurify + document.createElement
 * que falla en servidor y causa hydration mismatch.
 */
const getPlainText = (html) => {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
};

function SiteCard({ site, showRemoveButton, onRemoveFavorite }) {
  const siteUrl =
    site.category && site.slug
      ? `/categoria/${createSlug(site.category)}/${site.slug}`
      : `/sitio/${site.id}`;

  const plainTextDescription = getPlainText(
    site.description || site.description_es || ''
  );

  const handleRemoveClick = (e) => {
    e.preventDefault(); // Evita la navegación al hacer clic en el botón de quitar
    onRemoveFavorite(site.id);
  };

  // Resolver la URL de imagen: puede venir como string directo, como array, o como objeto legacy
  const resolveImageUrl = () => {
    // Nuevo formato simplificado (string directo desde SiteList)
    if (site.imageUrl && typeof site.imageUrl === 'string') return site.imageUrl;
    // Array de URLs (desde SiteDetailPage server component)
    if (Array.isArray(site.imageUrls) && site.imageUrls.length > 0) return site.imageUrls[0];
    // Objeto legacy con .original
    if (site.imageUrls?.original) return site.imageUrls.original;
    return 'https://placehold.co/400x225/EEE/31343C?text=Sin+Imagen';
  };

  const imageUrl = resolveImageUrl();
  const isPlaceholder = imageUrl.includes('placehold.co');

  return (
    <div className="site-card">
      <Link href={siteUrl} className="site-card-link">
        <div className="site-image-container">
          <img
            src={imageUrl}
            alt={site.name}
            className="site-image"
            loading="lazy"
            decoding="async"
            width={400}
            height={225}
          />
          {site.category && (
            <span className="site-card-badge">{site.category}</span>
          )}
        </div>

        <div className="site-info">
          <h3>{site.name}</h3>
          <p className="site-description">{plainTextDescription}</p>
          <div className="site-card-footer">
            <span className="site-card-location">
              <MapPin size={13} className="location-pin-icon" />
              <span>San Antonio Palopó</span>
            </span>
            <span className="site-card-cta">
              Explorar <ArrowRight size={13} className="cta-arrow" />
            </span>
          </div>
        </div>
      </Link>

      {showRemoveButton && (
        <button 
          type="button" 
          onClick={handleRemoveClick} 
          className="remove-favorite-button"
          aria-label={`Quitar ${site.name} de favoritos`}
        >
          Quitar
        </button>
      )}
    </div>
  );
}

export default SiteCard;