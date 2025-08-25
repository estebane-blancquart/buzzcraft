import React from 'react';

/*
 * FAIT QUOI : Composant atomique pour afficher UNE métrique
 * REÇOIT : number, label, isActive, onClick, variant
 * RETOURNE : Card métrique cliquable
 * ERREURS : Défensif avec props par défaut
 */

function MetricCard({ 
  number = 0, 
  label = '', 
  isActive = false, 
  onClick = () => {}, 
  variant = 'default' 
}) {
  const getVariantClass = () => {
    const variants = {
      default: '',
      draft: 'draft',
      built: 'built', 
      offline: 'offline',
      online: 'online'
    };
    return variants[variant] || '';
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div 
      className={`stat-card ${getVariantClass()} ${isActive ? 'active' : ''}`}
      onClick={handleClick}
    >
      <div className="stat-number">{number}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default MetricCard;