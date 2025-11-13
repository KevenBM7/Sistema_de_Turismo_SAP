import React from 'react';
import { Link } from 'react-router-dom';
import './InfoPage.css';

function PrivacyPage() {
const lastUpdated = "11 de Noviembre de 2025"; // Fecha de referencia

  return (
    <div className="legal-page-container">
      <h1>Política de Privacidad</h1>
      <p className="last-updated">Última actualización: {lastUpdated}</p>

      <section>
        <h2>1. Datos Recopilados y Su Uso</h2>
        <p>Recopilamos su información exclusivamente para la funcionalidad de la App. Los datos personales que solicitamos o recopilamos son:</p>

        <h3>1.1. Datos de Perfil</h3>
        <ul>
          <li><strong>Registro (Correo/Contraseña):</strong> Dirección de correo electrónico y contraseña cifrada.</li>
          <li><strong>Registro (Google):</strong> Nombre, dirección de correo electrónico y la URL de la foto de perfil asociada a su cuenta de Google.</li>
          <li><strong>Uso:</strong> Estos datos se utilizan para identificarlo, mantener su sesión activa y, crucialmente, para mostrar su identidad cuando interactúa en la App.</li>
        </ul>

        <h3>1.2. Contenido Generado por el Usuario</h3>
        <p>Se recopilan los **comentarios de texto y calificaciones con estrellas** que publica en los sitios turísticos.</p>
        <p className="important-note">⚠️ **Visibilidad Pública:** Su **nombre de usuario y foto de perfil** son públicos y visibles para todos los usuarios de la App cuando usted publica un comentario o reseña. No existe ninguna sección para ver perfiles de otros usuarios; la información es visible solo en el contexto del comentario.</p>

        <h3>1.3. Datos de Ubicación Geográfica (Temporal y Anónima)</h3>
        <p><strong>Recopilación:</strong> Sí, la App solicita acceso a su ubicación GPS solo si usted navega a la página del mapa (`/mapa`).</p>
        <p><strong>Uso:</strong> La ubicación se usa estrictamente para:</p>
        <ul>
            <li>Mostrar su posición en tiempo real en el mapa (GPS).</li>
            <li>Calcular rutas hacia un destino seleccionado.</li>
        </ul>
        <p><strong>Almacenamiento:</strong> Su ubicación **NO se almacena** permanentemente en nuestra base de datos ni se asocia a su perfil de usuario. Se descarta automáticamente en cuanto abandona la página del mapa.</p>
      </section>

      <section>
        <h2>2. Tecnología y Tracking</h2>
        
        <h3>2.1. Servicios de Terceros</h3>
        <p>Utilizamos **Firebase Authentication y Cloud Firestore** para la gestión de usuarios y almacenamiento de datos, respectivamente. Firebase recopila métricas de uso y rendimiento de forma anónima, estándar para sus servicios.</p>
        
        <h3>2.2. Mapas</h3>
        <p>La App utiliza la librería **Leaflet** con proveedores de capas de mapa (OpenStreetMap, Esri). El cálculo de rutas se realiza mediante servicios compatibles con Leaflet (actualmente routing.openstreetmap.de).</p>

        <h3>2.3. Cookies y Almacenamiento Local</h3>
        <p>La App utiliza el almacenamiento local del navegador (`localStorage`) para mantener su sesión de usuario iniciada y no tener que registrarse en cada visita.</p>
        <p><strong>No usamos Google Analytics</strong> ni otros scripts de seguimiento de terceros para publicidad o análisis de comportamiento detallado.</p>
      </section>

      <section>
        <h2>3. Derechos del Usuario y Control de Datos</h2>
        <p>Usted mantiene el control sobre sus datos:</p>
        <ul>
          <li><strong>Acceso y Modificación:</strong> Puede acceder a la sección "Mi Perfil" para modificar su nombre de usuario, cambiar o eliminar su foto de perfil.</li>
          <li><strong>Eliminación de Cuenta:</strong> Puede eliminar su cuenta de forma permanente en la sección "Mi Perfil". Esto borra sus datos de perfil y sus favoritos. Sus comentarios se mantendrán anónimos o serán eliminados, según la política de moderación vigente.</li>
        </ul>

        <h3>3.1. Menores de Edad</h3>
        <p>La aplicación **no realiza ningún proceso de verificación de edad** para el registro. Los usuarios que se registran a través de proveedores externos (como Google Authentication) están sujetos a las políticas de edad y términos de servicio de dichas plataformas. La Municipalidad de San Antonio Palopó no solicita ni recopila intencionalmente información personal de menores de edad.</p>
      </section>
    </div>
  );
}

export default PrivacyPage;