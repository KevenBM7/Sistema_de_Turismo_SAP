import { createSlug } from '@/lib/slugUtils';

/**
 * Sitemap dinámico generado automáticamente por Next.js.
 * Se accede en: /sitemap.xml
 */

export const revalidate = 900; // 15 minutos

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'turismo-municipal';

// Función helper para obtener datos de Firestore vía REST API (más estable en SSR)
async function fetchCollectionREST(collectionName) {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionName}?pageSize=1000`;
    const res = await fetch(url, { next: { revalidate: 900 } });
    
    if (!res.ok) {
      console.warn(`[Sitemap] Falló fetch a ${collectionName}: ${res.status}`);
      return [];
    }
    
    const data = await res.json();
    if (!data.documents) return [];
    
    return data.documents.map(doc => {
      const fields = doc.fields || {};
      const id = doc.name.split('/').pop();
      
      const extract = (field) => {
        if (!field) return null;
        if (field.stringValue !== undefined) return field.stringValue;
        if (field.timestampValue !== undefined) return field.timestampValue;
        return null;
      };

      return {
        id,
        slug: extract(fields.slug),
        category: extract(fields.category),
        categorySlug: extract(fields.categorySlug),
        createdAt: extract(fields.createdAt),
        lastmod: extract(fields.lastmod)
      };
    });
  } catch (error) {
    console.error(`[Sitemap] Error en ${collectionName}:`, error);
    return [];
  }
}

export default async function sitemap() {
  const baseUrl = 'https://turismosanantoniopalopo.com';

  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/categorias`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/eventos`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/mapa`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/historia`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/acerca-de`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/privacidad`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/terminos`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];

  try {
    const sites = await fetchCollectionREST('sites');
    const events = await fetchCollectionREST('events');

    // ─── Sitios turísticos ─────────────────────────────────────────────
    const siteEntries = sites
      .filter(data => (data.slug || data.id) && (data.category || data.categorySlug))
      .map((data) => {
        // Forzamos slugify para evitar espacios en URLs
        const categorySlug = createSlug(data.categorySlug || data.category || 'general');
        const siteSlug = createSlug(data.slug || data.id);
        const lastModDate = data.lastmod || data.createdAt ? new Date(data.lastmod || data.createdAt) : new Date();

        return {
          url: `${baseUrl}/categoria/${categorySlug}/${siteSlug}`,
          lastModified: lastModDate,
          changeFrequency: 'weekly',
          priority: 0.8,
        };
      });

    // ─── Categorías únicas ────────────────────────────────────────────
    const categorySet = new Set();
    sites.forEach((data) => {
      if (data.category) categorySet.add(data.category);
    });

    const categoryEntries = Array.from(categorySet).map((cat) => ({
      url: `${baseUrl}/categoria/${createSlug(cat)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    // ─── Eventos ──────────────────────────────────────────────────────
    const eventEntries = events
      .filter(data => (data.slug || data.id))
      .map((data) => {
        const eventSlug = createSlug(data.slug || data.id);
        const lastModDate = data.lastmod || data.createdAt ? new Date(data.lastmod || data.createdAt) : new Date();

        return {
          url: `${baseUrl}/evento/${eventSlug}`,
          lastModified: lastModDate,
          changeFrequency: 'weekly',
          priority: 0.7,
        };
      });

    // Combinar y eliminar duplicados por URL
    const allEntries = [...staticPages, ...categoryEntries, ...siteEntries, ...eventEntries];
    const uniqueEntries = Array.from(
      new Map(allEntries.map((item) => [item.url, item])).values()
    );

    return uniqueEntries;
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return staticPages;
  }
}
