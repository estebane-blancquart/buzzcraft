// Store enrichi basé sur contentSchema
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
    service1_title: 'Dépannage d\'urgence',
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
      console.log('[CONTENT API] Retour contenu:', contentStore);
      res.status(200).json(contentStore);
    } catch (error) {
      console.error('[CONTENT API ERROR]', error);
      res.status(500).json({ error: 'Erreur récupération contenu' });
    }
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}