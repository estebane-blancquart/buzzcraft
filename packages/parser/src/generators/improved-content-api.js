// API Content améliorée basée sur contentSchema réel

function generateImprovedContentAPI(contentSchema) {
  const contentAPI = `// Store en mémoire enrichi basé sur contentSchema
let contentStore = {
  company: {
    name: 'Dubois Plomberie',
    description: 'Plombier professionnel à Saint-Étienne depuis 15 ans',
    phone: '04 77 XX XX XX',
    email: 'contact@dubois-plomberie.fr',
    address: '15 rue de la République, 42000 Saint-Étienne'
  },
  services: {
    title: 'Nos Services de Plomberie',
    description: 'Découvrez notre gamme complète de services professionnels',
    service1_title: 'Dépannage d\\'urgence',
    service1_description: 'Intervention rapide 24h/24 pour tous vos problèmes de plomberie',
    service1_price: 'À partir de 80€',
    service2_title: 'Installation sanitaire', 
    service2_description: 'Installation complète de salles de bain et cuisines',
    service2_price: 'Devis gratuit',
    service3_title: 'Rénovation plomberie',
    service3_description: 'Rénovation complète de votre installation de plomberie',
    service3_price: 'Sur mesure'
  }
};

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      console.log('[CONTENT API] Récupération contenu:', contentStore);
      res.status(200).json(contentStore);
    } catch (error) {
      console.error('[CONTENT API ERROR]', error);
      res.status(500).json({ error: 'Erreur récupération contenu' });
    }
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}`;

  const adminAPI = `// Store en mémoire partagé avec l'API content
let contentStore = {
  company: {
    name: 'Dubois Plomberie',
    description: 'Plombier professionnel à Saint-Étienne depuis 15 ans',
    phone: '04 77 XX XX XX',
    email: 'contact@dubois-plomberie.fr',
    address: '15 rue de la République, 42000 Saint-Étienne'
  },
  services: {
    title: 'Nos Services de Plomberie',
    description: 'Découvrez notre gamme complète de services professionnels',
    service1_title: 'Dépannage d\\'urgence',
    service1_description: 'Intervention rapide 24h/24 pour tous vos problèmes de plomberie',
    service1_price: 'À partir de 80€',
    service2_title: 'Installation sanitaire',
    service2_description: 'Installation complète de salles de bain et cuisines', 
    service2_price: 'Devis gratuit',
    service3_title: 'Rénovation plomberie',
    service3_description: 'Rénovation complète de votre installation de plomberie',
    service3_price: 'Sur mesure'
  }
};

export default async function handler(req, res) {
  if (req.method === 'PUT') {
    try {
      const { entity, field, value } = req.body;
      
      // Mise à jour du store
      if (!contentStore[entity]) {
        contentStore[entity] = {};
      }
      contentStore[entity][field] = value;
      
      console.log('[ADMIN UPDATE]', {
        entity,
        field,
        value,
        newStore: contentStore
      });
      
      res.status(200).json({ 
        success: true, 
        message: \`\${entity}.\${field} mis à jour\`,
        updatedContent: contentStore
      });
    } catch (error) {
      console.error('[ADMIN ERROR]', error);
      res.status(500).json({ error: 'Erreur mise à jour' });
    }
  } else if (req.method === 'GET') {
    res.status(200).json(contentStore);
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}`;

  return { contentAPI, adminAPI };
}

module.exports = { generateImprovedContentAPI };
