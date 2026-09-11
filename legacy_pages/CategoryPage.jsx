'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import SiteList from '../components/SiteList';
import { getCategoryNameFromSlug, createSlug } from '@/lib/slugUtils';

function CategoryPage({ categoryName: propSlug, initialSites, categoryTitle }) {
  const params = useParams();
  const slug = propSlug || params?.categoryName;
  const router = useRouter();

  // Estado para manejar el nombre real de la categoría
  const [realCategoryName, setRealCategoryName] = useState(
    categoryTitle || getCategoryNameFromSlug(slug)
  );
  const [loadingName, setLoadingName] = useState(!categoryTitle && !initialSites);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }

    if (categoryTitle && initialSites) {
      setRealCategoryName(categoryTitle);
      setLoadingName(false);
      return;
    }

    const matchCategory = async () => {
      // 1. Opción Rápida: Si el mapeo estático ya nos dio una respuesta válida (diferente al slug crudo)
      const mapped = getCategoryNameFromSlug(slug);

      // Comprobamos si el mapeo tuvo éxito (no es solo el slug con espacios)
      // OJO: getCategoryNameFromSlug devuelve "slug formateado" si falla.
      // ESTRATEGIA SEGURA: Si el mapeo devolvió algo que existe en nuestro diccionario, úsalo.
      // Pero como getCategoryNameFromSlug hace fallback, mejor intentamos siempre "verificar" si es una categoría desconocida.

      // Si el slug coincide con algo mapeado EXPLICITAMENTE en slugUtils (sabemos que está bien escrito), lo usamos.
      // Pero si no, buscamos en la DB para encontrar "Mi Categoría Nueva".

      try {
        setLoadingName(true);

        // Consultamos Firebase para buscar la categoría real
        // Traemos todos los sitios para extraer sus categorías (igual que hacen en CategoriesPage)
        const q = query(collection(db, 'sites'));
        const querySnapshot = await getDocs(q);

        const allCategories = new Set();
        querySnapshot.forEach(doc => {
          const d = doc.data();
          if (d.category) allCategories.add(d.category);
        });

        // Buscamos cuál de todas las categorías reales, al ser convertida a slug, coincide con el slug de la URL
        const found = Array.from(allCategories).find(cat => createSlug(cat) === slug);

        if (found) {
          setRealCategoryName(found);
        } else {
          // Si no se encuentra en la DB, usamos el mapeo o un fallback formateado
          setRealCategoryName(mapped !== slug ? mapped : slug.split('-').join(' '));
        }
      } catch (error) {
        console.error("Error buscando categoría dinámica:", error);
        // Fallback en caso de error
        setRealCategoryName(mapped !== slug ? mapped : slug.split('-').join(' '));
      } finally {
        setLoadingName(false);
      }
    };

    matchCategory();
  }, [slug]);

  if (loadingName) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div>
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          .desktop-volver-btn { display: none !important; }
        }
      `}} />
      
      {/* Encabezado con Botón Volver a la izquierda y Título Centrado */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '20px', marginBottom: '20px', padding: '0 20px' }}>
        {/* Botón Volver para PWA (Solo Escritorio) */}
        <button 
          className="desktop-volver-btn"
          onClick={() => router.back()} 
          style={{ 
            position: 'absolute',
            left: '20px',
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
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Volver
        </button>

        <h1 style={{ textTransform: 'capitalize', margin: 0, textAlign: 'center' }}>
          {realCategoryName}
        </h1>
      </div>

      <SiteList categoryName={realCategoryName} initialSites={initialSites} />
    </div>
  );
}

export default CategoryPage;