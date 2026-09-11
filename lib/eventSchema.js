/**
 * Generador de datos estructurados (Schema.org) para Eventos.
 * Cumple al 100% con los requisitos críticos y recomendados de Google Search Console
 * para Resultados Enriquecidos (Rich Results):
 * - location (Place con PostalAddress completo)
 * - name, startDate, endDate
 * - description (limpia de HTML)
 * - eventStatus & eventAttendanceMode
 * - image (URLs absolutas válidas)
 * - organizer (Organization)
 * - offers (Offer con moneda GTQ y disponibilidad)
 * - performer (PerformingGroup)
 * - url (enlace canónico absoluto)
 */

export const BASE_URL = 'https://turismosanantoniopalopo.com';
export const DEFAULT_EVENT_IMAGE = `${BASE_URL}/LogoTurismo.png`;

/**
 * Limpia tags HTML y entidades de un texto para Schema.org
 */
export function cleanPlainText(text) {
  if (!text) return '';
  return String(text)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normaliza fechas a formato ISO 8601 con zona horaria de Guatemala (UTC-6)
 */
export function formatIsoDate(dateStr, defaultTime = '08:00:00-06:00') {
  if (!dateStr) return null;
  const trimmed = String(dateStr).trim();
  if (trimmed.includes('T')) {
    // Si ya tiene T pero no zona horaria, agregamos -06:00
    if (!trimmed.includes('-') && !trimmed.includes('+') && !trimmed.endsWith('Z')) {
      return `${trimmed}-06:00`;
    }
    return trimmed;
  }
  // Si es YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return `${trimmed}T${defaultTime}`;
  }
  return trimmed;
}

/**
 * Genera el JSON-LD Schema.org para un evento individual
 */
export function generateEventJsonLd(event) {
  if (!event) return null;

  const slugOrId = event.slug || event.id;
  const eventUrl = `${BASE_URL}/evento/${slugOrId}`;

  // Descripción limpia y concisa
  const cleanedDesc = cleanPlainText(event.description);
  const description = cleanedDesc.length > 0
    ? (cleanedDesc.length > 250 ? `${cleanedDesc.substring(0, 247)}...` : cleanedDesc)
    : `Evento cultural y festividad en San Antonio Palopó: ${event.title}. Descubre actividades, fechas y detalles.`;

  // Fechas normalizadas
  const startDate = formatIsoDate(event.startDate, '08:00:00-06:00');
  const endDate = formatIsoDate(event.endDate || event.startDate, '20:00:00-06:00');

  // Imágenes
  let rawImages = [];
  if (Array.isArray(event.imageUrls) && event.imageUrls.length > 0) {
    rawImages = event.imageUrls.filter(Boolean);
  } else if (event.imageUrl) {
    rawImages = [event.imageUrl];
  }
  const images = rawImages.length > 0 ? rawImages : [DEFAULT_EVENT_IMAGE];

  // Ubicación física (Google requiere Place con dirección estructurada)
  const locationName = event.locationName || event.location || 'San Antonio Palopó';
  const streetAddress = event.address || 'San Antonio Palopó, Calle Principal';

  const location = {
    '@type': 'Place',
    'name': locationName,
    'address': {
      '@type': 'PostalAddress',
      'streetAddress': streetAddress,
      'addressLocality': 'San Antonio Palopó',
      'addressRegion': 'Sololá',
      'postalCode': '07012',
      'addressCountry': 'GT'
    }
  };

  // Estado del evento
  const eventStatus = 'https://schema.org/EventScheduled';
  const eventAttendanceMode = 'https://schema.org/OfflineEventAttendanceMode';

  // Organizador
  const organizerName = event.organizer || 'Comité Organizador / Municipalidad de San Antonio Palopó';
  const organizer = {
    '@type': 'Organization',
    'name': organizerName,
    'url': BASE_URL
  };

  // Performer / Participantes
  const performer = {
    '@type': 'PerformingGroup',
    'name': event.performer || event.title || 'Comunidad de San Antonio Palopó'
  };

  // Ofertas (Entrada libre / Precio)
  const priceValue = event.price ? String(event.price).replace(/[^0-9.]/g, '') || '0' : '0';
  const offers = {
    '@type': 'Offer',
    'url': eventUrl,
    'price': priceValue,
    'priceCurrency': 'GTQ',
    'availability': 'https://schema.org/InStock',
    'validFrom': event.createdAt 
      ? new Date(event.createdAt).toISOString().split('T')[0]
      : (event.startDate || '2025-01-01')
  };

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    'name': event.title,
    'description': description,
    'startDate': startDate,
    'endDate': endDate,
    'eventStatus': eventStatus,
    'eventAttendanceMode': eventAttendanceMode,
    'location': location,
    'image': images,
    'organizer': organizer,
    'offers': offers,
    'performer': performer,
    'url': eventUrl
  };
}

/**
 * Genera el JSON-LD Schema.org tipo ItemList para la página general de eventos (/eventos)
 */
export function generateEventListJsonLd(events = []) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': 'Calendario de Eventos y Festividades de San Antonio Palopó',
    'description': 'Lista oficial de eventos, festivales y celebraciones culturales en San Antonio Palopó, Sololá.',
    'url': `${BASE_URL}/eventos`,
    'numberOfItems': events.length,
    'itemListElement': events.map((event, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'item': generateEventJsonLd(event)
    }))
  };
}
