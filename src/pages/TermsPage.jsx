import React from 'react';
import { Link } from 'react-router-dom';

function TermsPage() {
  const lastUpdated = "11 de Noviembre de 2025"; // Fecha de referencia

  return (
    <div className="legal-page-container">
      <h1>Términos de Uso del Servicio</h1>
      <p className="last-updated">Última actualización: {lastUpdated}</p>
      
      <section>
        <h2>1. Aceptación y Alcance</h2>
        <p>Al acceder o utilizar la aplicación móvil y web "Turismo San Antonio Palopó" (la App), usted acepta estar legalmente obligado por los presentes Términos de Uso. Esta App es propiedad y está operada por la Municipalidad de San Antonio Palopó (la Municipalidad), con el fin exclusivo de promover el turismo en la región.</p>
        <p>Si no está de acuerdo con estos términos, no debe utilizar la App.</p>
      </section>

      <section>
        <h2>2. Naturaleza del Servicio y Limitación de Responsabilidad</h2>
        
        <h3>2.1. Exclusividad Informativa (No Transaccional)</h3>
        <p>La App es una **guía informativa digital**. La Municipalidad no gestiona ni procesa **reservas, pagos o transacciones económicas** de ningún tipo. La App solo proporciona detalles de contacto (WhatsApp, redes sociales) para que el usuario contacte directamente al proveedor del servicio o negocio listado.</p>
        
        <h3>2.2. Información de Terceros (Descargo de Responsabilidad)</h3>
        <p>La información de negocios privados (ej. horarios, precios, disponibilidad) se proporciona a título de intermediario informativo. Aunque la Municipalidad se esfuerza por mantenerla actualizada, no es legalmente responsable por:</p>
        <ul>
            <li>Inexactitudes, errores o desactualizaciones de datos publicados.</li>
            <li>Cambios repentinos en precios, horarios, servicios o cierres de los negocios listados.</li>
        </ul>
        <p>El usuario es responsable de verificar la información directamente con el negocio antes de realizar cualquier acción o viaje.</p>
      </section>

      <section>
        <h2>3. Conducta del Usuario y Contenido Generado</h2>
        
        <h3>3.1. Uso Prohibido</h3>
        <p>Queda estrictamente prohibido:</p>
        <ul>
            <li>El uso comercial no autorizado de los datos de la App (ej. **scraping** o copiar masivamente la información para fines externos).</li>
            <li>Publicar información ilegal, difamatoria, amenazante, obscena o que viole derechos de terceros.</li>
            <li>Cualquier intento de acceder a áreas restringidas o manipular el código de la App.</li>
        </ul>

        <h3>3.2. Comentarios y Moderación</h3>
        <p>Los usuarios pueden publicar **comentarios de texto y calificaciones** (1-5 estrellas). Al publicar:</p>
        <ul>
            <li>Usted es el único responsable del contenido de su comentario.</li>
            <li>Su **nombre de usuario y foto de perfil serán visibles públicamente** junto a su reseña para todos los usuarios.</li>
            <li>**Moderación y Sanciones:** Los administradores municipales, a través de un sistema de reportes, se reservan el derecho de:
                <ol>
                    <li>Eliminar cualquier comentario que infrinja las normas de respeto o legalidad.</li>
                    <li>Aplicar una **penalización de 20 días sin poder comentar** al usuario que reincida o emita comentarios gravemente ofensivos, a discreción del administrador.</li>
                </ol>
            </li>
        </ul>
      </section>

      <section>
        <h2>4. Propiedad Intelectual</h2>
        <p>La Municipalidad de San Antonio Palopó posee los derechos sobre el código, diseño y contenidos originales de la App. Cualquier uso no autorizado está prohibido.</p>
      </section>
    </div>
  );
}

export default TermsPage;