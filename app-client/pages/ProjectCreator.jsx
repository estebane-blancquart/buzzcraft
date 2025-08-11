import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/*
 * FAIT QUOI : Page de création de nouveau projet
 * REÇOIT : Rien (page de création)
 * RETOURNE : JSX ProjectCreator
 * ERREURS : Gestion erreurs API
 */

export default function ProjectCreator() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    projectId: '',
    name: '',
    template: 'basic'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: formData.projectId,
          config: {
            name: formData.name,
            template: formData.template
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Project created:', result);
        // Retour au dashboard
        navigate('/');
      } else {
        console.error('Creation failed:', response.status);
      }
    } catch (error) {
      console.error('Creation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="project-creator">
      <h1>Créer un nouveau projet</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="projectId">ID Projet :</label>
          <input
            id="projectId"
            type="text"
            name="projectId"
            value={formData.projectId}
            onChange={handleInputChange}
            placeholder="mon-projet-id"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="name">Nom :</label>
          <input
            id="name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Mon Projet"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="template">Template :</label>
          <select
            id="template"
            name="template"
            value={formData.template}
            onChange={handleInputChange}
          >
            <option value="basic">Basic</option>
            <option value="test-button">Test Button</option>
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
          
          <button 
            type="button" 
            className="btn-secondary"
            onClick={() => navigate('/')}
          >
            Retour
          </button>
        </div>
      </form>
    </div>
  );
}