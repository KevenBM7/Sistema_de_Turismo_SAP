import React, { useState, useEffect } from 'react';
import { collectionGroup, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Link } from 'react-router-dom';

function UserReviews({ userId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReviews = async () => {
      if (!userId) return;

      try {
        // Consulta de grupo para encontrar todos los comentarios del usuario
        const commentsQuery = query(
          collectionGroup(db, 'comments'),
          where('authorId', '==', userId),
          orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(commentsQuery);
        
        const reviewsDataPromises = querySnapshot.docs.map(async (commentDoc) => {
          // Verificamos que el comentario pertenece a un 'sitio'
          if (commentDoc.ref.parent.parent?.path.startsWith('sites/')) {
            const siteId = commentDoc.ref.parent.parent.id;
            
            // Obtener el nombre del sitio
            const siteDocRef = doc(db, 'sites', siteId);
            const siteDoc = await getDoc(siteDocRef);
            const siteName = siteDoc.exists() ? siteDoc.data().name : 'Sitio Desconocido';
            
            return {
              ...commentDoc.data(),
              id: commentDoc.id,
              siteId: siteId,
              siteName: siteName,
            };
          }
          // Si no pertenece a un sitio, lo ignoramos
          return null;
        });

        // Filtramos los resultados nulos antes de actualizar el estado
        const reviewsData = (await Promise.all(reviewsDataPromises)).filter(review => review !== null);
        setReviews(reviewsData);
      } catch (err) {
        console.error("Error al cargar las reseñas del usuario:", err);
        setError("No se pudieron cargar tus reseñas.");
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [userId]);

  if (loading) return <p>Cargando tus reseñas...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="user-reviews-list">
      {reviews.length === 0 ? (
        <p>Aún no has escrito ninguna reseña.</p>
      ) : (
        reviews.map(review => (
          <div key={review.id} className="user-review-item compact">
            <div className="review-header">
              <Link to={`/sitio/${review.siteId}`} className="review-site-name">
                {review.siteName}
              </Link>
              <span className="review-date">
                {review.createdAt?.toDate().toLocaleDateString()}
              </span>
            </div>
            <p className="review-text">"{review.text}"</p>
          </div>
        ))
      )}
    </div>
  );
}

export default UserReviews;