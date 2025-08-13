import React from 'react';
import { PROJECT_STATES } from '@config/constants.js';

export default function ProjectStats({ hookData }) {
  const { allProjects, filterState, handleStateFilter } = hookData;

  const stats = {
    TOTAL: allProjects.length,
    [PROJECT_STATES.DRAFT]: allProjects.filter(p => p.state === PROJECT_STATES.DRAFT).length,
    [PROJECT_STATES.BUILT]: allProjects.filter(p => p.state === PROJECT_STATES.BUILT).length,
    [PROJECT_STATES.OFFLINE]: allProjects.filter(p => p.state === PROJECT_STATES.OFFLINE).length,
    [PROJECT_STATES.ONLINE]: allProjects.filter(p => p.state === PROJECT_STATES.ONLINE).length
  };

  const handleCardClick = (state) => {
    // TOTAL remet le filtre à null, autres états filtrent
    const newFilter = state === 'TOTAL' ? null : state;
    handleStateFilter(newFilter);
  };

  return (
    <div className="project-stats">
      <div 
        className={`stat-card ${filterState === null ? 'active' : ''}`}
        onClick={() => handleCardClick('TOTAL')}
      >
        <div className="stat-number">{stats.TOTAL}</div>
        <div className="stat-label">TOTAL</div>
      </div>
      <div 
        className={`stat-card ${filterState === PROJECT_STATES.DRAFT ? 'active' : ''}`}
        onClick={() => handleCardClick(PROJECT_STATES.DRAFT)}
      >
        <div className="stat-number">{stats[PROJECT_STATES.DRAFT]}</div>
        <div className="stat-label">DRAFT</div>
      </div>
      <div 
        className={`stat-card ${filterState === PROJECT_STATES.BUILT ? 'active' : ''}`}
        onClick={() => handleCardClick(PROJECT_STATES.BUILT)}
      >
        <div className="stat-number">{stats[PROJECT_STATES.BUILT]}</div>
        <div className="stat-label">BUILT</div>
      </div>
      <div 
        className={`stat-card ${filterState === PROJECT_STATES.OFFLINE ? 'active' : ''}`}
        onClick={() => handleCardClick(PROJECT_STATES.OFFLINE)}
      >
        <div className="stat-number">{stats[PROJECT_STATES.OFFLINE]}</div>
        <div className="stat-label">OFFLINE</div>
      </div>
      <div 
        className={`stat-card ${filterState === PROJECT_STATES.ONLINE ? 'active' : ''}`}
        onClick={() => handleCardClick(PROJECT_STATES.ONLINE)}
      >
        <div className="stat-number">{stats[PROJECT_STATES.ONLINE]}</div>
        <div className="stat-label">ONLINE</div>
      </div>
    </div>
  );
}