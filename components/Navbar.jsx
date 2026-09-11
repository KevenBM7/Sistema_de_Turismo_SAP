'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { 
  Home, Map, Grid, Calendar, History, Info, 
  User, LogOut, LogIn, PlusCircle, LayoutDashboard 
} from 'lucide-react';
import './Navbar.css';

// URL de tu formulario
const SUGGEST_SITE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSdewv1slZPa1c0jhZLNioTZdbYwyPYgWp4Yq0JL5OznQSA4hg/viewform?usp=preview";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    closeMenu();
    try {
      await logout();
      router.push('/');
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

  const NavLink = ({ href, children, className, onClick, end }) => {
    const isActive = end ? pathname === href : pathname.startsWith(href);
    return (
      <Link 
        href={href} 
        onClick={onClick} 
        className={`${className} ${isActive ? 'active' : ''}`}
      >
        {children}
      </Link>
    );
  };

  return (
    <>
      <button 
        type="button"
        className={`hamburger ${isOpen ? 'active' : ''}`} 
        onClick={toggleMenu}
        aria-label={isOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
        aria-expanded={isOpen}
      >
        <span className="bar"></span>
        <span className="bar"></span>
        <span className="bar"></span>
      </button>

      <div className={`navbar-overlay ${isOpen ? 'active' : ''}`} onClick={toggleMenu}></div>

      <nav className={`navbar-links ${isOpen ? 'active' : ''}`}>
        <div className="navbar-logo-container">
          <Link href="/" onClick={closeMenu}>
            <img 
              src="/LogoTurismo.png" 
              alt="Logo Turismo" 
              className="navbar-logo" 
              width="105"
              height="105"
              loading="lazy"
              decoding="async"
            />
          </Link>
        </div>

        {/* --- GRUPO 1: PRINCIPAL --- */}
        <div className="nav-group">
          <NavLink href="/" onClick={closeMenu} className="nav-item-with-icon" end>
            <Home size={18} /> Inicio
          </NavLink>
          <NavLink href="/mapa" onClick={closeMenu} className="nav-item-with-icon">
            <Map size={18} /> Mapa Interactivo
          </NavLink>
          <NavLink href="/categorias" onClick={closeMenu} className="nav-item-with-icon">
            <Grid size={18} /> Sitios por Categoría
          </NavLink>
          <NavLink href="/eventos" onClick={closeMenu} className="nav-item-with-icon">
            <Calendar size={18} /> Eventos
          </NavLink>
        </div>

        {/* --- SEPARADOR --- */}
        <div className="nav-divider">
          <span>Información y Cultura</span>
        </div>

        {/* --- GRUPO 2: INFORMACIÓN --- */}
        <div className="nav-group secondary-group">
          <NavLink href="/historia" onClick={closeMenu} className="nav-item-with-icon">
            <History size={18} /> Historia y Cultura
          </NavLink>
          <NavLink href="/acerca-de" onClick={closeMenu} className="nav-item-with-icon">
            <Info size={18} /> Acerca de
          </NavLink>
        </div>

        {/* --- SEPARADOR --- */}
        <div className="nav-divider">
          <span>Usuario</span>
        </div>

        {/* --- GRUPO 3: USUARIO / ADMIN --- */}
        <div className="nav-group">
          {currentUser && (
            <NavLink href="/profile" onClick={closeMenu} className="nav-item-with-icon">
              <User size={18} /> Mi Perfil
            </NavLink>
          )}
          
          {currentUser && currentUser.role === 'admin' && (
            <NavLink href="/admin" onClick={closeMenu} className="nav-item-with-icon highlight-admin">
              <LayoutDashboard size={18} /> Administrador
            </NavLink>
          )}

          {/* BOTÓN DE SUGERIR SITIO */}
          <a 
            href={SUGGEST_SITE_FORM_URL}
            target="_blank" 
            rel="noopener noreferrer"
            onClick={closeMenu}
            className="nav-suggestion-link"
          >
            <PlusCircle size={18} /> Sugerir un Sitio
          </a>

          {/* LOGIN / LOGOUT */}
          {currentUser ? (
            <button onClick={handleLogout} className="navbar-button logout">
              <LogOut size={16} /> Cerrar Sesión
            </button>
          ) : (
            <Link href="/login" className="navbar-button login" onClick={closeMenu}>
              <LogIn size={16} /> Iniciar Sesión
            </Link>
          )}
        </div>

        {/* --- LEGALES (Al final, más pequeños) --- */}
        <div className="nav-legal-links">
          <NavLink href="/privacidad" onClick={closeMenu}>
             Privacidad
          </NavLink>
          <span>•</span>
          <NavLink href="/terminos" onClick={closeMenu}>
             Términos
          </NavLink>
        </div>
      </nav>
    </>
  );
}

export default Navbar;