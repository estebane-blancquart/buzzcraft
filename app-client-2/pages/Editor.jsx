import React from 'react';
import { useParams } from 'react-router-dom';

function Editor() {
  const { id } = useParams();
  
  return (
    <div className="editor">
      <h1>Editor BuzzCraft v2</h1>
      <p>Projet ID: {id || 'Nouveau'}</p>
    </div>
  );
}

export default Editor;
