import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { invalidateCache } from '@/lib/smartCache';

/**
 * POST /api/revalidate
 *
 * Dispara la revalidación On-Demand de Next.js ISR.
 * El Dashboard del Admin lo llama después de guardar en Firestore.
 *
 * SEGURIDAD: Verifica la autenticación del usuario mediante Firebase Auth ID Token.
 * Solo usuarios con rol 'admin' en Firestore pueden revalidar.
 *
 * Body esperado:
 * {
 *   slug: string,         // Slug del sitio editado
 *   categoryName: string, // Slug de la categoría
 *   type?: 'site' | 'event' | 'home'  // Tipo de contenido (default: 'site')
 * }
 * 
 * Headers:
 *   Authorization: Bearer <Firebase ID Token>
 */
export async function POST(request) {
  try {
    // ─── Verificar autenticación ─────────────────────────────────────────
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { revalidated: false, error: 'No autorizado: falta token de autenticación' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];

    // Verificar el token contra Firebase Auth REST API
    const verifyRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );

    if (!verifyRes.ok) {
      return NextResponse.json(
        { revalidated: false, error: 'Token de autenticación inválido' },
        { status: 401 }
      );
    }

    const verifyData = await verifyRes.json();
    const uid = verifyData.users?.[0]?.localId;

    if (!uid) {
      return NextResponse.json(
        { revalidated: false, error: 'No se pudo identificar al usuario' },
        { status: 401 }
      );
    }

    // Verificar rol de admin en Firestore vía REST API
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const userDocRes = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`,
      {
        headers: { 'Authorization': `Bearer ${idToken}` },
      }
    );

    if (!userDocRes.ok) {
      return NextResponse.json(
        { revalidated: false, error: 'No se pudo verificar el rol del usuario' },
        { status: 403 }
      );
    }

    const userDoc = await userDocRes.json();
    const role = userDoc.fields?.role?.stringValue;

    if (role !== 'admin') {
      return NextResponse.json(
        { revalidated: false, error: 'Solo administradores pueden revalidar' },
        { status: 403 }
      );
    }

    // ─── Revalidación ───────────────────────────────────────────────────
    const { slug, categoryName, type = 'site' } = await request.json();

    invalidateCache('sites');
    invalidateCache('events');
    invalidateCache('categories');

    if (type === 'home') {
      revalidatePath('/');
      return NextResponse.json({ revalidated: true, paths: ['/'], timestamp: Date.now(), cacheCleared: true });
    }

    if (type === 'event') {
      if (!slug) {
        return NextResponse.json({ revalidated: false, error: 'Falta slug del evento' }, { status: 400 });
      }
      revalidatePath(`/evento/${slug}`);
      revalidatePath('/eventos');
      revalidatePath('/mapa');
      revalidatePath('/');
      return NextResponse.json({
        revalidated: true,
        paths: [`/evento/${slug}`, '/eventos', '/'],
        timestamp: Date.now(),
        cacheCleared: true,
      });
    }

    // type === 'site' (default)
    if (!slug) {
      return NextResponse.json({ revalidated: false, error: 'Falta slug del sitio' }, { status: 400 });
    }

    const pathsRevalidated = [];

    if (categoryName) {
      revalidatePath(`/categoria/${categoryName}/${slug}`);
      revalidatePath(`/categoria/${categoryName}`);
      pathsRevalidated.push(`/categoria/${categoryName}/${slug}`, `/categoria/${categoryName}`);
    }

    revalidatePath(`/sitio/${slug}`);
    revalidatePath('/categorias');
    revalidatePath('/mapa');
    revalidatePath('/');
    pathsRevalidated.push(`/sitio/${slug}`, '/categorias', '/');

    return NextResponse.json({
      revalidated: true,
      paths: pathsRevalidated,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('[revalidate] Error:', error);
    return NextResponse.json(
      { revalidated: false, error: error.message },
      { status: 500 }
    );
  }
}
