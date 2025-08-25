import React, { useState, useEffect } from 'react';
import { apiUrl } from '@config/api.js';

function CreateModal({ isOpen, onClose, onSubmit }) {
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
      const data = await response.json();
      
      if (data.success) {
        setTemplates(data.templates);
        if (data.templates.length > 0) {
          setFormData(prev => ({ ...prev, template: data.templates[0].id }));
        }
      }
    } catch (error) {
      console.error('Templates load error:', error);
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
      onClose();
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

  return (
    <div isOpen={isOpen} onClose={handleClose} title="Créer un nouveau projet">
      {errors.submit && (
        <div style={{ 
          background: 'color-mix(in srgb, var(--color-danger) 8%, transparent)', 
          border: '1px solid var(--color-danger)', 
          borderRadius: 'var(--radius-md)', 
          padding: 'var(--space-3)', 
          marginBottom: 'var(--space-4)', 
          color: 'var(--color-danger)' 
        }}>
          ⚠️ {errors.submit}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <input
          label="ID Projet"
          value={formData.projectId}
          onChange={(e) => handleInputChange('projectId', e.target.value)}
          placeholder="mon-super-projet"
          error={errors.projectId}
          required
          disabled={loading}
          maxLength={50}
        />

        <input
          label="Nom du projet"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="Mon Super Projet"
          error={errors.name}
          required
          disabled={loading}
          maxLength={100}
        />

        <div style={{ marginBottom: 'var(--space-6)' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: 'var(--space-2)', 
            fontWeight: 500, 
            fontSize: 'var(--size-sm)', 
            color: 'var(--color-text-primary)' 
          }}>
            Template <span style={{ color: 'var(--color-danger)' }}>*</span>
          </label>
          {templatesLoading ? (
            <div style={{ padding: 'var(--space-3)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              Chargement...
            </div>
          ) : (
            <select
              value={formData.template}
              onChange={(e) => handleInputChange('template', e.target.value)}
              disabled={loading || templates.length === 0}
              style={{
                width: '100%',
                background: 'color-mix(in srgb, var(--color-bg-secondary) 95%, white 5%)',
                border: '1px solid color-mix(in srgb, var(--color-bg-secondary) 85%, white 15%)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3)',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--size-sm)'
              }}
            >
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          )}
          {errors.template && (
            <div style={{ color: 'var(--color-danger)', fontSize: 'var(--size-xs)', marginTop: 'var(--space-1)' }}>
              {errors.template}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'flex-end', marginTop: 'var(--space-8)' }}>
          <button variant="secondary" onClick={handleClose} disabled={loading}>
            Annuler
          </button>
          <button 
            type="submit" 
            variant="primary" 
            loading={loading}
            disabled={templatesLoading || templates.length === 0}
          >
            Créer Projet
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateModal;
