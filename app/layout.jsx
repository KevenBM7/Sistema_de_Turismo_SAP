import ReactDOM from 'react-dom';
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
  verification: {
    google: 'GosTC4G2q_NlW_F1SGg1DCFwFGeBAc0aPjHSNRtfpiY',
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
  ReactDOM.preconnect('https://firebasestorage.googleapis.com', { crossOrigin: 'anonymous' });
  ReactDOM.prefetchDNS('https://firebasestorage.googleapis.com');
  ReactDOM.preconnect('https://firestore.googleapis.com', { crossOrigin: 'anonymous' });
  ReactDOM.prefetchDNS('https://firestore.googleapis.com');
  ReactDOM.preconnect('https://apis.google.com', { crossOrigin: 'anonymous' });
  ReactDOM.prefetchDNS('https://apis.google.com');

  return (
    <html lang="es" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {/* Script para neutralizar atributos inyectados por antivirus antes de la hidratación de React */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var clean = function(el) {
                    if (el && el.hasAttribute && el.hasAttribute('bis_skin_checked')) {
                      el.removeAttribute('bis_skin_checked');
                    }
                  };
                  var observer = new MutationObserver(function(mutations) {
                    for (var i = 0; i < mutations.length; i++) {
                      var m = mutations[i];
                      if (m.type === 'attributes' && m.attributeName === 'bis_skin_checked') {
                        clean(m.target);
                      } else if (m.type === 'childList') {
                        for (var j = 0; j < m.addedNodes.length; j++) {
                          var node = m.addedNodes[j];
                          if (node.nodeType === 1) {
                            clean(node);
                            var descendants = node.querySelectorAll ? node.querySelectorAll('[bis_skin_checked]') : [];
                            for (var k = 0; k < descendants.length; k++) clean(descendants[k]);
                          }
                        }
                      }
                    }
                  });
                  observer.observe(document.documentElement, {
                    attributes: true,
                    childList: true,
                    subtree: true,
                    attributeFilter: ['bis_skin_checked']
                  });
                } catch (e) {}
              })();
            `,
          }}
        />
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

        {/* Script para gestionar Service Worker (desregistra en localhost para evitar conflictos con HMR) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                var isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                if (isDev) {
                  navigator.serviceWorker.getRegistrations().then(function(regs) {
                    for (var i = 0; i < regs.length; i++) {
                      regs[i].unregister();
                    }
                  });
                  if (typeof caches !== 'undefined') {
                    caches.keys().then(function(names) {
                      for (var j = 0; j < names.length; j++) {
                        caches.delete(names[j]);
                      }
                    });
                  }
                } else {
                  let refreshing = false;
                  navigator.serviceWorker.addEventListener('controllerchange', () => {
                    if (refreshing) return;
                    refreshing = true;
                    try {
                      const lastReload = sessionStorage.getItem('pwa_sw_reloaded');
                      const now = Date.now();
                      if (!lastReload || (now - Number(lastReload)) > 15000) {
                        sessionStorage.setItem('pwa_sw_reloaded', now.toString());
                        window.location.reload();
                      }
                    } catch (e) {
                      window.location.reload();
                    }
                  });
                }
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
