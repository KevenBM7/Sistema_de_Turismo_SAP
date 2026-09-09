import { normalizeImagePaths } from '@/lib/helpers';
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
  let upcomingEvents = [];

  try {
    const data = await getSmartDocument('settings', 'homePage');
    if (data) {
      const imageUrls = normalizeImagePaths(data.imagePaths || []);
      homePageData = { ...data, imageUrls };
    }

    const sites = await getSmartCollection('sites');
    const groups = {};
    sites.forEach((site) => {
      if (site.parentCategory && site.category) {
        if (!groups[site.parentCategory]) groups[site.parentCategory] = new Set();
        groups[site.parentCategory].add(site.category);
      }
    });
    Object.keys(groups).forEach((k) => {
      categories[k] = Array.from(groups[k]).sort();
    });

    const today = new Date().toISOString().split('T')[0];
    const events = await getSmartCollection('events');
    upcomingEvents = events
      .filter((e) => (e.endDate ? e.endDate >= today : e.startDate >= today))
      .sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''))
      .slice(0, 10);
  } catch (err) {
    console.error('[HomePage] Error fetching data:', err);
  }

  return (
    <HomeClient
      homePageData={homePageData}
      groupedCategories={categories}
      upcomingEvents={upcomingEvents}
    />
  );
}
