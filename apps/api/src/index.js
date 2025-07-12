const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Route principale
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'íº€ BUZZCRAFT API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Route de santÃ©
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Route pour lister les projets
app.get('/api/projects', async (req, res) => {
  try {
    const projectsDir = path.join(process.cwd(), '..', '..', 'data', 'projects');
    
    if (!await fs.pathExists(projectsDir)) {
      return res.json({
        success: true,
        projects: [],
        count: 0,
        message: 'Projects directory not found, but API is working'
      });
    }
    
    const files = await fs.readdir(projectsDir);
    const projects = files
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''));
    
    res.json({
      success: true,
      projects,
      count: projects.length,
      projectsDir
    });
  } catch (error) {
    res.json({
      success: false,
      error: 'Failed to list projects',
      details: error.message,
      fallback: 'API is working but projects dir not accessible'
    });
  }
});

// DÃ©marrage du serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log('íº€ Starting BUZZCRAFT API...');
  console.log(`í¿¢ BUZZCRAFT API running on port ${PORT}`);
  console.log(`í´— Projects directory: ${path.join(process.cwd(), '..', '..', 'data', 'projects')}`);
  console.log('âœ… API ready to accept requests');
});


// Route POST pour sauvegarder un projet
app.post("/api/projects/save", async (req, res) => {
  try {
    const { projectName, project } = req.body;
    if (!projectName || !project) {
      return res.status(400).json({ success: false, error: "Missing data" });
    }
    const projectPath = path.join(process.cwd(), "..", "..", "data", "projects", `${projectName}.json`);
    await fs.writeJson(projectPath, project, { spaces: 2 });
    res.json({ success: true, message: `Project ${projectName} saved` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
module.exports = app;
