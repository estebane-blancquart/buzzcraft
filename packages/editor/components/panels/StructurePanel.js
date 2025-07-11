import React from 'react';
import useEditorStore from '../../store/editorStore';

const StructurePanel = () => {
  const { jsonProject, selectedPage, setSelectedPage, selectedElement, setSelectedElement } = useEditorStore();

  // Guard clause pour éviter l'erreur
  if (!jsonProject || !jsonProject.structure || !jsonProject.structure.pages) {
    return (
      <div className="w-80 bg-white border-r border-gray-200 p-4">
        <h2 className="text-lg font-semibold mb-4">Structure</h2>
        <div className="text-gray-500 text-center py-8">
          <p>Aucun projet chargé</p>
          <p className="text-sm mt-2">Utilisez les boutons "Charger" pour ouvrir un projet</p>
        </div>
      </div>
    );
  }

  const pages = jsonProject.structure.pages;

  return (
    <div className="w-80 bg-white border-r border-gray-200 p-4">
      <h2 className="text-lg font-semibold mb-4">Structure</h2>
      
      <div className="mb-4">
        <button className="w-full px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600">
          + Nouvelle Page
        </button>
      </div>

      <div className="space-y-2">
        {Object.entries(pages).map(([pageId, pageData]) => {
          const isSelected = selectedPage === pageId;
          const isExpanded = true;
          
          return (
            <div key={pageId} className="border rounded">
              <div 
                className={`p-2 cursor-pointer flex items-center ${
                  isSelected ? 'bg-blue-100 border-blue-300' : 'bg-gray-50 hover:bg-gray-100'
                }`}
                onClick={() => setSelectedPage(pageId)}
              >
                <span className="mr-2">📄</span>
                <span className="font-medium">{pageId}</span>
                <span className="ml-auto text-sm text-gray-500">
                  ({pageData.route})
                </span>
              </div>
              
              {isExpanded && pageData.modules && pageData.modules.length > 0 && (
                <div className="pl-4 pb-2">
                  {pageData.modules.map((module, index) => (
                    <div key={`${pageId}-module-${index}`} className="py-1 text-sm">
                      <span className="text-gray-600">📦 {module.id || `module_${index}`}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {isExpanded && (!pageData.modules || pageData.modules.length === 0) && (
                <div className="pl-4 pb-2 text-sm text-gray-500">
                  <button className="text-blue-500 hover:text-blue-700">
                    + Ajouter Module
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StructurePanel;