import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import AddSiteForm from '../../components/Admin/AddSiteForm';
import '../../components/Buttons.css';

function EditSitePage() {
  const { id } = useParams();
  const [siteToEdit, setSiteToEdit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSite = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const docRef = doc(db, 'sites', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSiteToEdit({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError('No se encontró el sitio para editar.');
        }
      } catch (err) {
        console.error("Error al cargar el sitio para editar:", err);
        setError('Ocurrió un error al cargar el sitio.');
      } finally {
        setLoading(false);
      }
    };

    fetchSite();
  }, [id]);

  if (loading) return <p>Cargando información del sitio...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="edit-site-page-container">
      <Link to="/admin" className="back-to-menu-button">← Volver al Panel</Link>
      {siteToEdit && <AddSiteForm siteToEdit={siteToEdit} />}
    </div>
  );
}

export default EditSitePage;