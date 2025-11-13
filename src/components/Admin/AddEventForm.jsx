import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, serverTimestamp, onSnapshot, query, orderBy, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, deleteObject, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import imageCompression from 'browser-image-compression';
import '../AdminForms.css';

function AddEventForm() {
  const [events, setEvents] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploading, setUploading] = useState(false);;
  const { currentUser } = useAuth();

  // Estados para edición
  const [editingEvent, setEditingEvent] = useState(null);
  const [existingImageUrls, setExistingImageUrls] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);

  // Estados para sub-eventos (programación)
  const [schedule, setSchedule] = useState([]);
  const [showScheduleForm, setShowScheduleForm] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('startDate', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEvents(eventsData);
    });
    return () => unsubscribe();
  }, []);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if ((existingImageUrls.length - imagesToDelete.length + files.length) > 2) {
      toast.error('Puedes subir un máximo de 2 imágenes en total.');
      e.target.value = null; // Limpia la selección
      return;
    }
    setImageFiles(files);
    setImagePreviews(files.map(file => URL.createObjectURL(file)));
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setImageFiles([]);
    setImagePreviews([]);
    setEditingEvent(null);
    setExistingImageUrls([]);
    setImagesToDelete([]);
    setSchedule([]);
    setShowScheduleForm(false);;
    if (document.getElementById('event-image-input')) {
      document.getElementById('event-image-input').value = null;
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event.id);
    setTitle(event.title);
    setDescription(event.description || '');
    setStartDate(event.startDate);
    setEndDate(event.endDate || '');
    // Manejar tanto el campo antiguo 'imageUrl' como el nuevo 'imageUrls'
    setExistingImageUrls(event.imageUrls || (event.imageUrl ? [event.imageUrl] : []));
    setImageFiles([]);
    setImagePreviews([]);
    setSchedule(event.schedule || []); setShowScheduleForm(event.schedule && event.schedule.length > 0);;
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Función para agregar un día al schedule
  const addDay = () => {
    const newDay = {
      day: schedule.length + 1,
      date: '',
      dayTitle: '',
      activities: []
    };
    setSchedule([...schedule, newDay]);
  };

  // Función para eliminar un día
  const removeDay = (dayIndex) => {
    const newSchedule = schedule.filter((_, index) => index !== dayIndex);
    // Reindexar los días
    const reindexed = newSchedule.map((day, index) => ({
      ...day,
      day: index + 1
    }));
    setSchedule(reindexed);
  };

  // Función para actualizar un día
  const updateDay = (dayIndex, field, value) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex][field] = value;
    setSchedule(newSchedule);
  };

  // Función para agregar una actividad a un día
  const addActivity = (dayIndex) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].activities.push({
      time: '',
      title: '',
      description: ''
    });
    setSchedule(newSchedule);
  };

  // Función para eliminar una actividad
  const removeActivity = (dayIndex, activityIndex) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].activities = newSchedule[dayIndex].activities.filter((_, index) => index !== activityIndex);
    setSchedule(newSchedule);
  };

  // Función para actualizar una actividad
  const updateActivity = (dayIndex, activityIndex, field, value) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].activities[activityIndex][field] = value;
    setSchedule(newSchedule);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const totalImages = (existingImageUrls.length - imagesToDelete.length) + imageFiles.length;

    // --- VALIDACIÓN DETALLADA ---
    if (!title.trim()) { toast.error('El título del evento es obligatorio.'); return; }
    if (!startDate) { toast.error('La fecha de inicio es obligatoria.'); return; }
    if (endDate && new Date(endDate) < new Date(startDate)) {
      toast.error('La fecha de fin no puede ser anterior a la fecha de inicio.');
      return;
    }
    if (totalImages === 0) { toast.error('Debes agregar al menos una imagen para el evento.'); return; }
    if (totalImages > 2) { toast.error('No puedes tener más de 2 imágenes en total.'); return; }

    setUploading(true);

    try {
      let finalImageUrls = [...existingImageUrls.filter(url => !imagesToDelete.includes(url))];

      // Subir nuevas imágenes (OPTIMIZADO)
      if (imageFiles.length > 0) {
        const uploadPromises = imageFiles.map(async (file) => {
          // Opciones de compresión: 1.5MB max, 1920px, WebP, 80% calidad
          const imageOptions = { 
            maxSizeMB: 1.5, 
            maxWidthOrHeight: 1920, 
            useWebWorker: true,
            fileType: 'image/webp', // Forzar a WebP
            initialQuality: 0.8 // 80% calidad para preservar el texto del anuncio
          };
          
          const compressedFile = await imageCompression(file, imageOptions);
          
          // Asegurar nombre de archivo .webp
          const fileName = compressedFile.name.replace(/\.[^/.]+$/, "") + '.webp';
          const storageRef = ref(storage, `events/${Date.now()}_${fileName}`);
          
          await uploadBytesResumable(storageRef, compressedFile, { contentType: 'image/webp' });
          return getDownloadURL(storageRef);
        });
        const newUrls = await Promise.all(uploadPromises);
        finalImageUrls.push(...newUrls);
      }

      // Eliminar imágenes marcadas de Storage
      if (imagesToDelete.length > 0) {
        const deletePromises = imagesToDelete.map(url => {
          // Extraer la ruta del archivo de la URL de descarga
          try {
            const imageRef = ref(storage, url);
            return deleteObject(imageRef);
          } catch (error) {
            console.warn(`Error al crear referencia para borrar imagen de evento: ${url}`, error);
            return Promise.resolve(); // Continuar sin fallar
          }
        });
        await Promise.all(deletePromises);
      }

      const eventData = {
        title,
        description,
        startDate,
        endDate: endDate || null,
        imageUrls: finalImageUrls, // Guardar el array de URLs
        schedule: schedule.length > 0 ? schedule : null
      };

      if (editingEvent) {
        const eventRef = doc(db, 'events', editingEvent);
        const promise = updateDoc(eventRef, eventData);
        toast.promise(promise, { loading: 'Actualizando evento...', success: '¡Evento actualizado con éxito!', error: 'No se pudo actualizar.' });
        await promise;
      } else {
        const promise = addDoc(collection(db, 'events'), {
          ...eventData,
          createdAt: serverTimestamp(),
          author: currentUser.uid,
        });
        toast.promise(promise, { loading: 'Agregando evento...', success: '¡Evento agregado con éxito!', error: 'No se pudo agregar.' });
        await promise;
      }

      if (editingEvent) {
        setTimeout(() => {
          resetForm();
        }, 1500);
      } else {
        resetForm();
      }

    } catch (err) {
      console.error(err);
      toast.error('Error al procesar el evento.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (event) => {
    const promise = new Promise(async (resolve, reject) => {
      try {
        // Eliminar el documento del evento
        await deleteDoc(doc(db, 'events', event.id));
  
        // Eliminar todas las imágenes asociadas de Storage
        const imageUrls = event.imageUrls || (event.imageUrl ? [event.imageUrl] : []);
        if (imageUrls.length > 0) {
          const deletePromises = imageUrls.map(url => {
            try {
              const imageRef = ref(storage, url);
              return deleteObject(imageRef);
            } catch (e) { 
              console.warn(`Error al crear referencia para borrar imagen de evento: ${url}`); 
              return Promise.resolve(); 
            }
          });
          await Promise.all(deletePromises);
        }
        resolve(); // Resuelve la promesa si todo fue exitoso
      } catch (err) {
        console.error(err);
        reject(err); // Rechaza la promesa si hay un error
      }
    });

    toast((t) => (
      <div className="toast-confirmation">
        <div className="toast-content">
          <p className="toast-title">Confirmar Eliminación</p>
          <p className="toast-message">¿Estás seguro de que quieres eliminar este evento? Esta acción es irreversible.</p>
        </div>
        <div className="toast-buttons">
          <button className="toast-button-cancel" onClick={() => toast.dismiss(t.id)}>Cancelar</button>
          <button className="toast-button-confirm" onClick={() => { toast.dismiss(t.id); toast.promise(promise, { loading: 'Eliminando...', success: 'Evento eliminado.', error: 'No se pudo eliminar.' }); }}>Confirmar</button>
        </div>
      </div>
    ), { duration: 6000 });
  };

  const handleDeleteExistingImage = (url) => {
    setImagesToDelete(prev => [...prev, url]);
  };

  return (
    <div className="add-site-container">
      <h3>Gestionar Eventos</h3>
      
      <form onSubmit={handleSubmit} className="add-site-form">
        <h4>{editingEvent ? 'Editar Evento' : 'Agregar Nuevo Evento'}</h4>
        
        {editingEvent && (
          <div className="edit-notice">
            <p>✏️ Estás editando un evento. <button type="button" onClick={resetForm} className="cancel-edit-button">Cancelar edición</button></p>
          </div>
        )}
        
        {/* Información básica del evento */}
        <div className="form-section">
          <h5>Información General</h5>
          
          <div className="form-group">
            <label htmlFor="event-title">Título del Evento</label>
            <input 
              id="event-title" 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="Ej: Feria Patronal de San Antonio" 
              disabled={uploading} 
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="event-description">Descripción General</label>
            <textarea 
              id="event-description" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Descripción general del evento..." 
              disabled={uploading} 
              rows="4"
            />
          </div>
          
          <div className="coordinates-group">
            <div className="form-group">
              <label htmlFor="event-start-date">Fecha de Inicio</label>
              <input 
                id="event-start-date" 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                disabled={uploading} 
              />
            </div>
            <div className="form-group">
              <label htmlFor="event-end-date">Fecha de Fin (opcional)</label>
              <input 
                id="event-end-date" 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                disabled={uploading} 
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Imágenes del Evento (máximo 2)</label>
            {existingImageUrls.length > 0 && (
              <div className="image-preview-container">
                {existingImageUrls.map((url, index) => {
                  if (imagesToDelete.includes(url)) return null;
                  return (
                    <div key={index} className="image-preview-wrapper">
                      <img src={url} alt={`Imagen actual ${index + 1}`} className="image-preview" />
                      <button type="button" onClick={() => handleDeleteExistingImage(url)} className="delete-image-button">X</button>
                    </div>
                  );
                })}
              </div>
            )}
            <input 
              id="event-image-input" 
              type="file" 
              accept="image/*" 
              onChange={handleImageChange} 
              disabled={uploading} 
              multiple
            />
            {imagePreviews.length > 0 && (
              <div className="image-preview-container">
                {imagePreviews.map((preview, index) => (
                  <img key={index} src={preview} alt={`Previsualización ${index + 1}`} className="image-preview" />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Programación del evento (sub-eventos) */}
        <div className="form-section schedule-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h5>Programación del Evento (Opcional)</h5>
            <button 
              type="button" 
              onClick={() => setShowScheduleForm(!showScheduleForm)}
              className="toggle-schedule-button"
              disabled={uploading}
            >
              {showScheduleForm ? '➖ Ocultar programación' : '➕ Agregar programación por días'}
            </button>
          </div>

          {showScheduleForm && (
            <div className="schedule-builder">
              <p className="section-description">
                Ideal para eventos de varios días (ferias, festivales). Organiza actividades por día y hora.
              </p>

              {schedule.map((day, dayIndex) => (
                <div key={dayIndex} className="day-container">
                  <div className="day-header">
                    <h6>Día {day.day}</h6>
                    <button 
                      type="button" 
                      onClick={() => removeDay(dayIndex)}
                      className="remove-day-button"
                      disabled={uploading}
                    >
                      ✕ Eliminar día
                    </button>
                  </div>

                  <div className="coordinates-group">
                    <div className="form-group">
                      <label>Fecha del Día {day.day}</label>
                      <input 
                        type="date"
                        value={day.date}
                        onChange={(e) => updateDay(dayIndex, 'date', e.target.value)}
                        disabled={uploading}
                      />
                    </div>
                    <div className="form-group">
                      <label>Título del Día (ej: "Inicio de la Feria")</label>
                      <input 
                        type="text"
                        value={day.dayTitle}
                        onChange={(e) => updateDay(dayIndex, 'dayTitle', e.target.value)}
                        placeholder="Ej: Día del Santo Patrono"
                        disabled={uploading}
                      />
                    </div>
                  </div>

                  {/* Actividades del día */}
                  <div className="activities-list">
                    <label style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>
                      Actividades del Día {day.day}:
                    </label>
                    
                    {day.activities.map((activity, actIndex) => (
                      <div key={actIndex} className="activity-item">
                        <div className="activity-fields">
                          <input 
                            type="time"
                            value={activity.time}
                            onChange={(e) => updateActivity(dayIndex, actIndex, 'time', e.target.value)}
                            placeholder="Hora"
                            disabled={uploading}
                            style={{ width: '120px' }}
                          />
                          <input 
                            type="text"
                            value={activity.title}
                            onChange={(e) => updateActivity(dayIndex, actIndex, 'title', e.target.value)}
                            placeholder="Nombre de la actividad"
                            disabled={uploading}
                            style={{ flex: 2 }}
                          />
                          <input 
                            type="text"
                            value={activity.description}
                            onChange={(e) => updateActivity(dayIndex, actIndex, 'description', e.target.value)}
                            placeholder="Descripción breve"
                            disabled={uploading}
                            style={{ flex: 3 }}
                          />
                          <button 
                            type="button"
                            onClick={() => removeActivity(dayIndex, actIndex)}
                            className="remove-activity-button"
                            disabled={uploading}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}

                    <button 
                      type="button"
                      onClick={() => addActivity(dayIndex)}
                      className="add-activity-button"
                      disabled={uploading}
                    >
                      + Agregar actividad
                    </button>
                  </div>
                </div>
              ))}

              <button 
                type="button"
                onClick={addDay}
                className="add-day-button"
                disabled={uploading}
              >
                + Agregar día
              </button>
            </div>
          )}
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            onClick={resetForm} 
            className="cancel-button"
            disabled={uploading}
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={uploading} 
            className="submit-button"
          >
            {uploading ? 'Guardando...' : editingEvent ? 'Actualizar Evento' : 'Agregar Evento'}
          </button>
        </div>
      </form>

      <div className="manage-sites-container" style={{ marginTop: '3rem', padding: 0 }}>
        <h3>Eventos Existentes</h3>
        <ul className="manage-sites-list">
          {events.length > 0 ? events.map(event => (
            <li key={event.id} className="manage-site-item">
              <img 
                src={(event.imageUrls && event.imageUrls[0]) || event.imageUrl || "https://placehold.co/60x60/EEE/31343C?text=Sin+Img"} 
                alt={event.title} 
                className="manage-site-thumbnail" />
              <div className="manage-site-info">
                <span className="manage-site-name">
                  {event.title}
                  {event.schedule && event.schedule.length > 0 && (
                    <span className="event-has-schedule"> 📅 {event.schedule.length} días</span>
                  )}
                </span>
                <span className="manage-site-category">
                  {new Date(`${event.startDate}T00:00:00`).toLocaleDateString('es-ES')}
                  {event.endDate && event.endDate !== event.startDate && 
                    ` - ${new Date(`${event.endDate}T00:00:00`).toLocaleDateString('es-ES')}`
                  }
                </span>
              </div>
              <div className="manage-site-actions">
                <Link 
                  to={`/evento/${event.id}`} 
                  className="view-button"
                >
                  Ver
                </Link>
                <button 
                  onClick={() => handleEdit(event)} 
                  className="edit-button"
                  disabled={uploading}
                >
                  Editar
                </button>
                <button 
                  onClick={() => handleDelete(event)} 
                  className="delete-button"
                  disabled={uploading}
                >
                  Eliminar
                </button>
              </div>
            </li>
          )) : <p>No hay eventos registrados.</p>}
        </ul>
      </div>
    </div>
  );
}

export default AddEventForm;