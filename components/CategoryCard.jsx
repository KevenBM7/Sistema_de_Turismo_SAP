'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { normalizeImagePath } from '@/lib/helpers';
import { createSlug } from '@/lib/slugUtils';
import './CategoryCard.css';

function CategoryCard({ categoryName, imageUrl: propImageUrl }) {
  const [imageUrl, setImageUrl] = useState(propImageUrl || null);
  const [loading, setLoading] = useState(!propImageUrl);

  useEffect(() => {
    if (propImageUrl) {
      setImageUrl(propImageUrl);
      setLoading(false);
      return;
    }

    const fetchCategoryImage = async () => {
      try {
        const sitesRef = collection(db, 'sites');
        const q = query(sitesRef, where('category', '==', categoryName), limit(1));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const siteData = querySnapshot.docs[0].data();
          if (siteData.imagePaths && siteData.imagePaths.length > 0) {
            // Usar normalizeImagePath para obtener la URL original
            // Next.js <Image> se encargará del redimensionamiento
            const url = normalizeImagePath(siteData.imagePaths[0]);
            setImageUrl(url || 'https://placehold.co/400x250/EEE/31343C?text=Sin+Imagen');
          } else if (siteData.imageUrl) { // Fallback para URLs directas si existen
            setImageUrl(siteData.imageUrl);
          } else {
            setImageUrl(null);
          }
        } else {
          setImageUrl(null);
        }
      } catch (error) {
        console.error("Error fetching category image:", error);
        setImageUrl(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryImage();
  }, [categoryName]);

  // Mientras carga, mostrar skeleton
  if (loading) {
    return (
      <div className="category-card-link">
        <div className="category-card">
          <div style={{ width: '100%', height: '100%', backgroundColor: '#e0e0e0', borderRadius: '12px' }}></div>
        </div>
      </div>
    );
  }

  // Si no hay imagen, no renderizar
  if (!imageUrl) return null;

  const isPlaceholder = imageUrl.includes('placehold.co');

  return (
    <Link href={`/categoria/${createSlug(categoryName)}`} className="category-card-link">
      <div className="category-card">
        <img
          src={imageUrl}
          alt={categoryName}
          className="category-card-image"
          loading="lazy"
          decoding="async"
        />
        <div className="category-card-overlay">
          <h3>{categoryName}</h3>
        </div>
      </div>
    </Link>
  );
}

export default CategoryCard;