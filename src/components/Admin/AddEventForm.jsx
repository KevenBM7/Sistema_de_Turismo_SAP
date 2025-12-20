import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, deleteObject, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import imageCompression from 'browser-image-compression';
import slugify from 'slugify';
import RichTextEditor from './RichTextEditor';
import '../AdminForms.css';

function AddEventForm({ eventToEdit = null, onFormSubmit }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [slug, setSlug] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const { currentUser } = useAuth();

  // Estados para edición
  const [editingEvent, setEditingEvent] = useState(null);
  const [existingImageUrls, setExistingImageUrls] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);

  // Estados para sub-eventos (programación)
  const [schedule, setSchedule] = useState([]);
  const [showScheduleForm, setShowScheduleForm] = useState(false);

  useEffect(() => {
    if (eventToEdit) {
      handleEdit(eventToEdit);
    } else {
      resetForm();
    }
  }, [eventToEdit]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if ((existingImageUrls.length - imagesToDelete.length + files.length) > 2) {
      toast.error('Puedes subir un máximo de 2 imágenes en total.');
      e.target.value = null;
      return;
    }
    setImageFiles(files);
    setImagePreviews(files.map(file => URL.createObjectURL(file)));
  };

  const resetForm = () => {
    setTitle('');
    setSlug('');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setImageFiles([]);
    setImagePreviews([]);
    setEditingEvent(null);
    setExistingImageUrls([]);
    setImagesToDelete([]);
    setSchedule([]);
    setShowScheduleForm(false);
    if (document.getElementById('event-image-input')) {
      document.getElementById('event-image-input').value = null;
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event.id);
    setTitle(event.title);
    setSlug(event.slug || slugify(event.title, { lower: true, strict: true }));
    setDescription(event.description || '');
    setStartDate(event.startDate);
    setEndDate(event.endDate || '');
    setExistingImageUrls(event.imageUrls || (event.imageUrl ? [event.imageUrl] : []));
    setImageFiles([]);
    setImagePreviews([]);
    setSchedule(event.schedule || []);
    setShowScheduleForm(event.schedule && event.schedule.length > 0);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    setSlug(slugify(newTitle, { lower: true, strict: true }));
  };

  const handleToggleSchedule = () => {
    const isOpening = !showScheduleForm;
    setShowScheduleForm(isOpening);

    if (isOpening && schedule.length === 0) {
      setSchedule([{
        day: 1,
        date: startDate || '',
        dayTitle: '',
        activities: []
      }]);
    }
  };

  const addDay = () => {
    const newDay = { day: schedule.length + 1, date: startDate || '', dayTitle: '', activities: [] };
    setSchedule(prevSchedule => [...prevSchedule, newDay]);
  };

  const removeDay = (dayIndex) => {
    const newSchedule = schedule.filter((_, index) => index !== dayIndex);
    const reindexed = newSchedule.map((day, index) => ({
      ...day,
      day: index + 1
    }));
    setSchedule(reindexed);
  };

  const updateDay = (dayIndex, field, value) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex][field] = value;
    setSchedule(newSchedule);
  };

  const addActivity = (dayIndex) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].activities.push({
      time: '',
      title: '',
      description: ''
    });
    setSchedule(newSchedule);
  };

  const removeActivity = (dayIndex, activityIndex) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].activities = newSchedule[dayIndex].activities.filter((_, index) => index !== activityIndex);
    setSchedule(newSchedule);
  };

  const updateActivity = (dayIndex, activityIndex, field, value) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].activities[activityIndex][field] = value;
    setSchedule(newSchedule);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const totalImages = (existingImageUrls.length - imagesToDelete.length) + imageFiles.length;

    if (!title.trim()) { toast.error('El título del evento es obligatorio.'); return; }
    if (!slug.trim()) { toast.error('El slug (generado del título) no puede estar vacío.'); return; }
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

      if (imageFiles.length > 0) {
        const uploadPromises = imageFiles.map(async (file, index) => {
          const imageOptions = { 
            maxSizeMB: 1.5, 
            maxWidthOrHeight: 1920, 
            useWebWorker: true,
            fileType: 'image/webp',
            initialQuality: 0.8 
          };

          const compressedFile = await imageCompression(file, imageOptions);
          const eventSlug = slugify(title, { lower: true, strict: true });
          const fileName = `san-antonio-palopo-evento-${eventSlug}-${Date.now()}-${index}.webp`;
          const storageRef = ref(storage, `events/${fileName}`);

          const uploadTask = uploadBytesResumable(storageRef, compressedFile, { contentType: 'image/webp' });
          await uploadTask;
          return getDownloadURL(storageRef);
        });
        const newUrls = await Promise.all(uploadPromises);
        finalImageUrls.push(...newUrls);
      }

      if (imagesToDelete.length > 0) {
        const deletePromises = imagesToDelete.map(url => {
          try {
            const imageRef = ref(storage, url);
            return deleteObject(imageRef);
          } catch (error) {
            console.warn(`Error al crear referencia para borrar imagen de evento: ${url}`, error);
            return Promise.resolve();
          }
        });
        await Promise.all(deletePromises);
      }

      const eventData = {
        title,
        slug,
        description,
        startDate,
        endDate: endDate || null,
        imageUrls: finalImageUrls,
        schedule: schedule.length > 0 ? schedule : null
      };

      if (editingEvent) {
        const eventRef = doc(db, 'events', editingEvent);
        const promise = updateDoc(eventRef, {
          ...eventData,
          lastmod: serverTimestamp(),
        });
        toast.promise(promise, { loading: 'Actualizando evento...', success: '¡Evento actualizado con éxito!', error: 'No se pudo actualizar.' });
        await promise;
      } else {
        const promise = addDoc(collection(db, 'events'), {
          ...eventData,
          createdAt: serverTimestamp(),
          author: currentUser.uid,
          lastmod: serverTimestamp(),
        });
        toast.promise(promise, { loading: 'Agregando evento...', success: '¡Evento agregado con éxito!', error: 'No se pudo agregar.' });
        await promise;
      }

      resetForm();

    } catch (err) {
      console.error(err);
      toast.error('Error al procesar el evento.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteExistingImage = (url) => {
    setImagesToDelete(prev => [...prev, url]);
  };

  return (
    <div className="add-site-container">
      <form onSubmit={handleSubmit} className="add-site-form">
        <h4>{editingEvent ? 'Editar Evento' : 'Agregar Nuevo Evento'}</h4>
        
        {editingEvent && (
          <div className="edit-notice">
            <p>✏️ Estás editando un evento. <button type="button" onClick={resetForm} className="cancel-edit-button">Cancelar edición</button></p>
          </div>
        )}
        
        <div className="form-section">
          <div className="form-group">
            <label htmlFor="event-title">Título del Evento</label>
            <input 
              id="event-title" 
              type="text" 
              value={title} 
              onChange={handleTitleChange}
              placeholder="Ej: Feria Patronal de San Antonio" 
              disabled={uploading} 
            />
          </div>
          
          <div className="form-group full-width">
            <label>Descripción General</label>
            <div className="rich-editor-wrapper">
              <RichTextEditor 
                key={editingEvent || 'new-event'}
                content={description} 
                onChange={setDescription} 
                placeholder="Escribe aquí los detalles... Puedes usar negritas, listas, etc."
              />
            </div>
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

        {/* Programación del evento */}
        <div className="form-section schedule-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h5>Programación del Evento (Opcional)</h5>
            <button 
              type="button" 
              onClick={handleToggleSchedule}
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
    </div>
  );
}

export default AddEventForm;