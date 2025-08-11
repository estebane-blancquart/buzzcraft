import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './theme/main.scss';
import Dashboard from './pages/Dashboard.jsx';
import ProjectCreator from './pages/ProjectCreator.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/create" element={<ProjectCreator />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);