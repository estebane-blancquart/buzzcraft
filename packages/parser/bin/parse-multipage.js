#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

// Import du parser principal avec AdminGenerator
const JsonToReactParser = require('../src/json-to-react');
const AdminGenerator = require('../src/generators/admin-generator');

console.log('Ì∫Ä BuzzCraft Parser Multi-Pages avec Admin - Phase 3B+Admin');
console.log('='.repeat(60));

const jsonFile = process.argv[2];
if (!jsonFile) {
  console.error('‚ùå Usage: node parse-multipage.js <json-file>');
  process.exit(1);
}

if (!fs.existsSync(jsonFile)) {
  console.error(`‚ùå Fichier JSON introuvable: ${jsonFile}`);
  process.exit(1);
}

try {
  // Charger le projet JSON
  const jsonProject = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
  
  console.log(`ÌæØ Projet: ${jsonProject.meta.projectId}`);
  console.log(`Ì≥Ñ Pages: ${Object.keys(jsonProject.structure.pages).join(', ')}`);
  console.log(`Ì∑ÇÔ∏è ContentSchema: ${Object.keys(jsonProject.contentSchema || {}).join(', ')}`);
  
  // Cr√©er le parser
  const parser = new JsonToReactParser({ verbose: true });
  
  // Parser le projet  
  console.log('Ì¥® G√©n√©ration site multi-pages...');
  const outputPath = path.join(__dirname, '../output', jsonProject.meta.projectId);
  
  // Utiliser le parser principal qui g√©n√®re d√©j√† les pages
  parser.parseProject(jsonProject, outputPath).then(() => {
    console.log('‚úÖ Site multi-pages g√©n√©r√©');
    
    // NOUVEAU: Ajouter g√©n√©ration admin
    console.log('Ì¥® Ajout interface admin...');
    const adminGen = new AdminGenerator(jsonProject, outputPath);
    adminGen.generate();
    
    console.log('‚úÖ Interface admin ajout√©e');
    console.log(`‚è±Ô∏è G√©n√©ration termin√©e`);
    console.log(`Ì≥Ç Sortie: ${outputPath}`);
    
    console.log('\nÌ∫Ä PROCHAINES √âTAPES:');
    console.log(`1. cd ${outputPath}`);
    console.log('2. npm install');
    console.log('3. npm run build');
    console.log('4. D√©ploiement avec engine');
    
  }).catch(error => {
    console.error('‚ùå Erreur parsing:', error);
    process.exit(1);
  });
  
} catch (error) {
  console.error('‚ùå Erreur lecture JSON:', error.message);
  process.exit(1);
}
