import React from 'react';
import StructurePanel from '../panels/StructurePanel';
import PreviewPanel from '../panels/PreviewPanel';
import ConfigPanel from '../panels/ConfigPanel';
import ProjectLoader from '../ui/ProjectLoader';
import useEditorStore from '../../store/editorStore';
import Button from '../ui/Button';
import Icon from '../ui/Icon';

const EditorLayout = () => {
  const { isDirty, saveProject, undo, redo } = useEditorStore();

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <div className="h-14 bg-white border-b flex items-center px-4">
        <h1 className="text-xl font-bold text-gray-900">BuzzCraft Editor</h1>
        
        <div className="ml-4">
          <ProjectLoader />
        </div>
        
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={undo}>
            <Icon name="undo" size={16} className="mr-1" />
            Annuler
          </Button>
          
          <Button variant="ghost" size="sm" onClick={redo}>
            <Icon name="redo" size={16} className="mr-1" />
            Refaire
          </Button>
          
          <div className="w-px h-6 bg-gray-300 mx-2" />
          
          <Button 
            variant={isDirty ? "primary" : "secondary"} 
            size="sm" 
            onClick={saveProject}
          >
            {isDirty ? "Sauvegarder*" : "Sauvegardé"}
          </Button>
          
          <Button variant="outline" size="sm">
            <Icon name="eye" size={16} className="mr-1" />
            Aperçu
          </Button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="w-80 flex-shrink-0">
          <StructurePanel />
        </div>

        <div className="flex-1 min-w-0">
          <PreviewPanel />
        </div>

        <div className="w-80 flex-shrink-0">
          <ConfigPanel />
        </div>
      </div>
    </div>
  );
};

export default EditorLayout;
