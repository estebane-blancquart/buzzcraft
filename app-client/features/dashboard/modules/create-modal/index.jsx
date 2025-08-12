import React, { useState, useEffect } from 'react';

export default function CreateModal({ isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    projectId: '',
    name: '',
    template: 'basic'
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  // Charger les templates depuis l'API
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    setTemplatesLoading(true);
    setErrors(prev => ({ ...prev, templates: null }));
    
    try {
      console.log('Chargement des templates...');
      const response = await fetch('http://localhost:3000/projects/meta/templates');
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setTemplates(data.templates);
        console.log(`${data.templates.length} templates chargés`);
        
        // Sélectionner le premier template par défaut
        if (data.templates.length > 0 && !formData.template) {
          setFormData(prev => ({ ...prev, template: data.templates[0].id }));
        }
      } else {
        throw new Error(data.error || 'Erreur lors du chargement des templates');
      }
    } catch (error) {
      console.error('Erreur loadTemplates:', error);
      setErrors(prev => ({ ...prev, templates: `Impossible de charger les templates: ${error.message}` }));
    } finally {
      setTemplatesLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validation ID projet
    if (!formData.projectId.trim()) {
      newErrors.projectId = 'ID projet requis';
    } else if (!/^[a-z0-9-]+$/.test(formData.projectId)) {
      newErrors.projectId = 'Lettres minuscules, chiffres et tirets uniquement';
    } else if (formData.projectId.length < 3) {
      newErrors.projectId = 'Au moins 3 caractères';
    } else if (formData.projectId.length > 50) {
      newErrors.projectId = 'Maximum 50 caractères';
    }

    // Validation nom projet
    if (!formData.name.trim()) {
      newErrors.name = 'Nom du projet requis';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Au moins 2 caractères';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Maximum 100 caractères';
    }

    // Validation template
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
    setErrors({});
    
    try {
      await onSubmit(formData);
      // Reset form et fermer modal après succès
      setFormData({ projectId: '', name: '', template: templates[0]?.id || 'basic' });
      onClose(); // Fermer la modal
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (name, value) => {
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
    if (errors.submit) {
      setErrors(prev => ({ ...prev, submit: null }));
    }

    let processedValue = value;
    if (name === 'projectId') {
      // Nettoyage strict ID projet
      processedValue = value.toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .replace(/^-+|-+$/g, '') // Pas de tirets au début/fin
        .replace(/-{2,}/g, '-'); // Pas de tirets multiples
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
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Créer un nouveau projet</h2>
          <button 
            className="modal-close"
            onClick={handleClose}
            disabled={loading}
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        {errors.submit && (
          <div className="error-banner">
            <span>⚠️ {errors.submit}</span>
          </div>
        )}

        {errors.templates && (
          <div className="error-banner">
            <span>⚠️ {errors.templates}</span>
            <button onClick={loadTemplates}>Réessayer</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="projectId">
              ID Projet <span className="required">*</span>
            </label>
            <input
              id="projectId"
              type="text"
              value={formData.projectId}
              onChange={(e) => handleInputChange('projectId', e.target.value)}
              placeholder="mon-super-projet"
              className={errors.projectId ? 'error' : ''}
              disabled={loading}
              maxLength={50}
              required
            />
            {errors.projectId && (
              <div className="field-error">{errors.projectId}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="name">
              Nom du projet <span className="required">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Mon Super Projet"
              className={errors.name ? 'error' : ''}
              disabled={loading}
              maxLength={100}
              required
            />
            {errors.name && (
              <div className="field-error">{errors.name}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="template">
              Template <span className="required">*</span>
            </label>
            {templatesLoading ? (
              <div className="loading-inline">Chargement...</div>
            ) : (
              <select
                id="template"
                value={formData.template}
                onChange={(e) => handleInputChange('template', e.target.value)}
                className={errors.template ? 'error' : ''}
                disabled={loading || templates.length === 0}
                required
              >
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            )}
            {errors.template && (
              <div className="field-error">{errors.template}</div>
            )}
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={handleClose}
              disabled={loading}
            >
              Annuler
            </button>
            <button 
              type="submit" 
              className="btn-primary" 
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