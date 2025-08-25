import React from 'react';
import CanvasFrame from './CanvasFrame.jsx';
import { DEVICES } from '@config/constants.js';

/*
 * FAIT QUOI : Container preview avec header device + CanvasFrame
 * REÇOIT : project, device, selectedElement, onElementSelect
 * RETOURNE : Module complet prévisualisation
 * ERREURS : Défensif avec valeurs par défaut
 */

function PreviewModule({ 
  project = null, 
  device = DEVICES.DESKTOP, 
  selectedElement = null, 
  onElementSelect = () => {} 
}) {
  const getDeviceLabel = () => {
    const deviceLabels = {
      [DEVICES.DESKTOP]: 'Desktop',
      [DEVICES.TABLET]: 'Tablet',
      [DEVICES.MOBILE]: 'Mobile'
    };
    return deviceLabels[device] || 'Unknown';
  };

  const getDeviceIcon = () => {
    const deviceIcons = {
      [DEVICES.DESKTOP]: '💻',
      [DEVICES.TABLET]: '📱',
      [DEVICES.MOBILE]: '📱'
    };
    return deviceIcons[device] || '💻';
  };

  return (
    <div className="project-preview">
      <div className="preview-header">
        <h3>Preview</h3>
        <span className="device-indicator">
          <span className="device-icon">{getDeviceIcon()}</span>
          {getDeviceLabel()}
        </span>
      </div>
      
      <CanvasFrame
        project={project}
        device={device}
        selectedElement={selectedElement}
        onElementSelect={onElementSelect}
      />
    </div>
  );
}

export default PreviewModule;