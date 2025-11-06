import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';

function AddCommentForm({ siteId }) {
  const { currentUser } = useAuth();
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError('El comentario no puede estar vacío.');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      const commentsColRef = collection(db, 'sites', siteId, 'comments');
      await addDoc(commentsColRef, {
        text: comment,
        createdAt: serverTimestamp(),
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email,
        userPhotoURL: currentUser.photoURL || null,
      });
      setComment('');
    } catch (err) {
      console.error("Error al agregar comentario:", err);
      setError('No se pudo enviar el comentario. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentUser) {
    return <p>Debes <a href="/login">iniciar sesión</a> para dejar un comentario.</p>;
  }

  return (
    <div className="add-comment-container">
      <h4>Deja un comentario</h4>
      <form onSubmit={handleSubmit}>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Escribe tu comentario aquí..." rows="4" disabled={submitting} />
        {error && <p className="error-message">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Enviando...' : 'Enviar Comentario'}
        </button>
      </form>
    </div>
  );
}

export default AddCommentForm;