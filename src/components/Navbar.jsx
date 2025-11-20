import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    closeMenu(); // Cierra el menú al hacer logout
    try {
      await logout(); // Esta función está en AuthContext
      navigate('/');
    } catch (error) {
      console.error("Fallo al cerrar sesión:", error);
    }
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <>
      <div className={`hamburger ${isOpen ? 'active' : ''}`} onClick={toggleMenu}>
        <span className="bar"></span>
        <span className="bar"></span>
        <span className="bar"></span>
      </div>

      <div className={`navbar-overlay ${isOpen ? 'active' : ''}`} onClick={toggleMenu}></div>

      <nav className={`navbar-links ${isOpen ? 'active' : ''}`} aria-hidden={!isOpen}>
        <div className="navbar-logo-container">
          <Link to="/" onClick={closeMenu}>
            <img 
              src="/LogoTurismo.png" 
              alt="Logo Turismo" 
              className="navbar-logo" 
              width="105"  // CLS FIX
              height="105" // CLS FIX
            />
          </Link>
        </div>
        <NavLink to="/" onClick={closeMenu} tabIndex={isOpen ? 0 : -1} end>Inicio</NavLink>
        <NavLink to="/mapa" onClick={closeMenu} tabIndex={isOpen ? 0 : -1}>Mapa</NavLink>
        <NavLink to="/categorias"onClick={closeMenu} tabIndex={isOpen ? 0 : -1}>Sitios por Categoría</NavLink>
        <NavLink to="/eventos" onClick={closeMenu} tabIndex={isOpen ? 0 : -1}>Calendario de Eventos</NavLink>
        <NavLink to="/historia" onClick={closeMenu} tabIndex={isOpen ? 0 : -1}>Historia</NavLink>
        <NavLink to="/acerca-de" onClick={closeMenu} tabIndex={isOpen ? 0 : -1}>Acerca de</NavLink>
        {currentUser && <NavLink to="/profile" onClick={closeMenu} tabIndex={isOpen ? 0 : -1}>Mi Perfil</NavLink>}
        {currentUser && currentUser.role === 'admin' && (
          <NavLink to="/admin" onClick={closeMenu} tabIndex={isOpen ? 0 : -1}>Administrador</NavLink>
        )}
        {currentUser ? (
          <button onClick={handleLogout} className="navbar-button" tabIndex={isOpen ? 0 : -1}>Cerrar Sesión</button>
        ) : (
          <Link to="/login" className="navbar-button" onClick={closeMenu} tabIndex={isOpen ? 0 : -1}>Iniciar Sesión</Link>
        )}
        <NavLink to="/privacidad" onClick={closeMenu} tabIndex={isOpen ? 0 : -1}>Política de Privacidad</NavLink>
        <NavLink to="/terminos" onClick={closeMenu} tabIndex={isOpen ? 0 : -1}>Términos y Condiciones</NavLink>
      </nav>
    </>
  );
}

export default Navbar;