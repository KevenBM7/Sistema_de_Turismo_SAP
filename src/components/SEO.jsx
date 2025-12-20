import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ 
  title, 
  description, 
  image, 
  url, 
  type = 'website',
  keywords,
  author = 'Municipalidad de San Antonio Palopó',
  publishedTime,
  modifiedTime,
  noIndex = false,
  jsonLd
}) => {
  const baseUrl = 'https://turismosanantoniopalopo.com';
  const fullUrl = url ? `${baseUrl}${url}` : baseUrl;
  
  // Asegurar URL absoluta de imagen con fallback inteligente
  let fullImage;
  if (image && (image.startsWith('http://') || image.startsWith('https://'))) {
    // Si ya es URL absoluta, usarla
    fullImage = image;
  } else if (image) {
    // Si es relativa, completarla
    fullImage = `${baseUrl}${image}`;
  } else {
    // Fallback: siempre usar og-image.jpg para consistencia
    fullImage = `${baseUrl}/og-image.jpg`;
  }
  
  const defaultTitle = 'Turismo en San Antonio Palopó | Lago Atitlán';
  const fullTitle = title ? `${title} | Turismo San Antonio Palopó` : defaultTitle;
  
  const defaultDescription = 'Descubre la belleza, cultura y tradiciones de San Antonio Palopó, a orillas del Lago Atitlán.';
  const finalDescription = description || defaultDescription;

  return (
    <Helmet>
      {/* --- Estándar HTML --- */}
      <title>{fullTitle}</title>
      <meta name="description" content={finalDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="author" content={author} />
      <link rel="canonical" href={fullUrl} />
      
      {/* --- Control de Indexación --- */}
      {noIndex && <meta name="robots" content="noindex, follow" />}

      {/* --- Facebook / WhatsApp (Open Graph) --- */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:image:secure_url" content={fullImage} />
      <meta property="og:image:type" content="image/jpeg" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={fullTitle} />
      <meta property="og:site_name" content="Turismo San Antonio Palopó" />
      <meta property="og:locale" content="es_GT" />
      
      {/* Meta adicional para forzar actualización en WhatsApp */}
      <meta property="og:updated_time" content={new Date().toISOString()} />

      {/* --- Artículos (Blog/Noticias) --- */}
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}

      {/* --- Twitter Card --- */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={fullImage} />
      <meta name="twitter:image:alt" content={fullTitle} />

      {/* --- Inyección de Datos Estructurados (JSON-LD) --- */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;