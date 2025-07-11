import React from 'react';
import useEditorStore from '../../store/editorStore';

const ConfigPanel = () => {
  const { jsonProject, selectedElement, updateProject } = useEditorStore();

  // Guard clause pour éviter l'erreur
  if (!jsonProject || !jsonProject.config) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-4">
        <h2 className="text-lg font-semibold mb-4">Configuration</h2>
        <div className="text-gray-500 text-center py-8">
          <p>Aucun projet chargé</p>
          <p className="text-sm mt-2">Chargez un projet pour voir la configuration</p>
        </div>
      </div>
    );
  }

  const config = jsonProject.config;
  const meta = jsonProject.meta || {};

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4">Configuration</h2>
      
      {!selectedElement ? (
        // Configuration globale du projet
        <div className="space-y-6">
          {/* Projet */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Projet</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre
                </label>
                <input
                  type="text"
                  value={meta.title || ''}
                  onChange={(e) => updateProject(['meta', 'title'], e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Titre du projet"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={meta.description || ''}
                  onChange={(e) => updateProject(['meta', 'description'], e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm h-20 resize-none"
                  placeholder="Description du projet"
                />
              </div>
            </div>
          </div>

          {/* Couleurs */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Couleurs</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Primary
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={config.colors?.primary || '#3B82F6'}
                    onChange={(e) => updateProject(['config', 'colors', 'primary'], e.target.value)}
                    className="w-12 h-8 border border-gray-300 rounded"
                  />
                  <input
                    type="text"
                    value={config.colors?.primary || '#3B82F6'}
                    onChange={(e) => updateProject(['config', 'colors', 'primary'], e.target.value)}
                    className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
                    placeholder="#3B82F6"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Secondary
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={config.colors?.secondary || '#1E40AF'}
                    onChange={(e) => updateProject(['config', 'colors', 'secondary'], e.target.value)}
                    className="w-12 h-8 border border-gray-300 rounded"
                  />
                  <input
                    type="text"
                    value={config.colors?.secondary || '#1E40AF'}
                    onChange={(e) => updateProject(['config', 'colors', 'secondary'], e.target.value)}
                    className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
                    placeholder="#1E40AF"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Accent
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={config.colors?.accent || '#EF4444'}
                    onChange={(e) => updateProject(['config', 'colors', 'accent'], e.target.value)}
                    className="w-12 h-8 border border-gray-300 rounded"
                  />
                  <input
                    type="text"
                    value={config.colors?.accent || '#EF4444'}
                    onChange={(e) => updateProject(['config', 'colors', 'accent'], e.target.value)}
                    className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
                    placeholder="#EF4444"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Polices */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Polices</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Heading
                </label>
                <select
                  value={config.fonts?.heading || 'Inter'}
                  onChange={(e) => updateProject(['config', 'fonts', 'heading'], e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="Inter">Inter</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Open Sans">Open Sans</option>
                  <option value="Poppins">Poppins</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Body
                </label>
                <select
                  value={config.fonts?.body || 'Inter'}
                  onChange={(e) => updateProject(['config', 'fonts', 'body'], e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="Inter">Inter</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Open Sans">Open Sans</option>
                  <option value="Poppins">Poppins</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Configuration de l'élément sélectionné
        <div>
          <h3 className="font-medium text-gray-900 mb-3">Élément sélectionné</h3>
          <div className="bg-gray-50 p-3 rounded text-sm">
            <p>ID: {selectedElement}</p>
            <p className="text-gray-600 mt-1">
              Configuration de l'élément à implémenter
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfigPanel;