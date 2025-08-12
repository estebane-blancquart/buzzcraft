import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ProjectTree from "./ProjectTree.jsx";
import PreviewPanel from "./PreviewPanel.jsx";
import PropertiesPanel from "./PropertiesPanel.jsx";
import DeviceSelector from "./DeviceSelector.jsx";

/*
 * FAIT QUOI : Éditeur principal avec interface 3 panels
 * REÇOIT : projectId via URL params
 * RETOURNE : JSX éditeur complet selon maquette
 * ERREURS : Redirect si projet inexistant ou erreur
 */

export default function ProjectEditor() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState("desktop");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      setError(null);
      const response = await fetch(
        `http://localhost:3000/projects/${projectId}`
      );
      const data = await response.json();

      if (data.success) {
        if (data.project.state !== "DRAFT") {
          setError(
            `Le projet doit être en état DRAFT pour être édité (état actuel: ${data.project.state})`
          );
          return;
        }

        setProject(data.project);
      } else {
        setError(data.error || "Projet introuvable");
      }
    } catch (error) {
      console.error("Failed to load project:", error);
      setError(`Erreur de chargement: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const saveProject = async () => {
    if (!isDirty || !project) return;

    try {
      setError(null);
      const response = await fetch(
        `http://localhost:3000/projects/${projectId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(project),
        }
      );

      const result = await response.json();

      if (result.success) {
        setIsDirty(false);
        console.log("Projet sauvegardé !");
      } else {
        setError(result.error || "Erreur de sauvegarde");
      }
    } catch (error) {
      console.error("Save error:", error);
      setError(`Erreur de sauvegarde: ${error.message}`);
    }
  };

  const updateProject = (newProject) => {
    setProject(newProject);
    setIsDirty(true);
  };

  const handleElementSelect = (element, path) => {
    setSelectedElement({ element, path });
  };

  const handleElementUpdate = (path, updatedElement) => {
    // TODO: Implémenter la mise à jour dans l'arbre JSON
    console.log("Update element at path:", path, updatedElement);
    setIsDirty(true);
  };

  if (loading) {
    return (
      <div className="project-editor">
        <div className="loading">Chargement de l'éditeur...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="project-editor">
        <div className="editor-header">
          <h1>Erreur</h1>
          <button onClick={() => navigate("/")} className="btn-secondary">
            Retour Dashboard
          </button>
        </div>
        <div className="error-banner">
          <span>⚠️ {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="project-editor">
      {/* Header avec titre + actions */}
      <header className="editor-header">
        <div className="editor-title">
          <h1>{project.name}</h1>
          <span className="project-id">({project.id})</span>
          {isDirty && <span className="dirty-indicator">●</span>}
        </div>

        <div className="editor-controls">
          <DeviceSelector
            selected={selectedDevice}
            onChange={setSelectedDevice}
          />
        </div>

        <div className="editor-actions">
          <button
            onClick={saveProject}
            className={`btn-primary ${!isDirty ? "disabled" : ""}`}
            disabled={!isDirty}
          >
            SAVE
          </button>
          <button onClick={() => navigate("/")} className="btn-secondary">
            Dashboard
          </button>
        </div>
      </header>

      {/* Workspace 3 panels */}
      <div className="editor-workspace">
        {/* Panel gauche - Arbre */}
        <ProjectTree
          project={project}
          selectedElement={selectedElement}
          onElementSelect={handleElementSelect}
          onProjectUpdate={updateProject}
        />

        {/* Panel centre - Preview */}
        <PreviewPanel
          project={project}
          device={selectedDevice}
          selectedElement={selectedElement}
          onElementSelect={handleElementSelect}
        />

        {/* Panel droite - Propriétés */}
        <PropertiesPanel
          selectedElement={selectedElement}
          device={selectedDevice}
          onElementUpdate={handleElementUpdate}
        />
      </div>
    </div>
  );
}
