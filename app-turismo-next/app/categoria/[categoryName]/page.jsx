import { getCategoryNameFromSlug } from '@/lib/slugUtils';
import CategoryPage from '@/legacy_pages/CategoryPage';

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
  return <CategoryPage categoryName={categoryName} />;
}