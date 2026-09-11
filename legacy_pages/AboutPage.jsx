'use client';

import React, { useEffect } from 'react';
import './InfoPage.css'; 
import SEO from '../components/SEO'; 

function AboutPage() {
  useEffect(() => {
    // Scroll a la parte superior al cargar la página.
    window.scrollTo(0, 0);
  }, []);

  const jsonLdData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Acerca de la Aplicación de Turismo de San Antonio Palopó",
    "description": "Conoce el propósito y la tecnología detrás de esta guía turística digital de San Antonio Palopó, una iniciativa de la Municipalidad.",
    "url": "https://turismosanantoniopalopo.com/acerca-de"
  };

  return (
    <div className="info-page-container">
      {/* --- SEO para la Página "Acerca de" --- */}
      <SEO 
        title="Acerca de la Aplicación"
        description="Conoce el propósito y la tecnología detrás de esta guía turística digital de San Antonio Palopó, una iniciativa de la Municipalidad."
        url="/acerca-de"
        keywords="acerca de, municipalidad, turismo, aplicación, desarrollo, san antonio palopó"
        jsonLd={jsonLdData}
      />

      <header className="info-page-header">
        <h1>Acerca de la Aplicación</h1>
        <p className="info-page-subtitle">
          Conoce el propósito y la tecnología detrás de esta guía turística digital de San Antonio Palopó.
        </p>
      </header>

      <section className="info-page-section">
        <h2>Nuestro Propósito</h2>
        <p>
          Esta aplicación fue creada con el objetivo de <strong>promover el turismo sostenible en San Antonio Palopó</strong>, 
          ofreciendo a los visitantes una herramienta moderna, completa y fácil de usar para descubrir todos los tesoros 
          de nuestro hermoso municipio a orillas del Lago de Atitlán.
        </p>
        <p>
          Queremos que cada visitante tenga la mejor experiencia posible, encontrando fácilmente lugares de interés, 
          servicios, eventos, tradiciones culturales y conectando con la rica herencia kaqchikel de nuestra comunidad. 
          Nuestro objetivo es ser el puente digital entre los visitantes y las maravillas que San Antonio Palopó tiene para ofrecer.
        </p>
        <p>
          Como <strong>guía turística digital integral</strong>, esta plataforma proporciona información detallada sobre:
        </p>
        <ul>
          <li><strong>Sitios turísticos</strong> - Lugares históricos, miradores, muelles y atractivos naturales</li>
          <li><strong>Hoteles y hospedajes</strong> - Opciones de alojamiento para todos los presupuestos</li>
          <li><strong>Restaurantes y gastronomía</strong> - Experiencias culinarias locales e internacionales</li>
          <li><strong>Cultura y tradiciones</strong> - Historia kaqchikel, ceremonias mayas y festividades</li>
          <li><strong>Artesanías locales</strong> - Talleres de cerámica, textiles y productos únicos</li>
          <li><strong>Eventos y actividades</strong> - Calendario cultural y actividades de temporada</li>
          <li><strong>Servicios turísticos</strong> - Medios de transporte y guías locales</li>
          <li><strong>Perfiles de usuario</strong> - Cuentas personalizadas para guardar favoritos y planificar visitas</li>
          <li><strong>Comentarios y reseñas</strong> - Experiencias compartidas y calificaciones de otros visitantes</li>
          <li><strong>Lista de favoritos</strong> - Guarda y organiza tus lugares o servicios preferidos</li>
        </ul>
      </section>

      <section className="info-page-section">
        <h2>Iniciativa Municipal</h2>
        <p>
          Este proyecto es una iniciativa de la <strong>Oficina de Turismo de la Municipalidad de San Antonio Palopó</strong>, 
          desarrollado en colaboración con la administración municipal, período 2024-2028.
        </p>
        <p>
          La aplicación forma parte de los esfuerzos municipales para modernizar los servicios turísticos, 
          impulsar la economía local y preservar nuestro patrimonio cultural mientras facilitamos el acceso 
          a la información para visitantes nacionales e internacionales.
        </p>
        
        <div style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '8px', margin: '10px 0' }}>
          <p>
            <strong>Municipalidad de San Antonio Palopó:</strong><br />
            <a href="https://municipalidadsanantoniopalopo.com" target="_blank" rel="noopener noreferrer">
              municipalidadsanantoniopalopo.com
            </a>
          </p>
          <p>
            <strong>Oficina de Turismo Municipal</strong><br />
            Barrio Central, San Antonio Palopó, Sololá<br />
          </p>
        </div>
      </section>


      <section className="info-page-section">
        <h2>Desarrollo y Créditos</h2>
        
        <div style={{ backgroundColor: '#fff3e0', padding: '10px', borderRadius: '8px', margin: '10px 0' }}>
          <h3>Equipo de Desarrollo</h3>
          <p>
            <strong>Desarrollador Principal:</strong> Kevin Bixcul<br />
            <strong>Especialidad:</strong> Técnico en Sistemas Infomáticos<br />
            <strong>Email:</strong> kevinbixcul@gmail.com<br />
            <strong>LinkedIn:</strong> Kevin Bixcul Martín<br />
          </p>
          
          <p>
            <strong>Proyecto:</strong> Desarrollado Como Práctica Profesional<br />
          </p>
        </div>

        <h3>Colaboración Institucional</h3>
        <p>
          <strong>Municipalidad de San Antonio Palopó</strong><br />
          Alcalde Municipal: Rufino Caníz Vicente (2024-2028)<br />
          Oficina Municipal de Turismo<br />
        </p>

        <h3>Agradecimientos Especiales</h3>
        <ul>
          <li>Comunidad kaqchikel de San Antonio Palopó por compartir su conocimiento cultural</li>
          <li>Artesanos locales por permitir documentar sus procesos tradicionales</li>
          <li>Hoteleros y restauranteros por su colaboración con la información turística</li>
          <li>Guías turísticos locales por sus valiosos aportes</li>
        </ul>
      </section>

      <section className="info-page-section">
        <h2>Impacto y Objetivos</h2>
        
        <h3>Impacto Esperado</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '10px', margin: '20px 0' }}>
          <div style={{ textAlign: 'center', padding: '15px' }}>
            <h4 style={{ color: '#2e7d32' }}>🌱 Turismo Sostenible</h4>
            <p>Promover el turismo responsable que beneficie a la comunidad local</p>
          </div>
          <div style={{ textAlign: 'center', padding: '15px' }}>
            <h4 style={{ color: '#1976d2' }}>💼 Desarrollo Económico</h4>
            <p>Impulsar la economía local a través del turismo digital</p>
          </div>
          <div style={{ textAlign: 'center', padding: '15px' }}>
            <h4 style={{ color: '#7b1fa2' }}>🎭 Preservación Cultural</h4>
            <p>Documentar y compartir las tradiciones kaqchikeles</p>
          </div>
          <div style={{ textAlign: 'center', padding: '15px' }}>
            <h4 style={{ color: '#f57c00' }}>🌐 Accesibilidad</h4>
            <p>Facilitar el acceso a información turística actualizada</p>
          </div>
        </div>

        <h3>Visión a Futuro</h3>
        <p>
          Aspiramos a que esta plataforma se convierta en el <strong>referente digital del turismo</strong> en San Antonio Palopó, 
          expandiendo gradualmente sus funcionalidades para enriquecer la experiencia del visitante.
        </p>
      </section>

      <section className="info-page-section">
        <h2>Contacto y Retroalimentación</h2>
        <p>
          Valoramos tus comentarios y sugerencias para mejorar continuamente esta herramienta. 
          Si eres visitante, residente local, empresario turístico o simplemente tienes ideas para mejorar la aplicación, 
          no dudes en contactarnos.
        </p>
        
        <div style={{ backgroundColor: '#e1f5fe', padding: '20px', borderRadius: '8px' }}>
          <h4>Formas de Contacto:</h4>
          <ul>
            <li><strong>Oficina de Turismo:</strong> Lunes a Viernes de 8:00 - 17:00</li>
            <li><strong>Email:</strong> sapturismo24@gmail.com</li>
            <li><strong>Presencial:</strong> Municipalidad de San Antonio Palopó, Oficina de Turismo</li>
          </ul>
        </div>
      </section>

      <footer className="info-page-footer">
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <img
            src="https://firebasestorage.googleapis.com/v0/b/turismo-municipal.firebasestorage.app/o/staticpages%2Faboutpage%2Flogo%20muni%20san%20antonio%20palop%C3%B3%2024-28.webp?alt=media&token=5a95b5e4-9076-4fd5-8dd4-7c0ddfa0b2bf"
            alt="Logotipo de la Municipalidad de San Antonio Palopó"
            style={{ width: '370px', height: '370px', marginBottom: '0px', borderRadius: '10%', objectFit: 'cover' }}
          />
          <p>
            <strong>Municipalidad de San Antonio Palopó</strong><br />
            Administración 2024-2028<br />
            "Con la guía de Dios construimos juntos un mejor San Antonio Palopó"
          </p>
          <p style={{ fontSize: '14px', color: '#666', marginTop: '15px' }}>
            Municipalidad de San Antonio Palopó. © 2025 Todos los derechos reservados.<br />
            Desarrollado como proyecto de práctica profesional.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default AboutPage;