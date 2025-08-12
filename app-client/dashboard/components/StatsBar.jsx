import React from 'react';

/*
 * FAIT QUOI : Barre de statistiques des projets
 * REÇOIT : projects: array
 * RETOURNE : JSX 5 cards compteurs
 */

export default function StatsBar({ projects = [] }) {
  // Calculer stats par état
  const getProjectStats = () => {
    const stats = {
      TOTAL: projects.length,
      DRAFT: 0,
      BUILT: 0,
      OFFLINE: 0,
      ONLINE: 0
    };
    
    projects.forEach(project => {
      if (stats.hasOwnProperty(project.state)) {
        stats[project.state]++;
      }
    });
    
    return stats;
  };

  const stats = getProjectStats();

  return (
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
  );
}