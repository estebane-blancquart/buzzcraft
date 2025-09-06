import { useState, useCallback } from 'react';
import { apiUrl } from '@config/api.js';

/**
 * Hook gestion projet éditeur
 * @param {string} projectId - ID du projet à gérer
 * @returns {Object} État projet et actions
 */
export function useProject(projectId) {
  // === VALIDATION STRICTE ===
  if (!projectId || typeof projectId !== 'string') {
    throw new Error('[useProject] projectId must be non-empty string');
  }

  // === ÉTATS LOCAUX ===
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  // === HANDLERS PROJET ===

  /**
   * Charge un projet depuis l'API
   * @param {string} id - ID projet à charger
   */
  const loadProject = useCallback(async (id) => {
    if (!id) {
      console.error('[useProject] loadProject: ID required');
      setError('Project ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('[useProject] 🔄 Loading project:', id);
      const response = await fetch(apiUrl(`projects/${id}`));
      const data = await response.json();
      
      if (data.success) {
        setProject(data.data.project);
        setIsDirty(false);
        console.log('[useProject] ✅ Project loaded:', data.data.project.name);
      } else {
        throw new Error(data.error || 'Failed to load project');
      }
    } catch (error) {
      console.error('[useProject] ❌ Load failed:', error);
      setError(`Failed to load project: ${error.message}`);
      setProject(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Sauvegarde le projet actuel
   */
  const saveProject = useCallback(async () => {
    if (!project) {
      console.warn('[useProject] saveProject: No project to save');
      return;
    }

    if (!isDirty) {
      console.log('[useProject] saveProject: No changes to save');
      return;
    }

    try {
      console.log('[useProject] 💾 Saving project:', project.name);
      
      const response = await fetch(apiUrl(`projects/${project.id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project)
      });

      const data = await response.json();
      
      if (data.success) {
        setIsDirty(false);
        console.log('[useProject] ✅ Project saved successfully');
      } else {
        throw new Error(data.error || 'Failed to save project');
      }
    } catch (error) {
      console.error('[useProject] ❌ Save failed:', error);
      throw error; // Remonter l'erreur pour gestion UI
    }
  }, [project, isDirty]);

  /**
   * Met à jour le projet avec nouvelles données
   * @param {Object} updates - Données à mettre à jour
   */
  const updateProject = useCallback((updates) => {
    if (!project) {
      console.warn('[useProject] updateProject: No project loaded');
      return;
    }

    if (!updates || typeof updates !== 'object') {
      console.error('[useProject] updateProject: Invalid updates');
      return;
    }

    console.log('[useProject] 🔄 Updating project with:', updates);

    setProject(prevProject => ({
      ...prevProject,
      ...updates,
      updated: new Date().toISOString()
    }));
    
    setIsDirty(true);
  }, [project]);

  /**
   * Efface l'erreur actuelle
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // === INTERFACE PUBLIQUE ===
  return {
    // États
    project,
    loading,
    error,
    isDirty,
    
    // Actions
    loadProject,
    saveProject,
    updateProject,
    clearError
  };
}