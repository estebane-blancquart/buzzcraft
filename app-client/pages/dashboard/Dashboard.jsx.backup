import React, { useMemo } from "react";
import { useDashboard } from "@hooks/useDashboard.js";
import { useWorkflows } from "@hooks/useWorkflows.js";
import MetricsModule from "@pages/dashboard/metrics/MetricsModule.jsx";
import ProjectsModule from "@pages/dashboard/projects/ProjectsModule.jsx";
import TerminalModule from "@pages/dashboard/terminal/TerminalModule.jsx";
import NewProjectModal from "@pages/dashboard/projects/NewProjectModal.jsx";
import ConfirmModal from "@pages/dashboard/projects/ConfirmModal.jsx";
import "./Dashboard.scss";

function Dashboard() {
  // Hooks métier
  const dashboard = useDashboard();
  const workflows = useWorkflows();

  // Projets filtrés selon l'état dashboard
  const filteredProjects = useMemo(
    () => dashboard.getFilteredProjects(workflows.projects || []),
    [workflows.projects, dashboard.filterState]
  );

  // Messages console mémorisés avec protection défensive
  const memoizedMessages = useMemo(
    () => workflows.consoleMessages || [],
    [workflows.consoleMessages?.length || 0]
  );

  // Handler création projet intégré
  const handleCreateProject = async (formData) => {
    try {
      await workflows.createProject(formData);
      dashboard.handleCloseModal();
    } catch (error) {
      // Erreur déjà gérée dans workflows
    }
  };

  // Handler action projet intégré
  const handleProjectAction = async (projectId, action) => {
    // Action spéciale édition → logique dashboard
    if (action === "EDIT") {
      dashboard.handleEditAction(projectId, workflows.addConsoleMessage);
      return;
    }

    // Autres actions → workflows
    await workflows.executeProjectAction(projectId, action);
  };

  // Handler confirmation suppression intégré
  const handleConfirmDelete = async () => {
    dashboard.handleConfirmDelete(workflows.deleteProject);
  };

  if (workflows.loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="dashboard">
      <MetricsModule
        projects={workflows.projects || []}
        filterState={dashboard.filterState}
        onStateFilter={(state) =>
          dashboard.handleStateFilter(state, workflows.addConsoleMessage)
        }
      />

      <ProjectsModule
        projects={filteredProjects}
        onNewProject={dashboard.handleNewProject}
        onAction={handleProjectAction}
        onDeleteRequest={dashboard.handleDeleteRequest}
        actionLoading={workflows.actionLoading || {}}
        filterState={dashboard.filterState}
      />

      <TerminalModule
        messages={memoizedMessages}
        onClear={workflows.clearConsole}
      />

      <NewProjectModal
        isOpen={dashboard.showCreateModal}
        onClose={dashboard.handleCloseModal}
        onSubmit={handleCreateProject}
      />

      <ConfirmModal
        isOpen={dashboard.showConfirmModal}
        onClose={dashboard.handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Supprimer le projet"
        message={`Êtes-vous sûr de vouloir supprimer "${dashboard.projectToDelete?.name}" ?
Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        loading={
          workflows.actionLoading?.[`${dashboard.projectToDelete?.id}-DELETE`]
        }
      />
    </div>
  );
}

export default Dashboard;
