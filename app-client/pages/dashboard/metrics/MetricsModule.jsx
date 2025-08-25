import React from 'react';
import MetricCard from './MetricCard.jsx';
import { PROJECT_STATES } from '@config/constants.js';

/*
 * FAIT QUOI : Container qui assemble 5 MetricCard avec logique filtres
 * REÇOIT : projects, filterState, onStateFilter
 * RETOURNE : Module complet métriques
 * ERREURS : Défensif avec projets vides
 */

function MetricsModule({ projects = [], filterState = null, onStateFilter = () => {} }) {
  // Calcul des statistiques
  const stats = {
    TOTAL: projects.length,
    [PROJECT_STATES.DRAFT]: projects.filter(p => p.state === PROJECT_STATES.DRAFT).length,
    [PROJECT_STATES.BUILT]: projects.filter(p => p.state === PROJECT_STATES.BUILT).length,
    [PROJECT_STATES.OFFLINE]: projects.filter(p => p.state === PROJECT_STATES.OFFLINE).length,
    [PROJECT_STATES.ONLINE]: projects.filter(p => p.state === PROJECT_STATES.ONLINE).length
  };

  // Handler click métrique
  const handleMetricClick = (state) => {
    const newFilter = state === 'TOTAL' ? null : state;
    if (onStateFilter) {
      onStateFilter(newFilter);
    }
  };

  return (
    <div className="project-stats">
      <MetricCard
        number={stats.TOTAL}
        label="TOTAL"
        isActive={filterState === null}
        onClick={() => handleMetricClick('TOTAL')}
        variant="default"
      />
      
      <MetricCard
        number={stats[PROJECT_STATES.DRAFT]}
        label="DRAFT"
        isActive={filterState === PROJECT_STATES.DRAFT}
        onClick={() => handleMetricClick(PROJECT_STATES.DRAFT)}
        variant="draft"
      />
      
      <MetricCard
        number={stats[PROJECT_STATES.BUILT]}
        label="BUILT"
        isActive={filterState === PROJECT_STATES.BUILT}
        onClick={() => handleMetricClick(PROJECT_STATES.BUILT)}
        variant="built"
      />
      
      <MetricCard
        number={stats[PROJECT_STATES.OFFLINE]}
        label="OFFLINE"
        isActive={filterState === PROJECT_STATES.OFFLINE}
        onClick={() => handleMetricClick(PROJECT_STATES.OFFLINE)}
        variant="offline"
      />
      
      <MetricCard
        number={stats[PROJECT_STATES.ONLINE]}
        label="ONLINE"
        isActive={filterState === PROJECT_STATES.ONLINE}
        onClick={() => handleMetricClick(PROJECT_STATES.ONLINE)}
        variant="online"
      />
    </div>
  );
}

export default MetricsModule;