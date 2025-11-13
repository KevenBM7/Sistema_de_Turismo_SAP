import React, { useEffect } from 'react';
import './InfoPage.css';

function AboutPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="info-page-container">
      <header className="info-page-header">
        <h1>Acerca de la Aplicación</h1>
        <p className="info-page-subtitle">
          Conoce el propósito y la tecnología detrás de esta guía turística digital de San Antonio Palopó.
        </p>
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/3/3b/Coat_of_arms_of_Guatemala.svg"
          alt="img"
          className="info-page-image"
          style={{ maxWidth: '200px', margin: '20px auto' }}
        />
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
        
        <div style={{ backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '8px', margin: '20px 0' }}>
          <h4>Enlaces Oficiales:</h4>
          <p>
            <strong>Municipalidad de San Antonio Palopó:</strong><br />
            <a href="https://municipalidadsanantoniopalopo.com" target="_blank" rel="noopener noreferrer">
              municipalidadsanantoniopalopo.com
            </a>
          </p>
          <p>
            <strong>Oficina de Turismo Municipal</strong><br />
            Barrio Central, San Antonio Palopó, Sololá<br />
            Teléfono: [Número de contacto de la oficina de turismo]
          </p>
        </div>
      </section>

      <section className="info-page-section">
        <h2>Desarrollo y Tecnología</h2>
        <p>
          Esta aplicación representa la fusión entre tecnología moderna y tradición cultural, 
          diseñada específicamente para las necesidades del turismo en San Antonio Palopó.
        </p>
        
        <h3>Tecnologías Utilizadas</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', margin: '20px 0' }}>
          <div style={{ backgroundColor: '#e3f2fd', padding: '15px', borderRadius: '8px' }}>
            <strong>Frontend:</strong>
            <ul>
              <li>React.js - Framework principal</li>
              <li>React Router - Navegación</li>
              <li>CSS3 - Estilos responsivos</li>
            </ul>
          </div>
          <div style={{ backgroundColor: '#f3e5f5', padding: '15px', borderRadius: '8px' }}>
            <strong>Backend & Datos:</strong>
            <ul>
              <li>Firebase - Base de datos</li>
              <li>Cloud Firestore - Almacenamiento</li>
              <li>Firebase Hosting - Despliegue</li>
            </ul>
          </div>
          <div style={{ backgroundColor: '#e8f5e8', padding: '15px', borderRadius: '8px' }}>
            <strong>Funcionalidades:</strong>
            <ul>
              <li>Leaflet - Mapas interactivos</li>
              <li>Aplicación Web responsiva</li>
              <li>Responsive Design - Móvil optimizado</li>
            </ul>
          </div>
        </div>

        <h3>Características Técnicas</h3>
        <ul>
          <li><strong>Diseño Responsivo:</strong> Optimizada para dispositivos móviles, tablets y computadoras</li>
          <li><strong>Aplicación Web:</strong> Requiere conexión a internet</li>
          <li><strong>Mapas Interactivos:</strong> Geolocalización de sitios turísticos y servicios</li>
          <li><strong>Sistema de autenticación:</strong> Registro seguro y gestión de perfiles de usuario</li>
          <li><strong>Base de datos de reseñas:</strong> Comentarios verificados y calificaciones en tiempo real</li>
          <li><strong>Accesibilidad:</strong> Cumple con estándares de accesibilidad web</li>
          <li><strong>SEO Optimizado:</strong> Mejorado para motores de búsqueda</li>
        </ul>
      </section>

      <section className="info-page-section">
        <h2>Desarrollo y Créditos</h2>
        
        <div style={{ backgroundColor: '#fff3e0', padding: '20px', borderRadius: '8px', margin: '20px 0' }}>
          <h3>Equipo de Desarrollo</h3>
          <p>
            <strong>Desarrollador Principal:</strong> Kevin Bixcul<br />
            <strong>Especialidad:</strong> Técnico en Sistemas Infomáticos<br />
            <strong>Email:</strong> kevinbixcul@gmail.com<br />
            <strong>LinkedIn:</strong> Kevin Bixcul Martín<br />
          </p>
          
          <p>
            <strong>Proyecto:</strong> Práctica Profesional en Desarrollo de Sistemas Turísticos<br />
            <strong>Período:</strong> 14 de septiembre al 5 de nomviembre de 2025<br />
            <strong>Modalidad:</strong> Desarrollo para entidad pública - Municipalidad de San Antonio Palopó
          </p>
        </div>

        <h3>Colaboración Institucional</h3>
        <p>
          <strong>Municipalidad de San Antonio Palopó</strong><br />
          Alcalde Municipal: Rufino Caníz Vicente(2024-2028)<br />
          Oficina Municipal de Turismo<br />
          Departamento de Desarrollo Económico Local
        </p>

        <h3>Agradecimientos Especiales</h3>
        <ul>
          <li>Comunidad kaqchikel de San Antonio Palopó por compartir su conocimiento cultural</li>
          <li>Artesanos locales por permitir documentar sus procesos tradicionales</li>
          <li>Hoteleros y restauranteros por su colaboración con la información turística</li>
          <li>Guías turísticos locales por sus valiosos aportes</li>
          <li>Habitantes del municipio por su apoyo y hospitalidad</li>
        </ul>
      </section>

      <section className="info-page-section">
        <h2>Impacto y Objetivos</h2>
        
        <h3>Impacto Esperado</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', margin: '20px 0' }}>
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
            <li><strong>Oficina de Turismo:</strong> [Teléfono y horarios]</li>
            <li><strong>Email técnico:</strong> [kevinbixcul@gmail.com]</li>
            <li><strong>Redes sociales:</strong> [Redes de la municipalidad]</li>
            <li><strong>Presencial:</strong> Municipalidad de San Antonio Palopó, Oficina de Turismo</li>
          </ul>
        </div>
      </section>

      <footer className="info-page-footer">
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/3/3b/Coat_of_arms_of_Guatemala.svg"
            alt="img"
            style={{ width: '60px', height: '60px', marginBottom: '10px' }}
          />
          <p>
            <strong>Municipalidad de San Antonio Palopó</strong><br />
            Administración 2024-2028<br />
            "Con la guía de Dios construimos juntos un mejor San Antonio Palopó"
          </p>
          <p style={{ fontSize: '14px', color: '#666', marginTop: '15px' }}>
            © 2025 Municipalidad de San Antonio Palopó. Todos los derechos reservados.<br />
            Desarrollado como proyecto de práctica profesional.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default AboutPage;