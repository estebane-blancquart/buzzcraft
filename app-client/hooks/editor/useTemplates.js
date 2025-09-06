import { useState, useEffect, useCallback } from 'react';
import { apiUrl } from '@config/api.js';

/**
 * Hook gestion cache templates
 * @returns {Object} Cache templates et actions
 */
export function useTemplates() {
  // === ÉTATS TEMPLATES ===
  const [templatesCache, setTemplatesCache] = useState({
    components: new Map(),
    containers: new Map(),
    loaded: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // === CHARGEMENT TEMPLATES ===

  /**
   * Charge tous les templates depuis l'API
   */
  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[useTemplates] 🔄 Loading templates...');
      
      // Chargement composants
      try {
        const componentsResponse = await fetch(apiUrl('projects/meta/templates/components'));
        const componentsData = await componentsResponse.json();
        
        if (componentsData.success) {
          const componentsMap = new Map();
          componentsData.data.forEach(template => {
            componentsMap.set(template.type, template);
          });
          
          setTemplatesCache(prev => ({
            ...prev,
            components: componentsMap
          }));
          
          console.log('[useTemplates] ✅ Components loaded:', componentsMap.size);
        }
      } catch (error) {
        console.warn('[useTemplates] ⚠️ Components API unavailable:', error.message);
      }
      
      // Chargement containers
      try {
        const containersResponse = await fetch(apiUrl('projects/meta/templates/containers'));
        const containersData = await containersResponse.json();
        
        if (containersData.success) {
          const containersMap = new Map();
          containersData.data.forEach(template => {
            containersMap.set(template.type, template);
          });
          
          setTemplatesCache(prev => ({
            ...prev,
            containers: containersMap,
            loaded: true
          }));
          
          console.log('[useTemplates] ✅ Containers loaded:', containersMap.size);
        }
      } catch (error) {
        console.warn('[useTemplates] ⚠️ Containers API unavailable:', error.message);
      }
      
      // Marquer comme chargé même si APIs indisponibles
      setTemplatesCache(prev => ({ ...prev, loaded: true }));
      console.log('[useTemplates] ✅ Templates loading complete');
      
    } catch (error) {
      console.error('[useTemplates] ❌ Template loading failed:', error);
      setError(`Template system failed: ${error.message}`);
      
      // Fallback: marquer comme chargé avec cache vide
      setTemplatesCache({
        components: new Map(),
        containers: new Map(),
        loaded: true
      });
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Recharge les templates
   */
  const reloadTemplates = useCallback(() => {
    setTemplatesCache({
      components: new Map(),
      containers: new Map(),
      loaded: false
    });
    loadTemplates();
  }, [loadTemplates]);

  /**
   * Obtient un template de composant
   * @param {string} type - Type de composant
   * @returns {Object|null} Template ou null
   */
  const getComponentTemplate = useCallback((type) => {
    if (!type) return null;
    return templatesCache.components.get(type) || null;
  }, [templatesCache.components]);

  /**
   * Obtient un template de container
   * @param {string} type - Type de container
   * @returns {Object|null} Template ou null
   */
  const getContainerTemplate = useCallback((type) => {
    if (!type) return null;
    return templatesCache.containers.get(type) || null;
  }, [templatesCache.containers]);

  /**
   * Efface l'erreur actuelle
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Chargement automatique au montage
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // === INTERFACE PUBLIQUE ===
  return {
    // États
    templatesCache,
    loading,
    error,
    
    // Actions
    loadTemplates,
    reloadTemplates,
    clearError,
    
    // Utilitaires
    getComponentTemplate,
    getContainerTemplate
  };
}