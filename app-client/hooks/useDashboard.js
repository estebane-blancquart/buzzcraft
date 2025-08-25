import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PROJECT_ACTIONS, MESSAGE_TYPES } from '@config/constants.js';

/*
 * FAIT QUOI : Logique métier dashboard pure (UI, modals, filtres)
 * REÇOIT : Rien (hook autonome)
 * RETOURNE : États et handlers UI dashboard
 * ERREURS : Aucune (logique UI défensive)
 */

export function useDashboard() {
  const navigate = useNavigate();
  
  // États UI Dashboard
  const [filterState, setFilterState] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

  // Filtrage projets
  const getFilteredProjects = (allProjects) => {
    let filtered = allProjects;
    
    if (filterState) {
      filtered = allProjects.filter(project => project.state === filterState);
      console.log('🔍 FILTER BY STATE:', filterState, '→', filtered.length, 'projets');
    }
    
    return filtered.sort((a, b) => new Date(b.created) - new Date(a.created));
  };

  // Handler filtrage par état
  const handleStateFilter = (state, addMessage) => {
    console.log('🔍 FILTER CHANGED:', filterState, '→', state);
    setFilterState(state);
    
    if (addMessage) {
      if (state) {
        addMessage(MESSAGE_TYPES.INFO, `Filtrage par état: ${state}`);
      } else {
        addMessage(MESSAGE_TYPES.INFO, 'Affichage de tous les projets');
      }
    }
  };

  // Handler création projet
  const handleNewProject = () => {
    console.log('Ouverture modal création');
    setShowCreateModal(true);
  };

  // Handler fermeture modal
  const handleCloseModal = () => {
    console.log('Fermeture modal');
    setShowCreateModal(false);
  };

  // Handler demande suppression
  const handleDeleteRequest = (projectId, projectName) => {
    console.log('🗑️ DELETE REQUEST for:', projectId);
    setProjectToDelete({ id: projectId, name: projectName });
    setShowConfirmModal(true);
  };

  // Handler annulation suppression
  const handleCancelDelete = () => {
    console.log('❌ DELETE CANCELLED');
    setShowConfirmModal(false);
    setProjectToDelete(null);
  };

  // Handler confirmation suppression
  const handleConfirmDelete = (executeDelete) => {
    if (!projectToDelete) return;
    
    console.log('💀 DELETE CONFIRMED for:', projectToDelete.id);
    setShowConfirmModal(false);
    
    if (executeDelete) {
      executeDelete(projectToDelete.id);
    }
    
    setProjectToDelete(null);
  };

  // Handler action édition (navigation)
  const handleEditAction = (projectId, addMessage) => {
    console.log(`Navigation vers éditeur pour projet DRAFT: ${projectId}`);
    if (addMessage) {
      addMessage(MESSAGE_TYPES.INFO, `Ouverture éditeur pour projet ${projectId}`);
    }
    navigate(`/editor/${projectId}`);
  };

  return {
    // États
    filterState,
    showCreateModal,
    showConfirmModal,
    projectToDelete,
    
    // Fonctions
    getFilteredProjects,
    handleStateFilter,
    handleNewProject,
    handleCloseModal,
    handleDeleteRequest,
    handleCancelDelete,
    handleConfirmDelete,
    handleEditAction
  };
}