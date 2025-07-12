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
    message: '🚀 BUZZCRAFT API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Route de santé
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Route pour charger un projet
app.get('/api/projects/load/:projectName', async (req, res) => {
  try {
    const { projectName } = req.params
    
    const projectsDir = path.join(__dirname, '..', '..', '..', 'data')
    const possiblePaths = [
      path.join(projectsDir, 'projects', `${projectName}.json`),
      path.join(projectsDir, 'examples', `${projectName}.json`)
    ]
    
    let project = null
    let foundPath = null
    
    for (const filePath of possiblePaths) {
      if (await fs.pathExists(filePath)) {
        project = await fs.readJSON(filePath)
        foundPath = filePath
        break
      }
    }
    
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        error: `Project ${projectName} not found` 
      })
    }
    
    console.log(`✅ Project loaded: ${projectName} from ${foundPath}`)
    
    res.json({ 
      success: true, 
      project,
      projectName,
      loadedFrom: foundPath
    })
    
  } catch (error) {
    console.error('Load error:', error)
    res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
})

// Route pour lister tous les projets
app.get('/api/projects/list', async (req, res) => {
  try {
    const projectsDir = path.join(__dirname, '..', '..', '..', 'data', 'projects')
    await fs.ensureDir(projectsDir)
    
    const files = await fs.readdir(projectsDir)
    const jsonFiles = files.filter(file => file.endsWith('.json'))
    
    const projects = []
    for (const file of jsonFiles) {
      try {
        const filePath = path.join(projectsDir, file)
        const project = await fs.readJSON(filePath)
        projects.push(project)
      } catch (error) {
        console.warn(`Error reading project ${file}:`, error.message)
      }
    }
    
    console.log(`✅ Listed ${projects.length} projects`)
    
    res.json({ 
      success: true, 
      projects,
      count: projects.length
    })
    
  } catch (error) {
    console.error('List projects error:', error)
    res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
})

// Route POST pour sauvegarder un projet
app.post("/api/projects/save", async (req, res) => {
  try {
    const { projectName, project } = req.body;
    if (!projectName || !project) {
      return res.status(400).json({ success: false, error: "Missing data" });
    }
    const projectPath = path.join(process.cwd(), "..", "..", "data", "projects", `${projectName}.json`);
    await fs.writeJson(projectPath, project, { spaces: 2 });
    console.log(`✅ Project saved: ${projectName}`)
    res.json({ success: true, message: `Project ${projectName} saved` });
  } catch (error) {
    console.error('Save error:', error)
    res.status(500).json({ success: false, error: error.message });
  }
});

// Route pour supprimer un projet
app.delete('/api/projects/delete/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params
    
    const projectsDir = path.join(__dirname, '..', '..', '..', 'data', 'projects')
    const filePath = path.join(projectsDir, `${projectId}.json`)
    
    if (await fs.pathExists(filePath)) {
      await fs.remove(filePath)
      console.log(`✅ Project deleted: ${projectId}`)
      
      res.json({ 
        success: true, 
        message: `Project ${projectId} deleted successfully` 
      })
    } else {
      res.status(404).json({ 
        success: false, 
        error: `Project ${projectId} not found` 
      })
    }
    
  } catch (error) {
    console.error('Delete project error:', error)
    res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
})

// Route pour générer le site (Parser)
app.post('/api/projects/build', async (req, res) => {
  try {
    const { projectId } = req.body
    
    if (!projectId) {
      return res.status(400).json({ 
        success: false, 
        error: 'projectId is required' 
      })
    }
    
    console.log(`🔨 Building project: ${projectId}`)
    
    // TODO: Intégrer avec le parser
    // Pour l'instant, simulation
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    console.log(`✅ Project built: ${projectId}`)
    
    res.json({ 
      success: true, 
      message: `Project ${projectId} built successfully`,
      buildTime: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Build project error:', error)
    res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
})

// Route pour déployer le site (Engine)
app.post('/api/projects/deploy', async (req, res) => {
  try {
    const { projectId } = req.body
    
    if (!projectId) {
      return res.status(400).json({ 
        success: false, 
        error: 'projectId is required' 
      })
    }
    
    console.log(`🚀 Deploying project: ${projectId}`)
    
    // TODO: Intégrer avec l'engine
    // Pour l'instant, simulation
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    console.log(`✅ Project deployed: ${projectId}`)
    
    res.json({ 
      success: true, 
      message: `Project ${projectId} deployed successfully`,
      deployTime: new Date().toISOString(),
      url: `http://localhost:3201` // TODO: port dynamique
    })
    
  } catch (error) {
    console.error('Deploy project error:', error)
    res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
})

// Démarrage du serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 Starting BUZZCRAFT API...');
  console.log(`🌐 BUZZCRAFT API running on port ${PORT}`);
  console.log(`📁 Projects directory: ${path.join(process.cwd(), '..', '..', 'data', 'projects')}`);
  console.log('✅ API ready to accept requests');
});

module.exports = app;