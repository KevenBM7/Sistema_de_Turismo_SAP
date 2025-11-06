import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import SiteList from '../components/SiteList';
import UserReviews from '../components/UserReviews';
import toast, { Toaster } from 'react-hot-toast';
function Profile() {
  const { currentUser, logout, updateProfilePicture, deleteProfilePicture, deleteUserAccount, updateDisplayName, toggleFavorite } = useAuth();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(currentUser?.displayName || '');
  const [nameChangeLoading, setNameChangeLoading] = useState(false);

  // --- SOLUCIÓN: Paginación de favoritos ---
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
      await updateProfilePicture(file); // Esta función ahora es una promesa que se resuelve
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
      // La sesión se cerrará automáticamente al eliminar el usuario.
    } catch (err) {
      console.error("Error al eliminar la cuenta:", err);
      setError('Error al eliminar la cuenta. Es posible que necesites volver a iniciar sesión para completar esta acción.');
    }
  };

  const handleNameChange = async (e) => {
    e.preventDefault();
    setNameChangeLoading(true);
    setError('');
    setMessage('');
    try {
      await updateDisplayName(newName);
      toast.success('¡Nombre actualizado con éxito!');
      setIsEditingName(false);
    } catch (err) {
      toast.error(err.message);
    }
    setNameChangeLoading(false);
  };

 const handleEditNameClick = () => {
    toast.custom((t) => (
      <div
        className={`toast-confirmation ${t.visible ? 'fade-in' : 'fade-out'}`}
      >
        <div className="toast-content">
          <p className="toast-title">Advertencia</p>
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

 // --- SOLUCIÓN: Handler para cargar más favoritos ---
 const handleLoadMoreFavorites = () => {
    setVisibleCount(prevCount => prevCount + FAVORITES_PER_PAGE);
 };

  if (!currentUser) {
    return <p>Cargando perfil...</p>;
  }

  return (
    <div className="profile-container">
      <Toaster position="top-center" /> {/* Corregido: Toaster ahora está definido */}
      <div className="profile-card">
        <h2>Perfil de Usuario</h2>
        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}
        <div className="profile-info">
          <div className="profile-photo-container">
            <img 
              src={currentUser.photoURL || 'https://placehold.co/100x100/EFEFEF/31343C?text=U'} 
              alt="Foto de perfil" 
              className="profile-photo" 
            />
            <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
            <div className="profile-photo-actions">
              <button onClick={() => fileInputRef.current.click()} disabled={uploading}>
                {uploading ? 'Subiendo...' : 'Cambiar'}
              </button>
              {currentUser.photoURL && <button onClick={deleteProfilePicture} disabled={uploading}>Eliminar</button>}
            </div>
          </div>
          <div>
            {!isEditingName ? (
              <div className="name-display-container">
                <p><strong>Nombre:</strong> {currentUser.displayName || 'No especificado'}</p>
                <button onClick={handleEditNameClick} className="edit-name-button">
                  ✏️
                </button>
              </div>
            ) : (
              <form onSubmit={handleNameChange} className="name-edit-form">
                <div className="form-group">
                  <label htmlFor="newName">Nuevo Nombre</label>
                  <input
                    id="newName"
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                <button type="button" onClick={() => setIsEditingName(false)} disabled={nameChangeLoading}>Cancelar</button>
                <button type="submit" disabled={nameChangeLoading}>{nameChangeLoading ? 'Guardando...' : 'Guardar'}</button>
              </form>
            )}
            <p><strong>Correo:</strong> {currentUser.email}</p>
            {currentUser.role === 'admin' && (
              <p><strong>Rol:</strong> <span className={`role-badge role-${currentUser.role}`}>{currentUser.role}</span></p>
            )}
          </div>
        </div>
        <div className="profile-actions">
          <button onClick={logout} className="logout-button">Cerrar Sesión</button>
          <button onClick={handleDeleteAccount} className="delete-account-button">Eliminar Cuenta</button>
        </div>
      </div>

      <div className="favorites-section">
        <h3>Mis Sitios Favoritos ❤️</h3>
        {currentUser.favorites && currentUser.favorites.length > 0 ? (
          <>
            <SiteList 
              siteIds={displayedFavorites} // SOLUCIÓN: Pasar solo los favoritos visibles
              showRemoveButton={true}
              onRemoveFavorite={toggleFavorite}
            />
            {/* SOLUCIÓN: Mostrar el botón "Ver más" si hay más favoritos por cargar */}
            {visibleCount < currentUser.favorites.length && (
              <button onClick={handleLoadMoreFavorites} className="button-primary" style={{marginTop: '2rem', maxWidth: '300px', margin: '2rem auto 0'}}>
                Ver más favoritos
              </button>
            )}
          </>
        ) : (
          <p>Aún no has guardado ningún sitio como favorito. ¡Empieza a explorar y guarda los que más te gusten!</p>
        )}
      </div>

      <div className="user-reviews-section">
        <h3>Mis Reseñas ✍️</h3>
        <UserReviews userId={currentUser.uid} />
      </div>
    </div>
  );
}

export default Profile;