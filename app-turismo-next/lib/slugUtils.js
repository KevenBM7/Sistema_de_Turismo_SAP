import slugify from 'slugify';

export const CATEGORY_MAPPING = {
    "atracciones-y-cultura": "Atracciones y Cultura",
    "servicios-y-logistica": "Servicios y Logística",
    "movilidad-y-transporte": "Movilidad y Transporte",
    "artesanias": "Artesanías",
    "miradores": "Miradores",
    "religion": "Religión",
    "cultura": "Cultura",
    "hoteles": "Hoteles",
    "restaurantes": "Restaurantes",
    "cafeterias": "Cafeterías",
    "transporte": "Transporte",
    "tuc-tucs": "Tuc Tucs",
    "lanchas": "Lanchas",
    "pickups": "Pickups",
    "servicios-publicos": "Servicios Públicos",
    "mercados": "Mercados",
};

export function createSlug(text) {
  if (!text) return '';
  return slugify(text, {
    lower: true,
    strict: true,
    locale: 'es'
  });
}

export const getCategoryNameFromSlug = (slug) => {
    if (!slug) return '';
    if (CATEGORY_MAPPING[slug]) {
        return CATEGORY_MAPPING[slug];
    }
    const found = Object.values(CATEGORY_MAPPING).find(
        name => createSlug(name) === slug
    );
    if (found) return found;
    return slug.split('-').join(' ');
};
