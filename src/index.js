import React from 'react';
import ReactDOM from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import './index.css';
import { AuthProvider } from './context/AuthContext';
// 1. Importamos el proveedor de SEO
import { HelmetProvider } from 'react-helmet-async'; 
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <AuthProvider>
    {/* 2. Envolvemos la App con HelmetProvider */}
    <HelmetProvider>
      {/* App ya contiene el Router, por lo que no es necesario aquí */}
      <App />
    </HelmetProvider>
  </AuthProvider>
);