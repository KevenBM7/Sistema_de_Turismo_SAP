import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { storage } from '../services/firebase';
import SiteList from '../components/SiteList';
import { ref, getDownloadURL } from 'firebase/storage';
import EventCarouselSkeleton from '../components/EventCarouselSkeleton';
import CategoryGroupSkeleton from '../components/CategoryGroupSkeleton';
import { Link } from 'react-router-dom';
import Slider from 'react-slick';
import '../pages/Home.css';
import '../components/CategoryCard.css';
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

const parentCategoryTitles = {
  "Atracciones y Cultura": "Descubre lo Imprescindible",
  "Servicios y Logística": "Tu Base de Viaje",
  "Movilidad y Transporte": "Movilidad y Transporte",
};

const displayOrder = ["Atracciones y Cultura", "Servicios y Logística", "Movilidad y Transporte"];

function Home() {
  const [homePageData, setHomePageData] = useState({ welcomeText: 'Bienvenido', subText: 'Descubre lugares increíbles.', imageUrls: [] });
  const [groupedCategories, setGroupedCategories] = useState({});
  const [randomSiteIds, setRandomSiteIds] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchData = async () => {
      try {
        const homePageRef = doc(db, 'settings', 'homePage');
        const homePageSnap = await getDoc(homePageRef);
        if (homePageSnap.exists()) {
          const data = homePageSnap.data();
          if (data.imagePaths && data.imagePaths.length > 0) {
            const urlPromises = data.imagePaths.map(path => getDownloadURL(ref(storage, path)).catch(() => null));
            const urls = (await Promise.all(urlPromises)).filter(Boolean);
            setHomePageData({ ...data, imageUrls: urls });
          } else {
            setHomePageData(data);
          }
        }

        try {
          const today = new Date().toISOString().split('T')[0];
          const futureEventsQuery = query(
            collection(db, 'events'),
            where('startDate', '>=', today),
            orderBy('startDate', 'asc'),
            limit(5)
          );
          const futureEventsSnap = await getDocs(futureEventsQuery);
          let upcoming = futureEventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

          if (upcoming.length < 5) {
            const currentlyActiveQuery = query(
              collection(db, 'events'),
              where('startDate', '<', today),
              where('endDate', '>=', today),
              orderBy('startDate', 'desc'),
              limit(5)
            );
            const activeEventsSnap = await getDocs(currentlyActiveQuery);
            const activeEvents = activeEventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            activeEvents.forEach(event => {
              if (upcoming.length < 5 && !upcoming.find(e => e.id === event.id)) {
                upcoming.push(event);
              }
            });
          }
          
          upcoming.sort((a, b) => a.startDate.localeCompare(b.startDate));
          setUpcomingEvents(upcoming.slice(0, 5));

        } catch (eventsErr) {
          if (eventsErr.message.includes('index')) {
            console.warn("Fallback de eventos activado por falta de índice en Firestore.");
            const allEventsSnapshot = await getDocs(collection(db, 'events'));
            const today = new Date().toISOString().split('T')[0];
            const allEvents = allEventsSnapshot.docs
              .map(doc => ({ id: doc.id, ...doc.data() }))
              .filter(event => event.endDate >= today)
              .sort((a, b) => a.startDate.localeCompare(b.startDate))
              .slice(0, 5);
            setUpcomingEvents(allEvents);
          }
        }

        const sitesSnapshot = await getDocs(collection(db, 'sites'));
        const allSites = sitesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const sitesByCategory = {};
        const groups = {};
        allSites.forEach(site => {
          if (site.parentCategory && site.category) {
            if (!groups[site.parentCategory]) {
              groups[site.parentCategory] = new Set();
            }
            groups[site.parentCategory].add(site.category);
          }
          if (site.category && site.parentCategory !== 'Movilidad y Transporte') {
            if (!sitesByCategory[site.category]) {
              sitesByCategory[site.category] = [];
            }
            sitesByCategory[site.category].push(site);
          }
        });

        Object.keys(groups).forEach(parentCat => {
          groups[parentCat] = Array.from(groups[parentCat]).sort();
        });
        setGroupedCategories(groups);

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
        console.error("Error al cargar los datos de la página de inicio:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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

  if (loading) {
    return (
      <div>
        <header className="home-welcome-text">
          <div className="skeleton-line" style={{ width: '40%', height: '36px', margin: '0 auto 1rem auto', backgroundColor: '#e0e0e0', borderRadius: '4px' }}></div>
          <div className="skeleton-line" style={{ width: '60%', height: '24px', margin: '0 auto', backgroundColor: '#e0e0e0', borderRadius: '4px' }}></div>
        </header>
        <div className="home-header-carousel" style={{ backgroundColor: '#e0e0e0' }}></div>
        <section className="home-section">
          <EventCarouselSkeleton />
        </section>
        <section className="home-section">
          <CategoryGroupSkeleton />
          <CategoryGroupSkeleton />
        </section>
      </div>
    );
  }

  return (
    <div>
      <header className="home-welcome-text">
        <h1>{homePageData.welcomeText}</h1>
      </header>

      <div className="home-description-container">
        {homePageData.imageUrls && homePageData.imageUrls.length > 0 && (
          <div className="home-header-carousel">
            <Slider {...sliderSettings}>
              {homePageData.imageUrls.map((url, index) => (
                <div key={index} className="header-slide-wrapper">
                  {/* MEJORA LCP: Usar <img> en lugar de backgroundImage */}
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
              {upcomingEvents.map(event => {
                const status = getEventStatus(event);
                const eventImg = event.imageUrls && event.imageUrls.length > 0 
                  ? event.imageUrls[Math.floor(Math.random() * event.imageUrls.length)]
                  : null;

                return (
                  <div key={event.id}>
                    <Link to={`/evento/${event.id}`} className="event-slide-link">
                      <div className="event-slide">
                        {/* MEJORA: Usar <img> para eventos también */}
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
                    <Link key={subCat} to={`/categoria/${encodeURIComponent(subCat)}`} className="category-button">
                      {subCat}
                    </Link>
                  ))}
                </div>
              </div>
            )
          ))}
        </section>
      )}
      
      {randomSiteIds.length > 0 && (
        <div className="container" style={{ paddingTop: '2rem' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Conociendo San Antonio Palopó</h2>
          <SiteList siteIds={randomSiteIds} />
        </div>
      )}
    </div>
  );
}

export default Home;