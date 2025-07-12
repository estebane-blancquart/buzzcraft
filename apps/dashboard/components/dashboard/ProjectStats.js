import React from 'react'
import useDashboardStore from '../../store/dashboardStore'

const ProjectStats = () => {
  const { projects, projectStates } = useDashboardStore()

  const stats = {
    total: projects.length,
    draft: Object.values(projectStates).filter(state => state.status === 'DRAFT').length,
    built: Object.values(projectStates).filter(state => state.status === 'BUILT').length,
    deployed: Object.values(projectStates).filter(state => state.status === 'DEPLOYED').length
  }

  const statCards = [
    { label: 'Total Projets', value: stats.total, color: 'bg-blue-500', icon: '📊' },
    { label: 'Brouillons', value: stats.draft, color: 'bg-yellow-500', icon: '📝' },
    { label: 'Générés', value: stats.built, color: 'bg-orange-500', icon: '🔨' },
    { label: 'Déployés', value: stats.deployed, color: 'bg-green-500', icon: '🚀' }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {statCards.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center">
            <div className={`${stat.color} rounded-lg p-3 mr-4`}>
              <span className="text-white text-xl">{stat.icon}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ProjectStats