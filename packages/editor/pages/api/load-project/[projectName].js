import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { projectName } = req.query;
  
  if (!projectName) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  try {
    const projectPath = path.join(process.cwd(), '..', '..', 'data', 'examples', `${projectName}.json`);
    
    console.log(`Loading project from: ${projectPath}`);
    
    if (!fs.existsSync(projectPath)) {
      console.error(`Project file not found: ${projectPath}`);
      return res.status(404).json({ 
        error: `Project "${projectName}" not found`,
        searchedPath: projectPath
      });
    }
    
    const projectData = fs.readFileSync(projectPath, 'utf8');
    const jsonProject = JSON.parse(projectData);
    
    if (!jsonProject.meta || !jsonProject.structure) {
      return res.status(400).json({ 
        error: 'Invalid project format',
        details: 'Missing required fields: meta or structure'
      });
    }
    
    console.log(`✅ Project "${projectName}" loaded successfully`);
    
    res.status(200).json({
      success: true,
      project: jsonProject,
      projectName,
      loadedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error loading project:', error);
    
    if (error instanceof SyntaxError) {
      return res.status(400).json({ 
        error: 'Invalid JSON format',
        details: error.message
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to load project', 
      details: error.message 
    });
  }
}
