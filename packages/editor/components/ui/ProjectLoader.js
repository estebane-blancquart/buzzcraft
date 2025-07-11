import React, { useState } from 'react';
import useEditorStore from '../../store/editorStore';

const ProjectLoader = () => {
  const { setJsonProject } = useEditorStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadProject = async (projectName) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`🔄 Loading project: ${projectName}`);
      
      const response = await fetch(`/api/load-project/${projectName}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data);
      
      if (!data.success || !data.project) {
        throw new Error('Invalid response format');
      }
      
      // IMPORTANT: utiliser data.project, pas data directement
      console.log('Setting project:', data.project);
      setJsonProject(data.project);
      
      console.log(`✅ Project "${projectName}" loaded successfully`);
      alert(`✅ Projet "${projectName}" chargé avec succès !`);
      
    } catch (error) {
      console.error('Error loading project:', error);
      setError(error.message);
      alert(`❌ Erreur lors du chargement: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <button 
          onClick={() => loadProject('dubois-multipage')}
          disabled={isLoading}
          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
        >
          {isLoading ? '⏳' : '📁'} Charger Dubois
        </button>
        
        <button 
          onClick={() => loadProject('artisan-dubois-complete')}
          disabled={isLoading}
          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
        >
          {isLoading ? '⏳' : '📁'} Charger Artisan
        </button>
        
        <button 
          onClick={() => loadProject('test-minimal')}
          disabled={isLoading}
          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
        >
          {isLoading ? '⏳' : '📁'} Charger Minimal
        </button>
      </div>
      
      {error && (
        <div className="text-red-600 text-xs">
          Erreur: {error}
        </div>
      )}
    </div>
  );
};

export default ProjectLoader;