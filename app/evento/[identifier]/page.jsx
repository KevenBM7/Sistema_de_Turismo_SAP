import { queryCollectionREST, getDocumentREST } from '@/lib/firestoreREST';
import EventDetailPage from '@/legacy_pages/EventDetailPage';
import { generateEventJsonLd, cleanPlainText, BASE_URL, DEFAULT_EVENT_IMAGE } from '@/lib/eventSchema';

export const revalidate = 300; // 5 minutos de revalidación ISR

async function fetchEvent(identifier) {
  if (!identifier) return null;
  try {
    const isFirestoreId = /^[a-zA-Z0-9]{20}$/.test(identifier);
    let event = null;

    if (isFirestoreId) {
      event = await getDocumentREST('events', identifier);
    }

    if (!event) {
      const events = await queryCollectionREST('events', 'slug', '==', identifier);
      if (events && events.length > 0) {
        event = events[0];
      }
    }

    if (!event && !isFirestoreId) {
      event = await getDocumentREST('events', identifier);
    }

    if (event) {
      event.imageUrls = event.imageUrls || (event.imageUrl ? [event.imageUrl] : []);
    }

    return event;
  } catch (e) {
    console.error(`[EventPage] Error obteniendo evento "${identifier}":`, e);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { identifier } = await params;
  const event = await fetchEvent(identifier);

  if (!event) {
    return {
      title: 'Evento no encontrado | Turismo San Antonio Palopó',
      description: 'El evento solicitado no está disponible o ha finalizado.',
    };
  }

  const cleanDescription = cleanPlainText(event.description).substring(0, 155);
  const images = (event.imageUrls && event.imageUrls.length > 0)
    ? event.imageUrls
    : (event.imageUrl ? [event.imageUrl] : [DEFAULT_EVENT_IMAGE]);
  
  const canonicalUrl = `${BASE_URL}/evento/${event.slug || event.id}`;

  return {
    title: `${event.title} | Eventos San Antonio Palopó`,
    description: cleanDescription || `Detalles, fecha y ubicación del evento ${event.title} en San Antonio Palopó.`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${event.title} | Eventos San Antonio Palopó`,
      description: cleanDescription || `Detalles del evento ${event.title} en San Antonio Palopó.`,
      url: canonicalUrl,
      images: images.map(url => ({ url })),
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: event.title,
      description: cleanDescription,
      images: images,
    }
  };
}

export default async function Page({ params }) {
  const { identifier } = await params;
  const event = await fetchEvent(identifier);

  const jsonLd = event ? generateEventJsonLd(event) : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <EventDetailPage initialEvent={event} />
    </>
  );
}
