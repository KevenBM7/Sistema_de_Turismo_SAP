import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import SiteList from '../components/SiteList';
import { getCategoryNameFromSlug, createSlug } from '../utils/slugUtils';

function CategoryPage() {
  const { categoryName: slug } = useParams();

  // Estado para manejar el nombre real de la categoría
  const [realCategoryName, setRealCategoryName] = useState(getCategoryNameFromSlug(slug));
  const [loadingName, setLoadingName] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);

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
      <h1 style={{ textTransform: 'capitalize', textAlign: 'center' }}>
        {realCategoryName}
      </h1>

      <SiteList categoryName={realCategoryName} />
    </div>
  );
}

export default CategoryPage;