import React from 'react';

export default function EditorHeader({
  project,
  selectedDevice,
  isDirty,
  onDeviceChange,
  onSave,
  onBackToDashboard
}) {
  const devices = [
    { id: 'mobile', label: 'MOBILE', icon: '📱' },
    { id: 'tablet', label: 'TABLET', icon: '📱' },
    { id: 'desktop', label: 'DESKTOP', icon: '💻' }
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
          className={`btn-primary ${!isDirty ? 'disabled' : ''}`}
          disabled={!isDirty}
        >
          SAVE
        </button>
        <button 
          onClick={onBackToDashboard} 
          className="btn-secondary"
        >
          Dashboard
        </button>
      </div>
    </header>
  );
}