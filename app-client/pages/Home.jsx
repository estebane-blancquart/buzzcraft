import { useState } from 'react';

/*
 * FAIT QUOI : Page principale création de projets
 * REÇOIT : Rien (page racine)
 * RETOURNE : JSX Component
 * ERREURS : Gestion erreurs API
 */

export default function Home() {
  const [projectId, setProjectId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [template, setTemplate] = useState('basic');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const createProject = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:3000/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          config: { name: projectName, template }
        })
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>BuzzCraft - Créer un Projet</h1>
      
      <form onSubmit={createProject}>
        <div style={{ marginBottom: '15px' }}>
          <label>ID Projet:</label><br/>
          <input 
            type="text" 
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label>Nom:</label><br/>
          <input 
            type="text" 
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label>Template:</label><br/>
          <select 
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
          >
            <option value="basic">Basic</option>
            <option value="restaurant">Restaurant</option>
            <option value="portfolio">Portfolio</option>
          </select>
        </div>
        
        <button 
          type="submit" 
          disabled={loading || !projectId}
          style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none' }}
        >
          {loading ? 'Création...' : 'Créer Projet'}
        </button>
      </form>
      
      {result && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}