import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './theme/main.scss';
import Dashboard from './dashboard/index.jsx';
import ProjectCreator from './editor/ProjectCreator.jsx';
import ProjectEditor from './editor/ProjectEditor.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/create" element={<ProjectCreator />} />
        <Route path="/editor/:projectId" element={<ProjectEditor />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);