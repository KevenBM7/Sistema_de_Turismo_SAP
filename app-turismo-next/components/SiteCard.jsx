import Link from 'next/link';
import Image from 'next/image';
import React from 'react';
import { createSlug } from '@/lib/slugUtils';
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
    <Link href={siteUrl} className="site-card-link">
      <div className="site-card">
        <div className="site-image-container">
          {isPlaceholder ? (
            <img
              src={imageUrl}
              alt={site.name}
              className="site-image"
              loading="lazy"
              width="400"
              height="225"
            />
          ) : (
            <Image
              src={imageUrl}
              alt={site.name}
              className="site-image"
              loading="lazy"
              width={400}
              height={225}
              sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 400px"
            />
          )}
        </div>

        <div className="site-info">
          {/* El CSS limitará esto a 2 líneas y letra más pequeña */}
          <h3>{site.name}</h3>

          {/* El CSS limitará esto a 3 líneas */}
          <p className="site-description">{plainTextDescription}</p>

          {/* Este footer se irá siempre al fondo gracias a margin-top: auto */}
          <div className="site-card-footer">
            {site.category && (
              <span className="site-card-category">{site.category}</span>
            )}
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