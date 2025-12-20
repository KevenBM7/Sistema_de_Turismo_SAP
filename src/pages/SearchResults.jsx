import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { createSlug } from '../utils/slugUtils';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import SEO from '../components/SEO';
import SiteList from '../components/SiteList';
import { SearchX, PlusCircle, Grid, Calendar, MapPin } from 'lucide-react'; // Iconos


// URL del Formulario
const SUGGEST_SITE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSdewv1slZPa1c0jhZLNioTZdbYwyPYgWp4Yq0JL5OznQSA4hg/viewform?usp=preview";

function SearchResults() {
  const [searchParams] = useSearchParams();
  const [siteResults, setSiteResults] = useState([]);
  const [eventResults, setEventResults] = useState([]);
  const [categoryResults, setCategoryResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const q = searchParams.get('q');

  useEffect(() => {
    const fetchResults = async () => {
      if (!q) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      const searchTerm = q.toLowerCase();

      // Dividir el término de búsqueda en palabras (tokens)
      const searchTokens = searchTerm.split(' ').filter(token => token.length > 0);
      if (searchTokens.length === 0) {
        setLoading(false);
        return;
      }

      try {
        // --- Búsqueda en paralelo ---
        const [sites, events, categories] = await Promise.all([
          // 1. Buscar Sitios
          getDocs(query(
            collection(db, 'sites'),
            where('search_tokens', 'array-contains-any', searchTokens)
          )),
          // 2. Buscar Eventos
          getDocs(query(
            collection(db, 'events'),
            where('search_tokens', 'array-contains-any', searchTokens)
          )),
          // 3. Buscar Categorías (obteniendo todas y filtrando en cliente)
          getDocs(collection(db, 'sites'))
        ]);

        // Procesar resultados de sitios
        const siteIds = sites.docs.map(doc => doc.id);
        // Filtro adicional en cliente para asegurar que todos los tokens están presentes
        const filteredSiteIds = sites.docs
          .filter(doc => searchTokens.every(token => doc.data().search_tokens.includes(token)))
          .map(doc => doc.id);
        setSiteResults(filteredSiteIds);

        // Procesar resultados de eventos
        const eventData = events.docs
          .filter(doc => searchTokens.every(token => doc.data().search_tokens.includes(token)))
          .map(doc => ({ id: doc.id, ...doc.data() }));

        // Ordenar eventos por relevancia (más tokens coincidentes primero)
        eventData.sort((a, b) => b.search_tokens.filter(t => searchTokens.includes(t)).length - a.search_tokens.filter(t => searchTokens.includes(t)).length);

        setEventResults(eventData);

        // Procesar y filtrar categorías
        const uniqueCategories = new Set();
        categories.forEach(doc => {
          const site = doc.data();
          if (site.category) {
            uniqueCategories.add(site.category);
          }
        });
        const matchingCategories = Array.from(uniqueCategories).filter(cat =>
          searchTokens.some(token => cat.toLowerCase().includes(token))
        );
        setCategoryResults(matchingCategories);

      } catch (err) {
        console.error("Error al buscar:", err);
        // Verificamos si el error es por un índice faltante en Firestore
        if (err.message && err.message.includes("indexes?create_composite")) {
          setError(
            <span>
              La búsqueda avanzada no está completamente configurada. Por favor, contacta al administrador.
              <a href={err.message.split(' ')[9]} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff', marginLeft: '5px' }}>Crear índice</a>
            </span>
          );
        }
        setError('Ocurrió un error al realizar la búsqueda.');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [q]);

  const totalResults = siteResults.length + eventResults.length + categoryResults.length;

  return (
    <div className="container search-results-container" style={{ padding: '20px' }}>
      <SEO
        title={`Resultados para "${q}"`}
        description={`Resultados de búsqueda para '${q}' en la guía turística de San Antonio Palopó.`}
        noIndex={true}
      />

      <h1>Resultados para: "{q}"</h1>

      {loading && <p>Buscando...</p>}

      {error && <p className="error-message">{error}</p>}

      {!loading && !error && totalResults > 0 && (
        <div className="search-results-wrapper">
          {/* --- Resultados de Sitios --- */}
          {siteResults.length > 0 && (
            <section className="results-section">
              <h2><MapPin size={22} style={{ marginRight: '8px' }} /> Sitios encontrados</h2>
              <SiteList siteIds={siteResults} />
            </section>
          )}

          {/* --- Resultados de Eventos --- */}
          {eventResults.length > 0 && (
            <section className="results-section">
              <h2><Calendar size={22} style={{ marginRight: '8px' }} /> Eventos relacionados</h2>
              <ul className="generic-results-list">
                {eventResults.map(event => (
                  <li key={event.id}>
                    <Link to={`/evento/${event.slug || event.id}`}>
                      {event.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* --- Resultados de Categorías --- */}
          {categoryResults.length > 0 && (
            <section className="results-section">
              <h2><Grid size={22} style={{ marginRight: '8px' }} /> Categorías relacionadas</h2>
              <ul className="generic-results-list">
                {categoryResults.map(category => (
                  <li key={category}>
                    <Link to={`/categoria/${createSlug(category)}`}>
                      {category}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {/* Caso Sin Resultados + Sugerencia */}
      {!loading && !error && totalResults === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '3rem 1rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '12px',
          marginTop: '2rem',
          border: '1px dashed #ccc'
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <SearchX size={48} color="#999" />
          </div>
          <h3 style={{ color: '#555', marginBottom: '10px' }}>No encontramos "{q}"</h3>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            ¿Crees que este lugar debería estar en nuestra guía?
          </p>

          <a
            href={SUGGEST_SITE_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#1e88e5',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '50px',
              textDecoration: 'none',
              fontWeight: 'bold',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <PlusCircle size={20} /> Sugerir agregar este sitio
          </a>
        </div>
      )}
    </div>
  );
}

export default SearchResults;