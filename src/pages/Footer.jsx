import React from 'react';
import { Link } from 'react-router-dom';
import { Music2, Mail, Phone, Clock, Facebook, MapPin, Globe, Youtube } from 'lucide-react';
import './Footer.css';

function Footer() {
  const currentYear = new Date().getFullYear();
  const lastUpdated = "Noviembre 2025"; 
  
  return (
    <footer className="footer-container">
      {/* Contenido principal del Footer: 4 secciones */}
      <div className="footer-content">
        
        {/* --- Columna 1: Contacto Oficial --- */}
        <div className="footer-section contact-official">
          <h4>Contacto Oficial</h4>
          <p className="footer-item">
            <MapPin size={16} className="footer-icon" /> 
            <strong>Oficina de Turismo Municipal</strong>
          </p>
          <p className="footer-item">Barrio Centro, San Antonio Palopó, Sololá</p>
          {/*
          <p className="footer-item">
            <Phone size={16} className="footer-icon" /> Tel: [Número de Turismo]
          </p>  
          */}
          <p className="footer-item">
            <Mail size={16} className="footer-icon" /> 
            <a href="mailto:sapturismo24@gmail.com" className="footer-link">
              sapturismo24@gmail.com
            </a>
          </p>
          <p className="footer-item">
            <Clock size={16} className="footer-icon" /> Lunes a Viernes, 8:00 - 17:00
          </p>
        </div>

        {/* --- Columna 2: Enlaces Importantes --- */}
        <div className="footer-section links-important">
          <h4>Enlaces Importantes</h4>
          <p>
            <a href="https://municipalidadsanantoniopalopo.com" target="_blank" rel="noopener noreferrer" className="footer-link">
              <Globe size={16} className="footer-icon" /> Web Oficial
            </a>
          </p>
          <p>
            <a href="https://www.facebook.com/share/1BUvguNB3P/" target="_blank" rel="noopener noreferrer" className="footer-link">
              <Facebook size={16} className="footer-icon" /> Facebook
            </a>
          </p>
          <p>
            <a href="https://www.youtube.com/@municipalidaddesanantoniop7747" target="_blank" rel="noopener noreferrer" className="footer-link">
              <Youtube size={16} className="footer-icon" /> YouTube
            </a>
          </p>
          <p>
            <a href="https://www.tiktok.com/@munisanantoniopalopo?is_from_webapp=1&sender_device=pc" target="_blank" rel="noopener noreferrer" className="footer-link">
              <Music2 size={16} className="footer-icon" /> TikTok
            </a>
          </p>
          <p>
            <Link to="/terminos" className="footer-link" onClick={() => window.scrollTo(0, 0)}>
              Términos y Condiciones
            </Link>
          </p>
          <p>
            <Link to="/privacidad" className="footer-link" onClick={() => window.scrollTo(0, 0)}>
              Política de Privacidad
            </Link>
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
        
        {/* --- Columna 4: Créditos Técnicos --- */}
        <div className="footer-section developer-credits">
          <h4>Desarrollo Técnico</h4>
          <p>Desarrollado por: Kevin Bixcul</p>
          <p>Técnico en Sistemas Informáticos</p>
          <p>
            <span>Email: </span>
            <a href="mailto:kevinbixcul@gmail.com" className="footer-link">
              kevinbixcul@gmail.com
            </a>
          </p>
        </div>
      </div>

      {/* Barra inferior de copyright */}
<div className="footer-developer-credit">
  <p style={{ 
    margin: 0, 
    fontSize: '.85rem', 
    color: '#999',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px'
  }}>
    <img 
      src="/logosap.png" 
      alt="Logo Turismo" 
      className="foter-logo" 
      width="59"
      height="60"
      style={{ padding: '5px' }}
    />
    <span>Sistema de Gestión Turística Municipalidad de San Antonio Palopó</span>
  </p>
</div>
    </footer>
  );
}

export default Footer;