import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function useProjectCreator() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    projectId: '',
    name: '',
    template: 'basic'
  });
  
  // Mock templates
  const templates = [
    { id: 'basic', name: 'Basic Project', description: 'Simple landing page' },
    { id: 'empty', name: 'Empty Project', description: 'Blank project' }
  ];
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.projectId.trim()) {
      newErrors.projectId = 'ID projet requis';
    } else if (!/^[a-z0-9-]+$/.test(formData.projectId)) {
      newErrors.projectId = 'ID invalide (lettres, chiffres, tirets seulement)';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Nom du projet requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return false;
    
    setLoading(true);
    
    // Mock création (2 secondes)
    setTimeout(() => {
      console.log('Projet créé:', formData);
      navigate('/', {
        state: { message: `Projet ${formData.projectId} créé !` }
      });
      setLoading(false);
    }, 2000);
    
    return true;
  };

  const handleInputChange = (name, value) => {
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
    if (apiError) setApiError(null);

    let processedValue = value;
    if (name === 'projectId') {
      processedValue = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    }

    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleBackToDashboard = () => {
    navigate('/');
  };

  const clearApiError = () => setApiError(null);

  return {
    formData,
    templates,
    loading,
    templatesLoading: false,
    errors,
    apiError,
    handleSubmit,
    handleInputChange,
    handleBackToDashboard,
    clearApiError
  };
}