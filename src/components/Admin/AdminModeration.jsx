import React, { useState, useEffect } from 'react';
import { collectionGroup, query, where, onSnapshot, doc, deleteDoc, updateDoc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

function AdminModeration() {
  const [reportedComments, setReportedComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { refreshCurrentUser } = useAuth(); // Obtener la función para refrescar el usuario

  useEffect(() => {
    // --- SOLUCIÓN: Buscar comentarios con 1 o más reportes ---
    const q = query(collectionGroup(db, 'comments'), where('reports', '>=', 1));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      // --- SOLUCIÓN: Obtener datos del sitio para cada comentario ---
      const commentsPromises = snapshot.docs.map(async (commentDoc) => {
        const siteRef = commentDoc.ref.parent.parent;
        const siteSnap = await getDoc(siteRef);
        const siteData = siteSnap.exists() ? siteSnap.data() : {};
        return {
          id: commentDoc.id,
          siteId: siteRef.id,
          siteName: siteData.name || 'Sitio Desconocido',
          siteSlug: siteData.slug,
          siteCategory: siteData.category,
          ...commentDoc.data()
        };
      });
      const comments = await Promise.all(commentsPromises);
      setReportedComments(comments);
      setLoading(false);
    }, (error) => {
      console.error("Error al cargar comentarios reportados:", error);
      toast.error("No se pudieron cargar los comentarios reportados.");
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
  const handleDismissReport = async (siteId, commentId) => {
    const commentRef = doc(db, `sites/${siteId}/comments`, commentId);
    await updateDoc(commentRef, { reports: 0, reportedBy: [] }); // Corregido
    toast.success('Reporte desestimado.');
  };

  const handleDeleteComment = async (siteId, commentId) => {
    const commentRef = doc(db, `sites/${siteId}/comments`, commentId);
    await deleteDoc(commentRef);
    toast.success('Comentario eliminado.');
  };

  const handleSuspendUser = (userId, userName) => {
    // --- SOLUCIÓN: Usar toast para confirmación de suspensión ---
    toast((t) => (
      <div className="toast-confirmation">
        <div className="toast-content">
          <p className="toast-title">Suspender a "{userName}"</p>
          <p className="toast-message">El usuario no podrá comentar durante 15 días. ¿Confirmar suspensión?</p>
        </div>
        <div className="toast-buttons">
          <button className="toast-button-cancel" onClick={() => toast.dismiss(t.id)}>Cancelar</button>
          <button 
            className="toast-button-confirm" 
            onClick={async () => { 
              toast.dismiss(t.id);
              // --- SOLUCIÓN: Calcular fecha de fin de suspensión ---
              const suspensionEndDate = new Date();
              suspensionEndDate.setDate(suspensionEndDate.getDate() + 15);

              const userRef = doc(db, 'users', userId);
              try {
                await updateDoc(userRef, { suspendedUntil: Timestamp.fromDate(suspensionEndDate) });
                await refreshCurrentUser(); // --- SOLUCIÓN: Refrescar el estado del usuario en toda la app ---
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

  // --- SOLUCIÓN: Navegar al comentario ---
  const navigate = useNavigate();
  const handleViewComment = (comment) => { // Esta función ya estaba bien
    const url = `/categoria/${comment.siteCategory}/${comment.siteSlug}#comment-${comment.id}`;
    navigate(url);
  };

  if (loading) {
    return <p>Cargando comentarios reportados...</p>;
  }

  return (
    <div className="manage-sites-container" style={{ maxWidth: '1200px' }}>
      {reportedComments.length === 0 ? (
        <p>No hay comentarios reportados en este momento. ¡Buen trabajo!</p>
      ) : (
        <div className="simple-list-container">
          <div className="simple-list-header">
            <span>Comentario</span>
            <span>Reportes</span>
            <span>Autor</span>
            <span>En Sitio</span>
            <span>Acciones</span>
          </div>
          <ul className="simple-list">
            {reportedComments.map(comment => (
              <li key={comment.id} className="simple-list-item">
                <span className="comment-text-cell">"{comment.text}"</span>
                <span className="report-count-cell">{comment.reports || 0}</span>
                <span>{comment.authorName}</span>
                <span>{comment.siteName || 'N/A'}</span> {/* Corregido */}
                <div className="moderation-actions-simple">
                  <button onClick={() => handleViewComment(comment)} className="action-view">Ver Comentario</button>
                  <button onClick={() => handleDismissReport(comment.siteId, comment.id)} className="action-dismiss">Desestimar</button>
                  <button onClick={() => handleDeleteComment(comment.siteId, comment.id)} className="action-delete">Eliminar</button>
                  {/* --- SOLUCIÓN: Pasar nombre de usuario a la función --- */}
                  <button onClick={() => handleSuspendUser(comment.authorId, comment.authorName)} className="action-suspend">Suspender</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default AdminModeration;