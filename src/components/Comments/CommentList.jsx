import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';

function CommentList({ siteId }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const commentsColRef = collection(db, 'sites', siteId, 'comments');
    const q = query(commentsColRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore Timestamp to JS Date
        createdAt: doc.data().createdAt?.toDate()
      }));
      setComments(commentsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [siteId]);

  if (loading) {
    return <p>Cargando comentarios...</p>;
  }

  return (
    <div className="comment-list-container">
      <h4>Comentarios</h4>
      {comments.length === 0 ? (
        <p>Aún no hay comentarios. ¡Sé el primero en comentar!</p>
      ) : (
        <ul className="comment-list">
          {comments.map(comment => (
            <li key={comment.id} className="comment-item">
              <div className="comment-header">
                <img 
                  src={comment.userPhotoURL || `https://ui-avatars.com/api/?name=${comment.userName}&background=random`} 
                  alt={comment.userName} 
                  className="comment-user-photo"
                />
                <span className="comment-user-name">{comment.userName}</span>
                <span className="comment-date">
                  {comment.createdAt ? new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' }).format(comment.createdAt) : ''}
                </span>
              </div>
              <p className="comment-text">{comment.text}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CommentList;