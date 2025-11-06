import React, { useState, useEffect } from "react";
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import CategoryCard from '../components/CategoryCard';

// Mapeo de los nombres de backend a los títulos que se mostrarán
const parentCategoryTitles = {
  "Atracciones y Cultura": "Descubre lo Imprescindible",
  "Servicios y Logística": "Tu Base de Viaje",
  "Movilidad y Transporte": "Movilidad y Transporte",
};

// Orden deseado para mostrar las categorías principales
const displayOrder = ["Atracciones y Cultura", "Servicios y Logística", "Movilidad y Transporte"];

function GroupedCategoriesPage() {
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
      <h1 style={{ textAlign: 'center' }}>Categorías</h1>
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

export default GroupedCategoriesPage;