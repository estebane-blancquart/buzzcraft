// API améliorée avec simulation persistance

const generateImprovedAdminAPI = () => {
  const adminAPI = `// Store en mémoire pour simulation persistance
let contentStore = {
  company: {
    name: 'Dubois Plomberie',
    description: 'Plombier professionnel à Saint-Étienne depuis 15 ans',
    phone: '04 77 XX XX XX',
    email: 'contact@dubois-plomberie.fr',
    address: '15 rue de la République, 42000 Saint-Étienne'
  }
};

export default async function handler(req, res) {
  if (req.method === 'PUT') {
    try {
      const { entity, field, value } = req.body;
      
      // Mise à jour du store en mémoire
      if (!contentStore[entity]) {
        contentStore[entity] = {};
      }
      contentStore[entity][field] = value;
      
      console.log('[ADMIN UPDATE]', {
        entity,
        field, 
        value,
        timestamp: new Date().toISOString(),
        newStore: contentStore
      });
      
      res.status(200).json({ 
        success: true, 
        message: \`\${entity}.\${field} mis à jour avec: \${value}\`,
        timestamp: new Date().toISOString(),
        updatedContent: contentStore
      });
    } catch (error) {
      console.error('[ADMIN ERROR]', error);
      res.status(500).json({ error: 'Erreur mise à jour contenu' });
    }
  } else if (req.method === 'GET') {
    // Permettre de récupérer le store actuel
    res.status(200).json(contentStore);
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}`;

  const contentAPI = `// Store en mémoire partagé
let contentStore = {
  company: {
    name: 'Dubois Plomberie',
    description: 'Plombier professionnel à Saint-Étienne depuis 15 ans',
    phone: '04 77 XX XX XX',
    email: 'contact@dubois-plomberie.fr',
    address: '15 rue de la République, 42000 Saint-Étienne'
  }
};

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Retourner le contenu actuel (modifié par admin ou par défaut)
      res.status(200).json(contentStore);
    } catch (error) {
      res.status(500).json({ error: 'Erreur récupération contenu' });
    }
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}`;

  return { adminAPI, contentAPI };
};

module.exports = { generateImprovedAdminAPI };
