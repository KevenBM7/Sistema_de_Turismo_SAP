'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import SiteList from '../components/SiteList';
import UserReviews from '../components/UserReviews';
import toast, { Toaster } from 'react-hot-toast';
import { 
  Camera, Trash2, Edit3, Mail, Shield, User, Heart, 
  MessageSquare, LogOut, Compass, Check, X, AlertTriangle 
} from 'lucide-react';
import './Profile.css';

function Profile() {
  const { currentUser, logout, updateProfilePicture, deleteProfilePicture, deleteUserAccount, updateDisplayName, toggleFavorite } = useAuth();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(currentUser?.displayName || '');
  const [nameChangeLoading, setNameChangeLoading] = useState(false);

  // Paginación de favoritos
  const FAVORITES_PER_PAGE = 10;
  const [visibleCount, setVisibleCount] = useState(FAVORITES_PER_PAGE);
  const displayedFavorites = currentUser?.favorites?.slice(0, visibleCount) || [];
  
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError('');
    setMessage('');
    try {
      await updateProfilePicture(file);
      toast.success('¡Foto de perfil actualizada con éxito!');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Error al subir la imagen. Inténtalo de nuevo.');
    }
    setUploading(false);
  };

  const handleDeleteAccount = async () => {
    setError('');
    setMessage('');
    const confirmation = window.prompt("Esta acción es irreversible. Perderás tu perfil y tus favoritos. Escribe 'ELIMINAR' para confirmar.");
    if (confirmation !== 'ELIMINAR') {
      setMessage('Eliminación cancelada.');
      return;
    }

    try {
      await deleteUserAccount();
    } catch (err) {
      console.error("Error al eliminar la cuenta:", err);
      setError('Error al eliminar la cuenta. Es posible que necesites volver a iniciar sesión para completar esta acción.');
    }
  };

  const handleNameChange = async (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast.error('El nombre no puede estar vacío');
      return;
    }
    setNameChangeLoading(true);
    setError('');
    setMessage('');
    try {
      await updateDisplayName(newName.trim());
      toast.success('¡Nombre actualizado con éxito!');
      setIsEditingName(false);
    } catch (err) {
      toast.error(err.message);
    }
    setNameChangeLoading(false);
  };

  const handleEditNameClick = () => {
    toast.custom((t) => (
      <div className={`toast-confirmation ${t.visible ? 'fade-in' : 'fade-out'}`}>
        <div className="toast-content">
          <p className="toast-title">Cambiar nombre</p>
          <p className="toast-message">
            Solo puedes cambiar tu nombre de usuario una vez cada 30 días.
          </p>
        </div>
        <div className="toast-buttons">
          <button
            className="toast-button-cancel"
            onClick={() => toast.dismiss(t.id)}
          >
            Cancelar
          </button>
          <button
            className="toast-button-confirm"
            onClick={() => {
              toast.dismiss(t.id);
              setIsEditingName(true);
              setNewName(currentUser.displayName || '');
            }}
          >
            Continuar
          </button>
        </div>
      </div>
    ), { duration: 6000 });
  };

  const handleLoadMoreFavorites = () => {
    setVisibleCount(prevCount => prevCount + FAVORITES_PER_PAGE);
  };

  if (!currentUser) {
    return (
      <div className="profile-loading-container">
        <div className="profile-spinner"></div>
        <p>Cargando tu perfil...</p>
      </div>
    );
  }

  const favoritesCount = currentUser.favorites?.length || 0;

  return (
    <div className="profile-container">
      <Toaster position="top-center" />
      
      {/* Tarjeta Principal de Perfil (Hero) */}
      <div className="profile-hero-card">
        <div className="profile-hero-cover">
          <div className="profile-cover-pattern"></div>
        </div>

        <div className="profile-hero-body">
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar-container">
              <img 
                src={currentUser.photoURL || 'https://placehold.co/120x120/0284c7/FFFFFF?text=' + encodeURIComponent((currentUser.displayName || 'U').charAt(0).toUpperCase())} 
                alt={currentUser.displayName || 'Usuario'} 
                className="profile-avatar-img" 
              />
              {uploading && (
                <div className="profile-avatar-uploading">
                  <div className="profile-spinner small"></div>
                </div>
              )}
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              style={{ display: 'none' }} 
              accept="image/*" 
            />

            <div className="profile-avatar-actions">
              <button 
                type="button"
                className="profile-icon-btn camera"
                onClick={() => fileInputRef.current?.click()} 
                disabled={uploading}
                title="Cambiar fotografía de perfil"
                aria-label="Cambiar fotografía de perfil"
              >
                <Camera size={15} />
              </button>
              {currentUser.photoURL && (
                <button 
                  type="button"
                  className="profile-icon-btn delete"
                  onClick={deleteProfilePicture} 
                  disabled={uploading}
                  title="Eliminar fotografía de perfil"
                  aria-label="Eliminar fotografía de perfil"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </div>

          <div className="profile-hero-details">
            <div className="profile-name-row">
              {!isEditingName ? (
                <div className="profile-name-display">
                  <h1>{currentUser.displayName || 'Turista'}</h1>
                  <button 
                    type="button"
                    onClick={handleEditNameClick} 
                    className="profile-edit-name-btn"
                    title="Editar nombre de usuario"
                    aria-label="Editar nombre de usuario"
                  >
                    <Edit3 size={16} />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleNameChange} className="profile-name-edit-form">
                  <input
                    type="text"
                    className="profile-name-input"
                    value={newName}
                    autoFocus
                    placeholder="Tu nombre completo"
                    onChange={(e) => setNewName(e.target.value)}
                  />
                  <button 
                    type="submit" 
                    className="profile-name-save-btn" 
                    disabled={nameChangeLoading}
                    title="Guardar"
                  >
                    <Check size={16} />
                  </button>
                  <button 
                    type="button" 
                    className="profile-name-cancel-btn" 
                    onClick={() => setIsEditingName(false)} 
                    disabled={nameChangeLoading}
                    title="Cancelar"
                  >
                    <X size={16} />
                  </button>
                </form>
              )}
            </div>

            <div className="profile-meta-row">
              <div className="profile-meta-item">
                <Mail size={15} className="profile-meta-icon" />
                <span>{currentUser.email}</span>
              </div>
              
              <div className="profile-role-badge-wrapper">
                {currentUser.role === 'admin' ? (
                  <span className="profile-role-pill admin">
                    <Shield size={13} /> Administrador
                  </span>
                ) : (
                  <span className="profile-role-pill tourist">
                    <User size={13} /> Visitante
                  </span>
                )}
              </div>
            </div>

            {error && <p className="profile-alert error">{error}</p>}
            {message && <p className="profile-alert success">{message}</p>}
          </div>

          <div className="profile-hero-actions">
            <button 
              type="button"
              onClick={logout} 
              className="profile-btn secondary"
              title="Cerrar sesión en este dispositivo"
            >
              <LogOut size={16} /> Cerrar Sesión
            </button>
            <button 
              type="button"
              onClick={handleDeleteAccount} 
              className="profile-btn danger-subtle"
              title="Eliminar cuenta y datos permanentemente"
            >
              <AlertTriangle size={15} /> Eliminar Cuenta
            </button>
          </div>
        </div>

        {/* Barra de Estadísticas Rápidas */}
        <div className="profile-stats-bar">
          <div className="profile-stat-box">
            <div className="profile-stat-icon-wrapper heart">
              <Heart size={18} />
            </div>
            <div className="profile-stat-info">
              <span className="profile-stat-number">{favoritesCount}</span>
              <span className="profile-stat-label">Favoritos</span>
            </div>
          </div>

          <div className="profile-stat-divider"></div>

          <div className="profile-stat-box">
            <div className="profile-stat-icon-wrapper star">
              <MessageSquare size={18} />
            </div>
            <div className="profile-stat-info">
              <span className="profile-stat-number">Mis Reseñas</span>
              <span className="profile-stat-label">Comentarios en sitios</span>
            </div>
          </div>

          <div className="profile-stat-divider"></div>

          <div className="profile-stat-box">
            <div className="profile-stat-icon-wrapper compass">
              <Compass size={18} />
            </div>
            <div className="profile-stat-info">
              <span className="profile-stat-number">San Antonio Palopó</span>
              <span className="profile-stat-label">Guía Oficial</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sección de Sitios Favoritos */}
      <section className="profile-content-section">
        <div className="profile-section-header">
          <div className="profile-section-title-wrapper">
            <div className="profile-section-icon heart">
              <Heart size={20} />
            </div>
            <div>
              <h2>Mis Sitios Favoritos</h2>
              <p>Lugares turísticos, miradores y hoteles que has guardado para tu visita.</p>
            </div>
          </div>
          {favoritesCount > 0 && (
            <span className="profile-count-pill">{favoritesCount} guardados</span>
          )}
        </div>

        {favoritesCount > 0 ? (
          <div className="profile-favorites-container">
            <SiteList 
              siteIds={displayedFavorites} 
              showRemoveButton={true}
              onRemoveFavorite={toggleFavorite}
            />
            {visibleCount < favoritesCount && (
              <div className="profile-load-more-wrapper">
                <button 
                  type="button"
                  onClick={handleLoadMoreFavorites} 
                  className="profile-load-more-btn"
                >
                  Ver más favoritos ({favoritesCount - visibleCount} restantes)
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="profile-empty-state">
            <div className="profile-empty-icon-circle">
              <Compass size={36} color="#0284c7" />
            </div>
            <h3>Tu lista de favoritos está vacía</h3>
            <p>
              Explora los sitios turísticos, hoteles, talleres de cerámica y miradores de San Antonio Palopó y presiona el ícono de corazón para tenerlos a mano.
            </p>
            <Link href="/categorias" className="profile-empty-cta-btn">
              <Compass size={16} /> Explorar Atractivos Turísticos
            </Link>
          </div>
        )}
      </section>

      {/* Sección de Reseñas y Comentarios */}
      <section className="profile-content-section">
        <div className="profile-section-header">
          <div className="profile-section-title-wrapper">
            <div className="profile-section-icon review">
              <MessageSquare size={20} />
            </div>
            <div>
              <h2>Mis Reseñas y Calificaciones</h2>
              <p>Opiniones y valoraciones que has compartido con la comunidad de viajeros.</p>
            </div>
          </div>
        </div>

        <div className="profile-reviews-container">
          <UserReviews userId={currentUser.uid} />
        </div>
      </section>
    </div>
  );
}

export default Profile;