import React from 'react';
import CanvasFrame from './CanvasFrame.jsx';
import { DEVICES } from '@config/constants.js';

/*
 * FAIT QUOI : Container preview avec validation project
 * REÇOIT : project, device, selectedElement, onElementSelect
 * RETOURNE : Module complet prévisualisation + debug info
 * NOUVEAU : Validation structure + debug visible
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

  // Debug: Analyser la structure du projet reçu
  const debugProject = () => {
    if (!project) {
      return {
        status: 'NO_PROJECT',
        message: 'Aucun projet fourni'
      };
    }

    if (!project.pages || !Array.isArray(project.pages)) {
      return {
        status: 'NO_PAGES',
        message: 'Projet sans pages ou pages invalides',
        project: project
      };
    }

    if (project.pages.length === 0) {
      return {
        status: 'EMPTY_PAGES',
        message: 'Projet avec pages vides'
      };
    }

    const page = project.pages[0];
    const sections = page.layout?.sections || page.sections || [];
    
    return {
      status: 'OK',
      pageCount: project.pages.length,
      sectionsCount: sections.length,
      structure: {
        projectId: project.id,
        projectName: project.name,
        firstPageId: page.id,
        firstPageSections: sections.length
      }
    };
  };

  const debug = debugProject();

  return (
    <div className="project-preview">
      {/* Header avec info debug en dev */}

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