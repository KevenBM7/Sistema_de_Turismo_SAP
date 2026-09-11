import slugify from 'slugify';

export const CATEGORY_MAPPING = {
    "atracciones-y-cultura": "Atracciones y Cultura",
    "servicios-y-logistica": "Servicios y Logística",
    "movilidad-y-transporte": "Movilidad y Transporte",

    // Subcategorías Comunes (Mapeo Manual para recuperar acentos y mayúsculas)
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

export const createSlug = (text) => {
    if (!text) return '';
    return slugify(text, {
        lower: true,
        strict: true,
        locale: 'es'
    });
};

export const getCategoryNameFromSlug = (slug) => {
    if (!slug) return '';

    // 1. Direct lookup in our known mapping
    if (CATEGORY_MAPPING[slug]) {
        return CATEGORY_MAPPING[slug];
    }

    // 2. Fallback: Check if the slug matches any known category when slugified
    // This handles edge cases or future categories added to the mapping
    const found = Object.values(CATEGORY_MAPPING).find(
        name => createSlug(name) === slug
    );

    if (found) return found;

    // 3. Fallback: If not found, try to utilize the slug itself 
    // (though for strict exact matching queries in DB this might fail if not exact)
    // Converting "movilidad-y-transporte" -> "Movilidad y transporte" is risky for DB queries
    // so we prefer to return the slug or decoded version if no mapping found.
    // For now, let's return the slug with hyphens replaced by spaces as a best guess
    return slug.split('-').join(' ');
};
