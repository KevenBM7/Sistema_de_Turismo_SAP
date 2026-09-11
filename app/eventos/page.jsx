import { getCollectionREST } from '@/lib/firestoreREST';
import CalendarPage from '@/legacy_pages/CalendarPage';
import { generateEventListJsonLd, BASE_URL } from '@/lib/eventSchema';

export const revalidate = 300; // 5 minutos de revalidación ISR

export const metadata = {
  title: 'Calendario de Eventos y Festividades | Turismo San Antonio Palopó',
  description: 'Descubre las festividades, ferias, carreras y eventos culturales de San Antonio Palopó a orillas del Lago Atitlán. Calendario oficial de actividades.',
  alternates: {
    canonical: `${BASE_URL}/eventos`,
  },
  openGraph: {
    title: 'Calendario de Eventos y Festividades | Turismo San Antonio Palopó',
    description: 'Descubre las festividades, ferias y eventos culturales de San Antonio Palopó a orillas del Lago Atitlán.',
    url: `${BASE_URL}/eventos`,
    type: 'website',
    images: [`${BASE_URL}/LogoTurismo.png`],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Calendario de Eventos y Festividades | Turismo San Antonio Palopó',
    description: 'Descubre las festividades y eventos culturales de San Antonio Palopó a orillas del Lago Atitlán.',
    images: [`${BASE_URL}/LogoTurismo.png`],
  }
};

export default async function Page() {
  let events = [];
  try {
    const rawEvents = await getCollectionREST('events');
    if (Array.isArray(rawEvents)) {
      events = [...rawEvents].sort((a, b) => {
        const dateA = a.startDate || '';
        const dateB = b.startDate || '';
        return dateA.localeCompare(dateB);
      });
    }
  } catch (error) {
    console.error('Error cargando eventos en el servidor:', error);
  }

  const jsonLd = generateEventListJsonLd(events);

  return (
    <>
      {/* Schema.org ItemList para indexación Rich Results de Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CalendarPage initialEvents={events} />
    </>
  );
}