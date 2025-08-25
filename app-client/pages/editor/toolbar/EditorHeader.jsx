import React from 'react';
import { DEVICES } from '@config/constants.js';

function EditorHeader({
  project,
  selectedDevice,
  isDirty,
  onDeviceChange,
  onSave,
  onBackToDashboard
}) {
  const devices = [
    { id: DEVICES.DESKTOP, label: 'DESKTOP', icon: '💻' },
    { id: DEVICES.TABLET, label: 'TABLET', icon: '📱' },
    { id: DEVICES.MOBILE, label: 'MOBILE', icon: '📱' }
  ];

  if (!project) return null;

  return (
    <header className="editor-header">
      <div className="editor-title">
        <h1>{project.name}</h1>
        <span className="project-id">({project.id})</span>
        {isDirty && <span className="dirty-indicator">●</span>}
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
        <button
          onClick={onSave}
          variant="primary"
          disabled={!isDirty}
          size="sm"
        >
          SAVE
        </button>
        <button 
          onClick={onBackToDashboard} 
          variant="secondary"
          size="sm"
        >
          DASHBOARD
        </button>
      </div>
    </header>
  );
}

export default EditorHeader;