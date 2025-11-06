import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import SiteList from '../components/SiteList';

function SearchResults() {
  const [searchParams] = useSearchParams();
  const [siteIds, setSiteIds] = useState([]);
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
      try {
        const sitesRef = collection(db, 'sites');
        const searchTerm = q.toLowerCase();

        // Consulta 1: Buscar por nombre del sitio (insensible a mayúsculas/minúsculas)
        const nameQuery = query(
          sitesRef,
          where('name_lowercase', '>=', searchTerm),
          where('name_lowercase', '<=', searchTerm + '\uf8ff')
        );

        // Consulta 2: Buscar por nombre de la categoría (insensible a mayúsculas/minúsculas)
        const categoryTerm = searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1);
        const categoryQuery = query(
          sitesRef,
          where('category', '>=', categoryTerm),
          where('category', '<=', categoryTerm + '\uf8ff')
        );

        // Ejecutar ambas consultas en paralelo
        const [nameSnapshot, categorySnapshot] = await Promise.all([
          getDocs(nameQuery),
          getDocs(categoryQuery)
        ]);

        const ids = new Set([...nameSnapshot.docs.map(doc => doc.id), ...categorySnapshot.docs.map(doc => doc.id)]);
        setSiteIds(Array.from(ids));
      } catch (err) {
        console.error("Error al buscar:", err);
        setError('Ocurrió un error al realizar la búsqueda.');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [q]);

  return (
    <div className="container search-results-container">
      <h1>Resultados para: "{q}"</h1>
      {loading && <p>Buscando...</p>}
      {error && <p className="error-message">{error}</p>}
      {!loading && !error && (
        siteIds.length > 0 ? <SiteList siteIds={siteIds} /> : <p>No se encontraron sitios que coincidan con tu búsqueda.</p>
      )}
    </div>
  );
}

export default SearchResults;