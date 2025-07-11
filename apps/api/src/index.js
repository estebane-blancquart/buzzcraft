const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

console.log('Ì∫Ä Starting BUZZCRAFT API...');

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  console.log('Ì≥ã Health check requested');
  res.json({ status: 'OK', service: 'BUZZCRAFT API' });
});

// GET /api/projects/:name - Charger un projet  
app.get('/api/projects/:name', async (req, res) => {
  try {
    const projectName = req.params.name;
    const projectPath = path.join(__dirname, '../../../data/projects', `${projectName}.json`);
    
    console.log(`Ì≥ã Loading project: ${projectName}`);
    console.log(`Ì≥Å Project path: ${projectPath}`);
    
    if (!await fs.pathExists(projectPath)) {
      console.log(`‚ùå Project not found: ${projectPath}`);
      return res.status(404).json({ 
        success: false, 
        error: `Project ${projectName} not found` 
      });
    }
    
    const project = await fs.readJson(projectPath);
    console.log(`‚úÖ Project loaded successfully: ${projectName}`);
    
    res.json({
      success: true,
      project,
      projectName,
      loadedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error(`‚ùå Load error:`, error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// POST /api/projects/save - Sauvegarder un projet
app.post('/api/projects/save', async (req, res) => {
  try {
    const { projectName, project } = req.body;
    
    console.log(`Ì≤æ Save request for: ${projectName}`);
    
    if (!projectName || !project) {
      console.log(`‚ùå Missing data: projectName=${!!projectName}, project=${!!project}`);
      return res.status(400).json({ 
        success: false, 
        error: 'projectName and project are required' 
      });
    }
    
    // Mise √† jour timestamp
    project.meta.lastModified = new Date().toISOString();
    
    // Sauvegarde dans data/projects/
    const projectPath = path.join(__dirname, '../../../data/projects', `${projectName}.json`);
    await fs.writeJson(projectPath, project, { spaces: 2 });
    
    console.log(`‚úÖ Project saved successfully: ${projectName}`);
    console.log(`Ì≥Å Saved to: ${projectPath}`);
    
    res.json({
      success: true,
      message: `Project ${projectName} saved successfully`,
      savedAt: new Date().toISOString(),
      path: projectPath
    });
  } catch (error) {
    console.error('‚ùå Save error:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Ì∫Ä BUZZCRAFT API running on port ${PORT}`);
  console.log(`Ì≥Å Projects directory: ${path.join(__dirname, '../../../data/projects')}`);
  console.log('‚úÖ API ready to accept requests');
});
