import { useState, useCallback } from 'react';
import { DEVICES } from '@config/constants.js';

/**
 * Hook gestion devices et responsive
 * @returns {Object} État device et actions
 */
export function useDevices() {
  // === VALIDATION STRICTE ===
  if (!DEVICES || Object.keys(DEVICES).length === 0) {
    throw new Error('[useDevices] DEVICES constants not found');
  }

  // === ÉTATS DEVICES ===
  const [currentDevice, setCurrentDevice] = useState(DEVICES.DESKTOP);

  // === HANDLERS DEVICES ===

  /**
   * Change le device actuel
   * @param {string} device - Device à sélectionner
   */
  const changeDevice = useCallback((device) => {
    if (!device) {
      console.error('[useDevices] changeDevice: device is required');
      return;
    }

    if (!Object.values(DEVICES).includes(device)) {
      console.error('[useDevices] changeDevice: invalid device', device);
      return;
    }
    
    console.log('[useDevices] 📱 Device changed:', currentDevice, '→', device);
    setCurrentDevice(device);
  }, [currentDevice]);

  /**
   * Passe au device suivant dans la liste
   */
  const nextDevice = useCallback(() => {
    const deviceList = Object.values(DEVICES);
    const currentIndex = deviceList.indexOf(currentDevice);
    const nextIndex = (currentIndex + 1) % deviceList.length;
    const nextDevice = deviceList[nextIndex];
    
    changeDevice(nextDevice);
  }, [currentDevice, changeDevice]);

  /**
   * Passe au device précédent dans la liste
   */
  const previousDevice = useCallback(() => {
    const deviceList = Object.values(DEVICES);
    const currentIndex = deviceList.indexOf(currentDevice);
    const prevIndex = currentIndex === 0 ? deviceList.length - 1 : currentIndex - 1;
    const prevDevice = deviceList[prevIndex];
    
    changeDevice(prevDevice);
  }, [currentDevice, changeDevice]);

  /**
   * Remet le device par défaut
   */
  const resetDevice = useCallback(() => {
    changeDevice(DEVICES.DESKTOP);
  }, [changeDevice]);

  /**
   * Vérifie si un device est actuel
   * @param {string} device - Device à vérifier
   * @returns {boolean} True si actuel
   */
  const isCurrentDevice = useCallback((device) => {
    return currentDevice === device;
  }, [currentDevice]);

  /**
   * Obtient les dimensions du device actuel
   * @returns {Object} Dimensions {width, height}
   */
  const getCurrentDimensions = useCallback(() => {
    // Dimensions par défaut selon device
    const dimensions = {
      [DEVICES.DESKTOP]: { width: 1200, height: 800 },
      [DEVICES.TABLET]: { width: 768, height: 1024 },
      [DEVICES.MOBILE]: { width: 375, height: 667 }
    };
    
    return dimensions[currentDevice] || dimensions[DEVICES.DESKTOP];
  }, [currentDevice]);

  // === INTERFACE PUBLIQUE ===
  return {
    // États
    currentDevice,
    availableDevices: Object.values(DEVICES),
    
    // Actions
    changeDevice,
    nextDevice,
    previousDevice,
    resetDevice,
    
    // Utilitaires
    isCurrentDevice,
    getCurrentDimensions
  };
}