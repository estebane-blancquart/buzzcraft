import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

/*
 * FAIT QUOI : Création de nouveau projet (éditeur vide)
 * REÇOIT : ?template=basic via URL params
 * RETOURNE : JSX interface création simple
 * ERREURS : Validation + feedback utilisateur
 */

export default function ProjectCreator() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [formData, setFormData] = useState({
    projectId: '',
    name: '',
    template: searchParams.get('template') || 'basic'
  });
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await fetch('http://localhost:3000/projects/meta/templates');
      const data = await response.json();
      
      if (data.success) {
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
      // Fallback
      setTemplates([{ id: 'basic', name: 'Basic Project' }]);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validation Project ID
    if (!formData.projectId.trim()) {
      newErrors.projectId = 'ID projet requis';
    } else if (!/^[a-z0-9-]+$/.test(formData.projectId)) {
      newErrors.projectId = 'ID doit contenir seulement des lettres minuscules, chiffres et tirets';
    } else if (formData.projectId.length < 3) {
      newErrors.projectId = 'ID doit contenir au moins 3 caractères';
    }

    // Validation Name
    if (!formData.name.trim()) {
      newErrors.name = 'Nom du projet requis';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Nom doit contenir au moins 2 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setApiError(null);

    try {
      const response = await fetch('http://localhost:3000/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: formData.projectId.trim(),
          config: {
            name: formData.name.trim(),
            template: formData.template
          }
        })
      });

      const result = await response.json();

      if (result.success) {
        // Retour dashboard avec message succès
        navigate('/', {
          state: { message: `Projet ${formData.projectId} créé avec succès !` }
        });
      } else {
        setApiError(result.error || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Creation error:', error);
      setApiError(`Erreur de connexion: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Clear errors
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
    if (apiError) setApiError(null);

    // Special handling for projectId
    let processedValue = value;
    if (name === 'projectId') {
      processedValue = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    }

    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  return (
    <div className="project-creator">
      <header className="creator-header">
        <h1>Créer un nouveau projet</h1>
        <button 
          onClick={() => navigate('/')} 
          className="btn-secondary"
          disabled={loading}
        >
          Retour
        </button>
      </header>

      {apiError && (
        <div className="error-banner">
          <span>⚠️ {apiError}</span>
          <button onClick={() => setApiError(null)} className="error-close">×</button>
        </div>
      )}

      <div className="creator-content">
        <form onSubmit={handleSubmit} className="creator-form">
          <div className="form-group">
            <label htmlFor="projectId">
              ID Projet <span className="required">*</span>
            </label>
            <input
              id="projectId"
              type="text"
              name="projectId"
              value={formData.projectId}
              onChange={handleInputChange}
              placeholder="mon-projet-id"
              className={errors.projectId ? 'error' : ''}
              disabled={loading}
              required
            />
            {errors.projectId && (
              <div className="field-error">{errors.projectId}</div>
            )}
            <div className="field-hint">
              Utilisez uniquement des lettres minuscules, chiffres et tirets
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="name">
              Nom du projet <span className="required">*</span>
            </label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Mon Projet"
              className={errors.name ? 'error' : ''}
              disabled={loading}
              required
            />
            {errors.name && (
              <div className="field-error">{errors.name}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="template">Template</label>
            <select
              id="template"
              name="template"
              value={formData.template}
              onChange={handleInputChange}
              disabled={loading}
            >
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading}
            >
              {loading ? 'Création...' : 'Créer Projet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}