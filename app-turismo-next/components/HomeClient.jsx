'use client';

import Link from 'next/link';
import Image from 'next/image';
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { db } from '@/lib/firebase';
const SiteList = lazy(() => import('../components/SiteList'));
import EventCarouselSkeleton from '../components/EventCarouselSkeleton';
import CategoryGroupSkeleton from '../components/CategoryGroupSkeleton';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import '../legacy_pages/Home.css';
import '../components/CategoryCard.css';
import { createSlug } from '@/lib/slugUtils';
import { normalizeImagePaths } from '@/lib/helpers';
import '../styles/Utilities.css';
import '../styles/Layout.css';

const shuffleArray = (array) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};

/**
 * HomeClient — Componente cliente que recibe datos pre-fetched del servidor (ISR).
 * 
 * ANTES: re-fetcheaba TODO desde Firestore duplicando requests.
 * AHORA: usa los props del Server Component como fuente de verdad.
 * Solo se re-fetch en el cliente para datos que requieren interacción (sitios aleatorios).
 */
function Home({ homePageData: serverHomeData, groupedCategories: serverCategories, upcomingEvents: serverEvents }) {
  // Usar los datos del servidor como estado inicial
  const [homePageData] = useState(serverHomeData || { welcomeText: 'Bienvenido', subText: 'Descubre lugares increíbles.', imageUrls: [] });
  const [groupedCategories] = useState(serverCategories || {});
  const [randomSiteIds, setRandomSiteIds] = useState([]);
  const [upcomingEvents] = useState(serverEvents || []);
  const [loadingSites, setLoadingSites] = useState(true);
  const [isClient, setIsClient] = useState(false);

  const parentCategoryTitles = {
    "Atracciones y Cultura": "Descubre lo Imprescindible",
    "Servicios y Logística": "Tu Base de Viaje",
    "Movilidad y Transporte": "Movilidad y Transporte",
  };

  const displayOrder = ["Atracciones y Cultura", "Servicios y Logística", "Movilidad y Transporte"];

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Solo el fetch de sitios aleatorios se hace en el cliente 
  // (requiere Math.random que causa hydration mismatch si se hace en servidor)
  useEffect(() => {
    const fetchRandomSites = async () => {
      try {
        const { collection, getDocs } = await import('firebase/firestore');
        const sitesSnapshot = await getDocs(collection(db, 'sites'));
        const allSites = sitesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const sitesByCategory = {};
        allSites.forEach(site => {
          if (site.category && site.parentCategory !== 'Movilidad y Transporte') {
            if (!sitesByCategory[site.category]) {
              sitesByCategory[site.category] = [];
            }
            sitesByCategory[site.category].push(site);
          }
        });

        const categoriesWithSites = Object.keys(sitesByCategory);
        const shuffledCategories = shuffleArray([...categoriesWithSites]);
        const selectedSites = [];
        for (const category of shuffledCategories) {
          if (selectedSites.length >= 9) break;
          const sitesInCat = sitesByCategory[category];
          const randomSite = sitesInCat[Math.floor(Math.random() * sitesInCat.length)];
          selectedSites.push(randomSite);
        }
        setRandomSiteIds(selectedSites.map(site => site.id));
      } catch (error) {
        console.error("Error al cargar los sitios aleatorios:", error);
      } finally {
        setLoadingSites(false);
      }
    };

    // Diferir para priorizar renderizado del hero
    const timer = setTimeout(fetchRandomSites, 200);
    return () => clearTimeout(timer);
  }, []);

  const sliderSettings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    fade: true,
    arrows: false,
    lazyLoad: 'ondemand',
  };

  const eventSliderSettings = {
    dots: true,
    infinite: upcomingEvents.length > 1,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: upcomingEvents.length > 1,
    autoplaySpeed: 5000,
    lazyLoad: 'ondemand',
    arrows: true,
  };

  const getEventStatus = (event) => {
    const today = new Date().toISOString().split('T')[0];
    if (event.startDate > today) {
      return { text: 'Próximamente', color: '#007bff' };
    } else if (event.endDate >= today) {
      return { text: '¡En curso!', color: '#28a745' };
    } else {
      return { text: 'Finalizado', color: '#6c757d' };
    }
  };

  // --- JSON-LD para SEO ---
  const jsonLdData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "url": "https://turismosanantoniopalopo.com/",
    "name": "Turismo San Antonio Palopó",
    "description": homePageData.subText || "Guía turística oficial de San Antonio Palopó. Descubre hoteles, restaurantes, cultura y atracciones a orillas del Lago Atitlán.",
    "publisher": {
      "@type": "Organization",
      "name": "Municipalidad de San Antonio Palopó",
      "logo": {
        "@type": "ImageObject",
        "url": "https://turismosanantoniopalopo.com/logo512.png"
      }
    },
    ...(upcomingEvents.length > 0 && {
      "event": upcomingEvents.map(event => ({
        "@type": "Event",
        "name": event.title,
        "startDate": event.startDate,
        "endDate": event.endDate || event.startDate,
        "url": `https://turismosanantoniopalopo.com/evento/${event.slug || event.id}`
      }))
    })
  };

  // Resolver URLs de imágenes del carrusel hero
  const heroImageUrls = homePageData.imageUrls || [];

  return (
    <div>
      {/* JSON-LD para SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
      />

      <header className="home-welcome-text">
        <h1>{homePageData.welcomeText}</h1>
      </header>

      <div className="home-description-container">
        {heroImageUrls.length > 0 && (
          <div className="home-header-carousel">
            <Slider {...sliderSettings}>
              {heroImageUrls.map((url, index) => (
                <div key={index} className="header-slide-wrapper">
                  <img
                    src={url}
                    alt="Portada San Antonio Palopó"
                    className="header-slide-image"
                    width="1200"
                    height="675"
                    fetchPriority={index === 0 ? "high" : "auto"}
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                </div>
              ))}
            </Slider>
          </div>
        )}

        <p className="home-description-text">{homePageData.subText}</p>
      </div>

      {upcomingEvents.length > 0 ? (
        <section className="home-section">
          <h2 style={{ textAlign: 'center' }}>Eventos Activos y Próximos</h2>
          <p style={{ textAlign: 'center', color: '#666', fontSize: '0.9rem', marginTop: '-0.5rem' }}>
            {upcomingEvents.length > 0 ? `${upcomingEvents.length} ${upcomingEvents.length === 1 ? 'evento disponible' : 'eventos disponibles'}` : 'Mantente al tanto de nuestras actividades'}
          </p>
          <div className="event-carousel-container">
            <Slider {...eventSliderSettings}>
              {isClient && upcomingEvents.map(event => {
                const status = getEventStatus(event);
                const eventImg = event.imageUrls && event.imageUrls.length > 0
                  ? event.imageUrls[0]  // Usar primera imagen, no aleatoria (evita hydration mismatch)
                  : null;

                return (
                  <div key={event.id}>
                    <Link href={`/evento/${event.slug || event.id}`} className="event-slide-link">
                      <div className="event-slide">
                        {eventImg ? (
                          <img
                            src={eventImg}
                            alt={event.title}
                            className="event-slide-image"
                            loading="lazy"
                            width="800"
                            height="550"
                          />
                        ) : (
                          <div className="event-slide-placeholder" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', width: '100%', height: '100%' }}></div>
                        )}

                        <div className="event-slide-overlay">
                          <div style={{
                            display: 'inline-block',
                            backgroundColor: status.color,
                            color: 'white',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '20px',
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                            marginBottom: '0.5rem'
                          }}>
                            {status.text}
                          </div>
                          <h3>{event.title}</h3>
                          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', opacity: 0.9 }}>
                            📅 {new Date(`${event.startDate}T00:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                            {event.endDate && event.endDate !== event.startDate &&
                              ` - ${new Date(`${event.endDate}T00:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}`
                            }
                          </p>
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </Slider>
          </div>
        </section>
      ) : (
        <section className="home-section" style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: '#666', fontSize: '1rem' }}>
            📅 No hay eventos activos o próximos en este momento.
          </p>
        </section>
      )}

      {Object.keys(groupedCategories).length > 0 && (
        <section className="home-section">
          <h2 style={{ textAlign: 'center' }}>Explora por Categoría</h2>
          {displayOrder.map(parentCat => (
            groupedCategories[parentCat] && (
              <div key={parentCat} className="category-group">
                <h3 className="category-group-title">{parentCategoryTitles[parentCat] || parentCat}</h3>
                <div className="category-filters">
                  {groupedCategories[parentCat].map(subCat => (
                    <Link key={subCat} href={`/categoria/${createSlug(subCat)}`} className="category-button">
                      {subCat}
                    </Link>
                  ))}
                </div>
              </div>
            )
          ))}
        </section>
      )}

      {loadingSites ? (
        <section className="home-section">
          <CategoryGroupSkeleton />
          <CategoryGroupSkeleton />
        </section>
      ) : randomSiteIds.length > 0 && (
        <div className="container" style={{ paddingTop: '2rem' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Conociendo San Antonio Palopó</h2>
          <Suspense fallback={<div style={{ textAlign: 'center', padding: '2rem' }}>Cargando sitios...</div>}>
            <SiteList siteIds={randomSiteIds} />
          </Suspense>
        </div>
      )}
    </div>
  );
}

export default Home;