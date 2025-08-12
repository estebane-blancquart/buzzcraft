import React from 'react';

export default function ProjectStats({ hookData }) {
  const { allProjects, filterState, handleStateFilter } = hookData;

  const stats = {
    TOTAL: allProjects.length,
    DRAFT: allProjects.filter(p => p.state === 'DRAFT').length,
    BUILT: allProjects.filter(p => p.state === 'BUILT').length,
    OFFLINE: allProjects.filter(p => p.state === 'OFFLINE').length,
    ONLINE: allProjects.filter(p => p.state === 'ONLINE').length
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
        className={`stat-card ${filterState === 'DRAFT' ? 'active' : ''}`}
        onClick={() => handleCardClick('DRAFT')}
      >
        <div className="stat-number">{stats.DRAFT}</div>
        <div className="stat-label">DRAFT</div>
      </div>
      <div 
        className={`stat-card ${filterState === 'BUILT' ? 'active' : ''}`}
        onClick={() => handleCardClick('BUILT')}
      >
        <div className="stat-number">{stats.BUILT}</div>
        <div className="stat-label">BUILT</div>
      </div>
      <div 
        className={`stat-card ${filterState === 'OFFLINE' ? 'active' : ''}`}
        onClick={() => handleCardClick('OFFLINE')}
      >
        <div className="stat-number">{stats.OFFLINE}</div>
        <div className="stat-label">OFFLINE</div>
      </div>
      <div 
        className={`stat-card ${filterState === 'ONLINE' ? 'active' : ''}`}
        onClick={() => handleCardClick('ONLINE')}
      >
        <div className="stat-number">{stats.ONLINE}</div>
        <div className="stat-label">ONLINE</div>
      </div>
    </div>
  );
}