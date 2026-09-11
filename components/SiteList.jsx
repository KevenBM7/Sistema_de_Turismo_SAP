'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, limit as firestoreLimit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { normalizeImagePath } from '@/lib/helpers';
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

function SiteList({ categoryName, siteLimit, siteIds, initialSites, showRemoveButton, onRemoveFavorite }) {
  const [sites, setSites] = useState(initialSites || []);
  const [loading, setLoading] = useState(!initialSites);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialSites && initialSites.length > 0) {
      setSites(initialSites);
      setLoading(false);
      return;
    }

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
        
        let sitesData = snapshot.docs.map((doc) => {
          const siteData = { id: doc.id, ...doc.data() };
          
          // Normalizar imagen: tomar el original y dejar que Next.js <Image> redimensione
          if (siteData.imagePaths && siteData.imagePaths.length > 0) {
            const imageUrl = normalizeImagePath(siteData.imagePaths[0]);
            siteData.imageUrl = imageUrl || 'https://placehold.co/400x225/EEE/31343C?text=Sin+Imagen';
          } else {
            siteData.imageUrl = 'https://placehold.co/400x225/EEE/31343C?text=Sin+Imagen';
          }
          
          return siteData;
        });

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