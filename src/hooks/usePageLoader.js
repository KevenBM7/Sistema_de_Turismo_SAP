import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import NProgress from 'nprogress';

export const usePageLoader = () => {
  const location = useLocation();

  useEffect(() => {
    // Inicia la barra de progreso en cada cambio de ruta
    NProgress.start();

    // Un pequeño truco para que la barra no se complete instantáneamente
    // sino que espere a que el contenido tenga una oportunidad de renderizarse.
    const timer = setTimeout(() => {
      NProgress.done();
    }, 450); // 300ms de retraso

    return () => clearTimeout(timer);
  }, [location.pathname]); // Se ejecuta cada vez que cambia la URL
};