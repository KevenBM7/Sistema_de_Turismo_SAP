'use client';

import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import imageCompression from 'browser-image-compression';
import toast from 'react-hot-toast';
import { triggerRevalidation } from '@/lib/revalidate';
import { Layout, Sparkles, Camera, UploadCloud, Check } from 'lucide-react';
import '../AdminForms.css'; // Asegurando el CSS de Admin

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
          // Opciones de compresión para banners de Home: WebP, 1600px, 80% calidad
          const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1600, 
            useWebWorker: true,
            fileType: 'image/webp',
            initialQuality: 0.8,
          };
          
          const compressedFile = await imageCompression(file, options);
          
          // Crear un nombre de archivo que refleje WebP
          const fileName = compressedFile.name.replace(/\.[^/.]+$/, "") + '.webp';
          const imagePath = `settings/homePage_banner_${Date.now()}_${fileName}`;

          const imageRef = ref(storage, imagePath);
          const snapshot = await uploadBytes(imageRef, compressedFile, { contentType: 'image/webp' });
          return snapshot.ref.fullPath; // Devolver la ruta
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

      await triggerRevalidation('home');

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
        // Intentar obtener la URL de descarga para la vista previa
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
      {/* Header Banner */}
      <div className="form-header-banner">
        <span className="form-header-badge">
          <Layout size={13} /> Portada Principal y Bienvenida
        </span>
        <h2 className="form-header-title">
          Gestionar Portada de Inicio
        </h2>
        <p className="form-header-subtitle">
          Configura los títulos de bienvenida y las fotografías del carrusel principal que reciben a los visitantes del portal.
        </p>
      </div>

      <form onSubmit={handleSave} className="add-site-form">
        
        {/* =======================================================
            SECCIÓN 1: TEXTOS DE BIENVENIDA
            ======================================================= */}
        <div className="form-card-section">
          <div className="section-title-row">
            <div className="section-icon-pill bg-blue">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="section-card-title">1. Mensajes de Bienvenida</h3>
              <p className="section-card-desc">Frases destacadas visibles en el encabezado principal del sitio web.</p>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="welcomeText">
              Título de Bienvenida <span className="required-star">*</span>
            </label>
            <input
              type="text"
              id="welcomeText"
              value={welcomeText}
              onChange={(e) => setWelcomeText(e.target.value)}
              placeholder="Ej: Bienvenido a San Antonio Palopó"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="subText">
              Texto Secundario o Lema Turístico <span className="required-star">*</span>
            </label>
            <textarea
              id="subText"
              value={subText}
              onChange={(e) => setSubText(e.target.value)}
              placeholder="Describe el lema o bienvenida general a San Antonio Palopó..."
              rows={4}
              required
            />
          </div>
        </div>

        {/* =======================================================
            SECCIÓN 2: FOTOGRAFÍAS DE PORTADA (CARRUSEL)
            ======================================================= */}
        <div className="form-card-section">
          <div className="section-title-row">
            <div className="section-icon-pill bg-purple">
              <Camera size={20} />
            </div>
            <div>
              <h3 className="section-card-title">2. Fotografías de Portada (Carrusel)</h3>
              <p className="section-card-desc">Sube hasta 3 imágenes panorámicas de alta resolución para el carrusel de la página de inicio.</p>
            </div>
          </div>

          {currentImagePaths.length > 0 && (
            <div className="form-group">
              <label>Imágenes Actuales de Portada:</label>
              <div className="image-preview-container">
                {currentImagePaths.map((path, index) => {
                  if (imagesToDelete.includes(path)) return null;
                  return (
                    <div key={index} className="image-preview-wrapper">
                      <ImageFromPath path={path} alt={`Portada actual ${index + 1}`} className="image-preview" />
                      <button 
                        type="button" 
                        onClick={() => handleDeleteExistingImage(path)} 
                        className="delete-image-button"
                        title="Eliminar esta foto"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Subir Nuevas Fotografías de Portada (Máximo 3 en total) <span className="required-star">*</span></label>
            <div className="image-upload-dropzone">
              <input
                type="file"
                id="homeImage"
                accept="image/*"
                onChange={handleImageChange}
                disabled={saving}
                multiple
              />
              <div className="upload-dropzone-content">
                <UploadCloud size={38} className="upload-dropzone-icon" />
                <span className="upload-dropzone-title">Haz clic aquí o arrastra tus fotos de portada</span>
                <span className="upload-dropzone-hint">JPG, PNG o WebP. Se recomienda proporción panorámica (16:9).</span>
              </div>
            </div>
          </div>

          {imagePreviews.length > 0 && (
            <div className="form-group">
              <label>Nuevas imágenes a subir ({imagePreviews.length}):</label>
              <div className="image-preview-container">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="image-preview-wrapper">
                    <img key={index} src={preview} alt={`Previsualización ${index + 1}`} className="image-preview" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* =======================================================
            SECCIÓN 3: ACCIONES
            ======================================================= */}
        <div className="form-actions">
          <button type="submit" disabled={saving} className="submit-button">
            {saving ? (
              'Guardando portada...'
            ) : (
              <>
                <Check size={18} /> Guardar Cambios en Portada
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ManageHomePage;