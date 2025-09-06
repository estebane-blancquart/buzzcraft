import { useState, useCallback } from 'react';
import { DEVICES } from '@config/constants.js';

/**
 * Hook gestion sélection éditeur
 * @returns {Object} États et handlers sélection
 */
export function useSelection() {
  // === ÉTATS SÉLECTION ===
  const [selectedElement, setSelectedElement] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(DEVICES.DESKTOP);

  // === HANDLERS SÉLECTION ===

  /**
   * Sélectionne un élément
   * @param {Object} element - Élément à sélectionner
   */
  const selectElement = useCallback((element) => {
    console.log('[useSelection] 🎯 Element selected:', element);
    setSelectedElement(element);
  }, []);

  /**
   * Désélectionne l'élément actuel
   */
  const clearSelection = useCallback(() => {
    console.log('[useSelection] ❌ Selection cleared');
    setSelectedElement(null);
  }, []);

  /**
   * Change le device de prévisualisation
   * @param {string} device - Device à sélectionner
   */
  const selectDevice = useCallback((device) => {
    if (!device || !Object.values(DEVICES).includes(device)) {
      console.error('[useSelection] Invalid device:', device);
      return;
    }
    
    console.log('[useSelection] 📱 Device changed:', device);
    setSelectedDevice(device);
  }, []);

  /**
   * Vérifie si un élément est sélectionné
   * @param {Object} element - Élément à vérifier
   * @returns {boolean} True si sélectionné
   */
  const isSelected = useCallback((element) => {
    return selectedElement && selectedElement.id === element?.id;
  }, [selectedElement]);

  // === INTERFACE PUBLIQUE ===
  return {
    // États
    selectedElement,
    selectedDevice,
    
    // Actions
    selectElement,
    clearSelection,
    selectDevice,
    
    // Utilitaires
    isSelected
  };
}