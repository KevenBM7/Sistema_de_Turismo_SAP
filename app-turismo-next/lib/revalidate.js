import { auth } from '@/lib/firebase';

/**
 * triggerRevalidation — Llamar desde el Dashboard del Admin después de
 * guardar/editar contenido en Firestore. Invalida el caché ISR de la página
 * correspondiente en el servidor de Next.js.
 *
 * SEGURIDAD: Envía el token de Firebase Auth del admin actual para que el
 * servidor lo verifique. NO se usa un secreto compartido expuesto al cliente.
 *
 * @param {'site'|'event'|'home'} type
 * @param {{ slug?: string, categoryName?: string }} options
 */
export async function triggerRevalidation(type, { slug, categoryName } = {}) {
  try {
    // Obtener el token de autenticación del usuario actual
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.warn('[Revalidate] No hay usuario autenticado');
      return false;
    }

    const idToken = await currentUser.getIdToken();

    const res = await fetch('/api/revalidate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        type,
        slug,
        categoryName,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.warn('[Revalidate] Falló la revalidación:', data.error);
      return false;
    }

    console.log('[Revalidate] Páginas actualizadas:', data.paths);
    return true;
  } catch (err) {
    console.error('[Revalidate] Error de red:', err);
    return false;
  }
}
