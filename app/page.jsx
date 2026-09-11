import ReactDOM from 'react-dom';
import { normalizeImagePaths, normalizeImagePath } from '@/lib/helpers';
import { getSmartCollection, getSmartDocument } from '@/lib/smartCache';
import HomeClient from '@/components/HomeClient';

export const revalidate = 60;

export const metadata = {
  title: 'Turismo en San Antonio Palopó | Lago Atitlán',
  description:
    'Guía turística oficial de San Antonio Palopó. Hoteles, restaurantes, cultura y atracciones a orillas del Lago Atitlán, Guatemala.',
  openGraph: {
    title: 'Turismo en San Antonio Palopó | Lago Atitlán',
    description: 'Guía turística oficial de San Antonio Palopó.',
    type: 'website',
    locale: 'es_GT',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'San Antonio Palopó, Atitlán',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/og-image.jpg'],
  },
  alternates: {
    canonical: '/',
  },
};

export default async function HomePage() {
  let homePageData = { welcomeText: 'Bienvenido', subText: '', imageUrls: [] };
  let categories = {};
  let categoryInfo = {};
  let upcomingEvents = [];
  let featuredSites = [];

  try {
    const data = await getSmartDocument('settings', 'homePage');
    if (data) {
      const imageUrls = normalizeImagePaths(data.imagePaths || []);
      homePageData = { ...data, imageUrls };
    }

    const sites = await getSmartCollection('sites');
    const groups = {};
    const sitesByCategory = {};

    sites.forEach((site) => {
      if (site.parentCategory && site.category) {
        if (!groups[site.parentCategory]) groups[site.parentCategory] = new Set();
        groups[site.parentCategory].add(site.category);
      }

      if (site.category) {
        if (!categoryInfo[site.category]) {
          categoryInfo[site.category] = {
            count: 0,
            imageUrl: null,
          };
        }
        categoryInfo[site.category].count += 1;

        if (!categoryInfo[site.category].imageUrl && site.imagePaths && site.imagePaths.length > 0) {
          categoryInfo[site.category].imageUrl = normalizeImagePath(site.imagePaths[0]);
        }
      }

      if (site.category && site.parentCategory !== 'Movilidad y Transporte') {
        if (!sitesByCategory[site.category]) sitesByCategory[site.category] = [];
        sitesByCategory[site.category].push(site);
      }
    });

    Object.keys(groups).forEach((k) => {
      categories[k] = Array.from(groups[k]).sort();
    });

    // Seleccionar hasta 9 sitios representativos (uno por categoría) en el servidor
    const categoryKeys = Object.keys(sitesByCategory).sort(() => Math.random() - 0.5);
    for (const cat of categoryKeys) {
      if (featuredSites.length >= 9) break;
      const list = sitesByCategory[cat];
      const selected = list[Math.floor(Math.random() * list.length)];
      if (selected) {
        featuredSites.push({
          id: selected.id,
          name: selected.name,
          slug: selected.slug,
          category: selected.category,
          description: selected.description || selected.description_es || '',
          imageUrl: normalizeImagePath(selected.imagePaths?.[0]) || 'https://placehold.co/400x225/EEE/31343C?text=Sin+Imagen'
        });
      }
    }

    const today = new Date().toISOString().split('T')[0];
    const events = await getSmartCollection('events');
    const futureEvents = (events || [])
      .filter((e) => (e.endDate ? e.endDate >= today : e.startDate >= today))
      .sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));

    // Si hay eventos futuros los mostramos; si no, mostramos los eventos registrados para que la agenda siempre esté visible
    upcomingEvents = futureEvents.length > 0
      ? futureEvents.slice(0, 10)
      : (events || [])
          .sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''))
          .slice(0, 10);
  } catch (err) {
    console.error('[HomePage] Error fetching data:', err);
  }

  if (homePageData.imageUrls && homePageData.imageUrls.length > 0) {
    ReactDOM.preload(homePageData.imageUrls[0], { as: 'image', fetchPriority: 'high' });
  }

  return (
    <HomeClient
      homePageData={homePageData}
      groupedCategories={categories}
      categoryInfo={categoryInfo}
      upcomingEvents={upcomingEvents}
      featuredSites={featuredSites}
    />
  );
}
