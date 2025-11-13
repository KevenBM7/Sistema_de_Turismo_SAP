import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, serverTimestamp, onSnapshot, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytesResumable, deleteObject, getDownloadURL } from 'firebase/storage';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, LayersControl, GeoJSON, LayerGroup } from 'react-leaflet';
import { useAuth } from '../../context/AuthContext';
import imageCompression from 'browser-image-compression';
import RichTextEditor from './RichTextEditor'; // Importamos el nuevo editor
import toast from 'react-hot-toast';
import slugify from 'slugify'; // Importamos la librería para generar slugs
import { db, storage } from '../../services/firebase';
import '../AdminForms.css';
import '../Forms.css';
import '../Buttons.css';


// --- CORRECCIÓN PARA ICONOS DE LEAFLET ---
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });

function AddSiteForm({ siteToEdit }) {
  const isEditMode = !!siteToEdit;

  const [siteId, setSiteId] = useState(siteToEdit?.id || null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState(''); // Nuevo estado para el slug
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [longitude, setLongitude] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [parentCategory, setParentCategory] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [markerPosition, setMarkerPosition] = useState(null);
  const mapCenter = [14.70, -91.13];
  const [existingImagePaths, setExistingImagePaths] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  

  useEffect(() => {
    if (isEditMode && siteToEdit) {
      setSiteId(siteToEdit.id);
      const siteName = siteToEdit.name || '';
      setName(siteName);
      // Si el sitio ya tiene un slug, lo usamos. Si no, lo generamos.
      setSlug(siteToEdit.slug || slugify(siteName, { lower: true, strict: true }));
      setDescription(siteToEdit.description_es || siteToEdit.description || ''); // Compatibilidad con datos antiguos
      setAddress(siteToEdit.address || '');
      setLatitude(siteToEdit.latitude || '');
      setWhatsapp(siteToEdit.whatsapp || '');
      setFacebook(siteToEdit.facebook || '');
      setInstagram(siteToEdit.instagram || '');
      setLongitude(siteToEdit.longitude || '');
      setSelectedCategory(siteToEdit.category || '');
      setParentCategory(siteToEdit.parentCategory || '');
      
      const imagePaths = Array.isArray(siteToEdit.imagePaths) ? siteToEdit.imagePaths : [];
      setExistingImagePaths(imagePaths);
      
      if (siteToEdit.latitude && siteToEdit.longitude) {
        setMarkerPosition([siteToEdit.latitude, siteToEdit.longitude]);
      }
    } else {
      setSiteId(null);
      setName('');
      setSlug('');
      setDescription('');
      setAddress('');
      setLatitude('');
      setLongitude('');
      setWhatsapp('');
      setFacebook('');
      setInstagram('');
      setParentCategory('');
      setSelectedCategory('');
      setNewCategory('');
      setExistingImagePaths([]);
      setImageFiles([]);
      setImagePreviews([]);
      setMarkerPosition(null);;
    }
  }, [isEditMode, siteToEdit]);

  const handleNameChange = (e) => {
    const newName = e.target.value;
    setName(newName);
    setSlug(slugify(newName, { lower: true, strict: true }));
  };

  // Función para quitar una imagen recién seleccionada (de la previsualización)
  const handleRemoveNewImage = (indexToRemove) => {
    // Limpiar la URL de la previsualización para liberar memoria
    URL.revokeObjectURL(imagePreviews[indexToRemove]);

    // Filtrar tanto las previsualizaciones como los archivos
    setImagePreviews(prev => prev.filter((_, index) => index !== indexToRemove));
    setImageFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const resetForm = () => {
    setName('');
    setSlug('');
    setDescription('');
    setAddress('');
    setLatitude('');
    setLongitude('');
    setWhatsapp('');
    setFacebook('');
    setInstagram('');
    setParentCategory('');
    setSelectedCategory('');
    setNewCategory('');
    setImageFiles([]);
    setImagePreviews([]);
    setExistingImagePaths([]);
    setImagesToDelete([]);
    setMarkerPosition(null);;
    setSiteId(null); // Asegura que salimos del modo edición
  };

  const handleImageChange = (e) => {
    if (!e.target.files || e.target.files.length === 0) {
      setImageFiles([]);
      setImagePreviews([]);
      return;
    }

    const files = Array.from(e.target.files).filter(file => {
      if (!file || !file.name) {
        console.warn("Archivo inválido detectado y filtrado");
        return false;
      }
      return true;
    });

    if ((existingImagePaths.length - imagesToDelete.length + files.length) > 3) {
      toast.error(`Puedes tener un máximo de 3 imágenes. Ya tienes ${existingImagePaths.length - imagesToDelete.length}.`);
      e.target.value = null;
      setImageFiles([]);
      setImagePreviews([]);
      return;
    }

    if (files.length === 0) {
      setImageFiles([]);
      setImagePreviews([]);
      return;
    }

    try {
      const previewUrls = files.map(file => {
        if (!file) return null;
        return URL.createObjectURL(file);
      }).filter(url => url !== null);
      
      setImagePreviews(previewUrls);
      setImageFiles(files);
    } catch (err) {
      console.error("Error al crear previsualizaciones:", err);
      toast.error("Error al cargar las imágenes seleccionadas");
      setImageFiles([]);
      setImagePreviews([]);
    }
  };

  const uploadFile = (file, path) => {
    if (!file) {
      console.error("uploadFile: file es undefined");
      return Promise.reject(new Error("Archivo inválido"));
    }
    if (!path || typeof path !== 'string') {
      console.error("uploadFile: path es inválido:", path);
      return Promise.reject(new Error("Ruta de almacenamiento inválida"));
    }

    try {
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => { /* No hacemos seguimiento del progreso aquí */ },
          (error) => {
            console.error("Error en uploadTask.on:", error);
            reject(error);
          },
          () => {
            if (!uploadTask.snapshot || !uploadTask.snapshot.ref) {
              console.error("uploadTask.snapshot o snapshot.ref es undefined");
              reject(new Error("No se pudo obtener la referencia de la subida"));
              return;
            }

            const uploadedPath = uploadTask.snapshot.ref.fullPath;

            if (!uploadedPath || typeof uploadedPath !== 'string') {
              console.error("fullPath es inválido:", uploadedPath);
              reject(new Error("No se pudo obtener la ruta de la imagen subida"));
              return;
            }

            resolve(uploadedPath);
          }
        );
      });
    } catch (err) {
      console.error("Error al crear la tarea de subida:", err);
      return Promise.reject(err);
    }
  };

  const handleDeleteExistingImage = (pathToDelete) => {
    setImagesToDelete([...imagesToDelete, pathToDelete]);
  };

  const deleteImagesFromStorage = async (paths) => {
    const deletePromises = paths.flatMap(pathData => {
      let originalPath;      
      
      if (typeof pathData === 'string') {
        originalPath = pathData;
      } else if (pathData && pathData.original) {
        originalPath = pathData.original;
      } else {
        console.warn("pathData inválido:", pathData);
        return [];
      }

      if (!originalPath) return [];

      return [
        deleteObject(ref(storage, originalPath)).catch(e => console.warn(`No se pudo borrar ${originalPath}:`, e)),
        deleteObject(ref(storage, originalPath.replace(/(\.[^.]+)$/i, '_150x150.webp'))).catch(e => console.warn(`No se pudo borrar miniatura 150:`, e)),
        deleteObject(ref(storage, originalPath.replace(/(\.[^.]+)$/i, '_800x800.webp'))).catch(e => console.warn(`No se pudo borrar miniatura 800:`, e)),
        deleteObject(ref(storage, originalPath.replace(/(\.[^.]+)$/i, '_1200x1200.webp'))).catch(e => console.warn(`No se pudo borrar miniatura 1200:`, e)),
      ];
    });
    await Promise.all(deletePromises);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser || currentUser.role !== 'admin') {
      toast.error('No tienes permiso para realizar esta acción.');
      return;
    }

    const finalCategory = selectedCategory === 'otro' ? newCategory.trim() : selectedCategory;
    const totalImages = (Array.isArray(existingImagePaths) ? existingImagePaths.length : 0 - imagesToDelete.length) + imageFiles.length;

    // --- VALIDACIÓN DETALLADA ---
    if (!name.trim()) { toast.error('El nombre del sitio es obligatorio.'); return; }
    if (!slug.trim()) { toast.error('El slug (generado del nombre) no puede estar vacío.'); return; }
    if (!description.trim() || description === '<p></p>') { toast.error('La descripción es obligatoria.'); return; }
    if (!parentCategory) { toast.error('Debes seleccionar una categoría principal.'); return; }
    if (!finalCategory) { toast.error('Debes seleccionar o crear una subcategoría.'); return; }
    if (!address.trim()) { toast.error('La dirección es obligatoria.'); return; }
    if (!latitude || !longitude) { toast.error('Debes seleccionar una ubicación en el mapa.'); return; }
    if (totalImages === 0) { toast.error('Debes agregar al menos una imagen.'); return; }
    if (totalImages > 3) { toast.error('No puedes tener más de 3 imágenes en total.'); return; }

    setUploading(true);

    try {
      // Si es una nueva categoría, la guardamos primero
      if (selectedCategory === 'otro' && finalCategory) {
        const categoryExists = categories.some(cat => cat.name.toLowerCase() === finalCategory.toLowerCase());
        if (!categoryExists) {
          await addDoc(collection(db, 'categories'), { name: finalCategory });
        }
      }

      // Procesar imágenes nuevas
      let newImagePaths = [];

      if (imageFiles.length > 0) {
        imagePreviews.forEach(url => URL.revokeObjectURL(url));

        const imageProcessingPromises = imageFiles.map(async (file, index) => {
          try {
            if (!file || !file.name) {
              throw new Error(`Archivo inválido en posición ${index}`);
            }

            const timestamp = Date.now();
            const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const fileName = `${timestamp}_${index}_${sanitizedName}`;

            const mainImageOptions = {
              maxSizeMB: 2,
              maxWidthOrHeight: 1600,
              useWebWorker: true,
            };

            const compressedMain = await imageCompression(file, mainImageOptions);

            if (!compressedMain) {
              throw new Error(`No se pudo comprimir la imagen: ${fileName}`);
            }

            const originalPath = `sites/originals/${fileName}`;
            const uploadedPath = await uploadFile(compressedMain, originalPath);

            if (!uploadedPath || typeof uploadedPath !== 'string') {
              throw new Error(`No se pudo obtener la ruta de subida para: ${fileName}`);
            }

            return { original: uploadedPath };
          } catch (err) {
            console.error(`Error procesando imagen ${index}:`, err);
            throw err;
          }
        });

        newImagePaths = await Promise.all(imageProcessingPromises);
      }

      // Lógica para modo edición
      if (isEditMode) {
        if (!siteId) {
          throw new Error("ID del sitio no está disponible. No se puede actualizar.");
        }

        const remainingExistingImages = existingImagePaths.filter(path =>
          !imagesToDelete.some(deleteItem => {
            if (typeof deleteItem === 'string') {
              return typeof path === 'string' ? path === deleteItem : path.original === deleteItem;
            } else if (deleteItem && deleteItem.original) {
              return typeof path === 'string' ? path === deleteItem.original : path.original === deleteItem.original;
            }
            return false;
          })
        );

        const finalImagePaths = [...remainingExistingImages, ...newImagePaths];

        const siteRef = doc(db, 'sites', siteId);
        const updatePromise = updateDoc(siteRef, {
          name, 
          slug,
          name_lowercase: name.toLowerCase(),
          description: description, // Usar el campo unificado
          address, 
          category: finalCategory,
          whatsapp,
          facebook,
          instagram,
          latitude: Number(latitude),
          longitude: Number(longitude),
          imagePaths: finalImagePaths,
          parentCategory
        });

        toast.promise(updatePromise, { loading: 'Actualizando sitio...', success: '¡Sitio actualizado con éxito!', error: 'No se pudo actualizar el sitio.' });
        await updatePromise;
        // Borrar imágenes antiguas
        if (imagesToDelete.length > 0) {
          deleteImagesFromStorage(imagesToDelete).catch(err => 
            console.error("Error al eliminar imágenes antiguas:", err)
          );
        }

      } else {
        // Lógica para modo creación
        const addPromise = addDoc(collection(db, 'sites'), {
          name,
          slug,
          name_lowercase: name.toLowerCase(),
          description: description, // Usar el campo unificado
          address,
          latitude: Number(latitude),
          whatsapp,
          facebook,
          instagram,
          longitude: Number(longitude),
          category: finalCategory,
          imagePaths: newImagePaths,
          parentCategory,
          createdAt: serverTimestamp(),
        });

        toast.promise(addPromise, { loading: 'Agregando sitio...', success: '¡Sitio agregado con éxito!', error: 'No se pudo agregar el sitio.' });
        await addPromise;
      }

      if (isEditMode) {
        // Navegar al panel de administración después de mostrar el toast
        navigate('/admin', { state: { view: 'manageSites' } });
      } else {
        // En modo creación, solo reseteamos el formulario
        resetForm();
        if (document.getElementById('image-input')) {
          document.getElementById('image-input').value = null;
        }
      }

    } catch (err) {
      console.error("Error detallado:", err);
      toast.error(`Error al guardar el sitio: ${err.message}`);
    } finally {
      // CORRECCIÓN: Asegurarse de que el estado de 'uploading' siempre se reinicie.
      setUploading(false);
    }
  };

  const handleCancel = () => {
    if (isEditMode) {
      navigate('/admin');
    } else {
      // Si estamos agregando, solo limpiamos el formulario
      resetForm();
    }
  };

  function LocationMarker() {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setMarkerPosition([lat, lng]);
        setLatitude(lat.toFixed(6));
        setLongitude(lng.toFixed(6));
        
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
          .then(res => res.json())
          .then(data => {
            if (data && data.display_name) {
              setAddress(data.display_name);
            }
          }).catch(err => console.error("Error en Reverse Geocoding:", err));
      },
    });

    return markerPosition === null ? null : (
      <Marker position={markerPosition}></Marker>
    );
  }

  // Componente para controlar la interacción del mapa
  function MapInteractionController() {
    const map = useMapEvents({
      click(e) {
        // Al hacer clic, se activa el zoom con la rueda del ratón
        map.scrollWheelZoom.enable();
      },
      dragstart(e) {
        // Si se empieza a arrastrar el mapa, también se activa el zoom
        map.scrollWheelZoom.enable();
      }
    });

    // Desactivar el zoom por defecto al cargar el mapa
    useEffect(() => {
      map.scrollWheelZoom.disable();
    }, [map]);

    return null;
  }

  return (
    <div className="add-site-container">
      <h3>{isEditMode ? 'Editar Sitio Turístico' : 'Agregar Nuevo Sitio Turístico'}</h3>

      <form onSubmit={handleSubmit} className="add-site-form">
        <div className="form-group">
          <label htmlFor="name">Nombre del Sitio</label>
          <input 
            type="text"
            id="name"
            value={name}
            onChange={handleNameChange}
            placeholder="Ej: Plaza Principal"
            disabled={uploading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Descripción</label>
          <RichTextEditor
            content={description}
            onChange={setDescription}
            readOnly={uploading}
            placeholder="Describe el lugar..."
          />
        </div>

        {/* Sección de Contacto y Redes Sociales */}
        <div className="form-section">
          <h5>Contacto y Redes Sociales (Opcional)</h5>
          <div className="coordinates-group">
            <div className="form-group">
              <label htmlFor="whatsapp">Número de WhatsApp</label>
              <input
                type="tel"
                id="whatsapp"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="Ej: 50212345678 (sin + ni espacios)"
                disabled={uploading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="facebook">URL de Facebook</label>
              <input
                type="url"
                id="facebook"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                placeholder="https://facebook.com/pagina"
                disabled={uploading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="instagram">URL de Instagram</label>
              <input
                type="url"
                id="instagram"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="https://instagram.com/usuario"
                disabled={uploading}
              />
            </div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="parent-category">Categoría Principal</label>
          <select
            id="parent-category"
            value={parentCategory}
            onChange={(e) => setParentCategory(e.target.value)}
            disabled={uploading}
            required
          >
            <option value="">Selecciona una categoría principal</option>
            <option value="Atracciones y Cultura">Atracciones y Cultura</option>
            <option value="Servicios y Logística">Servicios y Logística</option>
            <option value="Movilidad y Transporte">Movilidad y Transporte</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="category">Subcategoría</label>
          <select
            id="category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            disabled={uploading}
          >
            <option value="">Selecciona una categoría</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
            <option value="otro">Otra...</option>
          </select>
        </div>
        
        {selectedCategory === 'otro' && (
          <div className="form-group">
            <label htmlFor="newCategory">Nombre de la Nueva Categoría</label>
            <input
              type="text"
              id="newCategory"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Ej: Restaurante"
              disabled={uploading}
            />
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="address">Dirección</label>
          <input
            type="text"
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Selecciona en el mapa o ingresa manualmente"
            disabled={uploading}
          />
        </div>
        
        <div className="form-group">
          <label>Seleccionar Ubicación en el Mapa</label>
          <p className="map-instructions">Haz clic en el mapa para establecer la ubicación y obtener la dirección automáticamente.</p>
          <MapContainer 
            center={markerPosition || mapCenter} 
            zoom={markerPosition ? 15 : 13} 
            className="location-picker-map"
          >
            
            <LayersControl position="topright">
              
              {/* Vista Híbrida (Satélite + Nombres) - PREDETERMINADA. Usamos LayerGroup para agrupar las capas. */}
              <LayersControl.BaseLayer checked name="Híbrido (Satélite + Nombres)">
                <LayerGroup>
                  <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    attribution='Tiles &copy; Esri'
                  />
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    pane="shadowPane" // Asegura que las etiquetas estén encima
                  />
                </LayerGroup>
              </LayersControl.BaseLayer>

              {/* Mapa de calles */}
              <LayersControl.BaseLayer name="Mapa de calles">
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
              </LayersControl.BaseLayer>
            </LayersControl>

            <LocationMarker />
            <MapInteractionController />
          </MapContainer>
        </div>

        {isEditMode && existingImagePaths.length > 0 && (
          <div className="form-group">
            <label>Imágenes Actuales</label>
            <div className="image-preview-container">
              {existingImagePaths.map((path, index) => {
                const isMarkedForDeletion = imagesToDelete.some(deleteItem => {
                  if (typeof deleteItem === 'string' && typeof path === 'string') {
                    return path === deleteItem;
                  } else if (deleteItem && deleteItem.original && path && path.original) {
                    return path.original === deleteItem.original;
                  }
                  return false;
                });

                if (isMarkedForDeletion) return null;

                const imagePath = typeof path === 'string' ? path : (path.original || '');
                const thumbnailPath = imagePath.replace(/(\.[^.]+)$/i, '_150x150.webp');
                
                return (
                  <div key={index} className="image-preview-wrapper">
                    <img 
                      src={`https://firebasestorage.googleapis.com/v0/b/${storage.app.options.storageBucket}/o/${encodeURIComponent(thumbnailPath)}?alt=media`} 
                      alt={`Imagen actual ${index + 1}`} 
                      className="image-preview" 
                    />
                    <button 
                      type="button" 
                      onClick={() => handleDeleteExistingImage(path)} 
                      className="delete-image-button"
                    >
                      X
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="image-input">Imágenes (máximo 3, formato WebP recomendado)</label>
          <input 
            type="file"
            id="image-input"
            accept="image/*"
            onChange={handleImageChange}
            disabled={uploading}
            multiple
          />
          <div className="image-preview-container">
            {imagePreviews.map((previewUrl, index) => (
              <div key={previewUrl} className="image-preview-wrapper">
                <img src={previewUrl} alt={`Previsualización ${index + 1}`} className="image-preview" />
                <button type="button" onClick={() => handleRemoveNewImage(index)} className="delete-image-button">
                  X
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            onClick={handleCancel}
            className="cancel-button"
            disabled={uploading}
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={uploading || !currentUser || currentUser.role !== 'admin'}
            className="submit-button"
          >
            {uploading ? 'Guardando...' : (isEditMode ? 'Actualizar Sitio' : 'Agregar Sitio')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddSiteForm;