import { getCollectionREST, queryCollectionREST } from '@/lib/firestoreREST';
import { normalizeImagePaths } from '@/lib/helpers';
import { createSlug } from '@/lib/slugUtils';
import { notFound } from 'next/navigation';
import SiteDetailClient from '@/components/SiteDetailClient';

// ─── ISR: caché permanente + revalidación manual vía /api/revalidate ─────────
export const revalidate = false;
// Permite URLs con slugs no pre-generados (se generan en la 1ra visita)
export const dynamicParams = true;

/**
 * generateMetadata — SE EJECUTA EN EL SERVIDOR.
 * El crawler de WhatsApp/Facebook/Google recibe el HTML con og:image y description
 * ya listos. Esto es exactamente el beneficio del SEO de Next.js sobre la SPA.
 */
export async function generateMetadata({ params }) {
  const { slug } = await params;

  // Buscar por slug
  const sites = await queryCollectionREST('sites', 'slug', '==', slug);
  let data = (sites && sites.length > 0) ? sites[0] : null;

  // Fallback: buscar por ID
  if (!data) {
    const { getDocumentREST } = await import('@/lib/firestoreREST');
    data = await getDocumentREST('sites', slug);
  }

  if (!data) return { title: 'Sitio no encontrado' };

  // Limpiar HTML de la descripción para meta tags
  const description = (data.description || data.description_es || '')
    .replace(/<[^>]*>/g, '')
    .trim()
    .substring(0, 155);

  // ─── Punto 1: normalizar imagePaths legacy → string ───────────────────────
  const imageUrls = normalizeImagePaths(data.imagePaths || []);
  const mainImage = imageUrls[0] || null;

  const categorySlug = createSlug(data.categorySlug || data.category || 'general');
  const finalSlug = createSlug(data.slug || data.id);

  return {
    title: data.name,
    description: description || `Descubre ${data.name} en San Antonio Palopó, Lago Atitlán.`,
    openGraph: {
      title: data.name,
      description,
      images: mainImage
        ? [{ url: mainImage, width: 1200, height: 630, alt: data.name }]
        : [],
      type: 'article',
      locale: 'es_GT',
    },
    twitter: {
      card: 'summary_large_image',
      title: data.name,
      description,
      images: mainImage ? [mainImage] : [],
    },
    alternates: {
      canonical: `/categoria/${categorySlug}/${finalSlug}`,
    },
  };
}

/**
 * generateStaticParams — Pre-genera los slugs más importantes en build time.
 * El resto se genera en la primera visita (dynamicParams = true).
 */
export async function generateStaticParams() {
  try {
    const sites = await getCollectionREST('sites');
    return sites
      .map((d) => ({
        categoryName: createSlug(d.categorySlug || d.category || 'general'),
        slug: createSlug(d.slug || d.id),
      }))
      .filter((p) => p.slug);
  } catch {
    return [];
  }
}

/**
 * Page — Server Component.
 * Obtiene datos de Firestore en el servidor, los serializa y los pasa al Client Component.
 */
export default async function SiteDetailPage({ params }) {
  const { slug } = await params;

  let siteData = null;

  try {
    // Buscar por slug
    const sites = await queryCollectionREST('sites', 'slug', '==', slug);

    if (sites && sites.length > 0) {
      siteData = sites[0];
    } else {
      // Fallback: buscar por ID
      const { getDocumentREST } = await import('@/lib/firestoreREST');
      siteData = await getDocumentREST('sites', slug);
    }

    if (siteData) {
      // ─── Punto 1: normalizar imagePaths (legacy objects → strings) ──────
      siteData.imageUrls = normalizeImagePaths(siteData.imagePaths || []);
    }
  } catch (err) {
    // console.error('[SiteDetailPage] Error al obtener sitio:', err);
  }

  if (!siteData) notFound();

  const cleanDescription = (siteData.description || siteData.description_es || '')
    .replace(/<[^>]*>/g, '')
    .trim();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': siteData.parentCategory === 'Servicios y Logística' ? 'LocalBusiness' : 'TouristAttraction',
    name: siteData.name,
    description: cleanDescription,
    image: siteData.imageUrls && siteData.imageUrls.length > 0 ? siteData.imageUrls : undefined,
    url: `https://turismosanantoniopalopo.com/categoria/${createSlug(siteData.category || 'general')}/${createSlug(siteData.slug || siteData.id)}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'San Antonio Palopó',
      addressRegion: 'Sololá',
      addressCountry: 'GT',
    },
    ...(siteData.coordinates && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: siteData.coordinates.latitude || siteData.coordinates._latitude || siteData.coordinates.lat,
        longitude: siteData.coordinates.longitude || siteData.coordinates._longitude || siteData.coordinates.lng,
      },
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteDetailClient site={siteData} />
    </>
  );
}
