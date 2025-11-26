// src/components/SEO.jsx
// Componente para agregar meta tags dinámicos en cada página

import React from 'react';

const SEO = ({ 
  title, 
  description, 
  image, 
  url, 
  type = 'website',
  keywords,
  author = 'Municipalidad de San Antonio Palopó',
  publishedTime,
  modifiedTime
}) => {
  const baseUrl = 'https://turismosanantoniopalopo.com';
  const fullUrl = url ? `${baseUrl}${url}` : baseUrl;
  const fullImage = image || `${baseUrl}/og-image.jpg`;
  const defaultTitle = 'Turismo en San Antonio Palopó | Lago Atitlán';
  const fullTitle = title ? `${title} | Turismo San Antonio Palopó` : defaultTitle;
  const defaultDescription = 'Descubre la belleza y cultura de San Antonio Palopó, a orillas del Lago Atitlán';
  const finalDescription = description || defaultDescription;

  return (
    <>
      {/* Title y Description */}
      <title>{fullTitle}</title>
      <meta name="description" content={finalDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="author" content={author} />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="Turismo San Antonio Palopó" />
      <meta property="og:locale" content="es_GT" />

      {/* Article específico */}
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={fullImage} />
    </>
  );
};

export default SEO;

// EJEMPLO DE USO:
/*
import SEO from '../components/SEO';

function AboutPage() {
  return (
    <>
      <SEO 
        title="Sobre Nosotros"
        description="Conoce la historia y misión de nuestra guía turística de San Antonio Palopó"
        url="/sobre-nosotros"
        keywords="sobre nosotros, san antonio palopó, turismo local"
      />
      <div>
        <h1>Sobre Nosotros</h1>
        ...contenido...
      </div>
    </>
  );
}
*/