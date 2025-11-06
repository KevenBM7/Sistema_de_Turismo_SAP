import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, serverTimestamp, doc, setDoc, getDoc, deleteDoc, orderBy, updateDoc, increment, arrayUnion, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const Star = ({ filled, onClick }) => (
  <span onClick={onClick} style={{ cursor: 'pointer', color: filled ? '#ffc107' : '#e4e5e9', fontSize: '2rem' }} onKeyDown={(e) => e.key === 'Enter' && onClick()} role="button" tabIndex={0}>
    ★
  </span>
);

function Comments({ siteId, onRatingUpdate }) {
  const { currentUser, refreshCurrentUser } = useAuth(); // Obtener refreshCurrentUser
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cargar comentarios
  useEffect(() => {
    const q = query(collection(db, `sites/${siteId}/comments`), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setComments(commentsData);
      setLoading(false);
    }, (err) => {
      console.error("Error al cargar comentarios:", err);
      setError("No se pudieron cargar los comentarios.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [siteId]);

  // Cargar calificaciones y calcular promedio
  useEffect(() => {
    const ratingsColRef = collection(db, `sites/${siteId}/ratings`);
    const unsubscribe = onSnapshot(ratingsColRef, (snapshot) => {
      if (snapshot.empty) {
        onRatingUpdate(0, 0);
        return;
      }
      let total = 0;
      snapshot.forEach(doc => {
        total += doc.data().rating;
      });
      const avg = total / snapshot.size;
      onRatingUpdate(avg, snapshot.size);
    });

    return () => unsubscribe();
  }, [siteId, onRatingUpdate]);

  // Cargar la calificación existente del usuario
  useEffect(() => {
    if (currentUser) {
      const getRating = async () => {
        const ratingDocRef = doc(db, `sites/${siteId}/ratings`, currentUser.uid);
        const ratingSnap = await getDoc(ratingDocRef);
        if (ratingSnap.exists()) {
          setRating(ratingSnap.data().rating);
        }
      };
      getRating();
    }
  }, [siteId, currentUser]);

  const handleRating = async (newRating) => {
    if (!currentUser) {
      setError("Debes iniciar sesión para calificar.");
      return;
    }

    const ratingDocRef = doc(db, `sites/${siteId}/ratings`, currentUser.uid);

    // Si el usuario hace clic en la misma estrella, se elimina la calificación.
    if (newRating === rating) {
      setRating(0); // Resetea el estado local a 0 estrellas
      await deleteDoc(ratingDocRef); // Elimina el documento de la calificación en Firestore
      toast.success('Calificación eliminada.');
    } else {
      // Si es una nueva calificación, la establece.
      setRating(newRating);
      await setDoc(ratingDocRef, { rating: newRating, userId: currentUser.uid });
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) {
      setError("El comentario no puede estar vacío.");
      return;
    }
    if (!currentUser) {
      setError("Debes iniciar sesión para comentar.");
      return;
    }
    // --- SOLUCIÓN: Verificar si el usuario está suspendido ---
    // Comprueba si existe una fecha de suspensión y si es posterior a la fecha actual.
    if (currentUser.suspendedUntil && currentUser.suspendedUntil.toDate() > new Date()) {
      const endDate = currentUser.suspendedUntil.toDate().toLocaleDateString('es-ES');
      setError(
        `Tu cuenta está suspendida hasta el ${endDate}. No puedes publicar comentarios.`
      );
      return;
    }

    try {
      await addDoc(collection(db, `sites/${siteId}/comments`), {
        text: newComment,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || currentUser.email,
        authorPhotoURL: currentUser.photoURL,
        createdAt: serverTimestamp(),
      });
      setNewComment('');
      setError('');
    } catch (err) {
      console.error("Error al agregar comentario:", err);
      setError("No se pudo guardar el comentario.");
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este comentario?")) return;
    try {
      await deleteDoc(doc(db, `sites/${siteId}/comments`, commentId));
    } catch (err) {
      console.error("Error al eliminar comentario:", err);
      setError("No se pudo eliminar el comentario.");
    }
  };

  const handleReportComment = async (commentId) => {
    if (!currentUser) {
      toast.error("Debes iniciar sesión para reportar un comentario.");
      return;
    }

    // --- SOLUCIÓN: Usar toast para confirmación ---
    toast((t) => (
      <div className="toast-confirmation">
        <p className="toast-message">¿Seguro que quieres reportar este comentario como ofensivo?</p>
        <div className="toast-buttons">
          <button className="toast-button-cancel" onClick={() => toast.dismiss(t.id)}>Cancelar</button>
          <button 
            className="toast-button-confirm" 
            onClick={async () => { 
              toast.dismiss(t.id);
              const commentRef = doc(db, `sites/${siteId}/comments`, commentId);
              await updateDoc(commentRef, { reports: increment(1), reportedBy: arrayUnion(currentUser.uid) });
              toast.success("Comentario reportado. Gracias por tu ayuda.");
            }}
          >
            Reportar
          </button>
        </div>
      </div>
    ), { duration: 6000 });
  };

  // --- SOLUCIÓN: Función para suspender desde los comentarios ---
  const handleSuspendFromComment = (userId, userName) => {
    toast((t) => (
      <div className="toast-confirmation">
        <p className="toast-title">Suspender a "{userName}"</p>
        <p className="toast-message">El usuario no podrá comentar durante 15 días. ¿Confirmar?</p>
        <div className="toast-buttons">
          <button className="toast-button-cancel" onClick={() => toast.dismiss(t.id)}>Cancelar</button>
          <button 
            className="toast-button-confirm" 
            onClick={async () => { 
              toast.dismiss(t.id);
              const suspensionEndDate = new Date();
              suspensionEndDate.setDate(suspensionEndDate.getDate() + 15);
              const userRef = doc(db, 'users', userId);
              try {
                await updateDoc(userRef, { suspendedUntil: Timestamp.fromDate(suspensionEndDate) });
                await refreshCurrentUser();
                toast.success(`Usuario ${userName} suspendido por 15 días.`);
              } catch (error) {
                console.error("Error al suspender usuario:", error);
                toast.error('No se pudo suspender al usuario.');
              }
            }}
          >
            Suspender
          </button>
        </div>
      </div>
    ), { duration: 8000 });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Justo ahora';
    return timestamp.toDate().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="comments-section">
      <h3>Comentarios</h3>

      {/* Formulario para agregar comentario y calificación */}
      <div className="add-comment-container">
        {currentUser ? (
          currentUser.suspendedUntil && currentUser.suspendedUntil.toDate() > new Date() ? (
            <p className="error-message">
              Tu cuenta está suspendida y no puedes publicar nuevos comentarios hasta el 
              {' ' + currentUser.suspendedUntil.toDate().toLocaleDateString('es-ES', {day: 'numeric', month: 'long'})}.
            </p>
          ) : (<form onSubmit={handleSubmitComment}>
            <h4>Deja tu reseña</h4>
            <div className="rating-input">
              <p>Tu calificación:</p>
              <div>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    filled={star <= (hoverRating || rating)}
                    onClick={() => handleRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                  />
                ))}
              </div>
            </div>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Escribe tu comentario siempre desde el respeto..."
              rows="4"
            />
            <button type="submit">Publicar Comentario</button>
          </form>)
        ) : (
          <div className="login-prompt">
            <p>Inicia sesión para dejar un comentario o reseña.</p>
            <Link to="/login" className="button-primary">Iniciar Sesión</Link>
          </div>
        )}
        {error && <p className="error-message">{error}</p>}
      </div>

      {/* Lista de comentarios */}
      <div className="comment-list-container">
        {loading ? (
          <p>Cargando comentarios...</p>
        ) : comments.length > 0 ? (
          <ul className="comment-list">
            {comments.map(comment => (
              <li key={comment.id} id={`comment-${comment.id}`} className="comment-item">
                <div className="comment-header">
                  <img
                    src={comment.authorPhotoURL || 'https://placehold.co/40x40/EFEFEF/31343C?text=U'}
                    alt={comment.authorName}
                    className="comment-user-photo"
                  />
                  <span className="comment-user-name">{comment.authorName}</span>
                  <span className="comment-date">{formatDate(comment.createdAt)}</span>
                  {currentUser && (currentUser.uid === comment.authorId || currentUser.role === 'admin') && (
                    <button onClick={() => handleDeleteComment(comment.id)} className="delete-comment-button">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                        <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                      </svg>
                    </button>
                  )}
                  {/* --- SOLUCIÓN: Botón de Reportar --- */}
                  {currentUser && currentUser.uid !== comment.authorId && !comment.reportedBy?.includes(currentUser.uid) && (
                    <button onClick={() => handleReportComment(comment.id)} className="report-button" title="Reportar comentario ofensivo">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                      </svg>
                    </button>
                  )}
                  {comment.reportedBy?.includes(currentUser.uid) && (
                    <span className="reported-badge">Reportado</span>
                  )}
                  {/* --- SOLUCIÓN: Botón de suspender para admin --- */}
                  {currentUser && currentUser.role === 'admin' && currentUser.uid !== comment.authorId && (
                    <button onClick={() => handleSuspendFromComment(comment.authorId, comment.authorName)} className="suspend-comment-button" title="Suspender usuario por 15 días">
                      🚫
                    </button>
                  )}
                </div>
                <p className="comment-text">{comment.text}</p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="no-comments-message">
            <p>Aún no hay comentarios. ¡Sé el primero en comentar!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Comments;