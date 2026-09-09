'use client';
import React from 'react';
import { Music2, Mail, Clock, Facebook, MapPin, Globe, Youtube, Linkedin, PlusCircle } from 'lucide-react';
import './Footer.css';


// URL del Formulario
const SUGGEST_SITE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSdewv1slZPa1c0jhZLNioTZdbYwyPYgWp4Yq0JL5OznQSA4hg/viewform?usp=preview";

function Footer() {
  const currentYear = new Date().getFullYear();
  const lastUpdated = "Noviembre 2025";

  return (
    <footer className="footer-container">
      <div className="footer-content">

        {/* --- Columna 1: Contacto Oficial --- */}
        <div className="footer-section contact-official">
          <h4>Contacto Oficial</h4>
          <p className="footer-item">
            <MapPin size={16} className="footer-icon" />
            <strong>Oficina de Turismo Municipal</strong>
          </p>
          <p className="footer-item">Barrio Centro, San Antonio Palopó, Sololá</p>
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

        {/* --- Columna 2: Enlaces y Colaboración --- */}
        <div className="footer-section links-important">
          <h4>Conéctate y Colabora</h4>
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

          {/* --- ENLACE DE SUGERENCIA AGREGADO --- */}
          <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px dashed #555' }}>
            <a
              href={SUGGEST_SITE_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
              style={{ color: '#ffc107', fontWeight: 'bold' }}
            >
              <PlusCircle size={16} className="footer-icon" style={{ color: '#ffc107' }} /> Sugerir un sitio
            </a>
          </div>
        </div>

        {/* --- Columna 3: Información Legal y Muni --- */}
        <div className="footer-section legal-info">
          <h4>Información Legal</h4>
          <p>Municipalidad de SAP.</p>
          <p>© {currentYear} Todos los derechos reservados.</p>
          <p>Administración Municipal 2024-2028</p>
          <p>Alcalde: Rufino Caníz Vicente</p>
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
          <p>
            <a href="https://www.linkedin.com/in/kevin-bixcul-mart%C3%ADn-748255126/" target="_blank" rel="noopener noreferrer" className="footer-link">
              <Linkedin size={16} className="footer-icon" /> Kevin Bixcul Martín
            </a>
          </p>
        </div>
      </div>

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
            className="foter-logo-optimized"
            width="59"
            height="60"
          />
          <span>Sistema de Gestión Turística Municipalidad de San Antonio Palopó<br />
            Última actualización: {lastUpdated}
          </span>
        </p>
      </div>
    </footer>
  );
}

export default Footer;