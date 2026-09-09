'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Slider from 'react-slick';
import Comments from '@/components/Comments';
import SiteDetailSkeleton from '@/components/SiteDetailSkeleton';
import { useAuth } from '@/context/AuthContext';
import { Map, Share2, Edit, Heart } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { createSlug } from '@/lib/slugUtils';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import '../legacy_pages/SiteDetailPage.css'; // Importando el CSS original

/**
 * ZoomableImage - Componente interno para manejar el zoom y paneo de imágenes en el modal.
 */
function ZoomableImage({ src, alt, onZoomChange }) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const handleToggleZoom = (e) => {
    e.stopPropagation();
    const newZoom = zoom === 1 ? 2.5 : 1;
    setZoom(newZoom);
    if (newZoom === 1) {
      setPosition({ x: 0, y: 0 });
    }
    onZoomChange(newZoom > 1);
  };

  const handleMouseDown = (e) => {
    if (zoom === 1) return;
    setIsDragging(true);
    setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || zoom === 1) return;
    const newX = e.clientX - startPos.x;
    const newY = e.clientY - startPos.y;
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e) => {
    if (zoom === 1) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setStartPos({ x: touch.clientX - position.x, y: touch.clientY - position.y });
  };

  const handleTouchMove = (e) => {
    if (!isDragging || zoom === 1) return;
    const touch = e.touches[0];
    setPosition({ x: touch.clientX - startPos.x, y: touch.clientY - startPos.y });
  };

  return (
    <div
      className="zoomable-image-wrapper"
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
    >
      <img
        src={src}
        alt={alt}
        onClick={handleToggleZoom}
        className={`image-modal-content ${zoom > 1 ? 'zoomed' : ''}`}
        style={{
          transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out',
          userSelect: 'none',
          pointerEvents: 'auto',
          maxWidth: '90vw',
          maxHeight: '90vh',
          objectFit: 'contain'
        }}
        draggable={false}
      />
    </div>
  );
}

export default function SiteDetailClient({ site }) {
  const { currentUser, toggleFavorite, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [avgRating, setAvgRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);

  // ✅ isFavorite ANTES del early return para no violar reglas de hooks
  const isFavorite = !authLoading && currentUser?.favorites?.includes(site?.id);

  if (!site) return <SiteDetailSkeleton />;

  // ✅ Sin DOM, funciona igual en server y cliente
  const cleanDescription = (site.description || site.description_es || '')
    .replace(/<[^>]*>/g, '')
    .trim()
    .substring(0, 150) + ((site.description || '').length > 150 ? '...' : '');

  const handleToggleFavorite = async () => {
    if (!authLoading && currentUser) await toggleFavorite(site.id);
  };

  const handleShare = async () => {
    const shareTitle = site.name;
    const shareText = `¡Dale un vistazo a este lugar en San Antonio Palopó!\n\n${site.name}\n${cleanDescription}`;
    const fullShareText = `${shareText}\n\nDescubre más aquí:\n${window.location.href}`;
    const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile && navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: window.location.href });
        return;
      } catch (e) {
        if (e.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(fullShareText);
      toast.success('Enlace copiado al portapapeles', { icon: '📋' });
    } catch {
      toast.error('No se pudo copiar.');
    }
  };

  const handleWhatsAppClick = async (e, phone, siteName) => {
    e.preventDefault();
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 8) cleanPhone = `502${cleanPhone}`;
    const messageText = `¡Hola! Quiero información sobre: "${siteName}"\n\n${window.location.href}`;
    const encodedText = encodeURIComponent(messageText);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    try {
      await navigator.clipboard.writeText(messageText);
      toast.success('Enlace copiado al portapapeles', { icon: '📋' });
    } catch (err) {
      console.log('Error copiando al portapapeles', err);
    }

    if (isMobile) {
      window.location.href = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
    } else {
      window.open(`https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`, 'whatsapp_window');
    }
  };

  const sliderSettings = {
    dots: true, infinite: true, speed: 500,
    slidesToShow: 1, slidesToScroll: 1,
    autoplay: true, autoplaySpeed: 3000,
    pauseOnHover: true, arrows: true,
    lazyLoad: 'ondemand',
  };

  const modalSliderSettings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    adaptiveHeight: true,
    arrows: !isZoomed,
    swipe: !isZoomed,
    draggable: !isZoomed,
    initialSlide: selectedImageIndex || 0,
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name: site.name,
    description: cleanDescription,
    image: site.imageUrls?.[0] || '',
    url: typeof window !== 'undefined' ? window.location.href : '',
    ...(site.latitude && site.longitude && {
      geo: { '@type': 'GeoCoordinates', latitude: site.latitude, longitude: site.longitude },
    }),
    ...(ratingCount > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: avgRating.toFixed(1),
        reviewCount: ratingCount,
      },
    }),
  };

  const handleCloseModal = () => {
    setIsImageModalOpen(false);
    setIsZoomed(false);
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <style dangerouslySetInnerHTML={{
        __html: `
        @media (max-width: 768px) {
          .desktop-volver-btn { display: none !important; }
        }
        .zoomable-image-wrapper { touch-action: none; }
      `}} />

      <div className="site-detail-container">
        <div className="site-detail-header-actions" style={{ alignItems: 'center', position: 'relative', justifyContent: 'center' }}>
          {/* Botón Volver para PWA (Solo en Escritorio) */}
          <button
            className="desktop-volver-btn"
            onClick={() => router.back()}
            style={{
              position: 'absolute',
              left: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              background: 'none',
              border: 'none',
              color: '#007bff',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold',
              padding: 0
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            Volver
          </button>

          {/* Contenedor central protegido con padding para evitar superposición con "Volver" */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '15px', padding: '0 90px', width: '100%' }}>
            {site.category && <span className="site-detail-category">{site.category}</span>}
            {ratingCount > 0 && (
              <div className="site-rating-summary">
                <span className="star-display">
                  {'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}
                </span>
                <span className="rating-text">
                  {avgRating.toFixed(1)} ({ratingCount} {ratingCount === 1 ? 'reseña' : 'reseñas'})
                </span>
              </div>
            )}
            {currentUser && (
              <button
                onClick={handleToggleFavorite}
                className={`favorite-button ${isFavorite ? 'active' : ''}`}
              >
                <Heart size={16} fill={isFavorite ? '#c9184a' : 'none'} />
                {isFavorite ? 'En favoritos' : 'Favorito'}
              </button>
            )}
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => router.push(`/admin?view=editSite&siteId=${site.id}`)}
                className="site-detail-edit-button"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#007bff', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <Edit size={16} /> Editar
              </button>
            )}
          </div>
        </div>

        <h1 className="site-detail-title">{site.name}</h1>

        {site.imageUrls && site.imageUrls.length > 0 && (
          <div className="carousel-container">
            <Slider {...sliderSettings} className="site-carousel">
              {site.imageUrls.map((url, index) => (
                <div key={index} className="carousel-slide-wrapper">
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9' }}>
                    <Image
                      src={url}
                      alt={`${site.name} - foto ${index + 1}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 800px"
                      priority={index === 0}
                      style={{ objectFit: 'cover', cursor: 'pointer' }}
                      onClick={() => { setSelectedImageIndex(index); setIsImageModalOpen(true); }}
                      title={`${site.name} - ${site.category}`}
                    />
                  </div>
                </div>
              ))}
            </Slider>
          </div>
        )}

        {site.address && <p className="site-detail-address">{site.address}</p>}

        <div className="site-actions-container">
          <div className="action-group">
            <button
              onClick={() => router.push(`/mapa?lat=${site.latitude}&lng=${site.longitude}&id=${site.id}`)}
              className="action-button map-button"
            >
              <Map size={18} /> Ver en Mapa
            </button>
            <button onClick={handleShare} className="action-button share-button">
              <Share2 size={18} /> Compartir
            </button>
          </div>
        </div>

        {(site.email || site.whatsapp || site.whatsapp2 || site.facebook || site.instagram || site.tiktok || site.youtube || site.website) && (
          <div className="social-group-container" style={{ marginTop: '20px' }}>
            <h5 className="social-group-title" style={{ textAlign: 'center', marginBottom: '10px', fontSize: '0.9rem', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>Contáctanos</h5>
            <div className="action-group social-group" style={{ justifyContent: 'center', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {site.website && (
                <a href={site.website} target="_blank" rel="noopener noreferrer" className="action-button social-icon website-button" aria-label="Sitio Web">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                </a>
              )}
              {site.whatsapp && (
                <button onClick={(e) => handleWhatsAppClick(e, site.whatsapp, site.name)} className="action-button social-icon whatsapp-button" aria-label="WhatsApp">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z" /></svg>
                </button>
              )}
              {site.whatsapp2 && (
                <button onClick={(e) => handleWhatsAppClick(e, site.whatsapp2, site.name)} className="action-button social-icon whatsapp-button" aria-label="WhatsApp 2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z" /></svg>
                </button>
              )}
              {site.facebook && (
                <a href={site.facebook} target="_blank" rel="noopener noreferrer" className="action-button social-icon facebook-button" aria-label="Facebook">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0 0 3.596 0 8.049c0 4.144 3.062 7.585 7.029 7.95v-5.625h-2.03V8.05H7.03v-2.022c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.967-.365 7.029-3.806 7.029-7.951z" /></svg>
                </a>
              )}
              {site.instagram && (
                <a href={site.instagram} target="_blank" rel="noopener noreferrer" className="action-button social-icon instagram-button" aria-label="Instagram">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                </a>
              )}
              {site.tiktok && (
                <a href={site.tiktok} target="_blank" rel="noopener noreferrer" className="action-button social-icon tiktok-button" aria-label="TikTok">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M9 0h1.98c.144.715.54 1.617 1.235 2.512C12.895 3.389 13.797 4 15 4v2c-1.753 0-3.07-.814-4-1.829V11a5 5 0 1 1-5-5v2a3 3 0 1 0 3 3V0Z" /></svg>
                </a>
              )}
              {site.youtube && (
                <a href={site.youtube} target="_blank" rel="noopener noreferrer" className="action-button social-icon youtube-button" aria-label="YouTube">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M8.051 1.999h.089c.822.003 4.987.033 6.11.335a2.01 2.01 0 0 1 1.415 1.42c.101.38.172.883.22 1.402l.01.104.022.26.008.104c.065.914.073 1.77.074 1.957v.075c-.001.194-.01 1.108-.082 2.06l-.008.105-.009.104c-.05.572-.124 1.14-.235 1.558a2.007 2.007 0 0 1-1.415 1.42c-1.16.312-5.569.334-6.18.335h-.142c-.309 0-1.587-.006-2.927-.052l-.17-.006-.087-.004-.171-.007-.171-.007c-1.11-.049-2.167-.128-2.654-.26a2.007 2.007 0 0 1-1.415-1.419c-.111-.417-.185-.986-.235-1.558L.09 9.82l-.008-.104A31.4 31.4 0 0 1 0 7.68v-.123c.002-.215.01-.958.064-1.778l.007-.103.003-.052.008-.104.022-.26.01-.104c.048-.519.119-1.023.22-1.402a2.007 2.007 0 0 1 1.415-1.42c.487-.13 1.544-.21 2.654-.26l.17-.007.172-.006.086-.003.171-.007A99.788 99.788 0 0 1 7.858 2h.193zM6.4 5.209v4.818l4.157-2.408L6.4 5.209z" /></svg>
                </a>
              )}
            </div>
          </div>
        )}

        <div className="site-detail-description">
          <div
            className="ql-editor-display"
            dangerouslySetInnerHTML={{ __html: site.description || site.description_es || '' }}
          />
        </div>

        <Comments
          siteId={site.id}
          onRatingUpdate={(avg, count) => { setAvgRating(avg); setRatingCount(count); }}
        />

        {isImageModalOpen && (
          <div className="image-modal-overlay" onClick={handleCloseModal}>
            <button className="close-image-modal-button" onClick={handleCloseModal}>✕</button>
            <div className="image-modal-slider-container" onClick={(e) => e.stopPropagation()}>
              <Slider {...modalSliderSettings}>
                {site.imageUrls.map((url, index) => (
                  <div key={index} className="image-modal-slide">
                    <ZoomableImage
                      src={url}
                      alt={`Vista ampliada ${index + 1}`}
                      onZoomChange={setIsZoomed}
                    />
                  </div>
                ))}
              </Slider>
            </div>
          </div>
        )}
      </div>
    </>
  );
}