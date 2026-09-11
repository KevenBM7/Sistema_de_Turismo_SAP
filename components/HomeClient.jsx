'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SiteList from '../components/SiteList';
import Slider from 'react-slick';
import { 
  Search, Map, ArrowRight, Palette, 
  Hotel, Utensils, Mountain, Compass, Calendar, 
  Coffee, Ship, Landmark, MapPin
} from 'lucide-react';
import '../legacy_pages/Home.css';
import '../components/CategoryCard.css';
import { createSlug } from '@/lib/slugUtils';
import '../styles/Utilities.css';
import '../styles/Layout.css';

/**
 * HomeClient — Rediseño Stitch UI de Alta Fidelidad
 * Con tarjetas visuales fotográficas para categorías, iconos de lucide-react y 100% responsivo.
 */
function Home({
  homePageData: serverHomeData,
  groupedCategories: serverCategories,
  categoryInfo = {},
  upcomingEvents: serverEvents,
  featuredSites = []
}) {
  const [homePageData] = useState(serverHomeData || { welcomeText: 'Bienvenido', subText: '', imageUrls: [] });
  const [groupedCategories] = useState(serverCategories || {});
  const [upcomingEvents] = useState(serverEvents || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  const parentCategoryTitles = {
    "Atracciones y Cultura": "Cultura y Lugares Emblemáticos",
    "Servicios y Logística": "Hospedaje, Gastronomía y Servicios",
    "Movilidad y Transporte": "Movilidad y Transporte",
  };

  const displayOrder = ["Atracciones y Cultura", "Servicios y Logística", "Movilidad y Transporte"];

  useEffect(() => {
    setIsClient(true);
    const checkMobile = () => {
      setIsMobile(typeof window !== 'undefined' && window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    const timer = setTimeout(() => {
      const hiddenLinks = document.querySelectorAll('.event-carousel-container .slick-slide[aria-hidden="true"] a');
      hiddenLinks.forEach(el => el.setAttribute('tabindex', '-1'));
    }, 500);

    return () => {
      window.removeEventListener('resize', checkMobile);
      clearTimeout(timer);
    };
  }, [upcomingEvents]);

  const handleQuickSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const sliderSettings = {
    dots: false,
    infinite: true,
    speed: 700,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    fade: true,
    arrows: false,
    pauseOnHover: false,
  };

  const isSingleCard = isMobile || upcomingEvents.length <= 1;

  const eventSliderSettings = {
    dots: upcomingEvents.length > 1,
    infinite: false,
    speed: 500,
    slidesToShow: isSingleCard ? 1 : 2,
    slidesToScroll: 1,
    autoplay: upcomingEvents.length > 2,
    autoplaySpeed: 6000,
    arrows: upcomingEvents.length > 1,
    customPaging: (i) => (
      <button type="button" aria-label={`Ver evento número ${i + 1}`}>
        {i + 1}
      </button>
    ),
    afterChange: () => {
      const hiddenLinks = document.querySelectorAll('.event-carousel-container .slick-slide[aria-hidden="true"] a');
      hiddenLinks.forEach(el => el.setAttribute('tabindex', '-1'));
      const visibleLinks = document.querySelectorAll('.event-carousel-container .slick-slide:not([aria-hidden="true"]) a');
      visibleLinks.forEach(el => el.removeAttribute('tabindex'));
    },
    responsive: [
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          arrows: upcomingEvents.length > 1,
          dots: upcomingEvents.length > 1,
        },
      },
    ],
  };

  const getEventStatus = (event) => {
    const today = new Date().toISOString().split('T')[0];
    if (event.startDate > today) {
      return { text: 'Próximamente', color: '#0284c7' };
    } else if (event.endDate && event.endDate >= today) {
      return { text: '¡En curso hoy!', color: '#059669' };
    } else if (event.startDate === today) {
      return { text: '¡En curso hoy!', color: '#059669' };
    } else {
      return { text: 'Evento Destacado', color: '#2563eb' };
    }
  };

  const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '').trim();
  };

  const getEventDates = (startDateStr, endDateStr) => {
    if (!startDateStr) return { day: '', month: '', full: '' };
    try {
      const sDate = new Date(`${startDateStr}T00:00:00`);
      const day = sDate.getDate();
      const month = sDate.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase().replace('.', '');
      let full = sDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
      if (endDateStr && endDateStr !== startDateStr) {
        const eDate = new Date(`${endDateStr}T00:00:00`);
        full += ` — ${eDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`;
      }
      return { day, month, full };
    } catch {
      return { day: '', month: '', full: startDateStr };
    }
  };

  const renderEventCard = (event, isPriority = false) => {
    const status = getEventStatus(event);
    const eventImg = (event.imageUrls && event.imageUrls.length > 0)
      ? event.imageUrls[0]
      : (event.imageUrl || null);
    const { day, month, full } = getEventDates(event.startDate, event.endDate);
    const cleanDesc = stripHtml(event.description);

    return (
      <Link href={`/evento/${event.slug || event.id}`} className="event-card-link">
        <article className="event-card-modern">
          <div className="event-card-media">
            {eventImg ? (
              <img
                src={eventImg}
                alt={event.title}
                className="event-card-img"
                loading="lazy"
                decoding="async"
                width="600"
                height="340"
              />
            ) : (
              <div className="event-card-placeholder">
                <Calendar size={40} color="#64748b" />
              </div>
            )}

            {/* Badge de estado flotante */}
            <div className="event-card-status-badge">
              <span className="event-status-dot" style={{ backgroundColor: status.color }}></span>
              <span>{status.text}</span>
            </div>

            {/* Chip de fecha destacada flotante */}
            {day && (
              <div className="event-card-date-chip">
                <span className="date-chip-day">{day}</span>
                <span className="date-chip-month">{month}</span>
              </div>
            )}
          </div>

          <div className="event-card-body">
            <div className="event-card-meta-row">
              <Calendar size={14} className="event-meta-icon" />
              <span>{full}</span>
            </div>

            <h3 className="event-card-title">{event.title}</h3>

            {cleanDesc && (
              <p className="event-card-desc">
                {cleanDesc.length > 90 ? `${cleanDesc.substring(0, 90)}...` : cleanDesc}
              </p>
            )}

            <div className="event-card-footer">
              <span className="event-card-cta">Ver información</span>
              <ArrowRight size={15} className="event-cta-arrow" />
            </div>
          </div>
        </article>
      </Link>
    );
  };

  // Iconos temáticos de alta fidelidad con Lucide (reemplaza cualquier emoji de IA)
  const renderCategoryIcon = (name) => {
    const lower = (name || '').toLowerCase();
    if (lower.includes('cerámica') || lower.includes('artesan') || lower.includes('alfarer')) {
      return <Palette size={16} />;
    }
    if (lower.includes('hotel') || lower.includes('hospedaje') || lower.includes('posada') || lower.includes('alojam')) {
      return <Hotel size={16} />;
    }
    if (lower.includes('restaurante') || lower.includes('comida') || lower.includes('gastronom') || lower.includes('antojito')) {
      return <Utensils size={16} />;
    }
    if (lower.includes('café') || lower.includes('cafeter')) {
      return <Coffee size={16} />;
    }
    if (lower.includes('mirador') || lower.includes('sitio') || lower.includes('turístic') || lower.includes('volc')) {
      return <Mountain size={16} />;
    }
    if (lower.includes('lancha') || lower.includes('transporte') || lower.includes('barco') || lower.includes('embarc') || lower.includes('movilidad')) {
      return <Ship size={16} />;
    }
    if (lower.includes('cultura') || lower.includes('museo') || lower.includes('iglesia') || lower.includes('patrimon') || lower.includes('historia')) {
      return <Landmark size={16} />;
    }
    return <Compass size={16} />;
  };

  const categoryFallbackImages = {
    'artesanías': 'https://firebasestorage.googleapis.com/v0/b/turismo-municipal.firebasestorage.app/o/sites%2Foriginals%2F1763157308642_1_464184342_8877113082376166_4051411287073867774_n_800x800.webp?alt=media',
    'sitios turisticos': 'https://firebasestorage.googleapis.com/v0/b/turismo-municipal.firebasestorage.app/o/sites%2Foriginals%2Fsan-antonio-palopo-sitios-turisticos-mirador-area-estelar-1778121259444-0_800x800.webp?alt=media',
    'comida rápida': 'https://firebasestorage.googleapis.com/v0/b/turismo-municipal.firebasestorage.app/o/sites%2Foriginals%2Fsan-antonio-palopo-comida-rapida-antojitos-ramirez-1765386446412-0_800x800.webp?alt=media',
    'transporte terrestre': 'https://firebasestorage.googleapis.com/v0/b/turismo-municipal.firebasestorage.app/o/sites%2Foriginals%2Fsan-antonio-palopo-transporte-terrestre-pick-ups-a-panajachel-1764354981620-0_800x800.webp?alt=media',
    'comercios': 'https://firebasestorage.googleapis.com/v0/b/turismo-municipal.firebasestorage.app/o/sites%2Foriginals%2F1764005446220_0_481203742_605372622381701_8256269841340260035_n_800x800.webp?alt=media',
    'servicios turísticos': 'https://firebasestorage.googleapis.com/v0/b/turismo-municipal.firebasestorage.app/o/sites%2Foriginals%2Fsan-antonio-palopo-servicios-turisticos-servicios-turisticos-nawa-atitlan-1770048018392-1_800x800.webp?alt=media',
    'municipalidad': 'https://firebasestorage.googleapis.com/v0/b/turismo-municipal.firebasestorage.app/o/sites%2Foriginals%2F1763160533439_0_org_6b0dd04354d28130_1752603836000_800x800.webp?alt=media',
  };

  const categoryGeneralTitles = {
    'artesanías': 'Alfarería en barro vidriado y telares tradicionales',
    'sitios turisticos': 'Miradores escénicos, templos y cascadas',
    'comida rápida': 'Gastronomía local, cevicherías y antojitos',
    'restaurantes': 'Restaurantes y sabores típicos a orillas del lago',
    'hoteles': 'Hospedajes y hoteles con vista a los volcanes',
    'hospedaje': 'Posadas tranquilas y calidez comunitaria',
    'transporte terrestre': 'Rutas de transporte terrestre y traslados',
    'comercios': 'Comercios locales, artesanías y recuerdos',
    'servicios turísticos': 'Servicios turísticos y guías comunitarios',
    'municipalidad': 'Centro cívico e información municipal',
  };

  const getParentCategoryHeader = (parentCat) => {
    if (parentCat === 'Atracciones y Cultura') {
      return {
        icon: <Landmark size={20} color="#2563eb" />,
        badge: "PATRIMONIO & PAISAJES",
        subtitle: "Talleres de alfarería, miradores panorámicos y senderos naturales."
      };
    }
    if (parentCat === 'Servicios y Logística') {
      return {
        icon: <Utensils size={20} color="#059669" />,
        badge: "SABORES & SERVICIOS",
        subtitle: "Gastronomía local, opciones de hospedaje y comercio comunitario."
      };
    }
    if (parentCat === 'Movilidad y Transporte') {
      return {
        icon: <Ship size={20} color="#0284c7" />,
        badge: "RUTAS Y CONECTIVIDAD",
        subtitle: "Transporte terrestre y lacustre para moverte cómodamente."
      };
    }
    return {
      icon: <Compass size={20} color="#2563eb" />,
      badge: "EXPERIENCIAS",
      subtitle: "Descubre todo lo que San Antonio Palopó tiene para ofrecerte."
    };
  };

  // JSON-LD para SEO
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

  const heroImageUrls = homePageData.imageUrls || [];

  return (
    <div className="home-page-stitch">
      {/* Marcado Schema.org */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
      />

      {/* ─── APARTADO 1: PORTADA & BIENVENIDA ─────────────────────────────────── */}
      <section className="home-section-band home-band-hero">
        <div className="home-band-container">
          <header className="home-welcome-header">
            <h1 className="home-welcome-title">
              {homePageData.welcomeText || 'Bienvenido a San Antonio Palopó'}
            </h1>
          </header>

          {/* Portada / Carrusel Limpio */}
          {heroImageUrls.length > 0 && (
            <div className="home-header-carousel-clean">
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
                      decoding="async"
                    />
                  </div>
                ))}
              </Slider>
            </div>
          )}

          {/* Descripción y Buscador Compacto y Centrado */}
          <div className="home-intro-search-section">
            {homePageData.subText && (
              <p className="home-intro-description">{homePageData.subText}</p>
            )}

            <form onSubmit={handleQuickSearch} className="home-compact-search-form">
              <Search size={18} className="compact-search-icon" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="¿Qué deseas explorar? (ej. mirador, café, hotel...)"
                className="compact-search-input"
                aria-label="Buscar en el portal turístico"
              />
              <button type="submit" className="compact-search-button">
                <span>Buscar</span>
                <ArrowRight size={14} />
              </button>
            </form>

            <div className="home-compact-pills">
              <Link href="/categoria/artesanias" className="compact-pill">
                <Palette size={13} />
                <span>Cerámica y Tejidos</span>
              </Link>
              <Link href="/categoria/sitios-turisticos" className="compact-pill">
                <Mountain size={13} />
                <span>Miradores</span>
              </Link>
              <Link href="/categoria/comida-rapida" className="compact-pill">
                <Utensils size={13} />
                <span>Gastronomía</span>
              </Link>
              <Link href="/mapa" className="compact-pill pill-accent">
                <Map size={13} />
                <span>Mapa en Vivo</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── APARTADO 2: EXPLORAR POR EXPERIENCIAS (CATEGORÍAS) ─────────────── */}
      {Object.keys(groupedCategories).length > 0 && (
        <section className="home-section-band home-band-categories">
          <div className="home-band-container">
            <div className="home-categories-section">
              <div className="home-section-header">
                <div className="section-eyebrow-container">
                  <span className="section-eyebrow-tag">DESTINO CULTURAL</span>
                </div>
                <h2 className="section-heading">Explora por Categoría</h2>
                <p className="section-subtext">
                  Talleres de alfarería vidriada, miradores escénicos, gastronomía típica y opciones de viaje.
                </p>
              </div>

              {displayOrder.map(parentCat => {
                if (!groupedCategories[parentCat]) return null;
                const headerMeta = getParentCategoryHeader(parentCat);

                return (
                  <div key={parentCat} className="category-group-block">
                    <div className="category-group-header-banner">
                      <div className="category-group-header-main">
                        <div className="category-group-icon-badge">
                          {headerMeta.icon}
                        </div>
                        <div>
                          <span className="category-group-eyebrow">{headerMeta.badge}</span>
                          <h3 className="category-group-title-v2">
                            {parentCategoryTitles[parentCat] || parentCat}
                          </h3>
                        </div>
                      </div>
                      <p className="category-group-description">{headerMeta.subtitle}</p>
                    </div>

                    <div className="category-visual-grid">
                      {groupedCategories[parentCat].map(subCat => {
                        const info = categoryInfo[subCat] || {};
                        const lower = subCat.toLowerCase().trim();
                        const bgImg =
                          info.imageUrl ||
                          categoryFallbackImages[lower] ||
                          'https://firebasestorage.googleapis.com/v0/b/turismo-municipal.firebasestorage.app/o/sites%2Foriginals%2F1763157308642_1_464184342_8877113082376166_4051411287073867774_n_800x800.webp?alt=media';
                        const generalTitle = categoryGeneralTitles[lower] || subCat;
                        const count = info.count || 0;

                        return (
                          <Link
                            key={subCat}
                            href={`/categoria/${createSlug(subCat)}`}
                            className="category-visual-card"
                          >
                            <div className="cat-card-media">
                              <img
                                src={bgImg}
                                alt={generalTitle}
                                className="cat-card-image"
                                loading="lazy"
                                decoding="async"
                                width={400}
                                height={250}
                              />
                              <div className="cat-card-gradient"></div>
                            </div>

                            <div className="cat-card-header">
                              <span className="cat-card-pill">
                                {renderCategoryIcon(subCat)}
                                <span>{subCat}</span>
                              </span>
                              {count > 0 && (
                                <span className="cat-card-count">
                                  <MapPin size={11} />
                                  <span>{count} {count === 1 ? 'sitio' : 'sitios'}</span>
                                </span>
                              )}
                            </div>

                            <div className="cat-card-content">
                              <h4 className="cat-card-title">{generalTitle}</h4>
                              <div className="cat-card-cta">
                                <span>Explorar lugares</span>
                                <ArrowRight size={14} className="cat-cta-arrow" />
                              </div>
                            </div>
                          </Link>
                        );
                      })}

                      {/* Tarjeta Destacada del Mapa Interactivo */}
                      {parentCat === 'Movilidad y Transporte' && (
                        <Link
                          href="/mapa"
                          className="category-visual-card category-map-card"
                        >
                          <div className="cat-card-media">
                            <img
                              src="https://firebasestorage.googleapis.com/v0/b/turismo-municipal.firebasestorage.app/o/sites%2Foriginals%2Fsan-antonio-palopo-sitios-turisticos-mirador-area-estelar-1778121259444-0_800x800.webp?alt=media"
                              alt="Mapa Interactivo de San Antonio Palopó"
                              className="cat-card-image"
                              loading="lazy"
                              decoding="async"
                              width={400}
                              height={250}
                            />
                            <div className="cat-card-gradient"></div>
                            <div className="map-radar-indicator">
                              <span className="radar-ping"></span>
                              <span className="radar-core"></span>
                            </div>
                          </div>

                          <div className="cat-card-header">
                            <span className="cat-card-pill" style={{ background: 'rgba(2, 132, 199, 0.95)', color: '#ffffff' }}>
                              <Map size={13} />
                              <span>Mapa Interactivo</span>
                            </span>
                            <span className="cat-card-count" style={{ background: 'rgba(16, 185, 129, 0.9)', color: '#ffffff' }}>
                              <Compass size={11} />
                              <span>GPS en Vivo</span>
                            </span>
                          </div>

                          <div className="cat-card-content">
                            <h4 className="cat-card-title">Mapa en vivo con rutas, miradores, hoteles y cómo llegar</h4>
                            <div className="cat-card-cta">
                              <span>Abrir mapa interactivo</span>
                              <ArrowRight size={14} className="cat-cta-arrow" />
                            </div>
                          </div>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─── APARTADO 3: LUGARES DESTACADOS ("JOYAS DE PALOPÓ") ────────────── */}
      {featuredSites && featuredSites.length > 0 && (
        <section className="home-section-band home-band-featured">
          <div className="home-band-container">
            <div className="home-section-header">
              <div className="section-eyebrow-container">
                <span className="section-eyebrow-tag">SELECCIÓN MUNICIPAL</span>
              </div>
              <h2 className="section-heading">Joyas de San Antonio Palopó</h2>
              <p className="section-subtext">
                Lugares emblemáticos, talleres y experiencias seleccionadas para que aproveches al máximo tu visita.
              </p>
            </div>
            <SiteList initialSites={featuredSites} />
          </div>
        </section>
      )}

      {/* ─── APARTADO 4: AGENDA CULTURAL Y EVENTOS ─────────────────────────── */}
      {upcomingEvents.length > 0 && (
        <section className="home-section-band home-band-events">
          <div className="home-band-container event-section-wrapper">
            <div className="home-section-header">
              <div className="section-eyebrow-container">
                <span className="section-eyebrow-tag">AGENDA CULTURAL</span>
              </div>
              <h2 className="section-heading">Eventos y Festividades</h2>
              <p className="section-subtext">
                Actividades culturales, ferias comunitarias y celebraciones en San Antonio Palopó.
              </p>
            </div>

            {upcomingEvents.length <= 2 ? (
              <div className="event-grid-container">
                {upcomingEvents.map((event, idx) => (
                  <div key={event.id} className="event-grid-item">
                    {renderEventCard(event, idx === 0)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="event-carousel-container">
                {isClient ? (
                  <Slider key={`event-slider-${isSingleCard ? '1-col' : '2-col'}`} {...eventSliderSettings}>
                    {upcomingEvents.map((event, idx) => (
                      <div key={event.id} className="event-slide-item">
                        {renderEventCard(event, idx === 0)}
                      </div>
                    ))}
                  </Slider>
                ) : (
                  <div className="event-grid-container" style={{ opacity: 0.95 }}>
                    {upcomingEvents.slice(0, 2).map((event, idx) => (
                      <div key={event.id} className="event-grid-item">
                        {renderEventCard(event, idx === 0)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

export default Home;
