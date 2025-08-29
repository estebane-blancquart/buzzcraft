import React, { useState, useEffect } from 'react';
import { apiUrl } from '@config/api.js';

/*
 * FAIT QUOI : Modal création nouveau projet (NO FALLBACK VERSION)
 * REÇOIT : isOpen, onClose, onSubmit
 * RETOURNE : Modal avec formulaire création STRICT - aucun fallback
 * ERREURS : Validation stricte, pas de masquage
 */

function NewProjectModal({ isOpen = false, onClose = () => {}, onSubmit = () => {} }) {
  const [formData, setFormData] = useState({
    projectId: '',
    name: '',
    template: ''  // ❌ PLUS DE 'basic' par défaut !
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
        // ❌ PLUS DE SÉLECTION AUTOMATIQUE !
        // if (data.data.templates.length > 0) {
        //   setFormData(prev => ({ ...prev, template: data.data.templates[0].id }));
        // }
        
        console.log("🟡 [CLIENT] Templates loaded:", data.data.templates.map(t => t.id));
      } else {
        // ❌ PLUS DE FALLBACK - ERREUR STRICTE
        console.error('CRITICAL: Server returned templates failure');
        setErrors({ 
          templates: 'Le serveur ne peut pas fournir les templates. Impossible de créer un projet.' 
        });
        setTemplates([]);
      }
    } catch (error) {
      console.error('CRITICAL: Templates load error:', error);
      
      // ❌ PLUS DE FALLBACK - ERREUR STRICTE
      setErrors({
        templates: `Impossible de charger les templates: ${error.message}. Vérifiez que le serveur est démarré.`
      });
      setTemplates([]);
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

    // ❌ VALIDATION STRICTE DU TEMPLATE
    if (!formData.template || formData.template.trim() === '') {
      newErrors.template = 'Template requis - vous devez en sélectionner un';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Debug : tracer ce qui est envoyé
    console.log("🟡 [CLIENT] === SUBMIT DEBUG ===");
    console.log("🟡 [CLIENT] formData.template =", `"${formData.template}"`);
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      await onSubmit(formData);
      // ❌ PLUS DE FALLBACK dans le reset
      setFormData({ projectId: '', name: '', template: '' });
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

    // Debug : tracer les changements de template
    if (name === 'template') {
      console.log("🟡 [CLIENT] Template changed to:", `"${value}"`);
    }

    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleClose = () => {
    if (!loading) {
      // ❌ PLUS DE FALLBACK dans le reset
      setFormData({ projectId: '', name: '', template: '' });
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

        {/* Affichage erreur templates */}
        {errors.templates && (
          <div className="error-banner">
            🚨 {errors.templates}
          </div>
        )}

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
            ) : templates.length === 0 ? (
              <div className="error">❌ Aucun template disponible. Impossible de créer un projet.</div>
            ) : (
              <select
                value={formData.template}
                onChange={(e) => handleInputChange('template', e.target.value)}
                disabled={loading}
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
              disabled={loading || templatesLoading || templates.length === 0 || !formData.template}
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