import React from 'react';

/*
 * FAIT QUOI : Sélecteur device responsive (Mobile/Tablet/Desktop)
 * REÇOIT : selected: string, onChange: function
 * RETOURNE : JSX boutons device
 */

export default function DeviceSelector({ selected, onChange }) {
  const devices = [
    { id: 'mobile', label: 'MOBILE', icon: '📱' },
    { id: 'tablet', label: 'TABLET', icon: '📱' },
    { id: 'desktop', label: 'DESKTOP', icon: '💻' }
  ];

  return (
    <div className="device-selector">
      {devices.map(device => (
        <button
          key={device.id}
          className={`device-btn ${selected === device.id ? 'active' : ''}`}
          onClick={() => onChange(device.id)}
        >
          <span className="device-icon">{device.icon}</span>
          <span className="device-label">{device.label}</span>
        </button>
      ))}
    </div>
  );
}