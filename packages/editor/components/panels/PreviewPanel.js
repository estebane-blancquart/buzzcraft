import React from 'react';
import useEditorStore from '../../store/editorStore';

const PreviewPanel = () => {
  const { jsonProject, selectedPage, previewMode, previewZoom } = useEditorStore();

  // Guard clause pour éviter l'erreur
  if (!jsonProject || !jsonProject.structure || !jsonProject.structure.pages) {
    return (
      <div className="flex-1 bg-gray-100 p-4">
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg h-full flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-6xl mb-4">📱</div>
            <h3 className="text-xl font-semibold mb-2">Aucun projet chargé</h3>
            <p className="text-sm">Chargez un projet pour voir le preview</p>
            <p className="text-xs mt-2">Utilisez les boutons "Charger Dubois" ou "Charger Artisan"</p>
          </div>
        </div>
      </div>
    );
  }

  const currentPage = jsonProject.structure.pages[selectedPage] || Object.values(jsonProject.structure.pages)[0];
  
  if (!currentPage) {
    return (
      <div className="flex-1 bg-gray-100 p-4">
        <div className="bg-white border border-gray-300 rounded-lg h-full flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p>Page sélectionnée introuvable</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-100 flex flex-col">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 p-2 flex items-center gap-4">
        <div className="flex gap-2">
          <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">
            📱 Mobile
          </button>
          <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">
            📟 Tablet
          </button>
          <button className="px-3 py-1 text-sm border border-gray-300 rounded bg-blue-100 border-blue-300">
            🖥️ Desktop
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Zoom:</span>
          <select className="text-sm border border-gray-300 rounded px-2 py-1">
            <option value="50">50%</option>
            <option value="100" selected>100%</option>
            <option value="150">150%</option>
          </select>
        </div>
        
        <div className="ml-auto">
          <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">
            Grid
          </button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="bg-white border border-gray-300 rounded-lg shadow-lg mx-auto max-w-4xl min-h-96">
          {/* Page Header */}
          <div className="border-b border-gray-200 p-4 bg-gray-50">
            <h3 className="font-semibold text-lg">
              {selectedPage} ({currentPage.route})
            </h3>
            <p className="text-sm text-gray-600">
              {currentPage.modules ? currentPage.modules.length : 0} modules
            </p>
          </div>

          {/* Page Content Preview */}
          <div className="p-6">
            {currentPage.modules && currentPage.modules.length > 0 ? (
              <div className="space-y-4">
                {currentPage.modules.map((module, index) => (
                  <div key={index} className="border-2 border-dashed border-blue-200 p-4 rounded">
                    <div className="flex items-center gap-2 mb-2">
                      <span>📦</span>
                      <span className="font-medium">{module.id || `Module ${index + 1}`}</span>
                      <span className="text-sm text-gray-500">({module.type})</span>
                    </div>
                    
                    {module.children && (
                      <div className="ml-4 space-y-2">
                        {module.children.map((child, childIndex) => (
                          <div key={childIndex} className="border border-gray-200 p-2 rounded text-sm">
                            <span className="text-gray-600">
                              {child.tag}: {child.content || child.className || 'Container'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-4">📄</div>
                <p>Aucun module sur cette page</p>
                <p className="text-sm mt-2">Ajoutez des modules depuis le panneau Structure</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewPanel;