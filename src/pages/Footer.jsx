import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, Clock, Facebook, MapPin, Globe } from 'lucide-react'; // Asegúrate de que Lucide está instalado (npm install lucide-react)

function Footer() {
  const currentYear = new Date().getFullYear();
  const lastUpdated = "Noviembre 2025"; 
  const version = "0.1.0"; 
  
  return (
    <footer className="footer-container">
      {/* Contenido principal del Footer: 4 secciones en una o dos columnas */}
      <div className="footer-content">
        
        {/* --- Columna 1: Contacto Oficial --- */}
        <div className="footer-section contact-official">
          <h4>Contacto Oficial</h4>
          {/* ... (resto del contenido de la Columna 1) ... */}
          <p className="footer-item">
            <MapPin size={14} className="footer-icon" /> Oficina de Turismo Municipal
          </p>
          <p className="footer-item">Barrio Central, San Antonio Palopó, Sololá</p>
          <p className="footer-item">
            <Phone size={14} className="footer-icon" /> Tel: [Número de Turismo]
          </p>
          <p className="footer-item">
            <Mail size={14} className="footer-icon" /> turismo@sanantoniopalopo.gob.gt
          </p>
          <p className="footer-item">
            <Clock size={14} className="footer-icon" /> Lunes a Viernes, 8:00 - 17:00
          </p>
        </div>

        {/* --- Columna 2: Enlaces Importantes --- */}
        <div className="footer-section links-important">
          <h4>Enlaces Importantes</h4>
          <p>
            <a href="https://municipalidadsanantoniopalopo.com" target="_blank" rel="noopener noreferrer" className="footer-link">
              <Globe size={14} className="footer-icon" /> Web Oficial Municipal
            </a>
          </p>
          <p>
            <a href="https://www.facebook.com/paginaoficialSAP" target="_blank" rel="noopener noreferrer" className="footer-link">
              <Facebook size={14} className="footer-icon" /> Facebook Municipalidad
            </a>
          </p>
          <p>
            <Link to="/terminos" className="footer-link" onClick={() => window.scrollTo(0, 0)}>Términos y Condiciones</Link>
          </p>
          <p>
            <Link to="/privacidad" className="footer-link" onClick={() => window.scrollTo(0, 0)}>Política de Privacidad</Link>
          </p>
        </div>

        {/* --- Columna 3: Información Legal y Muni --- */}
        <div className="footer-section legal-info">
          <h4>Información Legal y Muni</h4>
          <p>© {currentYear} Municipalidad de SAP.</p>
          <p>Todos los derechos reservados.</p>
          <p>Administración Municipal 2024-2028</p>
          <p>Alcalde: Rufino Caníz Vicente</p>
          <p className="footer-item footer-last-update">
            Última actualización: {lastUpdated}
          </p>
        </div>
        
        {/* --- Columna 4: Créditos Técnicos (Ahora solo se ve en escritorio) --- */}
        <div className="footer-section developer-credits">
          <h4>Desarrollo Técnico</h4>
          <p>Proyecto de práctica profesional</p>
          <p>Desarrollado por: Kevin Bixcul</p>
          <p>Técnico en Sistemas Infomáticos</p>
          <p>Email: <a href="mailto:kevinbixcul@gmail.com" className="footer-link">kevinbixcul@gmail.com</a></p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;