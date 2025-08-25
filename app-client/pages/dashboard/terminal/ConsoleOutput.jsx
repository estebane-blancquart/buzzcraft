import React, { useEffect, useRef } from 'react';
import LogMessage from './LogMessage.jsx';

/*
 * FAIT QUOI : Affiche la liste des messages de log avec scroll automatique
 * REÇOIT : messages = []
 * RETOURNE : Zone de contenu console avec LogMessage multiples
 * ERREURS : Défensif avec messages vides
 */

function ConsoleOutput({ messages = [] }) {
  const contentRef = useRef(null);
  const hasMessages = messages && messages.length > 0;

  // Auto-scroll vers le bas quand nouveaux messages
  useEffect(() => {
    if (contentRef.current && hasMessages) {
      const element = contentRef.current;
      element.scrollTop = element.scrollHeight;
    }
  }, [messages.length]);

  return (
    <div className="console-content" ref={contentRef}>
      {hasMessages ? (
        messages.map((message, index) => (
          <LogMessage 
            key={`${message.timestamp}-${index}`}
            message={message}
          />
        ))
      ) : (
        <div className="console-empty">
          Console vide
        </div>
      )}
    </div>
  );
}

export default ConsoleOutput;