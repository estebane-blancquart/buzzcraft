import React from 'react';
import { DEVICES } from '@config/constants.js';

/*
 * FAIT QUOI : Composant atomique pour sélectionner le device de preview
 * REÇOIT : selectedDevice, onDeviceChange, disabled
 * RETOURNE : Toggle buttons pour devices
 * ERREURS : Défensif avec device par défaut
 */

function DeviceToggle({ 
  selectedDevice = DEVICES.DESKTOP, 
  onDeviceChange = () => {}, 
  disabled = false 
}) {
  const devices = [
    { id: DEVICES.DESKTOP, label: 'DESKTOP' },
    { id: DEVICES.TABLET, label: 'TABLET' },
    { id: DEVICES.MOBILE, label: 'MOBILE' }
  ];

  const handleDeviceClick = (deviceId) => {
    if (!disabled && onDeviceChange && deviceId !== selectedDevice) {
      onDeviceChange(deviceId);
    }
  };

  return (
    <div className="device-selector">
      {devices.map(device => (
        <button
          key={device.id}
          className={`device-btn ${selectedDevice === device.id ? 'active' : ''}`}
          onClick={() => handleDeviceClick(device.id)}
          disabled={disabled}
        >
          <span className="device-label">{device.label}</span>
        </button>
      ))}
    </div>
  );
}

export default DeviceToggle;