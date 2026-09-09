'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import CategoryCard from '../components/CategoryCard';
import SEO from '../components/SEO'; // Importación de SEO
import '../components/CategoryCard.css';


import { useRouter } from 'next/navigation';

// Mapeo de los nombres de backend a los títulos que se mostrarán
const parentCategoryTitles = {
  "Atracciones y Cultura": "Descubre lo Imprescindible",
  "Servicios y Logística": "Tu Base de Viaje",
  "Movilidad y Transporte": "Movilidad y Transporte",
};

// Orden deseado para mostrar las categorías principales
const displayOrder = ["Atracciones y Cultura", "Servicios y Logística", "Movilidad y Transporte"];

function CategoriesPage() {
  const router = useRouter();
  const [groupedCategories, setGroupedCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAndGroupCategories = async () => {
      try {
        const sitesQuery = query(collection(db, 'sites'));
        const querySnapshot = await getDocs(sitesQuery);
        
        const groups = {};
        querySnapshot.forEach((doc) => {
          const site = doc.data();
          if (site.parentCategory && site.category) {
            if (!groups[site.parentCategory]) {
              groups[site.parentCategory] = new Set();
            }
            groups[site.parentCategory].add(site.category);
          }
        });

        // Convertir los Sets a Arrays y ordenarlos alfabéticamente
        Object.keys(groups).forEach(parentCat => {
          groups[parentCat] = Array.from(groups[parentCat]).sort();
        });

        setGroupedCategories(groups);
      } catch (err) {
        console.error("Error al agrupar categorías:", err);
        setError("No se pudieron cargar las categorías.");
      } finally {
        setLoading(false);
      }
    };

    fetchAndGroupCategories();
  }, []);

  if (loading) {
    return <p>Cargando categorías...</p>;
  }

  if (error) {
    return <p className="error-message">Error al cargar las categorías.</p>;
  }

  return (
    <div>
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          .desktop-volver-btn { display: none !important; }
        }
      `}} />

      {/* --- SEO para la Página de Categorías --- */}
      <SEO 
        title="Sitios por Categoría"
        description="Explora todos los sitios turísticos de San Antonio Palopó organizados por categoría: atracciones, hoteles, restaurantes, transporte y más."
        url="/categorias"
        keywords="categorías, atracciones, hoteles, restaurantes, servicios, san antonio palopó"
      />

      {/* Encabezado con Botón Volver a la izquierda y Título Centrado */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '20px', marginBottom: '20px', padding: '0 20px' }}>
        {/* Botón Volver para PWA (Solo Escritorio) */}
        <button 
          className="desktop-volver-btn"
          onClick={() => router.back()} 
          style={{ 
            position: 'absolute',
            left: '20px', // Alineado con el padding visual
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

        <h1 style={{ margin: 0 }}>Categorías</h1>
      </div>
      {displayOrder.map(parentCat => (
        groupedCategories[parentCat] && (
          <section key={parentCat} className="home-section">
            <h2>{parentCategoryTitles[parentCat] || parentCat}</h2>
            <div className="category-grid">
              {groupedCategories[parentCat].map(subCat => (
                <CategoryCard key={subCat} categoryName={subCat} />
              ))}
            </div>
          </section>
        )
      ))}
    </div>
  );
}

export default CategoriesPage;