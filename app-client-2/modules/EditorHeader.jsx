import React from 'react';
import { DEVICES } from '@config/constants.js';
import Button from '@components/Button.jsx';

function EditorHeader({
  project,
  selectedDevice,
  isDirty,
  onDeviceChange,
  onSave,
  onBackToDashboard
}) {
  const devices = [
    { id: DEVICES.DESKTOP, label: 'DESKTOP', icon: 'Ì≤ª' },
    { id: DEVICES.TABLET, label: 'TABLET', icon: 'Ì≥±' },
    { id: DEVICES.MOBILE, label: 'MOBILE', icon: 'Ì≥±' }
  ];

  if (!project) return null;

  return (
    <header className="editor-header">
      <div className="editor-title">
        <h1>{project.name}</h1>
        <span className="project-id">({project.id})</span>
        {isDirty && <span className="dirty-indicator">‚óè</span>}
      </div>

      <div className="editor-controls">
        <div className="device-selector">
          {devices.map(device => (
            <button
              key={device.id}
              className={`device-btn ${selectedDevice === device.id ? 'active' : ''}`}
              onClick={() => onDeviceChange(device.id)}
            >
              <span className="device-icon">{device.icon}</span>
              <span className="device-label">{device.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="editor-actions">
        <Button
          onClick={onSave}
          variant="primary"
          disabled={!isDirty}
        >
          SAVE
        </Button>
        <Button 
          onClick={onBackToDashboard} 
          variant="secondary"
        >
          DASHBOARD
        </Button>
      </div>
    </header>
  );
}

export default EditorHeader;
