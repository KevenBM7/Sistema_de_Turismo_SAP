import React, { useState, useEffect } from 'react';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db, storage } from '../services/firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import { Link } from 'react-router-dom';

function CategoryCard({ categoryName }) {
  const [imageUrl, setImageUrl] = useState("https://placehold.co/ /EEE/31343C");

  useEffect(() => {
    const fetchCategoryImage = async () => {
      try {
        const sitesRef = collection(db, 'sites');
        const q = query(sitesRef, where('category', '==', categoryName), limit(1));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const siteData = querySnapshot.docs[0].data();
          if (siteData.imagePaths && siteData.imagePaths.length > 0) {
            const imagePath = siteData.imagePaths[0].original.replace(/(\.[^.]+)$/i, '_800x800.webp');
            const imageRef = ref(storage, imagePath);
            const downloadUrl = await getDownloadURL(imageRef);
            setImageUrl(downloadUrl);
          } else if (siteData.imageUrl) { // Fallback para URLs directas si existen
            setImageUrl(siteData.imageUrl); 
          } else {
            setImageUrl("https://placehold.co/400x250/EEE/31343C");
          }
        } else {
          setImageUrl(null); // Si no hay imagen, se establece en null
        }
      } catch (error) {
        console.error("Error fetching category image:", error);
        setImageUrl(null);
      } 
    };

    fetchCategoryImage();
  }, [categoryName]);

  return (
    // Si no se pudo encontrar una imagen para la categoría, no se renderiza la tarjeta.
    !imageUrl ? null : (
    <Link to={`/categoria/${encodeURIComponent(categoryName)}`} className="category-card-link">
      <div className="category-card">
        <img src={imageUrl} alt={categoryName} className="category-card-image" loading="lazy" />
        <div className="category-card-overlay">
          <h3>{categoryName}</h3>
        </div>
      </div>
    </Link>
    )
  );
}

export default CategoryCard;