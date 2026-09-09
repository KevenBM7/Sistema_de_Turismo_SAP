import GroupedCategoriesPage from '@/components/GroupedCategoriesPage';

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

export default function Page() { 
  return <GroupedCategoriesPage />; 
}