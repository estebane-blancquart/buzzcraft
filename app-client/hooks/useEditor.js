import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject } from './editor/useProject.js';
import { useElements } from './editor/useElements.js';
import { useSelection } from './editor/useSelection.js';
import { useTemplates } from './editor/useTemplates.js';
import { useDevices } from './editor/useDevices.js';

/*
 * FAIT QUOI : Coordinateur éditeur (50 lignes max, délègue tout)
 * REÇOIT : Rien (hook autonome avec params)
 * RETOURNE : Interface unifiée de tous les hooks éditeur
 * ERREURS : Gérées par les hooks spécialisés
 */

export function useEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // === HOOKS SPÉCIALISÉS ===
  const project = useProject(id);
  const elements = useElements(project.project, project.updateProject);
  const selection = useSelection();
  const templates = useTemplates();
  const devices = useDevices();
  
  // === ÉTATS UI MODALS ===
  const [showComponentSelector, setShowComponentSelector] = useState(false);
  const [showContainerSelector, setShowContainerSelector] = useState(false);
  const [pendingContainerId, setPendingContainerId] = useState(null);
  const [pendingSectionId, setPendingSectionId] = useState(null);

  // === EFFETS ===
  
  // Chargement projet au montage
  useEffect(() => {
    if (id) {
      project.loadProject(id);
    }
  }, [id, project.loadProject]);

  // === HANDLERS COORDONNÉS ===

  /**
   * Handler navigation retour
   */
  const handleBackToDashboard = () => {
    navigate('/');
  };

  /**
   * Handler mise à jour élément (avec auto-clear sélection si supprimé)
   */
  const handleElementUpdate = (elementId, updates) => {
    elements.updateElement(elementId, updates);
    
    // Si l'élément sélectionné est supprimé, déselectionner
    if (selection.selectedElement?.id === elementId && updates === null) {
      selection.clearSelection();
    }
  };

  /**
   * Handler suppression élément (avec auto-clear sélection)
   */
  const handleDeleteElement = (elementId) => {
    // Déselectionner si l'élément supprimé était sélectionné
    if (selection.selectedElement?.id === elementId) {
      selection.clearSelection();
    }
    
    elements.deleteElement(elementId);
  };

  /**
   * Handler sélection composant (ouvre modal ou ajoute direct)
   */
  const handleComponentSelect = (componentType, containerId) => {
    console.log('[useEditor] 🔧 Component selection:', { componentType, containerId });
    
    if (componentType && containerId) {
      // Ajout direct
      elements.addComponent(containerId, componentType);
    } else if (containerId) {
      // Ouvrir modal sélection
      setPendingContainerId(containerId);
      setShowComponentSelector(true);
    } else {
      console.error('[useEditor] handleComponentSelect: containerId required');
    }
  };

  /**
   * Handler sélection container (ouvre modal ou ajoute direct)
   */
  const handleContainerSelect = (containerType, sectionId) => {
    console.log('[useEditor] 🔧 Container selection:', { containerType, sectionId });
    
    if (containerType && sectionId) {
      // Ajout direct
      elements.addContainer(sectionId, containerType);
    } else if (sectionId) {
      // Ouvrir modal sélection
      setPendingSectionId(sectionId);
      setShowContainerSelector(true);
    } else {
      console.error('[useEditor] handleContainerSelect: sectionId required');
    }
  };

  /**
   * Handler modal composants - sélection type
   */
  const handleModalComponentSelect = (componentType) => {
    if (pendingContainerId && componentType) {
      elements.addComponent(pendingContainerId, componentType);
    }
    
    setShowComponentSelector(false);
    setPendingContainerId(null);
  };

  /**
   * Handler modal containers - sélection type
   */
  const handleModalContainerSelect = (containerType) => {
    if (pendingSectionId && containerType) {
      elements.addContainer(pendingSectionId, containerType);
    }
    
    setShowContainerSelector(false);
    setPendingSectionId(null);
  };

  /**
   * Handler fermeture modals
   */
  const handleCloseModals = () => {
    setShowComponentSelector(false);
    setShowContainerSelector(false);
    setPendingContainerId(null);
    setPendingSectionId(null);
  };

  // === INTERFACE PUBLIQUE UNIFIÉE ===
  return {
    // États projet
    project: project.project,
    loading: project.loading,
    error: project.error,
    isDirty: project.isDirty,
    
    // États sélection
    selectedElement: selection.selectedElement,
    selectedDevice: devices.currentDevice,
    
    // États UI
    showComponentSelector,
    showContainerSelector,
    templatesCache: templates.templatesCache,

    // Actions projet
    saveProject: project.saveProject,
    clearError: project.clearError,

    // Actions éléments
    handleAddPage: elements.addPage,
    handleAddSection: elements.addSection,
    handleAddDiv: (sectionId) => elements.addContainer(sectionId, 'div'),
    handleElementUpdate,
    handleDeleteElement,

    // Actions sélection
    handleElementSelect: selection.selectElement,
    handleDeviceChange: devices.changeDevice,

    // Actions modals
    handleComponentSelect,
    handleContainerSelect,
    handleCloseComponentSelector: handleCloseModals,
    handleCloseContainerSelector: handleCloseModals,

    // Handlers pour modals (nouvelle interface)
    onModalComponentSelect: handleModalComponentSelect,
    onModalContainerSelect: handleModalContainerSelect,

    // Navigation
    handleBackToDashboard
  };
}