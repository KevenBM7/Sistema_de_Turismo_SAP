
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

const DOMAIN = 'https://turismosanantoniopalopo.com';

export const generateSitemap = async () => {
  try {
    const sitesSnapshot = await getDocs(collection(db, 'sites'));
    
    const urls = [
      // URLs estáticas
      { loc: DOMAIN, priority: '1.0', changefreq: 'weekly' },
      { loc: `${DOMAIN}/mapa`, priority: '0.9', changefreq: 'weekly' },
      { loc: `${DOMAIN}/sobre-nosotros`, priority: '0.8', changefreq: 'monthly' },
      { loc: `${DOMAIN}/contacto`, priority: '0.7', changefreq: 'monthly' },
    ];

    // Agregar todas las páginas de sitios turísticos
    sitesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const slug = data.slug || doc.id;
      const category = data.category || 'sitio';
      
      urls.push({
        loc: `${DOMAIN}/${encodeURIComponent(category)}/${encodeURIComponent(slug)}`,
        priority: '0.8',
        changefreq: 'weekly',
        lastmod: data.updatedAt?.toDate().toISOString().split('T')[0] || new Date().toISOString().split('T')[0]
      });
    });

    // Generar XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod || new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    return xml;
  } catch (error) {
    console.error('Error generando sitemap:', error);
    return null;
  }
};

// Función para descargar el sitemap
export const downloadSitemap = async () => {
  const xml = await generateSitemap();
  if (!xml) {
    alert('Error al generar el sitemap');
    return;
  }

  const blob = new Blob([xml], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sitemap.xml';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  console.log('✅ Sitemap generado. Súbelo a /public/sitemap.xml');
};

// Para usar en modo desarrollo/admin
// import { downloadSitemap } from './utils/generateSitemap';
// <button onClick={downloadSitemap}>Generar Sitemap</button>