import React from 'react';
import DeviceToggle from './DeviceToggle.jsx';

/*
 * FAIT QUOI : Container toolbar complet avec titre + DeviceToggle + SAVE seulement
 * REÇOIT : project, selectedDevice, isDirty, onDeviceChange, onSave, onBackToDashboard
 * RETOURNE : Header éditeur avec SAVE + DASHBOARD uniquement
 * ERREURS : Défensif avec projet null
 */

function ToolbarModule({
  project = null,
  selectedDevice = 'desktop',
  isDirty = false,
  onDeviceChange = () => {},
  onSave = () => {},
  onBackToDashboard = () => {}
}) {
  const handleSave = () => {
    if (isDirty && onSave) {
      onSave();
    }
  };

  const handleBack = () => {
    if (onBackToDashboard) {
      onBackToDashboard();
    }
  };

  if (!project) {
    return (
      <header className="editor-header">
        <div className="editor-title">
          <h1>Loading...</h1>
        </div>
      </header>
    );
  }

  return (
    <header className="editor-header">
      <div className="editor-title">
        <h1>{project.name}</h1>
        {isDirty && <span className="dirty-indicator">●</span>}
      </div>

      <div className="editor-controls">
        <DeviceToggle
          selectedDevice={selectedDevice}
          onDeviceChange={onDeviceChange}
        />
      </div>

      <div className="editor-actions">
        <button
          className={`btn-primary ${!isDirty ? 'disabled' : ''}`}
          onClick={handleSave}
          disabled={!isDirty}
        >
          SAVE
        </button>
        
        <button 
          className="btn-secondary"
          onClick={handleBack}
        >
          DASHBOARD
        </button>
      </div>
    </header>
  );
}

export default ToolbarModule;