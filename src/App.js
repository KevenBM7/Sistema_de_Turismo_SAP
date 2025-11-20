import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import Navbar from './components/Navbar';
import Footer from './pages/Footer';
import FloatingSearchButton from './components/FloatingSearchButton';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import LoggedInRoute from './components/LoggedInRoute';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Toaster } from 'react-hot-toast';
import { usePageLoader } from './hooks/usePageLoader';
import LazyPageWrapper from './components/LazyPageWrapper.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';
import './styles/Layout.css'; 
import './styles/Utilities.css'; 

// --- Code Splitting: Carga diferida de componentes de página ---
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const HistoryPage = lazy(() => import('./pages/HistoryPage')); // Nueva página
const AboutPage = lazy(() => import('./pages/AboutPage'));   // Nueva página
const Dashboard = lazy(() => import('./pages/Admin/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const SiteDetailPage = lazy(() => import('./pages/SiteDetailPage'));
const MapPage = lazy(() => import('./pages/MapPage'));
const EditSitePage = lazy(() => import('./pages/Admin/EditSitePage'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));
const EventDetailPage = lazy(() => import('./pages/EventDetailPage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const SearchResults = lazy(() => import('./pages/SearchResults'));

// Configuración global de NProgress para ocultar el spinner circular
NProgress.configure({ showSpinner: false });

// Componente que activa el hook del cargador de página
function PageLoader() {
  usePageLoader();
  return null;
}

// Componente interno para poder usar el hook useLocation
function AppContent() {
  const location = useLocation();
  const hideFooter = location.pathname === '/mapa';
  const showSearchButton = location.pathname === '/';
  const isHomePage = location.pathname === '/';

  return (
    <>
      {/* El PageLoader ahora está aquí y puede "ver" los cambios de ruta */}
      <PageLoader />
      {/* Este componente renderizará todas las notificaciones toast */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
      <Navbar />
      {showSearchButton && <FloatingSearchButton />}
      <main className={`container ${isHomePage ? 'no-padding-top' : ''}`}>
        <Suspense fallback={<div style={{ minHeight: '60vh' }}></div>}>
          <Routes>
            <Route path="/" element={<LazyPageWrapper><Home /></LazyPageWrapper>} />
            <Route path="/historia" element={<LazyPageWrapper><HistoryPage /></LazyPageWrapper>} />
            <Route path="/acerca-de" element={<LazyPageWrapper><AboutPage /></LazyPageWrapper>} />
            <Route path="/sitio/:id" element={<LazyPageWrapper><SiteDetailPage /></LazyPageWrapper>} />
            <Route path="/mapa" element={<LazyPageWrapper><MapPage /></LazyPageWrapper>} />
            <Route path="/categorias" element={<LazyPageWrapper><CategoriesPage /></LazyPageWrapper>} />
            <Route path="/categoria/:categoryName/:slug" element={<LazyPageWrapper><SiteDetailPage /></LazyPageWrapper>} />
            <Route path="/categoria/:categoryName" element={<LazyPageWrapper><CategoryPage /></LazyPageWrapper>} />
            <Route path="/terminos" element={<LazyPageWrapper><TermsPage /></LazyPageWrapper>} />
            <Route path="/privacidad" element={<LazyPageWrapper><PrivacyPage /></LazyPageWrapper>} />
            <Route path="/search" element={<LazyPageWrapper><SearchResults /></LazyPageWrapper>} />
            <Route path="/evento/:id" element={<LazyPageWrapper><EventDetailPage /></LazyPageWrapper>} />
            <Route path="/eventos" element={<LazyPageWrapper><CalendarPage /></LazyPageWrapper>} />
            <Route path="/login" element={<LoggedInRoute><LazyPageWrapper><Login /></LazyPageWrapper></LoggedInRoute>} />
            <Route
              path="/profile"
              element={<ProtectedRoute><LazyPageWrapper><Profile /></LazyPageWrapper></ProtectedRoute>}
            />
            <Route 
              path="/admin"
              element={<AdminRoute><LazyPageWrapper><Dashboard /></LazyPageWrapper></AdminRoute>}
            />
            <Route 
              path="/admin/edit/:id"
              element={<AdminRoute><LazyPageWrapper><EditSitePage /></LazyPageWrapper></AdminRoute>}
            />
          </Routes>
        </Suspense>
      </main>
      {!hideFooter && <Footer />}
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;