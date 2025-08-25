import React from 'react';

/*
 * FAIT QUOI : Composant atomique pour afficher UN message de log
 * REÇOIT : message: { type, text, timestamp }
 * RETOURNE : Ligne de log formatée
 * ERREURS : Défensif avec message par défaut
 */

function LogMessage({ message = {} }) {
  const { 
    type = 'info', 
    text = 'Empty message', 
    timestamp = new Date().toISOString() 
  } = message;

  const formatTimestamp = (isoString) => {
    try {
      return new Date(isoString).toLocaleTimeString('fr-FR');
    } catch (error) {
      return '00:00:00';
    }
  };

  return (
    <div className={`console-message console-${type}`}>
      <span className="console-timestamp">
        {formatTimestamp(timestamp)}
      </span>
      <span className="console-type">
        [{type.toUpperCase()}]
      </span>
      <span className="console-text">
        {text}
      </span>
    </div>
  );
}

export default LogMessage;