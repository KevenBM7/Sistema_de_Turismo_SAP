'use client';

import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';

/**
 * FirebaseProvider — Client Component raíz que envuelve toda la app.
 * Al ser 'use client', permite que AuthContext use hooks del browser
 * (onAuthStateChanged, onSnapshot) sin afectar el SSR del resto de páginas.
 */
export default function FirebaseProvider({ children }) {
  return (
    <AuthProvider>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: { background: '#363636', color: '#fff' },
        }}
      />
      {children}
    </AuthProvider>
  );
}
