'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, deleteDoc, doc, getDocs, where } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, deleteObject } from 'firebase/storage';
import { normalizeImagePath } from '@/lib/helpers';
import '../AdminForms.css';
import '../Buttons.css';

function ManageSitesList({ onEditSite }) {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    const catQuery = query(collection(db, 'categories'), orderBy('name'));
    const unsubscribeCats = onSnapshot(catQuery, (snapshot) => {
      setCategories(snapshot.docs.map(doc => doc.data().name));
    });

    const q = query(collection(db, 'sites'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      try {
        const sitesData = querySnapshot.docs.map((docSnap) => {
          const siteData = { id: docSnap.id, ...docSnap.data() };
          // Usar normalizeImagePath para obtener la URL (Next.js Image API redimensiona)
          if (siteData.imagePaths && siteData.imagePaths.length > 0) {
            siteData.adminThumbnailUrl = normalizeImagePath(siteData.imagePaths[0])
              || "https://placehold.co/60x60/EEE/31343C?text=Error";
          }
          return siteData;
        });

        setSites(sitesData);
      } catch (err) {
        console.error("Error procesando los sitios:", err);
        setError("No se pudieron cargar los datos de los sitios.");
      } finally {
        setLoading(false);
      }
    }, (err) => {
      console.error("Error al obtener los sitios:", err);
      setError("No se pudieron cargar los sitios turísticos.");
      setLoading(false);
    });

    return () => {
      unsubscribe();
      unsubscribeCats();
    };
  }, []);

  const handleDeleteSite = async (siteId, imagePaths) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este sitio? Esta acción es irreversible.')) {
      return;
    }

    try {
      // Borrar imágenes del Storage (solo originales; ya no se generan copias redimensionadas)
      if (imagePaths && imagePaths.length > 0) {
        const deletePromises = imagePaths.map(pathData => {
          let originalPath;
          if (typeof pathData === 'string') {
            originalPath = pathData;
          } else if (pathData && pathData.original) {
            originalPath = pathData.original;
          } else {
            return Promise.resolve();
          }

          return deleteObject(ref(storage, originalPath))
            .catch(e => console.warn(`No se pudo borrar ${originalPath}:`, e));
        });
        await Promise.all(deletePromises);
      }

      // Borrar comentarios asociados
      const commentsQuery = query(collection(db, 'comments'), where('siteId', '==', siteId));
      const commentsSnapshot = await getDocs(commentsQuery);
      const deleteCommentPromises = commentsSnapshot.docs.map(commentDoc => deleteDoc(doc(db, 'comments', commentDoc.id)));
      await Promise.all(deleteCommentPromises);

      await deleteDoc(doc(db, 'sites', siteId));

    } catch (err) {
      console.error("Error al eliminar el sitio:", err);
      alert('Ocurrió un error al eliminar el sitio.');
    }
  };

  if (loading) return <p>Cargando sitios...</p>;
  if (error) return <p className="error-message">{error}</p>;

  const filteredSites = sites.filter(site => {
    const matchesCategory = categoryFilter ? site.category === categoryFilter : true;
    const matchesSearch = searchTerm ? 
      site.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      site.category.toLowerCase().includes(searchTerm.toLowerCase()) : true;
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="manage-sites-container">
      <div className="admin-filters">
        <input
          type="text"
          placeholder="Buscar por nombre o categoría..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="admin-search-input"
        />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="admin-category-select">
          <option value="">Todas las categorías</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <ul className="manage-sites-list">
        {filteredSites.length > 0 ? filteredSites.map(site => (
          <li key={site.id} className="manage-site-item">
            <img 
              src={site.adminThumbnailUrl || "https://placehold.co/60x60/EEE/31343C?text=S/I"} 
              alt={site.name} 
              className="manage-site-thumbnail"
            />
            <div className="manage-site-info">
              <span className="manage-site-name">{site.name}</span>
              <span className="manage-site-category">{site.category}</span>
            </div>
            <div className="manage-site-actions">
              <Link href={`/sitio/${site.slug || site.id}`} className="view-button" target="_blank">Ver</Link>
              <button onClick={() => onEditSite(site)} className="edit-button">Editar</button>
              <button onClick={() => handleDeleteSite(site.id, site.imagePaths)} className="delete-button">Eliminar</button>
            </div>
          </li>
        )) : (
          <p style={{ textAlign: 'center', marginTop: '1rem' }}>No se encontraron sitios con los filtros aplicados.</p>
        )}
      </ul>
    </div>
  );
}

export default ManageSitesList;