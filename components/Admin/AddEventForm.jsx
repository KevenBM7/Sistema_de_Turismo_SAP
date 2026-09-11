'use client';

import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, deleteObject, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import imageCompression from 'browser-image-compression';
import slugify from 'slugify';
import { triggerRevalidation } from '@/lib/revalidate';
import { Calendar, Sparkles, Clock, Camera, UploadCloud, Plus, Check, CalendarDays } from 'lucide-react';
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

      await triggerRevalidation('event', { slug });
      router.refresh();

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
      {/* Header Banner */}
      <div className="form-header-banner">
        <span className="form-header-badge">
          <CalendarDays size={13} /> Agenda Cultural y Festividades
        </span>
        <h2 className="form-header-title">
          {editingEvent ? 'Editar Evento Cultural' : 'Registrar Nuevo Evento'}
        </h2>
        <p className="form-header-subtitle">
          Publica ferias, celebraciones y actividades turísticas de San Antonio Palopó con fechas y cronograma por días.
        </p>
      </div>

      {editingEvent && (
        <div className="edit-notice">
          <p>
            ✏️ Estás editando el evento: <strong>{title}</strong>
          </p>
          <button type="button" onClick={resetForm} className="cancel-edit-button">
            Cancelar edición
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="add-site-form">
        
        {/* =======================================================
            SECCIÓN 1: INFORMACIÓN PRINCIPAL
            ======================================================= */}
        <div className="form-card-section">
          <div className="section-title-row">
            <div className="section-icon-pill bg-blue">
              <Calendar size={20} />
            </div>
            <div>
              <h3 className="section-card-title">1. Información Principal del Evento</h3>
              <p className="section-card-desc">Título representativo, fechas oficiales de celebración y descripción detallada.</p>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="event-title">
              Título del Evento <span className="required-star">*</span>
            </label>
            <input 
              id="event-title" 
              type="text" 
              value={title} 
              onChange={handleTitleChange}
              placeholder="Ej: Feria Patronal de San Antonio Palopó" 
              disabled={uploading} 
              required
            />
            <span className="slug-preview">
              <strong>Slug SEO:</strong> /evento/{slug || 'titulo-del-evento'}
            </span>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="event-start-date">
                Fecha de Inicio <span className="required-star">*</span>
              </label>
              <input 
                id="event-start-date" 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                disabled={uploading} 
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="event-end-date">
                Fecha de Fin (opcional)
              </label>
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
            <label>Descripción General del Evento</label>
            <div className="rich-editor-wrapper">
              <RichTextEditor 
                key={editingEvent || 'new-event'}
                content={description} 
                onChange={setDescription} 
                placeholder="Escribe aquí los detalles del evento, historia, actividades principales y recomendaciones..."
              />
            </div>
          </div>
        </div>

        {/* =======================================================
            SECCIÓN 2: FOTOGRAFÍAS DEL EVENTO
            ======================================================= */}
        <div className="form-card-section">
          <div className="section-title-row">
            <div className="section-icon-pill bg-purple">
              <Camera size={20} />
            </div>
            <div>
              <h3 className="section-card-title">2. Fotografías del Evento</h3>
              <p className="section-card-desc">Sube hasta 2 imágenes promocionales o afiches (se convertirán automáticamente a WebP).</p>
            </div>
          </div>

          {existingImageUrls.length > 0 && (
            <div className="form-group">
              <label>Imágenes Actuales:</label>
              <div className="image-preview-container">
                {existingImageUrls.map((url, index) => {
                  if (imagesToDelete.includes(url)) return null;
                  return (
                    <div key={index} className="image-preview-wrapper">
                      <img src={url} alt={`Imagen actual ${index + 1}`} className="image-preview" />
                      <button 
                        type="button" 
                        onClick={() => handleDeleteExistingImage(url)} 
                        className="delete-image-button"
                        title="Eliminar imagen"
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
            <label>Subir Nuevas Fotografías (Máximo 2 en total) <span className="required-star">*</span></label>
            <div className="image-upload-dropzone">
              <input 
                id="event-image-input" 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange} 
                disabled={uploading} 
                multiple
              />
              <div className="upload-dropzone-content">
                <UploadCloud size={38} className="upload-dropzone-icon" />
                <span className="upload-dropzone-title">Haz clic aquí o arrastra tus imágenes</span>
                <span className="upload-dropzone-hint">Formatos: JPG, PNG o WebP. Tamaño óptimo panorámico.</span>
              </div>
            </div>
          </div>

          {imagePreviews.length > 0 && (
            <div className="form-group">
              <label>Nuevas imágenes a subir ({imagePreviews.length}):</label>
              <div className="image-preview-container">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="image-preview-wrapper">
                    <img src={preview} alt={`Previsualización ${index + 1}`} className="image-preview" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* =======================================================
            SECCIÓN 3: PROGRAMACIÓN POR DÍAS (CRONOGRAMA)
            ======================================================= */}
        <div className="form-card-section schedule-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
            <div className="section-title-row" style={{ marginBottom: 0, paddingBottom: 0, borderBottom: 'none' }}>
              <div className="section-icon-pill bg-emerald">
                <Clock size={20} />
              </div>
              <div>
                <h3 className="section-card-title">3. Programación Detallada</h3>
                <p className="section-card-desc">Organiza actividades por día y hora (ideal para festividades de varios días).</p>
              </div>
            </div>

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
            <div className="schedule-builder" style={{ marginTop: '1.25rem' }}>
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

                  <div className="form-grid-2">
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
                      <label>Título del Día (ej: "Apertura y Alborada")</label>
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
                    <label style={{ fontWeight: 600, marginBottom: '0.65rem', display: 'block', color: '#1e293b' }}>
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
                            style={{ width: '130px' }}
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
                            title="Eliminar actividad"
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
                + Agregar otro día al programa
              </button>
            </div>
          )}
        </div>
        
        {/* =======================================================
            SECCIÓN 4: ACCIONES
            ======================================================= */}
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
            {uploading ? (
              'Guardando...'
            ) : editingEvent ? (
              <>
                <Check size={18} /> Actualizar Evento
              </>
            ) : (
              <>
                <Check size={18} /> Publicar Evento
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddEventForm;