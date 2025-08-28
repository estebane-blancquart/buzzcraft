import React, { useState, useEffect } from 'react';
import { apiUrl } from '@config/api.js';

/*
 * FAIT QUOI : Modal création nouveau projet (CLEAN VERSION)
 * REÇOIT : isOpen, onClose, onSubmit
 * RETOURNE : Modal avec formulaire création + fallback templates
 * ERREURS : Validation inline + fallback automatique si API fail
 */

function NewProjectModal({ isOpen = false, onClose = () => {}, onSubmit = () => {} }) {
  const [formData, setFormData] = useState({
    projectId: '',
    name: '',
    template: 'basic'
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);


  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    setTemplatesLoading(true);
    
    try {
      const response = await fetch(apiUrl('projects/meta/templates'));
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setTemplates(data.data.templates);
        if (data.data.templates.length > 0) {
          setFormData(prev => ({ ...prev, template: data.data.templates[0].id }));
        }
      } else {
        // FALLBACK : Templates hardcodés
        const fallbackTemplates = [
          { id: 'basic', name: 'Basic Project Template' },
          { id: 'restaurant', name: 'Restaurant Template' },
          { id: 'contact', name: 'Contact Form Template' }
        ];
        setTemplates(fallbackTemplates);
        setFormData(prev => ({ ...prev, template: 'basic' }));
      }
    } catch (error) {
      console.error('Templates load error:', error);
      
      // FALLBACK : Templates hardcodés
      const fallbackTemplates = [
        { id: 'basic', name: 'Basic Project Template' },
        { id: 'restaurant', name: 'Restaurant Template' },
        { id: 'contact', name: 'Contact Form Template' }
      ];
      setTemplates(fallbackTemplates);
      setFormData(prev => ({ ...prev, template: 'basic' }));
    } finally {
      setTemplatesLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.projectId.trim()) {
      newErrors.projectId = 'ID projet requis';
    } else if (!/^[a-z0-9-]+$/.test(formData.projectId)) {
      newErrors.projectId = 'Lettres minuscules, chiffres et tirets uniquement';
    } else if (formData.projectId.length < 3) {
      newErrors.projectId = 'Au moins 3 caractères';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Nom du projet requis';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Au moins 2 caractères';
    }

    if (!formData.template) {
      newErrors.template = 'Template requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      await onSubmit(formData);
      setFormData({ projectId: '', name: '', template: templates[0]?.id || 'basic' });
      // onClose sera appelé par le parent après succès
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (name, value) => {
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }

    let processedValue = value;
    if (name === 'projectId') {
      processedValue = value.toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .replace(/^-+|-+$/g, '')
        .replace(/-{2,}/g, '-');
    }

    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({ projectId: '', name: '', template: templates[0]?.id || 'basic' });
      setErrors({});
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Créer un nouveau projet</h2>
          <button onClick={handleClose} className="modal-close">×</button>
        </div>

        {errors.submit && (
          <div className="error-banner">
            ⚠️ {errors.submit}
          </div>
        )}

        {/* Zone de debug supprimée - modal propre */}

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-field">
            <label>ID Projet *</label>
            <input
              type="text"
              value={formData.projectId}
              onChange={(e) => handleInputChange('projectId', e.target.value)}
              placeholder="mon-super-projet"
              disabled={loading}
              maxLength={50}
            />
            {errors.projectId && <small className="error">{errors.projectId}</small>}
          </div>

          <div className="form-field">
            <label>Nom du projet *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Mon Super Projet"
              disabled={loading}
              maxLength={100}
            />
            {errors.name && <small className="error">{errors.name}</small>}
          </div>

          <div className="form-field">
            <label>Template *</label>
            {templatesLoading ? (
              <div className="loading-templates">Chargement templates...</div>
            ) : (
              <select
                value={formData.template}
                onChange={(e) => handleInputChange('template', e.target.value)}
                disabled={loading || templates.length === 0}
              >
                <option value="">-- Sélectionnez un template --</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            )}
            {errors.template && <small className="error">{errors.template}</small>}
          </div>

          <div className="modal-footer">
            <button type="button" onClick={handleClose} disabled={loading}>
              Annuler
            </button>
            <button 
              type="submit" 
              disabled={loading || templatesLoading || templates.length === 0}
            >
              {loading ? 'Création...' : 'Créer Projet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewProjectModal;