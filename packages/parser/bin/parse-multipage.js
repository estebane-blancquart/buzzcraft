#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

// Import du parser principal avec AdminGenerator
const JsonToReactParser = require('../src/json-to-react');
const AdminGenerator = require('../src/generators/admin-generator');

console.log('��� BuzzCraft Parser Multi-Pages avec Admin - Phase 3B+Admin');
console.log('='.repeat(60));

const jsonFile = process.argv[2];
if (!jsonFile) {
  console.error('❌ Usage: node parse-multipage.js <json-file>');
  process.exit(1);
}

if (!fs.existsSync(jsonFile)) {
  console.error(`❌ Fichier JSON introuvable: ${jsonFile}`);
  process.exit(1);
}

try {
  // Charger le projet JSON
  const jsonProject = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
  
  console.log(`��� Projet: ${jsonProject.meta.projectId}`);
  console.log(`��� Pages: ${Object.keys(jsonProject.structure.pages).join(', ')}`);
  console.log(`���️ ContentSchema: ${Object.keys(jsonProject.contentSchema || {}).join(', ')}`);
  
  // Créer le parser
  const parser = new JsonToReactParser({ verbose: true });
  
  // Parser le projet  
  console.log('��� Génération site multi-pages...');
  const outputPath = path.join(__dirname, '../output', jsonProject.meta.projectId);
  
  // Utiliser le parser principal qui génère déjà les pages
  parser.parseProject(jsonProject, outputPath).then(() => {
    console.log('✅ Site multi-pages généré');
    
    // NOUVEAU: Ajouter génération admin
    console.log('��� Ajout interface admin...');
    const adminGen = new AdminGenerator(jsonProject, outputPath);
    adminGen.generate();
    
    console.log('✅ Interface admin ajoutée');
    console.log(`⏱️ Génération terminée`);
    console.log(`��� Sortie: ${outputPath}`);
    
    console.log('\n��� PROCHAINES ÉTAPES:');
    console.log(`1. cd ${outputPath}`);
    console.log('2. npm install');
    console.log('3. npm run build');
    console.log('4. Déploiement avec engine');
    
  }).catch(error => {
    console.error('❌ Erreur parsing:', error);
    process.exit(1);
  });
  
} catch (error) {
  console.error('❌ Erreur lecture JSON:', error.message);
  process.exit(1);
}
