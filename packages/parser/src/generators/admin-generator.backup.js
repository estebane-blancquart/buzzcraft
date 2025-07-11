const fs = require('fs');
const path = require('path');

class AdminGenerator {
  constructor(jsonProject, outputPath) {
    this.jsonProject = jsonProject;
    this.outputPath = outputPath;
    this.contentSchema = jsonProject.contentSchema || {};
    console.log('��� AdminGenerator initialisé pour:', jsonProject.meta?.projectId);
  }

  generate() {
    console.log('��� Génération interface admin...');
    
    try {
      // Créer structure admin
      this.createAdminStructure();
      this.generateAdminPages();
      this.generateAdminAPI();
      this.generateDatabaseConfig();
      this.updatePackageJson();
      
      console.log('✅ Interface admin générée avec succès');
    } catch (error) {
      console.error('❌ Erreur génération admin:', error.message);
    }
  }

  createAdminStructure() {
    const adminDirs = [
      'pages/admin',
      'pages/api/admin', 
      'pages/api/content',
      'lib/database',
      'database'
    ];

    adminDirs.forEach(dir => {
      const fullPath = path.join(this.outputPath, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`��� Créé: ${dir}`);
      }
    });
  }

  generateAdminPages() {
    // Page admin principale
    const adminContent = `import { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const [content, setContent] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const response = await fetch('/api/content');
      const data = await response.json();
      setContent(data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur:', error);
      setLoading(false);
    }
  };

  const updateContent = async (entity, field, value) => {
    try {
      await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity, field, value })
      });
      
      setContent(prev => ({
        ...prev,
        [entity]: { ...prev[entity], [field]: value }
      }));
    } catch (error) {
      console.error('Erreur mise à jour:', error);
    }
  };

  if (loading) return <div className="p-8">Chargement administration...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Administration - ${this.jsonProject.meta?.projectId}</h1>
        </div>
      </header>
      
      <main className="p-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Contenu du site</h2>
          <p className="text-gray-600">Interface admin générée automatiquement par BuzzCraft</p>
          <div className="mt-4">
            <pre className="bg-gray-100 p-4 rounded text-sm">
              {JSON.stringify(content, null, 2)}
            </pre>
          </div>
        </div>
      </main>
    </div>
  );
}`;

    fs.writeFileSync(
      path.join(this.outputPath, 'pages/admin/index.js'),
      adminContent
    );
    console.log('��� Généré: pages/admin/index.js');
  }

  generateAdminAPI() {
    // API Content
    const contentAPI = `export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Pour l'instant, retourner données statiques
      const mockContent = {
        company: {
          name: 'Dubois Plomberie',
          description: 'Plombier professionnel à Saint-Étienne',
          phone: '04 77 XX XX XX',
          email: 'contact@dubois-plomberie.fr'
        }
      };
      res.status(200).json(mockContent);
    } catch (error) {
      res.status(500).json({ error: 'Erreur récupération contenu' });
    }
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}`;

    // API Admin
    const adminAPI = `export default async function handler(req, res) {
  if (req.method === 'PUT') {
    try {
      const { entity, field, value } = req.body;
      console.log('Mise à jour:', { entity, field, value });
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Erreur mise à jour' });
    }
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}`;

    fs.writeFileSync(
      path.join(this.outputPath, 'pages/api/content/index.js'),
      contentAPI
    );
    
    fs.writeFileSync(
      path.join(this.outputPath, 'pages/api/admin/content.js'),
      adminAPI
    );
    
    console.log('��� Généré: API routes admin');
  }

  generateDatabaseConfig() {
    // Pour l'instant, créer juste un placeholder
    const dbConfig = `// Configuration SQLite - BuzzCraft Admin
// TODO: Implémenter SQLite avec better-sqlite3

module.exports = {
  dbPath: './database/content.db',
  initialized: false
};`;

    fs.writeFileSync(
      path.join(this.outputPath, 'lib/database/index.js'),
      dbConfig
    );
    console.log('��� Généré: lib/database/index.js');
  }

  updatePackageJson() {
    try {
      const packageJsonPath = path.join(this.outputPath, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Ajouter better-sqlite3 (optionnel pour l'instant)
      packageJson.dependencies = {
        ...packageJson.dependencies,
        'better-sqlite3': '^8.7.0'
      };
      
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log('��� Mis à jour: package.json avec SQLite');
    } catch (error) {
      console.error('❌ Erreur mise à jour package.json:', error.message);
    }
  }
}

module.exports = AdminGenerator;
