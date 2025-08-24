# 05-patterns.md

Conventions et patterns de code unifiés pour les 3 services.

## 📋 Organisation

**Pattern validation cohérente :**
```javascript
function validateInput(projectId) {
  if (!projectId || typeof projectId !== 'string') {
    return { valid: false, error: 'projectId must be non-empty string' };
  }
  return { valid: true };
}

// Dans les workflows
const validation = validateInput(projectId);
if (!validation.valid) {
  return { success: false, error: validation.error };
}
```

**Pattern logs structurés :**
```javascript
console.log(`[INFO] [SERVICE] Description action`);
console.log(`[SUCCESS] [SERVICE] Description résultat`);
console.log(`[ERROR] [SERVICE] Description problème`);
console.log(`[WARN] [SERVICE] Description alerte`);
```

**Pattern retour uniforme :**
```javascript
// Succès
return {
  success: true,
  data: result
};

// Échec
return {
  success: false,
  error: 'Description claire du problème'
};
```

**Pattern JSDoc simplifié :**
```javascript
/**
 * Détecte l'état d'un projet
 * @param {string} projectPath - Chemin vers le projet
 * @returns {Promise<{success: boolean, data: object}>}
 */
```

**Pattern gestion erreurs :**
```javascript
try {
  // Validation
  const validation = validateInput(params);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }
  
  // Logique principale
  const result = await doWork();
  console.log(`[SUCCESS] [SERVICE] Operation completed`);
  
  return { success: true, data: result };
  
} catch (error) {
  console.log(`[ERROR] [SERVICE] Unexpected error:`, { error: error.message });
  return { success: false, error: 'Internal error occurred' };
}
```

## 🔧 Fonctionnement

Tous les services utilisent ces patterns pour garantir cohérence et maintenabilité. Validation systématique des paramètres, logs structurés, retours uniformes, documentation JSDoc complète.