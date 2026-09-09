'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createSlug } from '@/lib/slugUtils';
import { collection, getDocs } from 'firebase/firestore/lite'; // Usamos Lite para mejor rendimiento
import { db } from '@/lib/firebase';
import SEO from '../components/SEO';
import SiteList from '../components/SiteList';
import { SearchX, PlusCircle, Grid, Calendar, MapPin } from 'lucide-react'; // Iconos
import SearchBar from '../components/SearchBar';
import '../components/FloatingSearchButton.css'; // Estilos para la barra de búsqueda

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
      const searchTerm = q.toLowerCase().trim();

      // Dividir el término de búsqueda en palabras (tokens) para búsqueda "Y" (AND)
      const searchTokens = searchTerm.split(/\s+/).filter(token => token.length > 0);

      if (searchTokens.length === 0) {
        setLoading(false);
        return;
      }

      try {
        // --- Búsqueda en cliente (más efectiva sin índices complejos) ---
        // Traemos todo y filtramos aquí. Para un app de este tamaño es perfectamente viable y rápido.
        const [sitesSnap, eventsSnap] = await Promise.all([
          getDocs(collection(db, 'sites')),
          getDocs(collection(db, 'events'))
        ]);

        const allSites = sitesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const allEvents = eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Función auxiliar para limpiar texto de HTML
        const stripHtml = (html) => {
          if (!html) return "";
          const tmp = document.createElement("DIV");
          tmp.innerHTML = html;
          return (tmp.textContent || tmp.innerText || "").toLowerCase();
        };

        // --- FILTRADO DE SITIOS ---
        const filteredSites = allSites.filter(site => {
          const name = (site.name || "").toLowerCase();
          const desc = stripHtml(site.description || site.description_es || "");
          const cat = (site.category || "").toLowerCase();

          // Verificamos que TODOS los tokens de búsqueda estén presentes en algún campo
          return searchTokens.every(token =>
            name.includes(token) || desc.includes(token) || cat.includes(token)
          );
        });

        // --- FILTRADO DE EVENTOS ---
        const filteredEvents = allEvents.filter(event => {
          const title = (event.title || "").toLowerCase();
          const desc = stripHtml(event.description || "");

          return searchTokens.every(token =>
            title.includes(token) || desc.includes(token)
          );
        });

        // --- FILTRADO DE CATEGORÍAS ---
        // Extraemos categorías únicas de los sitios encontrados O de todos los sitios si coinciden con el token
        const uniqueCategories = new Set();
        allSites.forEach(site => {
          if (site.category) uniqueCategories.add(site.category);
        });

        const matchingCategories = Array.from(uniqueCategories).filter(cat =>
          searchTokens.some(token => cat.toLowerCase().includes(token))
        );

        setSiteResults(filteredSites.map(s => s.id));
        setEventResults(filteredEvents);
        setCategoryResults(matchingCategories);

      } catch (err) {
        console.error("Error al buscar:", err);
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

      <div style={{ marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem auto' }}>
        <SearchBar />
      </div>

      <h1>Resultados para: "{q}"</h1>

      {loading && <p>Buscando...</p>}

      {error && <p className="error-message">{error}</p>}

      {!loading && !error && totalResults > 0 && (
        <div className="search-results-wrapper">
          {/* --- Resultados de Sitios --- */}
          {siteResults.length > 0 && (
            <section className="results-section">
              <h2><MapPin size={22} style={{ marginRight: '8px' }} /> Sitios encontrados ({siteResults.length})</h2>
              <SiteList siteIds={siteResults} />
            </section>
          )}

          {/* --- Resultados de Eventos --- */}
          {eventResults.length > 0 && (
            <section className="results-section">
              <h2><Calendar size={22} style={{ marginRight: '8px' }} /> Eventos relacionados ({eventResults.length})</h2>
              <ul className="generic-results-list">
                {eventResults.map(event => (
                  <li key={event.id}>
                    <Link href={`/evento/${event.slug || event.id}`}>
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
                    <Link href={`/categoria/${createSlug(category)}`}>
                      {category}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {/* Caso: Si no hay SITIOS específicos, mostrar sugerencia (incluso si hay categorías) */}
      {!loading && !error && siteResults.length === 0 && (
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
          {/* Mensaje dinámico dependiendo de si se encontró ALGO o NADA */}
          <h3 style={{ color: '#555', marginBottom: '10px' }}>
            {totalResults === 0 ? `No encontramos "${q}"` : `¿No encuentras el lugar específico?`}
          </h3>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Si estás buscando un sitio que no aparece aquí, ¡ayúdanos a mejorarlo!
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