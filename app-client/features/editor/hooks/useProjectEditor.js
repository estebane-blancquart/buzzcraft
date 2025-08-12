import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export function useProjectEditor() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  // Mock project data
  const [project] = useState({
    id: projectId,
    name: 'Test Project',
    state: 'DRAFT',
    pages: [
      {
        id: 'home',
        name: 'Home Page',
        layout: {
          sections: [
            {
              id: 'hero',
              name: 'Hero Section',
              divs: [
                {
                  id: 'hero-div',
                  name: 'Hero Container',
                  type: 'div',
                  components: [
                    {
                      id: 'title',
                      type: 'heading',
                      tag: 'h1',
                      content: 'Welcome to Test Project'
                    },
                    {
                      id: 'subtitle',
                      type: 'paragraph',
                      content: 'This is a test paragraph'
                    }
                  ]
                }
              ]
            }
          ]
        }
      }
    ]
  });

  const [selectedElement, setSelectedElement] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState('desktop');
  const [loading] = useState(false);
  const [error] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  const saveProject = async () => {
    console.log('Saving project...');
    setIsDirty(false);
  };

  const updateProject = (newProject) => {
    console.log('Updating project:', newProject);
    setIsDirty(true);
  };

  const handleElementSelect = (element, path) => {
    console.log('Selected element:', element, path);
    setSelectedElement({ element, path });
  };

  const handleElementUpdate = (path, updatedElement) => {
    console.log('Updating element:', path, updatedElement);
    setIsDirty(true);
  };

  const handleDeviceChange = (device) => {
    setSelectedDevice(device);
  };

  const handleBackToDashboard = () => {
    navigate('/');
  };

  const clearError = () => {};

  return {
    project,
    selectedElement,
    selectedDevice,
    loading,
    error,
    isDirty,
    saveProject,
    updateProject,
    handleElementSelect,
    handleElementUpdate,
    handleDeviceChange,
    handleBackToDashboard,
    clearError
  };
}