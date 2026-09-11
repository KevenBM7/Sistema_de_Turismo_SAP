'use client';

import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, serverTimestamp, onSnapshot, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytesResumable, deleteObject } from 'firebase/storage';
import L from 'leaflet';
import { useRouter } from 'next/navigation';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, LayersControl } from 'react-leaflet';
import { 
  MapPin, 
  Sparkles, 
  Camera, 
  Globe, 
  Mail, 
  Phone, 
  Share2, 
  UploadCloud, 
  Navigation, 
  Check, 
  Compass
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import imageCompression from 'browser-image-compression';
import RichTextEditor from './RichTextEditor'; // Importamos el nuevo editor
import toast from 'react-hot-toast';
import slugify from 'slugify'; // Importamos la librería para generar slugs
import { db, storage } from '@/lib/firebase';
import { normalizeImagePath } from '@/lib/helpers';
import { triggerRevalidation } from '@/lib/revalidate';
import '../AdminForms.css';


// --- CORRECCIÓN PARA ICONOS DE LEAFLET ---
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ 
  iconUrl: markerIcon.src, 
  iconRetinaUrl: markerIcon2x.src, 
  shadowUrl: markerShadow.src 
});

// Forzar a Leaflet a invalidar y recalcular dimensiones para evitar cuadrículas blancas
function MapResizeHandler() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 200);
    const t2 = setTimeout(() => map.invalidateSize(), 500);
    const t3 = setTimeout(() => map.invalidateSize(), 1000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [map]);
  return null;
}

// Centrar el mapa con animación fluida
function MapRecenterController({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target && target.coords) {
      map.flyTo([target.coords[0], target.coords[1]], target.zoom || 15, { duration: 1.2 });
    }
  }, [target, map]);
  return null;
}

function AddSiteForm({ siteToEdit }) {
  const isEditMode = !!siteToEdit;

  const [siteId, setSiteId] = useState(siteToEdit?.id || null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState(''); // Nuevo estado para el slug
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [whatsapp2, setWhatsapp2] = useState('');
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [youtube, setYoutube] = useState(''); // Nuevo
  const [website, setWebsite] = useState(''); // Nuevo
  const [longitude, setLongitude] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [parentCategory, setParentCategory] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [markerPosition, setMarkerPosition] = useState(null);
  const [recenterTarget, setRecenterTarget] = useState(null);
  const mapCenter = [14.70, -91.13];
  const [existingImagePaths, setExistingImagePaths] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const { currentUser } = useAuth();
  const router = useRouter();

  // --- SOLUCIÓN: Cargar categorías desde Firestore ---
  useEffect(() => {
    const q = query(collection(db, 'categories'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);


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
      setEmail(siteToEdit.email || '');
      setWhatsapp(siteToEdit.whatsapp || '');
      setWhatsapp2(siteToEdit.whatsapp2 || '');
      setFacebook(siteToEdit.facebook || '');
      setInstagram(siteToEdit.instagram || '');
      setTiktok(siteToEdit.tiktok || '');
      setYoutube(siteToEdit.youtube || ''); // Cargar YouTube
      setWebsite(siteToEdit.website || ''); // Cargar Website
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
      setEmail('');
      setWhatsapp('');
      setWhatsapp2('');
      setFacebook('');
      setInstagram('');
      setTiktok('');
      setYoutube('');
      setWebsite('');
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

  const handleLatitudeChange = (e) => {
    const val = e.target.value;
    setLatitude(val);
    const numLat = parseFloat(val);
    const numLng = parseFloat(longitude);
    if (!isNaN(numLat) && !isNaN(numLng)) {
      setMarkerPosition([numLat, numLng]);
    }
  };

  const handleLongitudeChange = (e) => {
    const val = e.target.value;
    setLongitude(val);
    const numLat = parseFloat(latitude);
    const numLng = parseFloat(val);
    if (!isNaN(numLat) && !isNaN(numLng)) {
      setMarkerPosition([numLat, numLng]);
    }
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
    setEmail('');
    setWhatsapp('');
    setWhatsapp2('');
    setFacebook('');
    setInstagram('');
    setTiktok('');
    setYoutube(''); // Reset YouTube
    setWebsite(''); // Reset Website
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
    // Solo borrar las imágenes originales. Next.js Image se encarga del resize
    // automático, así que ya no se generan copias _150x150, _800x800, _1200x1200.
    const deletePromises = paths.map(pathData => {
      let originalPath;

      if (typeof pathData === 'string') {
        originalPath = pathData;
      } else if (pathData && pathData.original) {
        originalPath = pathData.original;
      } else {
        console.warn("pathData inválido:", pathData);
        return Promise.resolve();
      }

      if (!originalPath) return Promise.resolve();

      return deleteObject(ref(storage, originalPath))
        .catch(e => console.warn(`No se pudo borrar ${originalPath}:`, e));
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

        // Generar slugs base para el nombre del archivo
        const catSlug = slugify(finalCategory || 'categoria', { lower: true, strict: true });
        const siteSlug = slug; // Usamos el slug del estado que ya se genera en tiempo real

        const imageProcessingPromises = imageFiles.map(async (file, index) => {
          try {
            if (!file || !file.name) {
              throw new Error(`Archivo inválido en posición ${index}`);
            }

            // --- CAMBIO CLAVE: NOMBRE DE ARCHIVO SEO OPTIMIZADO ---
            // Formato: san-antonio-palopo-categoria-nombre-sitio-indice.webp
            // El timestamp asegura que el nombre sea único incluso si se sube la misma imagen dos veces.
            const fileName = `san-antonio-palopo-${catSlug}-${siteSlug}-${Date.now()}-${index}.webp`;

            const mainImageOptions = {
              maxSizeMB: 2,
              maxWidthOrHeight: 1600,
              useWebWorker: true,
              fileType: 'image/webp', // Forzar conversión a WebP
              initialQuality: 0.8,
            };

            const compressedMain = await imageCompression(file, mainImageOptions);

            if (!compressedMain) {
              throw new Error(`No se pudo comprimir la imagen: ${fileName}`);
            }

            // Guardar en carpeta 'sites/originals/' con el nuevo nombre
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
          email,
          category: finalCategory,
          whatsapp,
          whatsapp2,
          facebook,
          instagram,
          tiktok,
          youtube, // Nuevo campo
          website, // Nuevo campo
          latitude: Number(latitude),
          longitude: Number(longitude),
          imagePaths: finalImagePaths,
          parentCategory,
          lastmod: serverTimestamp() // Actualizar fecha de modificación
        });

        toast.promise(updatePromise, { loading: 'Actualizando sitio...', success: '¡Sitio actualizado con éxito!', error: 'No se pudo actualizar el sitio.' });
        await updatePromise;
        
        // Revalidar página estática del sitio
        await triggerRevalidation('site', { slug, categoryName: slugify(parentCategory || 'general', { lower: true, strict: true }) });
        router.refresh();

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
          email,
          whatsapp,
          whatsapp2,
          facebook,
          instagram,
          tiktok,
          youtube, // Nuevo campo
          website, // Nuevo campo
          longitude: Number(longitude),
          category: finalCategory,
          imagePaths: newImagePaths,
          parentCategory,
          createdAt: serverTimestamp(),
          lastmod: serverTimestamp() // Añadir fecha de modificación
        });

        toast.promise(addPromise, { loading: 'Agregando sitio...', success: '¡Sitio agregado con éxito!', error: 'No se pudo agregar el sitio.' });
        await addPromise;
        
        // Revalidar página estática
        await triggerRevalidation('site', { slug, categoryName: slugify(parentCategory || 'general', { lower: true, strict: true }) });
        router.refresh();
      }

      if (isEditMode) {
        // En Next.js App Router, para cambiar el searchParams y forzar render sin recarga dura:
        router.push('/admin?view=manageSites');
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
      setUploading(false);
    }
  };

  const handleCancel = () => {
    if (isEditMode) {
      router.push('/admin?view=manageSites');
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
      {/* Banner de Cabecera */}
      <div className="form-header-banner">
        <span className="form-header-badge">
          <Sparkles size={13} /> {isEditMode ? 'Edición de Contenido' : 'Gestión de Contenido'}
        </span>
        <h2 className="form-header-title">
          {isEditMode ? 'Editar Sitio Turístico' : 'Registrar Nuevo Sitio Turístico'}
        </h2>
        <p className="form-header-subtitle">
          Completa todos los datos requeridos. Los cambios se actualizarán de forma instantánea en el mapa interactivo y el catálogo web.
        </p>
      </div>

      {isEditMode && (
        <div className="edit-notice">
          <p>
            ✏️ Estás editando el sitio: <strong>{name || siteToEdit?.name}</strong>
          </p>
          <button type="button" onClick={handleCancel} className="cancel-edit-button">
            Cancelar edición
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="add-site-form">
        
        {/* =======================================================
            SECCIÓN 1: INFORMACIÓN PRINCIPAL Y CATEGORIZACIÓN
            ======================================================= */}
        <div className="form-card-section">
          <div className="section-title-row">
            <div className="section-icon-pill bg-blue">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="section-card-title">1. Información Principal</h3>
              <p className="section-card-desc">Nombre comercial o del punto de interés, URL amigable y clasificación turística.</p>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="name">
                Nombre del Sitio <span className="required-star">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={handleNameChange}
                placeholder="Ej: Mirador San Antonio Palopó"
                disabled={uploading}
                required
              />
              <span className="slug-preview">
                <strong>Slug SEO:</strong> /{slug || 'nombre-del-sitio'}
              </span>
            </div>

            <div className="form-group">
              <label htmlFor="parent-category">
                Categoría Principal <span className="required-star">*</span>
              </label>
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
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="category">
                Subcategoría Específica <span className="required-star">*</span>
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                disabled={uploading}
                required
              >
                <option value="">Selecciona una subcategoría</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
                <option value="otro">Otra (crear nueva)...</option>
              </select>
            </div>

            {selectedCategory === 'otro' && (
              <div className="form-group">
                <label htmlFor="newCategory">
                  Nombre de la Nueva Subcategoría <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  id="newCategory"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Ej: Galerías de Arte"
                  disabled={uploading}
                  required
                />
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="description">
              Descripción Detallada <span className="required-star">*</span>
            </label>
            <RichTextEditor
              content={description}
              onChange={setDescription}
              readOnly={uploading}
              placeholder="Describe detalladamente los atractivos, historia, qué hacer y recomendaciones..."
            />
          </div>
        </div>

        {/* =======================================================
            SECCIÓN 2: UBICACIÓN GEOGRÁFICA Y MAPA INTERACTIVO
            ======================================================= */}
        <div className="form-card-section">
          <div className="section-title-row">
            <div className="section-icon-pill bg-emerald">
              <MapPin size={20} />
            </div>
            <div>
              <h3 className="section-card-title">2. Ubicación Geográfica en el Mapa</h3>
              <p className="section-card-desc">Haz clic en el mapa satelital para fijar el marcador exacto y autocompletar la dirección.</p>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="address">
              Dirección o Referencia <span className="required-star">*</span>
            </label>
            <div className="input-with-icon">
              <span className="input-icon-prefix">
                <MapPin size={18} />
              </span>
              <input
                type="text"
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Selecciona en el mapa satelital o ingresa manualmente"
                disabled={uploading}
                required
              />
            </div>
          </div>

          {/* Barra de herramientas del mapa */}
          <div className="map-toolbar-container">
            <div className="map-coords-badge">
              <Compass size={17} style={{ color: '#2563eb' }} />
              {markerPosition ? (
                <span>
                  <strong>Punto fijado:</strong> Lat {Number(latitude).toFixed(6)}, Lng {Number(longitude).toFixed(6)}
                </span>
              ) : (
                <span className="coords-pending">Haz clic sobre el mapa para colocar el marcador de ubicación</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setRecenterTarget({ coords: mapCenter, zoom: 15, key: Date.now() })}
              className="map-recenter-button"
              title="Centrar vista en San Antonio Palopó"
            >
              <Navigation size={14} /> Centrar en San Antonio Palopó
            </button>
          </div>

          {/* Contenedor del Mapa con Capas Google HD */}
          <div className="map-picker-wrapper">
            <MapContainer
              center={markerPosition || mapCenter}
              zoom={markerPosition ? 16 : 14}
              className="location-picker-map"
              scrollWheelZoom={false}
            >
              <LayersControl position="topright">
                {/* Capa Principal: Google Híbrido HD (Satélite nítido con nombres) */}
                <LayersControl.BaseLayer checked name="Google Híbrido HD">
                  <TileLayer
                    key="google-hybrid-hd"
                    url="https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                    subdomains={['0', '1', '2', '3']}
                    attribution="&copy; Google Maps"
                    maxNativeZoom={20}
                    maxZoom={21}
                    crossOrigin="anonymous"
                  />
                </LayersControl.BaseLayer>

                {/* Capa Secundaria: Google Calles */}
                <LayersControl.BaseLayer name="Google Calles">
                  <TileLayer
                    key="google-streets"
                    url="https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                    subdomains={['0', '1', '2', '3']}
                    attribution="&copy; Google Maps"
                    maxNativeZoom={20}
                    maxZoom={21}
                    crossOrigin="anonymous"
                  />
                </LayersControl.BaseLayer>

                {/* Capa Alternativa: OpenStreetMap */}
                <LayersControl.BaseLayer name="OpenStreetMap">
                  <TileLayer
                    key="osm-streets"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    maxNativeZoom={19}
                    maxZoom={21}
                    crossOrigin="anonymous"
                  />
                </LayersControl.BaseLayer>
              </LayersControl>

              <LocationMarker />
              <MapInteractionController />
              <MapResizeHandler />
              <MapRecenterController target={recenterTarget} />
            </MapContainer>
          </div>

          {/* Coordenadas numéricas editables */}
          <div className="form-grid-2" style={{ marginTop: '1.25rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="latitude">
                Latitud <span className="required-star">*</span>
              </label>
              <input
                type="text"
                id="latitude"
                value={latitude}
                onChange={handleLatitudeChange}
                placeholder="14.700000"
                disabled={uploading}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="longitude">
                Longitud <span className="required-star">*</span>
              </label>
              <input
                type="text"
                id="longitude"
                value={longitude}
                onChange={handleLongitudeChange}
                placeholder="-91.130000"
                disabled={uploading}
                required
              />
            </div>
          </div>
        </div>

        {/* =======================================================
            SECCIÓN 3: GALERÍA FOTOGRÁFICA
            ======================================================= */}
        <div className="form-card-section">
          <div className="section-title-row">
            <div className="section-icon-pill bg-purple">
              <Camera size={20} />
            </div>
            <div>
              <h3 className="section-card-title">3. Galería Fotográfica</h3>
              <p className="section-card-desc">Sube hasta 3 fotografías representativas. Se comprimirán y convertirán a WebP optimizado para alta velocidad.</p>
            </div>
          </div>

          {/* Imágenes ya existentes (Modo Edición) */}
          {isEditMode && existingImagePaths.length > 0 && (
            <div className="form-group">
              <label>Imágenes Actuales del Sitio</label>
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
                  const imageUrl = normalizeImagePath(path);

                  return (
                    <div key={index} className="image-preview-wrapper">
                      <img
                        src={imageUrl || 'https://placehold.co/150x100?text=Error'}
                        alt={`Foto actual ${index + 1}`}
                        className="image-preview"
                      />
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

          {/* Dropzone de subida */}
          <div className="form-group">
            <label>Subir Nuevas Fotografías (Máximo 3 fotos en total) <span className="required-star">*</span></label>
            <div className="image-upload-dropzone">
              <input
                type="file"
                id="image-input"
                accept="image/*"
                onChange={handleImageChange}
                disabled={uploading}
                multiple
              />
              <div className="upload-dropzone-content">
                <UploadCloud size={38} className="upload-dropzone-icon" />
                <span className="upload-dropzone-title">Haz clic aquí o arrastra tus imágenes</span>
                <span className="upload-dropzone-hint">JPG, PNG o WebP. Se optimizarán automáticamente a WebP de alta fidelidad.</span>
              </div>
            </div>
          </div>

          {/* Previsualización de imágenes nuevas */}
          {imagePreviews.length > 0 && (
            <div className="form-group">
              <label>Nuevas imágenes a subir ({imagePreviews.length}):</label>
              <div className="image-preview-container">
                {imagePreviews.map((previewUrl, index) => (
                  <div key={previewUrl} className="image-preview-wrapper">
                    <img src={previewUrl} alt={`Nueva foto ${index + 1}`} className="image-preview" />
                    <button
                      type="button"
                      onClick={() => handleRemoveNewImage(index)}
                      className="delete-image-button"
                      title="Quitar foto"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* =======================================================
            SECCIÓN 4: CONTACTO Y REDES SOCIALES
            ======================================================= */}
        <div className="form-card-section">
          <div className="section-title-row">
            <div className="section-icon-pill bg-amber">
              <Globe size={20} />
            </div>
            <div>
              <h3 className="section-card-title">4. Contacto Directo y Redes Sociales</h3>
              <p className="section-card-desc">Información opcional para que los turistas se comuniquen por WhatsApp, redes o visiten el sitio web.</p>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="email">Correo Electrónico de Contacto</label>
              <div className="input-with-icon">
                <span className="input-icon-prefix">
                  <Mail size={17} />
                </span>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@sanantonio.gt"
                  disabled={uploading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="website">Sitio Web Oficial</label>
              <div className="input-with-icon">
                <span className="input-icon-prefix">
                  <Globe size={17} />
                </span>
                <input
                  type="url"
                  id="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://ejemplo.com"
                  disabled={uploading}
                />
              </div>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="whatsapp">Número de WhatsApp Principal</label>
              <div className="input-with-icon">
                <span className="input-icon-prefix">
                  <Phone size={17} />
                </span>
                <input
                  type="tel"
                  id="whatsapp"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="Ej: 50212345678 (código de país sin +)"
                  disabled={uploading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="whatsapp2">WhatsApp Secundario / Auxiliar</label>
              <div className="input-with-icon">
                <span className="input-icon-prefix">
                  <Phone size={17} />
                </span>
                <input
                  type="tel"
                  id="whatsapp2"
                  value={whatsapp2}
                  onChange={(e) => setWhatsapp2(e.target.value)}
                  placeholder="Ej: 50287654321"
                  disabled={uploading}
                />
              </div>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="facebook">Perfil o Página de Facebook</label>
              <div className="input-with-icon">
                <span className="input-icon-prefix">
                  <Share2 size={17} />
                </span>
                <input
                  type="url"
                  id="facebook"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  placeholder="https://facebook.com/tupagina"
                  disabled={uploading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="instagram">Perfil de Instagram</label>
              <div className="input-with-icon">
                <span className="input-icon-prefix">
                  <Share2 size={17} />
                </span>
                <input
                  type="url"
                  id="instagram"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="https://instagram.com/tuperfil"
                  disabled={uploading}
                />
              </div>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="tiktok">Perfil de TikTok</label>
              <div className="input-with-icon">
                <span className="input-icon-prefix">
                  <Share2 size={17} />
                </span>
                <input
                  type="url"
                  id="tiktok"
                  value={tiktok}
                  onChange={(e) => setTiktok(e.target.value)}
                  placeholder="https://tiktok.com/@tuperfil"
                  disabled={uploading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="youtube">Canal o Video de YouTube</label>
              <div className="input-with-icon">
                <span className="input-icon-prefix">
                  <Share2 size={17} />
                </span>
                <input
                  type="url"
                  id="youtube"
                  value={youtube}
                  onChange={(e) => setYoutube(e.target.value)}
                  placeholder="https://youtube.com/@tucanal"
                  disabled={uploading}
                />
              </div>
            </div>
          </div>
        </div>

        {/* =======================================================
            SECCIÓN 5: BOTONES DE ACCIÓN
            ======================================================= */}
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
            {uploading ? (
              'Guardando datos...'
            ) : isEditMode ? (
              <>
                <Check size={18} /> Actualizar Sitio
              </>
            ) : (
              <>
                <Check size={18} /> Publicar Sitio
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddSiteForm;