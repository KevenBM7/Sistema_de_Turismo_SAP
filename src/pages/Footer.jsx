import React from 'react';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-container">
      <div className="footer-content">
        <div className="footer-section">
          <h4>Oficina de Turismo</h4>
          <p>Ubicada a un costado de la Municipalida  d.</p>
          <p>San Antonio Palopó, Sololá</p>
        </div>
        <div className="footer-section">
          <p>© {currentYear} Copyright. Todos los derechos reservados.</p>
          <p>Desarrollador: Kevin Bixcul</p>
          <p>
            <a href="https://www.facebook.com/share/17RZ2Y7kXi/" target="_blank" rel="noopener noreferrer">Kevin</a>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <a href="mailto:kevinbixcul@gmail.com" target="_blank" rel="noopener noreferrer">Contactar</a>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;