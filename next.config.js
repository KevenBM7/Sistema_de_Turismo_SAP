/** @type {import('next').NextConfig} */

// next-pwa puede no estar instalado aún en dev, por eso el try/catch
let withPWA;
try {
  withPWA = require('next-pwa')({
    dest: 'public',
    disable: process.env.NODE_ENV === 'development',
    register: true,
    skipWaiting: true,
    // ─── Estrategias de caché para PWA ───────────────────────────────────────
    runtimeCaching: [
      {
        // Documentos HTML → siempre intentar red primero (respeta ISR)
        urlPattern: /^https:\/\/turismosanantoniopalopo\.com\/.*/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'html-pages',
          expiration: { maxEntries: 60, maxAgeSeconds: 86400 },
          networkTimeoutSeconds: 3, // Reducido para no esperar de más en redes lentas
        },
      },
      {
        // Imágenes de Firebase Storage → CacheFirst (cambian poco)
        urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'firebase-images',
          expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
      {
        // Imágenes optimizadas por Next.js (_next/image)
        urlPattern: /\/_next\/image\?.*/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'next-images',
          expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
      {
        // Assets estáticos JS/CSS con hashes — cache inmutable
        urlPattern: /\/_next\/static\/.*/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'static-assets',
          expiration: { maxEntries: 100, maxAgeSeconds: 365 * 24 * 60 * 60 },
        },
      },
      {
        // Datos de Firestore REST API → NetworkFirst
        // Forzamos que intente ir a la red para tener datos frescos, fallback a cache si falla.
        urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'firestore-api',
          expiration: { maxEntries: 50, maxAgeSeconds: 3600 },
          networkTimeoutSeconds: 5,
        },
      },
      {
        // Fuentes de Google → CacheFirst (nunca cambian)
        urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts',
          expiration: { maxEntries: 30, maxAgeSeconds: 365 * 24 * 60 * 60 },
        },
      },
    ],
  });
} catch {
  withPWA = (config) => config;
}

const nextConfig = {
  // Silencia el warning de Turbopack vs Webpack en Next.js 16
  turbopack: {
    root: __dirname,
  },

  // ─── Imágenes: Entrega directa desde Firebase Storage CDN sin sobrecargar Cloud Functions ─
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/v0/b/**',
      },
      {
        // Soporte para URLs legadas que usen el bucket alternativo
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    qualities: [75, 80],
    deviceSizes: [360, 480, 768, 1024, 1280],
    imageSizes: [64, 128, 256, 384],
    // Caché de imágenes optimizadas: 30 días (en segundos)
    minimumCacheTTL: 2592000,
  },

  // Permite importar CSS de node_modules (react-slick, leaflet, nprogress…)
  transpilePackages: ['leaflet', 'react-leaflet'],

  // ─── Headers de caché para CDN y navegador ─────────────────────────────────
  async headers() {
    return [
      {
        // Assets estáticos del directorio public (imágenes, fuentes, etc.)
        source: '/:all*(svg|jpg|jpeg|png|webp|avif|ico|woff|woff2)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' },
        ],
      },
      {
        // DNS prefetch para todas las páginas
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
