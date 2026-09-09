import { queryCollectionREST } from '@/lib/firestoreREST';
import EventDetailPage from '@/legacy_pages/EventDetailPage';

export async function generateMetadata({ params }) {
  const { identifier } = await params;
  
  try {
    // Buscar por slug
    const events = await queryCollectionREST('events', 'slug', '==', identifier);
    let event = (events && events.length > 0) ? events[0] : null;

    // Fallback: buscar por ID directo
    if (!event) {
      const { getDocumentREST } = await import('@/lib/firestoreREST');
      event = await getDocumentREST('events', identifier);
    }

    if (!event) return { title: 'Evento - Turismo SAP' };

    const cleanDescription = (event.description || '')
      .replace(/<[^>]*>/g, '')
      .trim()
      .substring(0, 155);

    return {
      title: `${event.title} | Eventos`,
      description: cleanDescription || 'Evento cultural en San Antonio Palopó.',
      openGraph: {
        title: event.title,
        description: cleanDescription,
        images: event.imageUrl ? [event.imageUrl] : ['/LogoTurismo.png'],
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title: event.title,
        description: cleanDescription,
        images: event.imageUrl ? [event.imageUrl] : ['/LogoTurismo.png'],
      },
      alternates: {
        canonical: `/evento/${identifier}`,
      }
    };
  } catch (e) {
    return { title: 'Evento | Turismo SAP' };
  }
}

export default function Page() {
  return <EventDetailPage />;
}
