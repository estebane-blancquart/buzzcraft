import React from 'react';

export default function ProjectStats({ hookData }) {
  const { projects } = hookData;

  const stats = {
    TOTAL: projects.length,
    DRAFT: projects.filter(p => p.state === 'DRAFT').length,
    BUILT: projects.filter(p => p.state === 'BUILT').length,
    OFFLINE: projects.filter(p => p.state === 'OFFLINE').length,
    ONLINE: projects.filter(p => p.state === 'ONLINE').length
  };

  return (
    <div className="project-stats">
      <div className="stat-card">
        <div className="stat-number">{stats.TOTAL}</div>
        <div className="stat-label">TOTAL</div>
      </div>
      <div className="stat-card">
        <div className="stat-number">{stats.DRAFT}</div>
        <div className="stat-label">DRAFT</div>
      </div>
      <div className="stat-card">
        <div className="stat-number">{stats.BUILT}</div>
        <div className="stat-label">BUILT</div>
      </div>
      <div className="stat-card">
        <div className="stat-number">{stats.OFFLINE}</div>
        <div className="stat-label">OFFLINE</div>
      </div>
      <div className="stat-card">
        <div className="stat-number">{stats.ONLINE}</div>
        <div className="stat-label">ONLINE</div>
      </div>
    </div>
  );
}