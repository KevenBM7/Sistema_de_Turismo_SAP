import React from 'react';
import { useParams, Link } from 'react-router-dom';
import SiteList from '../components/SiteList';

function CategoryDetailPage() {
  const { categoryName } = useParams();
  const decodedCategoryName = decodeURIComponent(categoryName);

  return (
    <div>
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