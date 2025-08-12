import React from 'react';
import { useProjectCreator } from '../../hooks/useProjectCreator.js';

/*
 * FAIT QUOI : Module formulaire création projet
 * REÇOIT : Rien (utilise hook page)
 * RETOURNE : JSX formulaire complet avec validation
 */

export default function CreationForm() {
  const {
    // État
    formData,
    templates,
    loading,
    templatesLoading,
    errors,
    apiError,
    
    // Actions
    handleSubmit,
    handleInputChange,
    handleBackToDashboard,
    clearApiError
  } = useProjectCreator();

  const onSubmit = async (e) => {
    e.preventDefault();
    await handleSubmit();
  };

  if (templatesLoading) {
    return (
      <div className="creation-form">
        <div className="loading">Chargement des templates...</div>
      </div>
    );
  }

  return (
    <div className="creation-form">
      <header className="creator-header">
        <h1>Créer un nouveau projet</h1>
        <button 
          onClick={handleBackToDashboard} 
          className="btn-secondary"
          disabled={loading}
        >
          Retour
        </button>
      </header>

      {apiError && (
        <div className="error-banner">
          <span>⚠️ {apiError}</span>
          <button onClick={clearApiError} className="error-close">×</button>
        </div>
      )}

      <div className="creator-content">
        <form onSubmit={onSubmit} className="creator-form">
          <div className="form-group">
            <label htmlFor="projectId">
              ID Projet <span className="required">*</span>
            </label>
            <input
              id="projectId"
              type="text"
              value={formData.projectId}
              onChange={(e) => handleInputChange('projectId', e.target.value)}
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
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
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
            <label htmlFor="template">
              Template <span className="required">*</span>
            </label>
            <select
              id="template"
              value={formData.template}
              onChange={(e) => handleInputChange('template', e.target.value)}
              className={errors.template ? 'error' : ''}
              disabled={loading}
              required
            >
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                  {template.description && ` - ${template.description}`}
                </option>
              ))}
            </select>
            {errors.template && (
              <div className="field-error">{errors.template}</div>
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
          </div>
        </form>
      </div>
    </div>
  );
}