import React from 'react';
import { useProjectCreator } from '../../hooks/useProjectCreator.js';

export default function CreationForm() {
  const {
    formData,
    templates,
    loading,
    errors,
    apiError,
    handleSubmit,
    handleInputChange,
    handleBackToDashboard,
    clearApiError
  } = useProjectCreator();

  const onSubmit = async (e) => {
    e.preventDefault();
    await handleSubmit();
  };

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
          <button onClick={clearApiError}>×</button>
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
            <label htmlFor="template">Template</label>
            <select
              id="template"
              value={formData.template}
              onChange={(e) => handleInputChange('template', e.target.value)}
              disabled={loading}
            >
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name} - {template.description}
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