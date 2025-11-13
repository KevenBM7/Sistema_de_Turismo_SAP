import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, limit as firestoreLimit } from 'firebase/firestore';
import { db, storage } from '../services/firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import SiteCard from './SiteCard';
import './SiteList.css';

function SiteCardSkeleton() {
  return (
    <div className="site-card-skeleton">
      <div className="site-image-skeleton"></div>
      <div className="site-info-skeleton">
        <div className="site-title-skeleton"></div>
        <div className="site-description-skeleton"></div>
        <div className="site-category-skeleton"></div>
      </div>
    </div>
  );
}

function SiteList({ categoryName, siteLimit, siteIds, showRemoveButton, onRemoveFavorite }) {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const fetchSites = async () => {
      let sitesCollection = collection(db, 'sites');
      let q;

      if (Array.isArray(siteIds)) {
        if (siteIds.length === 0) {
          setSites([]);
          setLoading(false);
          return;
        }
        q = query(sitesCollection, where('__name__', 'in', siteIds));
      } else {
        const constraints = [];
        if (categoryName) {
          constraints.push(where('category', '==', categoryName));
        }
        if (siteLimit) {
          constraints.push(firestoreLimit(siteLimit));
        }
        q = query(sitesCollection, ...constraints);
      }

      try {
        const snapshot = await getDocs(q);
        
        const sitesDataPromises = snapshot.docs.map(async (doc) => {
          const siteData = { id: doc.id, ...doc.data() };
          
          if (siteData.imagePaths && siteData.imagePaths.length > 0) {
            try {
              const getCleanPath = (path) => path.replace(/^gs:\/\/[\w.-]+\//, '');
              const originalPath = getCleanPath(
                typeof siteData.imagePaths[0] === 'string' 
                  ? siteData.imagePaths[0] 
                  : siteData.imagePaths[0].original
              );
              
              // Generar rutas para las 3 versiones disponibles
              const path150 = originalPath.replace(/(\.[\w\d_-]+)$/i, '_150x150.webp');
              const path800 = originalPath.replace(/(\.[\w\d_-]+)$/i, '_800x800.webp');
              const path1200 = originalPath.replace(/(\.[\w\d_-]+)$/i, '_1200x1200.webp');
              
              // CORRECCIÓN: Usar 800px como default para tarjetas (no 150px)
              const finalUrl = await getDownloadURL(ref(storage, path800))
                .catch(() => getDownloadURL(ref(storage, path1200)))
                .catch(() => getDownloadURL(ref(storage, path150)))
                .catch(() => "https://placehold.co/400x225/EEE/31343C?text=Imagen+no+encontrada");
              
              // Crear srcset responsive apropiado
              const imageUrls = { original: finalUrl };
              
              try {
                const url150 = await getDownloadURL(ref(storage, path150)).catch(() => null);
                const url800 = await getDownloadURL(ref(storage, path800)).catch(() => null);
                const url1200 = await getDownloadURL(ref(storage, path1200)).catch(() => null);
                
                // Construir srcset: 150w para móviles pequeños, 800w para tarjetas, 1200w para vistas grandes
                const srcsetParts = [];
                if (url150) srcsetParts.push(`${url150} 150w`);
                if (url800) srcsetParts.push(`${url800} 800w`);
                if (url1200) srcsetParts.push(`${url1200} 1200w`);
                
                imageUrls.srcset = srcsetParts.join(', ');
                // Sizes optimizado: 150px para móviles muy pequeños, 800px para tarjetas normales
                imageUrls.sizes = "(max-width: 480px) 150px, (max-width: 1024px) 379px, 800px";
              } catch (srcsetError) {
                console.warn(`Error generando srcset para ${siteData.id}:`, srcsetError);
                imageUrls.srcset = "";
              }
              
              siteData.imageUrls = imageUrls;
              
            } catch (e) { 
              console.warn(`No se pudo cargar la imagen para el sitio ${siteData.id}:`, e);
              siteData.imageUrls = { 
                original: "https://placehold.co/400x225/EEE/31343C?text=Sin+Imagen", 
                srcset: "",
                sizes: ""
              };
            }
          } else {
            siteData.imageUrls = { 
              original: "https://placehold.co/400x225/EEE/31343C?text=Sin+Imagen", 
              srcset: "",
              sizes: ""
            };
          }
          
          return siteData;
        });

        let sitesData = await Promise.all(sitesDataPromises);

        if (siteIds) {
          sitesData.sort((a, b) => siteIds.indexOf(a.id) - siteIds.indexOf(b.id));
        }
        
        setSites(sitesData);
      } catch (err) {
        console.error("Error al cargar sitios:", err);
        setError("No se pudieron cargar los sitios.");
      } finally {
        setLoading(false);
      }
    };

    fetchSites();
  }, [categoryName, siteLimit, siteIds]);

  if (loading) {
    const numberOfSkeletons = siteLimit || 3;
    return (
      <div className="site-list">
        {Array.from({ length: numberOfSkeletons }).map((_, index) => (
          <SiteCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  return (
    <div className="site-list">
      {sites.length === 0 ? (
        <p>Aún no hay sitios turísticos para mostrar.</p>
      ) : (
        sites.map((site, index) => (
          <SiteCard 
            key={site.id} 
            style={{ '--i': index }} // SOLUCIÓN: Añadir el índice como variable CSS para la animación escalonada
            site={site}
            showRemoveButton={showRemoveButton}
            onRemoveFavorite={onRemoveFavorite}
          />
        ))
      )}
    </div>
  );
}

export default SiteList;