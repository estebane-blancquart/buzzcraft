import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from '@pages/Dashboard.jsx';
import Editor from '@pages/Editor.jsx';

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/editor/:id?" element={<Editor />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
