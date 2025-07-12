import React, { useEffect } from 'react'
import useDashboardStore from '../../store/dashboardStore'

const ProjectsList = () => {
  const { 
    projects, 
    loading, 
    error, 
    projectStates,
    loadProjects, 
    deleteProject, 
    buildProject, 
    deployProject 
  } = useDashboardStore()

  useEffect(() => {
    loadProjects()
  }, [])

  const getStatusBadge = (status) => {
    const styles = {
      DRAFT: 'bg-yellow-100 text-yellow-800',
      BUILT: 'bg-blue-100 text-blue-800', 
      DEPLOYED: 'bg-green-100 text-green-800'
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || styles.DRAFT}`}>
        {status || 'DRAFT'}
      </span>
    )
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Chargement des projets...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">Erreur: {error}</div>
        <button 
          onClick={loadProjects}
          className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
        >
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Projets ({projects.length})</h2>
        <div className="flex gap-2">
          <button
            onClick={loadProjects}
            className="px-3 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            🔄 Actualiser
          </button>
          <button
            onClick={() => window.open('http://localhost:4001', '_blank')}
            className="px-3 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600"
          >
            ✨ Nouveau Projet
          </button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-gray-500 mb-4">Aucun projet trouvé</div>
          <button
            onClick={() => window.open('http://localhost:4001', '_blank')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Créer votre premier projet
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {projects.map(project => {
            const projectId = project.meta.projectId
            const state = projectStates[projectId] || {}
            
            return (
              <div key={projectId} className="bg-white border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {project.meta.title}
                      </h3>
                      {getStatusBadge(state.status)}
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{project.meta.description}</p>
                    <div className="text-xs text-gray-500">
                      ID: {projectId} • Créé le {formatDate(project.meta.created)}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    Pages: {Object.keys(project.structure?.pages || {}).length} • 
                    Modules: {Object.values(project.structure?.pages || {}).reduce((acc, page) => acc + (page.modules?.length || 0), 0)}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.open(`http://localhost:4001?project=${projectId}`, '_blank')}
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      ✏️ Éditer
                    </button>
                    
                    <button
                      onClick={() => buildProject(projectId)}
                      disabled={state.building}
                      className="px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
                    >
                      {state.building ? '⏳ Build...' : '🔨 Build'}
                    </button>
                    
                    <button
                      onClick={() => deployProject(projectId)}
                      disabled={state.deploying || state.status !== 'BUILT'}
                      className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                    >
                      {state.deploying ? '⏳ Deploy...' : '🚀 Deploy'}
                    </button>
                    
                    {state.status === 'DEPLOYED' && (
                      <button
                        onClick={() => alert('Site déployé en simulation. Pour voir le vrai site, utilisez le parser + engine depuis bash.')}
                        className="px-3 py-1 text-sm bg-gray-400 text-white rounded cursor-help"
                        title="Déploiement simulé - pas de site réel"
                      >
                        👁️ Voir (sim)
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        if (confirm(`Supprimer le projet "${project.meta.title}" ?`)) {
                          deleteProject(projectId)
                        }
                      }}
                      className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ProjectsList