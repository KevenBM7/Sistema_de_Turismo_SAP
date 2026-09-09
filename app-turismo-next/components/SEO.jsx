'use client';
import React, { useEffect } from 'react';

// NOTA: En Next.js App Router, el SEO se gestiona mediante la API de 'metadata' 
// en los archivos page.jsx o layout.jsx (Server Components).
// Este componente legacy se mantiene como un "shell" vacío para no romper las imports,
// pero el SEO real ahora vive en los metadatos de las páginas.

const SEO = ({ 
  title, 
  description, 
  url, 
}) => {
  useEffect(() => {
    if (title) {
      document.title = title.includes('|') ? title : `${title} | Turismo San Antonio Palopó`;
    }
    if (description) {
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', description);
    }
  }, [title, description]);

  return null; 
};

export default SEO;