import React from 'react';
import { useParams, Link } from 'react-router-dom';
import SiteList from '../components/SiteList';
import SEO from '../components/SEO'; // Importación de SEO

function CategoryDetailPage() {
  const { categoryName } = useParams();
  const decodedCategoryName = decodeURIComponent(categoryName);

  return (
    <div>
      {/* --- SEO para el Detalle de Categoría --- */}
      <SEO 
        title={`Sitios en la categoría: ${decodedCategoryName}`}
        description={`Descubre todos los lugares y servicios en la categoría de ${decodedCategoryName} en San Antonio Palopó.`}
        url={`/categoria/${categoryName}`}
        keywords={`${decodedCategoryName}, ${categoryName}, categoría, turismo, san antonio palopó`}
      />

      <Link to="/categorias" className="back-link">&larr; Volver a Categorías</Link>
      <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2>{decodedCategoryName}</h2>
        <p>Descubre todos los lugares en esta categoría.</p>
      </header>
      <SiteList categoryFilter={decodedCategoryName} />
    </div>
  );
}

export default CategoryDetailPage;