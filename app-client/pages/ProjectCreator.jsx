import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/*
 * FAIT QUOI : Page de création de nouveau projet
 * REÇOIT : Rien (page de création)
 * RETOURNE : JSX ProjectCreator
 * ERREURS : Gestion erreurs API avec validation frontend
 */

export default function ProjectCreator() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    projectId: '',
    name: '',
    template: 'basic'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);

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
    
    // Validation Template
    if (!['basic', 'test-button'].includes(formData.template)) {
      newErrors.template = 'Template invalide';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset errors
    setApiError(null);
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

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
        // Retour au dashboard
        navigate('/', { 
          state: { 
            message: `Projet ${formData.projectId} créé avec succès !` 
          }
        });
      } else {
        // Handle API errors
        if (result.details && Array.isArray(result.details)) {
          setApiError(`Erreurs de validation: ${result.details.join(', ')}`);
        } else {
          setApiError(result.error || 'Erreur lors de la création');
        }
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
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
    
    // Clear API error when user modifies form
    if (apiError) {
      setApiError(null);
    }
    
    // Special handling for projectId (auto-lowercase and sanitize)
    let processedValue = value;
    if (name === 'projectId') {
      processedValue = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  return (
    <div className="project-creator">
      <h1>Créer un nouveau projet</h1>
      
      {apiError && (
        <div className="error-banner">
          <span>⚠️ {apiError}</span>
          <button onClick={() => setApiError(null)} className="error-close">×</button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} noValidate>
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
            required
            aria-describedby={errors.projectId ? 'projectId-error' : undefined}
          />
          {errors.projectId && (
            <div id="projectId-error" className="field-error">
              {errors.projectId}
            </div>
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
            required
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {errors.name && (
            <div id="name-error" className="field-error">
              {errors.name}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="template">
            Template <span className="required">*</span>
          </label>
          <select
            id="template"
            name="template"
            value={formData.template}
            onChange={handleInputChange}
            className={errors.template ? 'error' : ''}
            required
            aria-describedby={errors.template ? 'template-error' : undefined}
          >
            <option value="basic">Basic</option>
            <option value="test-button">Test Button</option>
          </select>
          {errors.template && (
            <div id="template-error" className="field-error">
              {errors.template}
            </div>
          )}
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Création...' : 'Créer Projet'}
          </button>
          
          <button 
            type="button" 
            className="btn-secondary"
            onClick={() => navigate('/')}
            disabled={loading}
          >
            Retour
          </button>
        </div>
      </form>
    </div>
  );
}