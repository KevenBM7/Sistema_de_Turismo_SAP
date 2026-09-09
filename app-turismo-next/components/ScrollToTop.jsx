'use client';

import { useEffect } from 'react';
import { useLocation } from 'next/navigation';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default ScrollToTop;