import { getCategoryNameFromSlug, createSlug } from '@/lib/slugUtils';
import { getSmartCollection } from '@/lib/smartCache';
import { normalizeImagePath } from '@/lib/helpers';
import CategoryPage from '@/legacy_pages/CategoryPage';

export const revalidate = 300; // 5 minutos

export async function generateMetadata({ params }) {
  const { categoryName } = await params;
  const name = getCategoryNameFromSlug(categoryName);
  
  return {
    title: `${name} | San Antonio Palopó`,
    description: `Explora los mejores sitios de ${name} en San Antonio Palopó, Lago Atitlán.`,
    openGraph: {
      title: `${name} - Turismo San Antonio Palopó`,
      description: `Descubre ${name} en el Lago Atitlán.`,
      images: ['/LogoTurismo.png'],
    },
    alternates: {
      canonical: `/categoria/${categoryName}`,
    }
  };
}

export default async function Page({ params }) {
  const { categoryName } = await params;
  const allSites = await getSmartCollection('sites');

  let realCategoryName = getCategoryNameFromSlug(categoryName);
  const matchingSites = [];

  (allSites || []).forEach((site) => {
    const siteCatSlug = createSlug(site.categorySlug || site.category || '');
    if (siteCatSlug === categoryName) {
      if (site.category) realCategoryName = site.category;
      matchingSites.push({
        id: site.id,
        name: site.name,
        slug: site.slug,
        category: site.category,
        description: site.description || site.description_es || '',
        imageUrl: normalizeImagePath(site.imagePaths?.[0]) || 'https://placehold.co/400x225/EEE/31343C?text=Sin+Imagen'
      });
    }
  });

  return (
    <CategoryPage 
      categoryName={categoryName}
      categoryTitle={realCategoryName}
      initialSites={matchingSites}
    />
  );
}