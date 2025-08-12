import React, { useEffect, useRef } from 'react';

export default function Console({ messages, onClear }) {
  const hasMessages = messages && messages.length > 0;
  const contentRef = useRef(null);

  // Auto-scroll vers le bas quand nouveaux messages
  useEffect(() => {
    if (contentRef.current && hasMessages) {
      const element = contentRef.current;
      element.scrollTop = element.scrollHeight;
    }
  }, [messages?.length]); // Dependency sur length pour éviter re-render inutiles

  return (
    <div className="console">
      <div className="console-header">
        <span className="console-title">Console</span>
        {hasMessages && (
          <button className="console-clear" onClick={onClear}>
            Clear
          </button>
        )}
      </div>
      
      <div className="console-content" ref={contentRef}>
        {hasMessages ? (
          messages.map((message, index) => (
            <div key={index} className={`console-message console-${message.type}`}>
              <span className="console-timestamp">
                {new Date(message.timestamp).toLocaleTimeString('fr-FR')}
              </span>
              <span className="console-type">
                [{message.type.toUpperCase()}]
              </span>
              <span className="console-text">
                {message.text}
              </span>
            </div>
          ))
        ) : (
          <div className="console-empty">
          </div>
        )}
      </div>
    </div>
  );
}