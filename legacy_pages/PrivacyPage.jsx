'use client';

import Link from 'next/link';
import React from 'react';
import SEO from '../components/SEO';
import './InfoPage.css';

function PrivacyPage() {
const lastUpdated = "11 de Noviembre de 2025"; // Fecha de referencia

  const jsonLdData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Política de Privacidad - Turismo San Antonio Palopó",
    "description": "Detalles sobre cómo se recopilan y utilizan los datos en la aplicación de turismo de San Antonio Palopó.",
    "url": "https://turismosanantoniopalopo.com/privacidad"
  };

  return (
    <div className="legal-page-container">
      <h1>Política de Privacidad</h1>
      <SEO title="Política de Privacidad" description="Política de privacidad de la guía turística de San Antonio Palopó." url="/privacidad" jsonLd={jsonLdData} />
      <p className="last-updated">Última actualización: {lastUpdated}</p>

      <section>
        <h2>1. Datos Recopilados y su Finalidad</h2>
        <p>
          Recopilamos información personal exclusivamente para garantizar la correcta operatividad y personalización de las funciones de la aplicación. Las categorías de datos solicitados y tratados comprenden:
        </p>

        <h3>1.1. Datos de Autenticación y Perfil</h3>
        <ul>
          <li><strong>Registro directo (Correo Electrónico y Contraseña):</strong> Su dirección de correo electrónico y una credencial de acceso cifrada mediante protocolos de seguridad estándar.</li>
          <li><strong>Registro federado (Google Authentication):</strong> Nombre, dirección de correo electrónico y la URL de la fotografía de perfil asociada a su cuenta de Google.</li>
          <li><strong>Finalidad del tratamiento:</strong> Estos datos se emplean para autenticar su identidad, mantener activa su sesión de usuario y acreditar su autoría al publicar contenido en la plataforma.</li>
        </ul>

        <h3>1.2. Contenido Generado por el Usuario</h3>
        <p>
          Se almacenan los <strong>comentarios de texto y valoraciones mediante escala de estrellas</strong> que usted libremente decida publicar en los diferentes sitios y atractivos turísticos.
        </p>
        <p className="important-note">
          <strong>Aviso de Visibilidad Pública:</strong> Su <strong>nombre de usuario y fotografía de perfil</strong> son de carácter público y visibles para cualquier visitante de la aplicación cuando usted publica una reseña. La plataforma no cuenta con un directorio de perfiles privados; su información de identidad solo es visible en el contexto de la reseña turística emitida.
        </p>

        <h3>1.3. Datos de Ubicación Geográfica (Geolocalización Volátil y Anónima)</h3>
        <p>
          <strong>Solicitud de Acceso:</strong> La aplicación solicita permiso para acceder a la ubicación satelital (GPS) de su dispositivo exclusivamente si usted navega a la sección del mapa interactivo (<code>/mapa</code>).
        </p>
        <p><strong>Finalidad exclusiva:</strong> La ubicación en tiempo real se utiliza para:</p>
        <ul>
          <li>Visualizar su posición actual en el mapa y orientarlo con respecto al entorno turístico.</li>
          <li>Calcular distancias de proximidad y trazar rutas de desplazamiento (a pie o en vehículo) hacia el destino que usted seleccione.</li>
        </ul>
        <p>
          <strong>No Almacenamiento:</strong> Sus coordenadas geográficas <strong>no se guardan de forma permanente</strong> en nuestros servidores ni quedan asociadas a su historial de usuario. Dichos datos se procesan en la memoria volátil del navegador y se descartan inmediatamente al cerrar la sesión de mapa.
        </p>
      </section>

      <section>
        <h2>2. Plataforma Tecnológica y Proveedores de Servicios</h2>
        
        <h3>2.1. Infraestructura y Seguridad en la Nube</h3>
        <p>
          La autenticación de usuarios y la base de datos se alojan en <strong>Firebase Authentication y Cloud Firestore</strong> (Google Cloud Platform), los cuales cuentan con estándares de seguridad, encriptación en tránsito y reposo, y procesamiento anónimo de métricas de fiabilidad.
        </p>
        
        <h3>2.2. Cartografía, Rutas y Geocodificación</h3>
        <p>
          La visualización cartográfica se implementa mediante la librería <strong>Leaflet</strong> con capas de mapas oficiales (Google Maps, OpenStreetMap y Esri). El cálculo de itinerarios viales y peatonales, así como los servicios de autocompletado y búsqueda por cercanía, se procesan mediante las interfaces seguras de <strong>Geoapify</strong>.
        </p>

        <h3>2.3. Almacenamiento Local (Cookies y LocalStorage)</h3>
        <p>
          La App utiliza el almacenamiento local seguro del navegador (<code>localStorage</code>) con el propósito de preservar su estado de sesión autenticado y evitar solicitudes repetitivas de ingreso.
        </p>
        <p>
          <strong>No utilizamos herramientas de rastreo intrusivo</strong> ni scripts de redes publicitarias de terceros para monitoreo de comportamiento comercial.
        </p>
      </section>

      <section>
        <h2>3. Derechos del Usuario y Control de su Información</h2>
        <p>Usted conserva en todo momento el control y la potestad sobre sus datos personales:</p>
        <ul>
          <li><strong>Acceso y Actualización:</strong> Puede ingresar a la sección <strong>&ldquo;Mi Perfil&rdquo;</strong> para modificar su nombre visible, así como actualizar o suprimir su fotografía de perfil.</li>
          <li><strong>Eliminación Definitiva de Cuenta:</strong> En la sección <strong>&ldquo;Mi Perfil&rdquo;</strong>, dispone de la opción para eliminar su cuenta de manera irrevocable. Esta acción borra sus credenciales de acceso y su listado de sitios favoritos del sistema.</li>
        </ul>

        <h3>3.1. Protección de Menores de Edad</h3>
        <p>
          La aplicación <strong>no efectúa procesos independientes de comprobación de edad</strong> para el registro. Los usuarios que se autentican mediante plataformas de terceros (como Google) se rigen por las políticas de edad mínima aplicables por dichos proveedores. La Municipalidad de San Antonio Palopó no solicita ni almacena deliberadamente datos personales de menores de edad.
        </p>
      </section>
    </div>
  );
}

export default PrivacyPage;