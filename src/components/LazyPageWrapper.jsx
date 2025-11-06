import React, { useEffect } from 'react';
import NProgress from 'nprogress';

/**
 * Este componente envuelve una página cargada con React.lazy.
 * Se encarga de detener la barra de NProgress una vez que el componente hijo
 * (la página) se ha renderizado por completo.
 */
const LazyPageWrapper = ({ children }) => {
  useEffect(() => {
    // Cuando este efecto se ejecuta, significa que el componente hijo ya se ha montado.
    // Es el momento perfecto para detener la barra de progreso.
    NProgress.done();
  }, []);

  return <>{children}</>;
};

export default LazyPageWrapper;