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

## 🚨 **RÈGLES ANTI-FALLBACK**

### **INTERDICTIONS STRICTES**

**❌ Fallbacks silencieux interdits :**
```javascript
// INTERDIT - Masque les bugs
template: config.template || 'basic'
state: project.state || 'DRAFT'
name: data.name || 'Untitled'

// AUTORISÉ - Fail fast
if (!config.template) {
  throw new Error('ValidationError: template is required');
}
template: config.template
```

**❌ Fonctions de fallback interdites :**
```javascript
// INTERDIT - Génère du contenu fake
function createFallbackTemplate(templateId) {
  return { /* template bidon */ };
}

// AUTORISÉ - Erreur explicite
if (!templateExists(templateId)) {
  throw new Error(`Template '${templateId}' not found`);
}
```

**❌ États par défaut masquant les problèmes :**
```javascript
// INTERDIT - Cache les problèmes d'initialisation
const [formData, setFormData] = useState({
  template: 'basic'  // Masque l'absence de sélection
});

// AUTORISÉ - Force la sélection explicite
const [formData, setFormData] = useState({
  template: ''  // Utilisateur DOIT choisir
});
```

**❌ Try-catch avalant les erreurs :**
```javascript
// INTERDIT - Masque les pannes
try {
  const result = await apiCall();
} catch (error) {
  return fallbackData;  // Cache le problème
}

// AUTORISÉ - Expose le problème
try {
  const result = await apiCall();
} catch (error) {
  throw new Error(`API failed: ${error.message}`);
}
```

### **EXCEPTIONS AUTORISÉES**

**✅ Fallbacks pour l'expérience utilisateur uniquement :**
```javascript
// AUTORISÉ - UX graceful degradation
const theme = userTheme || 'light';  // Préférence cosmétique
const language = userLang || 'en';   // Préférence affichage
```

**✅ Fallbacks techniques avec logs explicites :**
```javascript
// AUTORISÉ - Avec visibilité complète
const port = process.env.PORT || 3000;
if (!process.env.PORT) {
  console.warn('PORT not set, using default 3000');
}
```

### **PRINCIPE FONDAMENTAL**

> **"Un fallback silencieux est un bug masqué"**
> 
> Tout fallback doit soit :
> - Lever une erreur explicite (développement)
> - Logger un avertissement visible (production)
> - Être justifié par l'UX (cosmétique uniquement)

### **DÉTECTION DES VIOLATIONS**

**Pattern à rechercher dans le code :**
```bash
# Rechercher les fallbacks suspects
grep -r "|| '" src/
grep -r "|| \"" src/
grep -r "createFallback" src/
grep -r "fallback" src/ --ignore-case
```

**Questions à se poser :**
1. Ce fallback masque-t-il un vrai problème ?
2. L'utilisateur sait-il que le fallback s'est activé ?
3. Peut-on débugger facilement quand ça ne marche pas ?

## 🔧 Fonctionnement

Tous les services utilisent ces patterns pour garantir cohérence et maintenabilité. Validation systématique des paramètres, logs structurés, retours uniformes, documentation JSDoc complète.

**FAIL FAST** : Préférer l'échec immédiat et visible au succès apparent avec données incorrectes.