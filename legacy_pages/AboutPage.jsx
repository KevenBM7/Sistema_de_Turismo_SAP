'use client';

import React, { useEffect } from 'react';
import './InfoPage.css'; 
import SEO from '../components/SEO'; 
import { 
  MapPin, Hotel, Utensils, Sparkles, Palette, Calendar, 
  Bus, Users, MessageSquare, Heart, Building2, 
  Mail, LifeBuoy, Globe, Trees, TrendingUp, Compass, Award 
} from 'lucide-react';

function AboutPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const jsonLdData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Acerca de la Aplicación de Turismo de San Antonio Palopó",
    "description": "Conoce el propósito y la tecnología detrás de esta guía turística digital de San Antonio Palopó, una iniciativa de la Municipalidad.",
    "url": "https://turismosanantoniopalopo.com/acerca-de"
  };

  const featureItems = [
    { icon: MapPin, title: "Sitios turísticos", desc: "Lugares históricos, miradores, muelles y atractivos naturales." },
    { icon: Hotel, title: "Hoteles y hospedajes", desc: "Opciones de alojamiento confortables para todo presupuesto." },
    { icon: Utensils, title: "Gastronomía local", desc: "Experiencias culinarias tradicionales e internacionales." },
    { icon: Sparkles, title: "Cultura y tradiciones", desc: "Historia kaqchikel, ceremonias mayas y fiestas patronales." },
    { icon: Palette, title: "Artesanías y cerámica", desc: "Talleres de alfarería, textiles de telar y arte comunitario." },
    { icon: Calendar, title: "Eventos y festividades", desc: "Calendario de actividades culturales y religiosas del municipio." },
    { icon: Bus, title: "Servicios al viajero", desc: "Lanchas, tuc-tucs, guías locales y transporte terrestre." },
    { icon: Users, title: "Perfiles de visitante", desc: "Cuentas seguras para guardar favoritos y planificar tu recorrido." },
    { icon: MessageSquare, title: "Reseñas comunitarias", desc: "Opiniones auténticas y calificaciones de otros viajeros." },
    { icon: Heart, title: "Lista de favoritos", desc: "Guarda tus sitios imperdibles para acceder a ellos sin demora." }
  ];

  return (
    <div className="info-page-container">
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
          Conoce el propósito, el equipo y la tecnología detrás de la guía turística digital de San Antonio Palopó a orillas del Lago de Atitlán.
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
          Como <strong>guía turística digital integral</strong>, esta plataforma proporciona información detallada y geolocalizada sobre:
        </p>
        
        <div className="info-feature-grid">
          {featureItems.map((item, idx) => {
            const IconComp = item.icon;
            return (
              <div key={idx} className="info-feature-card">
                <IconComp size={20} className="info-feature-icon" />
                <div className="info-feature-content">
                  <div className="info-feature-title">{item.title}</div>
                  <div className="info-feature-desc">{item.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="info-page-section">
        <h2>Iniciativa Institucional</h2>
        <p>
          Este proyecto es una iniciativa oficial de la <strong>Oficina Municipal de Turismo de San Antonio Palopó</strong>, 
          desarrollado en estrecha colaboración con la administración municipal, período 2024-2028.
        </p>
        <p>
          La aplicación forma parte de la estrategia municipal para modernizar los servicios turísticos, 
          impulsar la economía local y preservar nuestro patrimonio cultural mientras facilitamos el acceso 
          a información confiable y en tiempo real para visitantes nacionales e internacionales.
        </p>
        
        <div className="info-callout-card primary">
          <p>
            <strong>Municipalidad de San Antonio Palopó:</strong><br />
            <a href="https://municipalidadsanantoniopalopo.com" target="_blank" rel="noopener noreferrer" style={{ color: '#166534', fontWeight: 600 }}>
              municipalidadsanantoniopalopo.com
            </a>
          </p>
          <p style={{ marginTop: '6px' }}>
            <strong>Oficina Municipal de Turismo:</strong> Barrio Central, Palacio Municipal, San Antonio Palopó, Sololá
          </p>
        </div>
      </section>

      <section className="info-page-section">
        <h2>Desarrollo y Soporte Técnico</h2>
        
        <div className="info-callout-card support">
          <h3>Soporte Técnico y Mantenimiento</h3>
          <p>
            <strong>Desarrollador:</strong> Kevin Bixcul<br />
            <strong>Especialidad:</strong> Técnico en Sistemas Informáticos<br />
            <strong>Proyecto:</strong> Sistema de Gestión y Difusión Turística Municipal
          </p>
          <p>
            ¿Tienes dudas técnicas, sugerencias o requieres soporte sobre el funcionamiento de la aplicación?
          </p>
          <a 
            href="mailto:kevinbixcul@gmail.com?subject=Soporte%20T%C3%A9cnico%20-%20App%20Turismo%20SAP" 
            className="info-support-btn"
          >
            <LifeBuoy size={16} /> Contactar Soporte Técnico
          </a>
        </div>

        <h3>Agradecimientos Especiales</h3>
        <p>
          A la noble comunidad kaqchikel de San Antonio Palopó, a los maestros artesanos de la cerámica y los telares, 
          a los hoteleros, restauranteros y guías turísticos locales que con entusiasmo colaboraron brindando 
          información valiosa para hacer posible esta guía digital.
        </p>
      </section>

      <section className="info-page-section">
        <h2>Impacto y Objetivos</h2>
        
        <div className="info-feature-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div className="info-feature-card">
            <Trees size={22} style={{ color: '#16a34a', flexShrink: 0, marginTop: '2px' }} />
            <div className="info-feature-content">
              <div className="info-feature-title" style={{ color: '#16a34a' }}>Turismo Sostenible</div>
              <div className="info-feature-desc">Promover el respeto ambiental y la convivencia armónica con el lago.</div>
            </div>
          </div>
          <div className="info-feature-card">
            <TrendingUp size={22} style={{ color: '#2563eb', flexShrink: 0, marginTop: '2px' }} />
            <div className="info-feature-content">
              <div className="info-feature-title" style={{ color: '#2563eb' }}>Desarrollo Local</div>
              <div className="info-feature-desc">Dinamizar el comercio de familias artesanas y negocios del municipio.</div>
            </div>
          </div>
          <div className="info-feature-card">
            <Sparkles size={22} style={{ color: '#9333ea', flexShrink: 0, marginTop: '2px' }} />
            <div className="info-feature-content">
              <div className="info-feature-title" style={{ color: '#9333ea' }}>Patrimonio Kaqchikel</div>
              <div className="info-feature-desc">Difundir la riqueza lingüística, espiritual y artesanal originaria.</div>
            </div>
          </div>
          <div className="info-feature-card">
            <Compass size={22} style={{ color: '#ea580c', flexShrink: 0, marginTop: '2px' }} />
            <div className="info-feature-content">
              <div className="info-feature-title" style={{ color: '#ea580c' }}>Navegación Fácil</div>
              <div className="info-feature-desc">Cartografía interactiva con rutas precisas a pie y en vehículo.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="info-page-section">
        <h2>Contacto Institucional</h2>
        <div className="info-callout-card contact">
          <p><strong>Atención al Visitante:</strong> Lunes a Viernes de 8:00 a 16:30 hrs</p>
          <p><strong>Correo Institucional:</strong> <a href="mailto:sapturismo24@gmail.com" style={{ color: '#2563eb' }}>sapturismo24@gmail.com</a></p>
          <p><strong>Ubicación:</strong> Edificio Municipal, San Antonio Palopó, Sololá, Guatemala</p>
        </div>
      </section>

      <footer className="info-page-footer" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '2rem', marginTop: '3rem', textAlign: 'center' }}>
        <img
          src="https://firebasestorage.googleapis.com/v0/b/turismo-municipal.firebasestorage.app/o/staticpages%2Faboutpage%2Flogo%20muni%20san%20antonio%20palop%C3%B3%2024-28.webp?alt=media&token=5a95b5e4-9076-4fd5-8dd4-7c0ddfa0b2bf"
          alt="Logotipo de la Municipalidad de San Antonio Palopó"
          style={{ width: '220px', height: '220px', marginBottom: '1rem', borderRadius: '16px', objectFit: 'contain' }}
        />
        <p style={{ margin: '0 0 6px 0', fontWeight: 700, color: '#0f172a' }}>
          Municipalidad de San Antonio Palopó
        </p>
        <p style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#64748b' }}>
          Administración 2024-2028 &bull; &ldquo;Con la guía de Dios construimos juntos un mejor San Antonio Palopó&rdquo;
        </p>
        <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: 0 }}>
          &copy; {new Date().getFullYear()} Municipalidad de San Antonio Palopó. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
}

export default AboutPage;