import React from 'react';
import { useParams } from 'react-router-dom';
import SiteList from '../components/SiteList';

function CategoryPage() {
  // Obtenemos el nombre de la categoría desde la URL
  const { categoryName } = useParams();

  return (
    <div>
      <h1 style={{ textTransform: 'capitalize', textAlign: 'center' }}>{categoryName}</h1>
      
      {/* Reutilizamos SiteList, pasándole la categoría para que filtre los resultados */}
      <SiteList categoryName={categoryName} />
    </div>
  );
}

export default CategoryPage;