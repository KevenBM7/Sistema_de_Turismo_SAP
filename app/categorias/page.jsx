import CategoryCard from '@/components/CategoryCard';
import '@/components/CategoryCard.css';
import { getSmartCollection } from '@/lib/smartCache';
import { normalizeImagePath } from '@/lib/helpers';

export const revalidate = 300; // 5 minutos

export const metadata = {
  title: 'Categorías Turísticas | San Antonio Palopó',
  description: 'Explora San Antonio Palopó por categorías: Hoteles, Restaurantes, Cultura y más.',
  openGraph: {
    title: 'Categorías - Turismo San Antonio Palopó',
    description: 'Encuentra todo lo que buscas en San Antonio Palopó.',
    images: ['/LogoTurismo.png'],
  },
  alternates: {
    canonical: '/categorias',
  }
};

const parentCategoryTitles = {
  "Atracciones y Cultura": "Descubre lo Imprescindible",
  "Servicios y Logística": "Tu Base de Viaje",
  "Movilidad y Transporte": "Movilidad y Transporte",
};

const displayOrder = ["Atracciones y Cultura", "Servicios y Logística", "Movilidad y Transporte"];

export default async function CategoriesPage() {
  const sites = await getSmartCollection('sites');
  const groups = {};
  const categoryImages = {};

  (sites || []).forEach((site) => {
    if (site.parentCategory && site.category) {
      if (!groups[site.parentCategory]) {
        groups[site.parentCategory] = new Set();
      }
      groups[site.parentCategory].add(site.category);

      if (!categoryImages[site.category] && site.imagePaths && site.imagePaths.length > 0) {
        categoryImages[site.category] = normalizeImagePath(site.imagePaths[0]);
      }
    }
  });

  const groupedCategories = {};
  Object.keys(groups).forEach((parentCat) => {
    groupedCategories[parentCat] = Array.from(groups[parentCat]).sort();
  });

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '2rem', color: '#1f2937' }}>
        Categorías Turísticas
      </h1>
      {displayOrder.map((parentCat) => (
        groupedCategories[parentCat] && (
          <section key={parentCat} className="home-section" style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ marginBottom: '1.25rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem', color: '#2563eb' }}>
              {parentCategoryTitles[parentCat] || parentCat}
            </h2>
            <div className="category-grid">
              {groupedCategories[parentCat].map((subCat) => (
                <CategoryCard 
                  key={subCat} 
                  categoryName={subCat}
                  imageUrl={categoryImages[subCat]} 
                />
              ))}
            </div>
          </section>
        )
      ))}
    </div>
  );
}