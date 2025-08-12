import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useProjectActions() {
  const navigate = useNavigate();
  
  // Mock data
  const [projects] = useState([
    { id: 'test-1', name: 'Test Project 1', state: 'DRAFT', created: '2025-01-01', updated: '2025-01-01' },
    { id: 'test-2', name: 'Test Project 2', state: 'BUILT', created: '2025-01-02', updated: '2025-01-02' },
    { id: 'test-3', name: 'Test Project 3', state: 'OFFLINE', created: '2025-01-03', updated: '2025-01-03' },
    { id: 'test-4', name: 'Test Project 4', state: 'ONLINE', created: '2025-01-04', updated: '2025-01-04' }
  ]);
  
  const [loading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading] = useState({});

  const handleNewProject = () => {
    navigate('/create');
  };

  const handleProjectAction = (projectId, action) => {
    console.log(`Action ${action} on project ${projectId}`);
    if (action === 'EDIT') {
      navigate(`/editor/${projectId}`);
    }
  };

  const clearError = () => setError(null);

  return {
    projects,
    loading,
    error,
    actionLoading,
    handleNewProject,
    handleProjectAction,
    clearError
  };
}