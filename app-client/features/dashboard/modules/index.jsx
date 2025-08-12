import React from 'react';
import { useProjectActions } from '../project-list/hooks/useProjectActions.js';
import StatCard from './components/StatCard.jsx';

/*
 * FAIT QUOI : Module statistiques projets
 * REÇOIT : Rien (utilise hook partagé)
 * RETOURNE : JSX barre statistiques
 */

export default function ProjectStats() {
  const { projects } = useProjectActions();

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
      <StatCard type="total" number={stats.TOTAL} label="TOTAL" />
      <StatCard type="draft" number={stats.DRAFT} label="DRAFT" />
      <StatCard type="built" number={stats.BUILT} label="BUILT" />
      <StatCard type="offline" number={stats.OFFLINE} label="OFFLINE" />
      <StatCard type="online" number={stats.ONLINE} label="ONLINE" />
    </div>
  );
}