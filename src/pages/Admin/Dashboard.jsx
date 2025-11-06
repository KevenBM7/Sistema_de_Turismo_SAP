import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, doc, deleteDoc, collectionGroup, where } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { db, storage } from '../../services/firebase'; // Asegúrate de que toast esté importado
import toast from 'react-hot-toast';
import AddSiteForm from '../../components/Admin/AddSiteForm';
import AddEventForm from '../../components/Admin/AddEventForm';
import ManageHomePage from '../../components/Admin/ManageHomePage';
import AdminModeration from '../../components/Admin/AdminModeration'; // Importar el panel de moderación

function Dashboard() {
  const { currentUser } = useAuth();
  const location = useLocation();
  
  const [sites, setSites] = useState([]);
  // Estados para controlar qué vista mostrar
  const [activeView, setActiveView] = useState('menu'); // 'menu', 'home', 'addSite', 'editSite', 'manageSites', 'manageEvents', 'manageComments'
  const [siteToEdit, setSiteToEdit] = useState(null);
  const [reportedCommentsCount, setReportedCommentsCount] = useState(0); // Estado para la notificación

  // Detectar si venimos de "Editar sitio" desde ManageSitesList
  useEffect(() => {
    if (location.state?.view) {
      setActiveView(location.state.view);
      if (location.state.siteToEdit) {
        setSiteToEdit(location.state.siteToEdit);
      }
    }
  }, [location]);

  // Cargar la lista de sitios para la vista "Gestionar Sitios"
  useEffect(() => {
    if (activeView === 'manageSites') {
      const q = query(collection(db, 'sites'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setSites(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return () => unsubscribe();
    }
  }, [activeView]);

  // SOLUCIÓN: Cargar el número de comentarios reportados para la notificación
  useEffect(() => {
    const q = query(collectionGroup(db, 'comments'), where('reports', '>=', 1));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReportedCommentsCount(snapshot.size);
    });
    return () => unsubscribe();
  }, []);


  const handleBackToMenu = () => {
    setActiveView('menu');
    setSiteToEdit(null);
  };

  const handleEditSite = (site) => {
    setSiteToEdit(site);
    setActiveView('editSite');
  };

  const handleDeleteSite = (siteId, imagePaths, siteRoutes) => {
    // La lógica de borrado ahora está dentro de esta función, que solo se llama al confirmar.
    const performDelete = async () => {
      // 1. Eliminar imágenes de Storage
      if (imagePaths && imagePaths.length > 0) {
        const deleteImagePromises = imagePaths.flatMap(pathData => {
          const originalPath = typeof pathData === 'string' ? pathData : pathData.original;
          if (!originalPath) return [];
          return [
            deleteObject(ref(storage, originalPath)).catch(e => console.warn(`No se pudo borrar ${originalPath}:`, e)),
            deleteObject(ref(storage, originalPath.replace(/(\.[^.]+)$/i, '_150x150.webp'))).catch(e => console.warn(`No se pudo borrar miniatura 150:`, e)),
            deleteObject(ref(storage, originalPath.replace(/(\.[^.]+)$/i, '_800x800.webp'))).catch(e => console.warn(`No se pudo borrar miniatura 800:`, e)),
          ];
        });
        await Promise.all(deleteImagePromises);
      }
      // 2. Eliminar documento de Firestore
      await deleteDoc(doc(db, 'sites', siteId));
    };

    toast((t) => (
      <div className="toast-confirmation">
        <div className="toast-content">
          <p className="toast-title">Confirmar Eliminación</p>
          <p className="toast-message">¿Seguro que quieres eliminar este sitio? Esta acción es irreversible.</p>
        </div>
        <div className="toast-buttons">
          <button className="toast-button-cancel" onClick={() => toast.dismiss(t.id)}>Cancelar</button>
          <button 
            className="toast-button-confirm" 
            onClick={() => { 
              toast.dismiss(t.id); 
              toast.promise(performDelete(), { 
                loading: 'Eliminando sitio...', 
                success: 'Sitio eliminado con éxito.', 
                error: 'No se pudo eliminar.' 
              }); 
            }}
          >
            Confirmar
          </button>
        </div>
      </div>
    ), { duration: 6000 });
  };

  // Vista del menú principal
  if (activeView === 'menu') {
    return (
      <div className="dashboard-container">
        <header className="dashboard-header">
          <h2>Panel de Administración</h2>
          <p>¡Bienvenido, {currentUser.displayName || currentUser.email}!</p>
        </header>

        <div className="dashboard-menu">
          <button 
            className="dashboard-menu-button home-button"
            onClick={() => setActiveView('home')}
          >
            <span className="button-icon">🏠</span>
            <span className="button-title">Configurar Portada</span>
            <span className="button-description">Editar imagen y texto de la página principal</span>
          </button>

          <button 
            className="dashboard-menu-button add-button"
            onClick={() => setActiveView('addSite')}
          >
            <span className="button-icon">➕</span>
            <span className="button-title">Agregar Sitio Turístico</span>
            <span className="button-description">Registrar un nuevo lugar turístico</span>
          </button>

          <button 
            className="dashboard-menu-button manage-button"
            onClick={() => setActiveView('manageSites')}
          >
            <span className="button-icon">📋</span>
            <span className="button-title">Gestionar Sitios</span>
            <span className="button-description">Ver, editar o eliminar sitios existentes</span>
          </button>

          <button 
            className="dashboard-menu-button add-button" // Puedes crear un color específico si quieres
            onClick={() => setActiveView('manageEvents')}
          >
            <span className="button-icon">🗓️</span>
            <span className="button-title">Gestionar Eventos</span>
            <span className="button-description">Añade o elimina ferias, festivales y actividades.</span>
          </button>

          {/* --- SOLUCIÓN: Nueva tarjeta para moderación de comentarios --- */}
          <button 
            className="dashboard-menu-button manage-button" // Puedes crear un color específico si quieres
            onClick={() => setActiveView('manageComments')}
          >
            {/* --- SOLUCIÓN: Notificación de alerta --- */}
            {reportedCommentsCount > 0 && (
              <span className="notification-badge">{reportedCommentsCount}</span>
            )}
            <span className="button-icon">👮‍♂️</span>
            <span className="button-title">Gestionar Comentarios</span>
            <span className="button-description">Revisa y modera los comentarios reportados por los usuarios.</span>
          </button>

        </div>
      </div>
    );
  }

  // Vista de configurar portada
  if (activeView === 'home') {
    return (
      <div className="dashboard-container">
        <header className="dashboard-header">
          <button className="back-to-menu-button" onClick={handleBackToMenu}>
            ← Volver al menú
          </button>
          <h2>Configurar Portada</h2>
        </header>
        <ManageHomePage />
      </div>
    );
  }

  // Vista de agregar sitio
  if (activeView === 'addSite') {
    return (
      <div className="dashboard-container">
        <header className="dashboard-header">
          <button className="back-to-menu-button" onClick={handleBackToMenu}>
            ← Volver al menú
          </button>
          <h2>Agregar Nuevo Sitio Turístico</h2>
        </header>
        <AddSiteForm />
      </div>
    );
  }

  // Vista de editar sitio
  if (activeView === 'editSite' && siteToEdit) {
    return (
      <div className="dashboard-container">
        <header className="dashboard-header">
          <button className="back-to-menu-button" onClick={handleBackToMenu}>
            ← Volver al menú
          </button>
          <h2>Editar Sitio Turístico</h2>
        </header>
        <AddSiteForm siteToEdit={siteToEdit} />
      </div>
    );
  }

  // Vista de gestionar sitios
  if (activeView === 'manageSites') {
    return (
      <div className="dashboard-container">
        <header className="dashboard-header">
          <button className="back-to-menu-button" onClick={handleBackToMenu}>
            ← Volver al menú
          </button>
          <h2>Gestionar Sitios Turísticos</h2>
        </header>
        <div className="manage-sites-container" style={{ maxWidth: '1000px' }}>
          <ul className="manage-sites-list">
            {sites.length > 0 ? sites.map(site => (
              <li key={site.id} className="manage-site-item">
                <img 
                  src={(site.imagePaths && site.imagePaths.length > 0 && `https://firebasestorage.googleapis.com/v0/b/${storage.app.options.storageBucket}/o/${encodeURIComponent(site.imagePaths[0].original.replace(/(\.[^.]+)$/i, '_150x150.webp'))}?alt=media`) || "https://placehold.co/60x60/EEE/31343C?text=Sin+Img"} 
                  alt={site.name} 
                  className="manage-site-thumbnail" 
                />
                <div className="manage-site-info">
                  <span className="manage-site-name">{site.name}</span>
                  <span className="manage-site-category">{site.category}</span>
                </div>
                <div className="manage-site-actions">
                  <a href={`/categoria/${encodeURIComponent(site.parentCategory)}/${site.slug}`} target="_blank" rel="noopener noreferrer" className="view-button">Ver</a>
                  <button 
                    onClick={() => handleEditSite(site)} 
                    className="edit-button"
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => handleDeleteSite(site.id, site.imagePaths, site.routes)} 
                    className="delete-button"
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            )) : <p>No hay sitios para gestionar.</p>}
          </ul>
        </div>
      </div>
    );
  }

  // Vista de gestionar eventos
  if (activeView === 'manageEvents') {
    return (
      <div className="dashboard-container">
        <header className="dashboard-header">
          <button className="back-to-menu-button" onClick={handleBackToMenu}>
            ← Volver al menú
          </button>
          <h2>Gestionar Eventos</h2>
        </header>
        <AddEventForm />
      </div>
    );
  }

  // --- SOLUCIÓN: Vista para gestionar comentarios ---
  if (activeView === 'manageComments') {
    return (
      <div className="dashboard-container">
        <header className="dashboard-header">
          <button className="back-to-menu-button" onClick={handleBackToMenu}>
            ← Volver al menú
          </button>
          <h2>Gestionar Comentarios Reportados</h2>
          <p>Revisa, desestima o elimina comentarios que han sido reportados por los usuarios.</p>
        </header>
        <AdminModeration />
      </div>
    );
  }

  return null; // Retorno por defecto si ninguna vista coincide
}

export default Dashboard;