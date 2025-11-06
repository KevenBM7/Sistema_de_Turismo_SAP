import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../services/firebase';
import imageCompression from 'browser-image-compression';
import toast from 'react-hot-toast';

function ManageHomePage() {
  const [welcomeText, setWelcomeText] = useState('');
  const [subText, setSubText] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [currentImagePaths, setCurrentImagePaths] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);;

  useEffect(() => {
    const fetchHomePageData = async () => {
      const docRef = doc(db, 'settings', 'homePage');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setWelcomeText(data.welcomeText || '');
        setSubText(data.subText || '');
        setCurrentImagePaths(data.imagePaths || data.imageUrls || []); // Compatibilidad con datos antiguos
      }
      setLoading(false);
    };
    fetchHomePageData();
  }, []);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const totalImages = (currentImagePaths.length - imagesToDelete.length) + files.length;
    if (totalImages > 3) {
      toast.error('Puedes tener un máximo de 3 imágenes en el carrusel.');
      e.target.value = null; // Limpia la selección
      return;
    }
    setImageFiles(files);
    setImagePreviews(files.map(file => URL.createObjectURL(file)));
  };
  const handleDeleteExistingImage = (path) => {
    setImagesToDelete(prev => [...prev, path]);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    // --- VALIDACIÓN DETALLADA ---
    const totalImages = (currentImagePaths.length - imagesToDelete.length) + imageFiles.length;
    if (totalImages === 0) {
      toast.error('Debes tener al menos una imagen en la portada.');
      setSaving(false);
      return;
    }

    try {
      // 1. Mantener las imágenes que no se van a borrar
      let finalImagePaths = currentImagePaths.filter(path => !imagesToDelete.includes(path));

      // 2. Eliminar de Storage las imágenes marcadas
      if (imagesToDelete.length > 0) {
        const deletePromises = imagesToDelete.map(path => deleteObject(ref(storage, path)).catch(err => console.warn("Error al borrar imagen, puede que ya no exista:", err)));
        await Promise.all(deletePromises);
      }
      // 3. Subir nuevas imágenes si las hay
      if (imageFiles.length > 0) {
        const uploadPromises = imageFiles.map(async (file) => {
          const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          };
          const compressedFile = await imageCompression(file, options);
          const imageRef = ref(storage, `settings/homePage_banner_${Date.now()}_${file.name}`);
          const snapshot = await uploadBytes(imageRef, compressedFile);
          return snapshot.ref.fullPath; // Devolver la ruta, no la URL
        });
        const newPaths = await Promise.all(uploadPromises);
        finalImagePaths.push(...newPaths);
      }
      // 4. Guardar todo en Firestore
      const docRef = doc(db, 'settings', 'homePage');
      const promise = setDoc(docRef, {
        welcomeText,
        subText,
        imagePaths: finalImagePaths, // Guardar las rutas
      });

      toast.promise(promise, { loading: 'Guardando portada...', success: '¡Portada guardada con éxito!', error: 'No se pudo guardar.' });
      await promise;

      setCurrentImagePaths(finalImagePaths);;
      setImageFiles([]);
      setImagePreviews([]);
      setImagesToDelete([]);
    } catch (error) {
      console.error("Error guardando la portada:", error);
      toast.error('Error al guardar. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  // Componente para mostrar imágenes desde sus rutas
  const ImageFromPath = ({ path, ...props }) => {
    const [url, setUrl] = useState('');

    useEffect(() => {
      if (path) {
        getDownloadURL(ref(storage, path))
          .then(setUrl)
          .catch(() => setUrl('https://placehold.co/150x100?text=Error'));
      }
    }, [path]);

    if (!url) return <div className="image-preview" style={{ backgroundColor: '#eee' }}></div>;

    return <img src={url} alt="" {...props} />;
  };

  if (loading) {
    return <p>Cargando configuración de la portada...</p>;
  }

  return (
    <div className="add-site-container">
      <h3>Gestionar Portada de Inicio</h3>
      <form onSubmit={handleSave} className="add-site-form">
        <div className="form-group">
          <label htmlFor="welcomeText">Título de Bienvenida</label>
          <input
            type="text"
            id="welcomeText"
            value={welcomeText}
            onChange={(e) => setWelcomeText(e.target.value)}
            placeholder="Ej: Bienvenido a San Antonio Palopó"
          />
        </div>
        <div className="form-group">
          <label htmlFor="subText">Texto Secundario</label>
          <textarea
            id="subText"
            value={subText}
            onChange={(e) => setSubText(e.target.value)}
            placeholder="Describe la bienvenida..."
            rows="3"
          />
        </div>
        <div className="form-group">
          <label htmlFor="homeImage">Imágenes de Portada (Carrusel, máximo 3)</label>
          <div className="image-preview-container">
            {currentImagePaths.map((path, index) => {
              if (imagesToDelete.includes(path)) return null;
              return (
                <div key={index} className="image-preview-wrapper">
                  <ImageFromPath path={path} alt={`Portada actual ${index + 1}`} className="image-preview" />
                  <button type="button" onClick={() => handleDeleteExistingImage(path)} className="delete-image-button">X</button>
                </div>
              );
            })}
          </div>
          {imagePreviews.length > 0 && (
            <div className="image-preview-container" style={{ marginTop: '1rem' }}>
              {imagePreviews.map((preview, index) => (
                <img key={index} src={preview} alt={`Previsualización ${index + 1}`} className="image-preview" />
              ))}
            </div>
          )}
          <input
            type="file"
            id="homeImage"
            accept="image/*"
            onChange={handleImageChange}
            multiple
          />
          <p className="map-instructions">Puedes eliminar imágenes existentes y/o subir nuevas (máximo 3 en total).</p>
        </div>
        <button type="submit" disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar Cambios en Portada'}
        </button>
      </form>
    </div>
  );
}

export default ManageHomePage;