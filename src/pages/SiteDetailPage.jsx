import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, limit, doc, getDoc } from 'firebase/firestore';
import { db, storage } from '../services/firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Comments from '../components/Comments';
import SEO from '../components/SEO';
import SiteDetailSkeleton from '../components/SiteDetailSkeleton';
import { useAuth } from '../context/AuthContext';
import { Map, Share2, Edit, Heart } from 'lucide-react';
import './SiteDetailPage.css';

// CORRECCIÓN PARA ICONOS DE LEAFLET
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });

function SiteDetailPage() {
  const { categoryName, slug, id } = useParams();
  const [site, setSite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [avgRating, setAvgRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const { currentUser, toggleFavorite, loading: authLoading } = useAuth();
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchSite = async () => {
      setLoading(true);
      setError('');

      try {
        let siteDoc;

        if (slug) {
          const sitesRef = collection(db, 'sites');
          const q = query(sitesRef, where("slug", "==", slug), limit(1));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            siteDoc = querySnapshot.docs[0];
          }
        } else if (id) {
          const docRef = doc(db, 'sites', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            siteDoc = docSnap;
          }
        }

        if (!siteDoc) {
          setError('No se encontró el sitio turístico.');
        } else {
          const siteData = { id: siteDoc.id, ...siteDoc.data() };

          if (siteData.imagePaths && Array.isArray(siteData.imagePaths)) {
            const urlPromises = siteData.imagePaths.map(async (pathData) => {
              const imagePath = typeof pathData === 'string' ? pathData : pathData.original;
              if (!imagePath) return Promise.resolve(null);
              
              const sizes = [150, 800, 1200];
              const srcset = {};
              for (const size of sizes) {
                const sizedPath = imagePath.replace(/(\.[\w\d_-]+)$/i, `_${size}x${size}.webp`);
                try {
                  srcset[`${size}w`] = await getDownloadURL(ref(storage, sizedPath));
                } catch (e) { /* Ignorar si una versión no existe */ }
              }
              
              const originalUrl = srcset['800w'] || srcset['1200w'] || srcset['150w'] || null;
              return { original: originalUrl, srcset: Object.values(srcset).map((url, i) => `${url} ${sizes[i]}w`).join(', ') };
            });
            const imageData = await Promise.all(urlPromises);
            siteData.imageUrls = imageData.filter(data => data && data.original);
          }
          setSite(siteData);
        }
      } catch (err) {
        console.error("Error al cargar el sitio:", err);
        setError('Ocurrió un error al cargar la información del sitio.');
      } finally {
        setLoading(false);
      }
    };

    fetchSite();
  }, [slug, categoryName, id]);

  if (loading) return <SiteDetailSkeleton />;
  if (error) return <p className="error-message">{error}</p>;
  if (!site) return <p>No se encontró el sitio.</p>;

  const getCleanDescription = (html) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html || '';
    const text = tempDiv.textContent || tempDiv.innerText || "";
    return text.substring(0, 150) + (text.length > 150 ? '...' : '');
  };

  const openImageModal = (index) => {
    setSelectedImageIndex(index);
    setIsImageModalOpen(true);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
    setSelectedImageIndex(null);
  };

  const handleShare = () => {
    const shareText = `¡Echa un vistazo a este lugar en San Antonio Palopó!\n\n*${site.name}*\n${cleanDescription}`;
    const shareUrl = window.location.href;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile && navigator.share) {
      navigator.share({
        title: site.name,
        text: `${shareText}\n\nDescubre más aquí:`,
        url: shareUrl,
      }).catch((error) => console.log('Error al usar Web Share API', error));
    } else {
      const clipboardText = `${shareText}\n\nDescubre más aquí:\n${shareUrl}`;
      navigator.clipboard.writeText(clipboardText);
      alert('¡Enlace y detalles copiados al portapapeles!');
    }
  };

  const cleanDescription = getCleanDescription(site.description || site.description_es);
  const mainImageUrl = site.imageUrls && site.imageUrls.length > 0 ? site.imageUrls[0].original : '';
  const isFavorite = !authLoading && currentUser?.favorites?.includes(site.id);

  const handleToggleFavorite = async () => {
    if (!authLoading && currentUser) {
      await toggleFavorite(site.id);
    }
  };

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    pauseOnHover: true,
    arrows: true,
  };

  const modalSliderSettings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    adaptiveHeight: true,
    autoplay: false,
    arrows: true,
    initialSlide: selectedImageIndex,
    customPaging: () => <div />, 
  };

  return (
    <>
      <SEO 
        title={site.name}
        description={cleanDescription}
        image={mainImageUrl}
        url={`/${site.category}/${site.slug || site.id}`}
        type="article"
      />
      
      <div className="site-detail-container">
        <div className="site-detail-header-actions">
          {site.category && (
            <span className="site-detail-category">{site.category}</span>
          )}
          {ratingCount > 0 && (
            <div className="site-rating-summary">
              <span className="star-display">{'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}</span>
              <span className="rating-text">{avgRating.toFixed(1)} ({ratingCount} {ratingCount === 1 ? 'reseña' : 'reseñas'})</span>
            </div>
          )}
          {currentUser && (
            <button onClick={handleToggleFavorite} className={`favorite-button ${isFavorite ? 'active' : ''}`}>
              <Heart size={16} fill={isFavorite ? '#c9184a' : 'none'} /> {isFavorite ? 'En favoritos' : 'Favorito'}
            </button>
          )}
          {currentUser && currentUser.role === 'admin' && (
            <Link to={`/admin/edit/${site.id}`} className="site-detail-edit-button">
              <Edit size={16} /> Editar
            </Link>
          )}
        </div>

        <h1 className="site-detail-title">{site.name}</h1>

        {site.imageUrls && site.imageUrls.length > 0 && (
          <div className="carousel-container">
            <Slider {...sliderSettings} className="site-carousel">
              {site.imageUrls.map((url, index) => (
                <div key={index} className="carousel-slide-wrapper">
                  <img 
                    src={url.original}
                    srcSet={url.srcset}
                    sizes={url.sizes}
                    alt={`${site.name} ${index + 1}`} 
                    className="site-detail-image" 
                    onClick={() => openImageModal(index)} 
                    style={{cursor: 'pointer'}}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    fetchPriority={index === 0 ? 'high' : 'auto'}
                    width="800" height="450"
                    title={`${site.name} - ${site.category}`}
                  />
                </div>
              ))}
            </Slider>
          </div>
        )}

        {site.address && <p className="site-detail-address">{site.address}</p>}

        <div className="site-actions-container">
          <div className="action-group">
            <button onClick={() => navigate('/mapa', { state: { selectedSite: { id: site.id, lat: site.latitude, lng: site.longitude } } })} className="action-button map-button">
              <Map /> Ver en Mapa
            </button>
            <button onClick={handleShare} className="action-button share-button">
              <Share2 /> Compartir
            </button>
          </div>
          {(site.email || site.whatsapp || site.whatsapp2 || site.facebook || site.instagram || site.tiktok) && (
            <div className="social-group-container">
              <h5 className="social-group-title">Contáctanos</h5>
              <div className="action-group social-group">
                {site.whatsapp && (
                  <a
                    href={`https://api.whatsapp.com/send?phone=${site.whatsapp.replace(/\D/g, '')}&text=${encodeURIComponent(
                      `Hola, quiero más información de: "${site.name}"\n${window.location.href}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="action-button social-icon whatsapp-button"
                    aria-label="WhatsApp"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="action-icon" viewBox="0 0 16 16"><path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/></svg>
                  </a>
                )}
                {site.whatsapp2 && (
                  <a
                    href={`https://api.whatsapp.com/send?phone=${site.whatsapp2.replace(/\D/g, '')}&text=${encodeURIComponent(
                      `Hola, quiero más información de: "${site.name}"\n${window.location.href}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="action-button social-icon whatsapp-button"
                    aria-label="WhatsApp 2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="action-icon" viewBox="0 0 16 16"><path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/></svg>
                  </a>
                )}
                {site.facebook && (
                  <a href={site.facebook} target="_blank" rel="noopener noreferrer" className="action-button social-icon facebook-button" aria-label="Facebook">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="action-icon" viewBox="0 0 16 16"><path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0 0 3.596 0 8.049c0 4.144 3.062 7.585 7.029 7.95v-5.625h-2.03V8.05H7.03v-2.022c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.967-.365 7.029-3.806 7.029-7.951z"/></svg>
                  </a>
                )}
                {site.instagram && (
                  <a href={site.instagram} target="_blank" rel="noopener noreferrer" className="action-button social-icon instagram-button" aria-label="Instagram">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" className="action-icon" viewBox="0 0 24 24">
                      <defs>
                        <radialGradient id="instagram-gradient-fixed" cx="0.3" cy="1.1" r="1.2">
                          <stop offset="0%" stopColor="#FFD521" />
                          <stop offset="5%" stopColor="#FFD521" />
                          <stop offset="50%" stopColor="#F50000" />
                          <stop offset="70%" stopColor="#C13584" />
                          <stop offset="90%" stopColor="#833AB4" />
                          <stop offset="100%" stopColor="#405DE6" />
                        </radialGradient>
                      </defs>
                      <path fill="url(#instagram-gradient-fixed)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </a>
                )}
                {site.tiktok && (
                  <a href={site.tiktok} target="_blank" rel="noopener noreferrer" className="action-button social-icon tiktok-button" aria-label="TikTok">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="action-icon" viewBox="0 0 16 16"><path d="M9 0h1.98c.144.715.54 1.617 1.235 2.512C12.895 3.389 13.797 4 15 4v2c-1.753 0-3.07-.814-4-1.829V11a5 5 0 1 1-5-5v2a3 3 0 1 0 3 3V0Z"/></svg>
                  </a>
                )}
                {site.email && (
                  <a href={`mailto:${site.email}`} className="action-button social-icon email-button" aria-label="Correo Electrónico">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="action-icon" viewBox="0 0 16 16"><path d="M.05 3.555A2 2 0 0 1 2 2h12a2 2 0 0 1 1.95 1.555L8 8.414.05 3.555ZM0 4.697v7.104l5.803-3.558L0 4.697ZM6.761 8.83l-6.57 4.027A2 2 0 0 0 2 14h12a2 2 0 0 0 1.808-1.144l-6.57-4.027L8 9.586l-1.239-.757Zm3.436-.586L16 11.801V4.697l-5.803 3.546Z"/></svg>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="site-detail-description">
          <div 
            className="ql-editor-display"
            dangerouslySetInnerHTML={{ __html: site.description || site.description_es }} 
          />
        </div>

        <Comments 
          siteId={site.id} 
          onRatingUpdate={(avg, count) => { setAvgRating(avg); setRatingCount(count); }} 
        />

        {isImageModalOpen && (
          <div className="image-modal-overlay" onClick={closeImageModal}>
            <button className="close-image-modal-button" onClick={closeImageModal}>✕</button>
            <div className="image-modal-slider-container" onClick={(e) => e.stopPropagation()}>
              <Slider {...modalSliderSettings}>
                {site.imageUrls.map((url, index) => (
                  <div key={index} className="image-modal-slide">
                    <img src={url.original} alt={`Vista ampliada ${index + 1}`} className="image-modal-content" />
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

export default SiteDetailPage;