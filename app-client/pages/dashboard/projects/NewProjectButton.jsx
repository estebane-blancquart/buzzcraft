import React from 'react';

/*
 * FAIT QUOI : Bouton déclencheur création nouveau projet
 * REÇOIT : onClick, disabled, loading
 * RETOURNE : Bouton primaire stylé
 * ERREURS : Défensif avec handler optionnel
 */

function NewProjectButton({ 
  onClick = () => {}, 
  disabled = false, 
  loading = false 
}) {
  const handleClick = () => {
    if (!disabled && !loading && onClick) {
      onClick();
    }
  };

  return (
    <button 
      className="btn-primary"
      onClick={handleClick}
      disabled={disabled || loading}
    >
      {loading ? 'CREATING...' : 'NEW PROJECT'}
    </button>
  );
}

export default NewProjectButton;