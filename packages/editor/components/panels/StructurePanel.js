import React, { useState } from 'react';
import useEditorStore from '../../store/editorStore';
import AddModuleModal from '../modals/AddModuleModal';

const StructurePanel = () => {
  const { jsonProject, selectedPage, setSelectedPage, addPage } = useEditorStore();
  const [showAddPage, setShowAddPage] = useState(false);
  const [newPageName, setNewPageName] = useState('');
  const [showAddModule, setShowAddModule] = useState(false);
  const [targetPageId, setTargetPageId] = useState('');

  const handleAddPage = (e) => {
    e.preventDefault();
    if (newPageName.trim()) {
      addPage(newPageName.trim().toLowerCase());
      setNewPageName('');
      setShowAddPage(false);
    }
  };

  // Guard clause pour éviter l'erreur
  if (!jsonProject || !jsonProject.structure || !jsonProject.structure.pages) {
    return (
      <div className="w-80 bg-white border-r border-gray-200 p-4">
        <h2 className="text-lg font-semibold mb-4">Structure</h2>
        <div className="text-gray-500 text-center py-8">
          <p>Aucun projet chargé</p>
          <p className="text-sm mt-2">Utilisez "Nouveau Projet" pour commencer</p>
        </div>
      </div>
    );
  }

  const pages = jsonProject.structure.pages;

  return (
    <div className="w-80 bg-white border-r border-gray-200 p-4">
      <h2 className="text-lg font-semibold mb-4">Structure</h2>
      
      <div className="mb-4">
        {!showAddPage ? (
          <button 
            onClick={() => setShowAddPage(true)}
            className="w-full px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            + Nouvelle Page
          </button>
        ) : (
          <form onSubmit={handleAddPage} className="space-y-2">
            <input
              type="text"
              value={newPageName}
              onChange={(e) => setNewPageName(e.target.value)}
              placeholder="Nom de la page (ex: services)"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
              >
                Ajouter
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddPage(false);
                  setNewPageName('');
                }}
                className="flex-1 px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Annuler
              </button>
            </div>
          </form>
        )}
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
                  <button 
                    onClick={() => {
                      setTargetPageId(pageId);
                      setShowAddModule(true);
                    }}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    + Ajouter Module
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <AddModuleModal 
        isOpen={showAddModule}
        onClose={() => setShowAddModule(false)}
        pageId={targetPageId}
      />
    </div>
  );
};

export default StructurePanel;