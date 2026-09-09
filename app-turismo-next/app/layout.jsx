import FirebaseProvider from '@/components/FirebaseProvider';
import NextTopLoader from 'nextjs-toploader';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingSearchButton from '@/components/FloatingSearchButton';
import '@/styles/globals.css';

export const metadata = {
  title: {
    default: 'Turismo en San Antonio Palopó | Lago Atitlán',
    template: '%s | Turismo San Antonio Palopó',
  },
  description:
    'Descubre la belleza, cultura y tradiciones de San Antonio Palopó, a orillas del Lago Atitlán, Guatemala.',
  metadataBase: new URL('https://turismosanantoniopalopo.com'),
  alternates: {
    canonical: './',
  },
  keywords: ['turismo', 'san antonio palopó', 'lago atitlán', 'guatemala', 'cultura', 'kaqchikel'],
  authors: [{ name: 'Municipalidad de San Antonio Palopó' }],
  openGraph: {
    siteName: 'Turismo San Antonio Palopó',
    locale: 'es_GT',
    type: 'website',
    images: [
      {
        url: '/LogoTurismo.png',
        width: 1200,
        height: 630,
        alt: 'Turismo San Antonio Palopó',
      },
    ],
  },
  twitter: { 
    card: 'summary_large_image',
    images: ['/LogoTurismo.png'],
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/logo192.png', sizes: '192x192', type: 'image/png' },
      { url: '/logo512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/logo192.png', sizes: '192x192', type: 'image/png' },
      { url: '/logo512.png', sizes: '512x512', type: 'image/png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/logosap.png',
        color: '#2563eb',
      },
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {/* NProgress al navegar entre páginas */}
        <NextTopLoader color="#2563eb" showSpinner={false} />
        <FirebaseProvider>
          <Navbar />
          <main style={{ minHeight: '80vh' }}>
            {children}
          </main>
          <Footer />
          <FloatingSearchButton />
        </FirebaseProvider>

        {/* Script para forzar recarga cuando hay nueva versión de PWA */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.getRegistration().then(function(reg) {
                    if (reg) {
                      reg.addEventListener('updatefound', () => {
                        const newWorker = reg.installing;
                        newWorker.addEventListener('statechange', () => {
                          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // Nueva versión detectada y lista, recargamos
                            window.location.reload();
                          }
                        });
                      });
                    }
                  });
                });
                
                let refreshing = false;
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                  if (refreshing) return;
                  refreshing = true;
                  window.location.reload();
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
