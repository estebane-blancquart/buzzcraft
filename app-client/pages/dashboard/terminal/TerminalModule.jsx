import React from 'react';
import ConsoleOutput from './ConsoleOutput.jsx';

/*
 * FAIT QUOI : Terminal complet avec header + ConsoleOutput + bouton clear
 * REÇOIT : messages, onClear
 * RETOURNE : Module terminal complet
 * ERREURS : Défensif avec handlers optionnels
 */

function TerminalModule({ messages = [], onClear = () => {} }) {
  const hasMessages = messages && messages.length > 0;

  const handleClear = () => {
    if (hasMessages && onClear) {
      onClear();
    }
  };

  return (
    <div className="console">
      <div className="console-header">
        <span className="console-title">Console</span>
        {hasMessages && (
          <button className="console-clear" onClick={handleClear}>
            Clear
          </button>
        )}
      </div>
      
      <ConsoleOutput messages={messages} />
    </div>
  );
}

export default TerminalModule;