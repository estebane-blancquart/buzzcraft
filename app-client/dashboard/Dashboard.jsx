import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

/*
 * FAIT QUOI : Dashboard avec stats projets + liste
 * REÇOIT : Rien (page racine)
 * RETOURNE : JSX Dashboard simple pour utilisateur unique
 */

export default function Dashboard() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setError(null);
      const response = await fetch("http://localhost:3000/projects");
      const data = await response.json();

      if (data.success) {
        setProjects(data.projects || []);
      } else {
        throw new Error(data.error || "Failed to load projects");
      }
    } catch (error) {
      console.error("Failed to load projects:", error);
      setError(`Erreur de chargement: ${error.message}`);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculer stats par état
  const getProjectStats = () => {
    const stats = {
      TOTAL: projects.length,
      DRAFT: 0,
      BUILT: 0,
      OFFLINE: 0,
      ONLINE: 0,
    };

    projects.forEach((project) => {
      if (stats.hasOwnProperty(project.state)) {
        stats[project.state]++;
      }
    });

    return stats;
  };

  const handleNewProject = () => {
    navigate("/create");
  };

  const setProjectActionLoading = (projectId, isLoading) => {
    setActionLoading((prev) => ({
      ...prev,
      [projectId]: isLoading,
    }));
  };

  const handleProjectAction = async (projectId, action) => {
    setProjectActionLoading(projectId, true);
    setError(null);

    try {
      let response;

      switch (action) {
        case "EDIT":
          // Si projet BUILT, le remettre en DRAFT d'abord
          const project = projects.find((p) => p.id === projectId);
          if (project && project.state === "BUILT") {
            response = await fetch(
              `http://localhost:3000/projects/${projectId}/revert`,
              {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
              }
            );

            const result = await response.json();
            if (!result.success) {
              throw new Error(result.error || "Revert failed");
            }

            // Recharger les données pour voir le changement d'état
            await loadProjects();
          }

          // Puis naviguer vers l'éditeur
          navigate(`/editor/${projectId}`);
          return;

        case "BUILD":
          response = await fetch(
            `http://localhost:3000/projects/${projectId}/build`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({}),
            }
          );
          break;

        case "DELETE":
          const confirmed = window.confirm(`Supprimer ${projectId} ?`);
          if (!confirmed) return;

          response = await fetch(
            `http://localhost:3000/projects/${projectId}`,
            {
              method: "DELETE",
            }
          );
          break;

        default:
          console.log(`${action} not implemented yet`);
          return;
      }

      if (response) {
        const result = await response.json();

        if (result.success) {
          await loadProjects();
        } else {
          throw new Error(result.error || `${action} failed`);
        }
      }
    } catch (error) {
      console.error(`${action} error:`, error);
      setError(`Erreur ${action}: ${error.message}`);
    } finally {
      setProjectActionLoading(projectId, false);
    }
  };

  const getAvailableActions = (state) => {
    switch (state) {
      case "DRAFT":
        return [
          { action: "EDIT", label: "EDIT", style: "secondary" },
          { action: "BUILD", label: "BUILD", style: "primary" },
          { action: "DELETE", label: "DELETE", style: "danger" },
        ];
      case "BUILT":
        return [
          { action: "EDIT", label: "EDIT", style: "secondary" },
          { action: "DEPLOY", label: "DEPLOY", style: "primary" },
          { action: "DELETE", label: "DELETE", style: "danger" },
        ];
      case "OFFLINE":
        return [
          { action: "UPDATE", label: "UPDATE", style: "secondary" },
          { action: "START", label: "START", style: "primary" },
          { action: "DELETE", label: "DELETE", style: "danger" },
        ];
      case "ONLINE":
        return [
          { action: "UPDATE", label: "UPDATE", style: "secondary" },
          { action: "STOP", label: "STOP", style: "warning" },
          { action: "DELETE", label: "DELETE", style: "danger" },
        ];
      default:
        return [{ action: "DELETE", label: "DELETE", style: "danger" }];
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">Chargement...</div>
      </div>
    );
  }

  const stats = getProjectStats();

  return (
    <div className="dashboard">
      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="error-close">
            ×
          </button>
        </div>
      )}

      {/* Stats par état */}
      <div className="project-stats">
        <div className="stat-card stat-total">
          <div className="stat-number">{stats.TOTAL}</div>
          <div className="stat-label">TOTAL</div>
        </div>
        <div className="stat-card stat-draft">
          <div className="stat-number">{stats.DRAFT}</div>
          <div className="stat-label">DRAFT</div>
        </div>
        <div className="stat-card stat-built">
          <div className="stat-number">{stats.BUILT}</div>
          <div className="stat-label">BUILT</div>
        </div>
        <div className="stat-card stat-offline">
          <div className="stat-number">{stats.OFFLINE}</div>
          <div className="stat-label">OFFLINE</div>
        </div>
        <div className="stat-card stat-online">
          <div className="stat-number">{stats.ONLINE}</div>
          <div className="stat-label">ONLINE</div>
        </div>
      </div>

      {/* New Project */}
      <button className="new-project-button" onClick={handleNewProject}>
        NEW PROJECT
      </button>

      {/* Projects List */}
      <div className="projects-list">
        {projects.length === 0 ? (
          <div className="empty-state">
            <p>Aucun projet trouvé.</p>
          </div>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="project-card">
              <div className="project-info">
                <div className="project-name">{project.name}</div>
                <div className="project-meta">
                  <span className="project-id">{project.id}</span>
                  <span className="project-date">
                    {new Date(project.created).toLocaleDateString()}
                  </span>
                </div>
                <div
                  className={`project-status status-${project.state.toLowerCase()}`}
                >
                  {project.state}
                </div>
              </div>

              <div className="project-actions">
                {getAvailableActions(project.state).map(
                  ({ action, label, style }) => (
                    <button
                      key={action}
                      className={`btn-${style}`}
                      onClick={() => handleProjectAction(project.id, action)}
                      disabled={actionLoading[project.id]}
                    >
                      {actionLoading[project.id] ? `${label}...` : label}
                    </button>
                  )
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
