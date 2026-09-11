import Link from 'next/link';
import React from 'react';
import SEO from '../components/SEO';
import './InfoPage.css';

function TermsPage() {
  const lastUpdated = "11 de Noviembre de 2025"; // Fecha de referencia

  const jsonLdData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Términos de Uso del Servicio - Turismo San Antonio Palopó",
    "description": "Términos y condiciones para el uso de la aplicación de turismo de la Municipalidad de San Antonio Palopó.",
    "url": "https://turismosanantoniopalopo.com/terminos"
  };

  return (
    // CORREGIDO: Se usa un Fragmento (<>) para permitir que SEO se coloque al inicio
    <>
      <SEO 
        title="Términos de Uso" 
        description="Términos y condiciones de la guía turística de San Antonio Palopó." 
        url="/terminos" 
        jsonLd={jsonLdData} 
      />
      
      <div className="legal-page-container">
        <h1>Términos de Uso del Servicio</h1>
        <p className="last-updated">Última actualización: {lastUpdated}</p>
        
        <section>
          <h2>1. Aceptación y Alcance</h2>
          <p>
            Al acceder o utilizar la aplicación móvil y web <strong>&ldquo;Turismo San Antonio Palopó&rdquo;</strong> (en adelante, &ldquo;la App&rdquo;), usted manifiesta su conformidad y acepta estar legalmente vinculado a los presentes Términos de Uso. Esta plataforma es propiedad de y se encuentra administrada por la <strong>Municipalidad de San Antonio Palopó</strong> (en adelante, &ldquo;la Municipalidad&rdquo;), con la finalidad exclusiva de promover, visibilizar y facilitar el turismo sostenible en el municipio y la cuenca del Lago de Atitlán.
          </p>
          <p>
            Si usted no está de acuerdo con la totalidad de estos términos y condiciones, deberá abstenerse de utilizar la App.
          </p>
        </section>

        <section>
          <h2>2. Naturaleza del Servicio y Limitación de Responsabilidad</h2>
          
          <h3>2.1. Exclusividad Informativa (No Transaccional)</h3>
          <p>
            La App opera estrictamente como una <strong>guía informativa digital e interactiva</strong>. La Municipalidad de San Antonio Palopó no administra, intermedia ni procesa <strong>reservas hoteleras, cobros, pasarelas de pago ni transacciones económicas</strong> de ninguna índole. La plataforma se limita a suministrar información de orientación y canales de comunicación directa (como enlaces telefónicos, WhatsApp y redes sociales oficiales) para que el visitante establezca contacto directo con el prestador del servicio turístico respectivo.
          </p>
          
          <h3>2.2. Información de Terceros y Descargo de Responsabilidad</h3>
          <p>
            Los datos relativos a establecimientos privados (tales como tarifas, horarios de atención, cartas gastronómicas y disponibilidad de servicios) son recopilados con fines puramente orientativos y de divulgación comunitaria. Si bien la Municipalidad realiza revisiones periódicas para procurar su veracidad, no asume responsabilidad legal directa ni derivada por:
          </p>
          <ul>
            <li>Inexactitudes involuntarias, errores tipográficos o desfases temporales en los datos publicados.</li>
            <li>Variaciones imprevistas en tarifas, horarios, disponibilidad o cierres eventuales de los negocios listados.</li>
          </ul>
          <p>
            Es responsabilidad del usuario confirmar previamente las condiciones particulares directamente con el establecimiento antes de efectuar su desplazamiento o incurrir en gastos.
          </p>
        </section>

        <section>
          <h2>3. Conducta del Usuario y Contenido Generado</h2>
          
          <h3>3.1. Usos Prohibidos</h3>
          <p>Queda expresamente prohibido:</p>
          <ul>
            <li>La extracción o explotación comercial no autorizada de la información contenida en la App (incluyendo técnicas de <strong>web scraping</strong>, clonación de bases de datos o minería automatizada para plataformas de terceros).</li>
            <li>La publicación o transmisión de mensajes ilícitos, difamatorios, lesivos, ofensivos, obscenos o que vulneren derechos humanos o comunitarios.</li>
            <li>Cualquier intento deliberado de vulnerar la seguridad informática, acceder a módulos de administración no autorizados o manipular el código fuente del sistema.</li>
          </ul>

          <h3>3.2. Reseñas, Calificaciones y Moderación Comunitaria</h3>
          <p>
            Los usuarios debidamente autenticados pueden emitir <strong>comentarios de texto y valoraciones mediante escala de estrellas</strong> (de 1 a 5). Al emitir una opinión:
          </p>
          <ul>
            <li>Usted es el único responsable legal del contenido, veracidad y tono de sus publicaciones.</li>
            <li>Su <strong>nombre de usuario y fotografía de perfil</strong> serán visibles de forma pública junto a la reseña para todos los usuarios de la comunidad.</li>
            <li>
              <strong>Criterios de Moderación y Sanción:</strong> A fin de resguardar una convivencia respetuosa y constructiva, el equipo de administración municipal se reserva la facultad de:
              <ol>
                <li>Remover de inmediato cualquier opinión que contenga lenguaje vulgar, agresivo, fraudulento o discriminatorio.</li>
                <li>Imponer una <strong>suspensión temporal de 15 días continuos</strong> en la potestad de comentar a aquellos usuarios reincidentes o que incurran en faltas graves, a criterio fundado de la administración.</li>
              </ol>
            </li>
          </ul>
        </section>

        <section>
          <h2>4. Propiedad Intelectual y Derechos Reservados</h2>
          <p>
            La Municipalidad de San Antonio Palopó ostenta la titularidad de los derechos sobre la arquitectura de software, identidad visual, logotipos institucionales y material editorial original de la aplicación. Queda prohibida su reproducción o distribución con fines de lucro sin la debida autorización expresa y por escrito de la autoridad municipal competente.
          </p>
        </section>
      </div>
    </>
  );
}

export default TermsPage;