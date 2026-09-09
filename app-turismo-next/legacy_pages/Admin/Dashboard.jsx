'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, doc, deleteDoc, collectionGroup, where } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'next/navigation'; 
import { db, storage } from '../../services/firebase'; 
import toast from 'react-hot-toast';
import AddSiteForm from '../../components/Admin/AddSiteForm';
import AddEventForm from '../../components/Admin/AddEventForm';
import ManageHomePage from '../../components/Admin/ManageHomePage';
import AdminModeration from '../../components/Admin/AdminModeration';
import '../Admin.css';
import '../../components/Buttons.css';

function Dashboard() {
  const { currentUser } = useAuth();
  const location = useLocation();
  
  const [sites, setSites] = useState([]);
  const [filteredSites, setFilteredSites] = useState([]);
  const [events, setEvents] = useState([]);
  const [activeView, setActiveView] = useState('menu'); 
  const [siteToEdit, setSiteToEdit] = useState(null);
  const [eventToEdit, setEventToEdit] = useState(null);
  const [reportedCommentsCount, setReportedCommentsCount] = useState(0); 
  
  // Estados para los filtros
  const [selectedParentCategory, setSelectedParentCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [availableSubcategories, setAvailableSubcategories] = useState([]);

  // Estados para categorías obtenidas de Firestore
  const [parentCategories, setParentCategories] = useState([]);
  const [subcategoriesByParent, setSubcategoriesByParent] = useState({});

  useEffect(() => {
    if (location.state?.view) {
      setActiveView(location.state.view);
      if (location.state.siteToEdit) {
        setSiteToEdit(location.state.siteToEdit);
      }
      if (location.state.eventToEdit) {
        setEventToEdit(location.state.eventToEdit);
      }
    }
  }, [location]);

  // Cargar la lista de sitios y extraer categorías únicas
  useEffect(() => {
    if (activeView === 'manageSites') {
      const q = query(collection(db, 'sites'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const sitesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSites(sitesData);
        setFilteredSites(sitesData);
        
        // Extraer categorías únicas
        const parentsSet = new Set();
        const subsMap = {};
        
        sitesData.forEach(site => {
          if (site.parentCategory) {
            parentsSet.add(site.parentCategory);
            if (!subsMap[site.parentCategory]) {
              subsMap[site.parentCategory] = new Set();
            }
            if (site.category) {
              subsMap[site.parentCategory].add(site.category);
            }
          }
        });
        
        setParentCategories(Array.from(parentsSet).sort());
        
        // Convertir Sets a Arrays
        const subsMapArrays = {};
        Object.keys(subsMap).forEach(parent => {
          subsMapArrays[parent] = Array.from(subsMap[parent]).sort();
        });
        setSubcategoriesByParent(subsMapArrays);
      });
      return () => unsubscribe();
    }
  }, [activeView]);

  // Cargar la lista de eventos
  useEffect(() => {
    if (activeView === 'manageEvents') {
      const q = query(collection(db, 'events'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return () => unsubscribe();
    }
  }, [activeView]);

  // Actualizar subcategorías disponibles cuando cambia la categoría padre
  useEffect(() => {
    if (selectedParentCategory) {
      setAvailableSubcategories(subcategoriesByParent[selectedParentCategory] || []);
      setSelectedSubcategory('');
    } else {
      setAvailableSubcategories([]);
      setSelectedSubcategory('');
    }
  }, [selectedParentCategory, subcategoriesByParent]);

  // Filtrar sitios cuando cambian los filtros
  useEffect(() => {
    let filtered = [...sites];

    if (selectedParentCategory) {
      filtered = filtered.filter(site => site.parentCategory === selectedParentCategory);
    }

    if (selectedSubcategory) {
      filtered = filtered.filter(site => site.category === selectedSubcategory);
    }

    setFilteredSites(filtered);
  }, [selectedParentCategory, selectedSubcategory, sites]);

  // Actualizar subcategorías disponibles cuando cambia la categoría padre
  useEffect(() => {
    if (selectedParentCategory) {
      setAvailableSubcategories(subcategoriesByParent[selectedParentCategory] || []);
      setSelectedSubcategory('');
    } else {
      setAvailableSubcategories([]);
      setSelectedSubcategory('');
    }
  }, [selectedParentCategory, subcategoriesByParent]);

  // Cargar el número de comentarios reportados
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
    setEventToEdit(null);
    // Reset filtros
    setSelectedParentCategory('');
    setSelectedSubcategory('');
  };

  const handleEditSite = (site) => {
    setSiteToEdit(site);
    setActiveView('editSite');
  };

  const handleDeleteSite = (siteId, imagePaths) => {
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

  const handleEditEvent = (event) => {
    setEventToEdit(event);
    setActiveView('editEvent');
  };

  const handleDeleteEvent = (eventId, imagePath) => {
    const performDelete = async () => {
      if (imagePath) {
        await deleteObject(ref(storage, imagePath)).catch(e => console.warn(`No se pudo borrar ${imagePath}:`, e));
      }
      await deleteDoc(doc(db, 'events', eventId));
    };

    toast((t) => (
      <div className="toast-confirmation">
        <div className="toast-content">
          <p className="toast-title">Confirmar Eliminación</p>
          <p className="toast-message">¿Seguro que quieres eliminar este evento? Esta acción es irreversible.</p>
        </div>
        <div className="toast-buttons">
          <button className="toast-button-cancel" onClick={() => toast.dismiss(t.id)}>Cancelar</button>
          <button 
            className="toast-button-confirm" 
            onClick={() => { 
              toast.dismiss(t.id); 
              toast.promise(performDelete(), { 
                loading: 'Eliminando evento...', 
                success: 'Evento eliminado con éxito.', 
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

  const handleResetFilters = () => {
    setSelectedParentCategory('');
    setSelectedSubcategory('');
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
            className="dashboard-menu-button add-button" 
            onClick={() => setActiveView('addEvent')}
          >
            <span className="button-icon">➕</span>
            <span className="button-title">Agregar Evento</span>
            <span className="button-description">Registrar una nueva feria, festival o actividad</span>
          </button>

          <button 
            className="dashboard-menu-button manage-button" 
            onClick={() => setActiveView('manageEvents')}
          >
            <span className="button-icon">🗓️</span>
            <span className="button-title">Gestionar Eventos</span>
            <span className="button-description">Ver, editar o eliminar eventos existentes</span>
          </button>

          <button 
            className="dashboard-menu-button manage-button" 
            onClick={() => setActiveView('manageComments')}
          >
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

        {/* Filtros */}
        <div className="filters-container">
          <div className="filter-group">
            <label htmlFor="parentCategory">Categoría Principal:</label>
            <select 
              id="parentCategory"
              value={selectedParentCategory}
              onChange={(e) => setSelectedParentCategory(e.target.value)}
              className="filter-select"
            >
              <option value="">Selecciona una categoría</option>
              {parentCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="subcategory">Subcategoría:</label>
            <select 
              id="subcategory"
              value={selectedSubcategory}
              onChange={(e) => setSelectedSubcategory(e.target.value)}
              className="filter-select"
              disabled={!selectedParentCategory}
            >
              <option value="">Todas las subcategorías</option>
              {availableSubcategories.map(subcategory => (
                <option key={subcategory} value={subcategory}>{subcategory}</option>
              ))}
            </select>
          </div>

          {(selectedParentCategory || selectedSubcategory) && (
            <button onClick={handleResetFilters} className="reset-filters-button">
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="manage-sites-container">
          <div className="sites-count">
            Mostrando {filteredSites.length} de {sites.length} sitios
          </div>
          <ul className="manage-sites-list">
            {filteredSites.length > 0 ? filteredSites.map(site => (
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
                  <Link href={`/categoria/${encodeURIComponent(site.parentCategory)}/${site.slug}`} 
                    className="view-button"
                  >
                    Ver
                  </Link>
                  <button 
                    onClick={() => handleEditSite(site)} 
                    className="edit-button"
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => handleDeleteSite(site.id, site.imagePaths)} 
                    className="delete-button"
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            )) : (
              <p className="no-results">
                {sites.length === 0 ? 'No hay sitios para gestionar.' : 'No se encontraron sitios con los filtros seleccionados.'}
              </p>
            )}
          </ul>
        </div>
      </div>
    );
  }

  // Vista de agregar evento
  if (activeView === 'addEvent') {
    return (
      <div className="dashboard-container">
        <header className="dashboard-header">
          <button className="back-to-menu-button" onClick={handleBackToMenu}>
            ← Volver al menú
          </button>
          <h2>Agregar Nuevo Evento</h2>
        </header>
        <AddEventForm onlyForm={true} />
      </div>
    );
  }

  // Vista de editar evento
  if (activeView === 'editEvent' && eventToEdit) {
    return (
      <div className="dashboard-container">
        <header className="dashboard-header">
          <button className="back-to-menu-button" onClick={handleBackToMenu}>
            ← Volver al menú
          </button>
          <h2>Editar Evento</h2>
        </header>
        <AddEventForm eventToEdit={eventToEdit} onlyForm={true} />
      </div>
    );
  }

  // Vista de gestionar eventos - Solo el listado
  if (activeView === 'manageEvents') {
    return (
      <div className="dashboard-container">
        <header className="dashboard-header">
          <button className="back-to-menu-button" onClick={handleBackToMenu}>
            ← Volver al menú
          </button>
          <h2>Gestionar Eventos</h2>
        </header>
        <div className="manage-sites-container">
          <ul className="manage-sites-list">
            {events.length > 0 ? events.map(event => (
              <li key={event.id} className="manage-site-item">
                <img 
                  src={(event.imageUrls && event.imageUrls[0]) || event.imageUrl || "https://placehold.co/60x60/EEE/31343C?text=Sin+Img"} 
                  alt={event.title} 
                  className="manage-site-thumbnail" 
                />
                <div className="manage-site-info">
                  <span className="manage-site-name">{event.title}</span>
                  <span className="manage-site-category">
                    {new Date(`${event.startDate}T00:00:00`).toLocaleDateString('es-ES')}
                    {event.endDate && event.endDate !== event.startDate && 
                      ` - ${new Date(`${event.endDate}T00:00:00`).toLocaleDateString('es-ES')}`
                    }
                  </span>
                </div>
                <div className="manage-site-actions">
                  <Link href={`/evento/${event.slug || event.id}`} 
                    className="view-button"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Ver
                  </Link>
                  <button 
                    onClick={() => handleEditEvent(event)} 
                    className="edit-button"
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => handleDeleteEvent(event.id, event.imageUrls?.[0] || event.imageUrl)} 
                    className="delete-button"
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            )) : <p className="no-results">No hay eventos registrados.</p>}
          </ul>
        </div>
      </div>
    );
  }

  // Vista para gestionar comentarios
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

  return null; 
}

export default Dashboard;