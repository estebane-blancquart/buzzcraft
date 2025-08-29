# 12-anti-fallback.md

**MANIFESTE ANTI-FALLBACK** - Élimination définitive des masquages de bugs.

## 🚨 **CONTEXTE CRITIQUE**

**Problème identifié :** Une IA a généré des fallbacks partout dans le code, créant un système **menteur** qui dit "ça marche" quand c'est cassé.

**Résultat :** Bug mystérieux où template "restaurant" → "basic" silencieusement, impossible à débugger pendant des heures.

**Principe fondamental :** **"Un fallback silencieux est un bug masqué"**

## 🎯 **RÈGLES STRICTES ANTI-FALLBACK**

### **🚫 INTERDICTIONS ABSOLUES**

#### **1. Opérateurs de fallback silencieux**
```javascript
// ❌ INTERDIT - Masque les bugs
const template = config.template || 'basic';
const state = project.state || 'DRAFT';
const name = data.name || 'Untitled';

// ✅ OBLIGATOIRE - Fail fast
if (!config.template) {
  throw new Error('ValidationError: template is required');
}
const template = config.template;
```

#### **2. Fonctions génératrices de contenu fake**
```javascript
// ❌ INTERDIT - Génère du mensonge
function createFallbackTemplate(templateId) {
  return { /* template bidon */ };
}

function generateDefaultProject() {
  return { /* projet fake */ };
}

// ✅ OBLIGATOIRE - Erreur explicite
if (!templateExists(templateId)) {
  throw new Error(`CRITICAL: Template '${templateId}' not found`);
}
```

#### **3. États par défaut masquant l'absence de choix**
```javascript
// ❌ INTERDIT - Cache l'absence de sélection utilisateur
const [formData, setFormData] = useState({
  template: 'basic'  // Masque le fait que l'utilisateur n'a rien choisi
});

// ✅ OBLIGATOIRE - Force la sélection explicite
const [formData, setFormData] = useState({
  template: ''  // Utilisateur DOIT choisir
});
```

#### **4. Try-catch avalant les erreurs**
```javascript
// ❌ INTERDIT - Masque les pannes
try {
  const result = await criticalOperation();
} catch (error) {
  return fallbackResult;  // Cache le problème
}

// ✅ OBLIGATOIRE - Expose le problème
try {
  const result = await criticalOperation();
} catch (error) {
  console.error(`CRITICAL: Operation failed - ${error.message}`);
  throw new Error(`Operation failed: ${error.message}`);
}
```

### **✅ EXCEPTIONS AUTORISÉES** 

#### **1. Préférences utilisateur cosmétiques**
```javascript
// ✅ AUTORISÉ - Préférence d'affichage uniquement
const theme = userTheme || 'light';
const language = userLang || 'en';
const fontSize = userFontSize || 16;
```

#### **2. Configuration technique avec logs explicites**
```javascript
// ✅ AUTORISÉ - Avec visibilité complète
const port = process.env.PORT || 3000;
if (!process.env.PORT) {
  console.warn('⚠️ PORT not set in environment, using default 3000');
}
```

#### **3. Graceful degradation UX avec notification**
```javascript
// ✅ AUTORISÉ - Avec notification utilisateur
const advancedFeatures = hasPermission || false;
if (!hasPermission) {
  showNotification('Certaines fonctionnalités avancées sont désactivées');
}
```

## 🔍 **AUDIT SYSTÉMATIQUE**

### **📝 CHECKLIST ANTI-FALLBACK**

#### **🔬 Niveau MICRO - Fonction**
```
□ Aucun opérateur || avec valeur par défaut
□ Aucun ?? avec valeur par défaut  
□ Validation explicite de tous les paramètres
□ Erreurs lancées pour données manquantes
□ Pas de return silencieux de valeurs alternatives
□ Logs d'erreur avant chaque throw
```

#### **📦 Niveau MODULE - Fichier**
```
□ Aucune fonction createFallback*, createDefault*, generate*
□ Aucune constante DEFAULT_* utilisée comme fallback
□ Toutes les erreurs remontent à la surface
□ Aucun masquage dans les try-catch
□ États initiaux forcent la sélection utilisateur
□ Configuration externe documentée explicitement
```

#### **🏗️ Niveau SERVICE - App**
```
□ Interface utilisateur bloquée si données manquantes
□ API retourne erreurs explicites, jamais de données fake
□ Base de données : contraintes NOT NULL strictes
□ Logs structurés pour chaque échec
□ Monitoring d'alertes sur les erreurs critiques
□ Documentation des cas d'échec complets
```

#### **🌐 Niveau SYSTÈME - Architecture**
```
□ Aucun service ne peut mentir sur son état
□ Communication inter-services : échec = arrêt
□ Circuit breaker avec alertes, pas de contournement
□ Tests d'intégration couvrent tous les cas d'échec
□ Rollback automatique si état incohérent détecté
□ Métriques de santé basées sur la vérité, pas les fallbacks
```

### **🛠️ OUTILS DE DÉTECTION**

#### **Recherche dans le code**
```bash
# Patterns suspects à éliminer
grep -r "|| '" src/
grep -r '|| "' src/
grep -r "?? " src/
grep -r "createFallback" src/ --ignore-case
grep -r "fallback" src/ --ignore-case
grep -r "default" src/ --ignore-case | grep -v "export default"
```

#### **Questions de validation**
Pour chaque fallback trouvé :
1. **Masque-t-il un vrai problème ?** → Supprimer
2. **L'utilisateur sait-il qu'il s'active ?** → Logger ou supprimer  
3. **Peut-on débugger facilement ?** → Ajouter logs ou supprimer
4. **Est-ce vraiment cosmétique ?** → Garder seulement si UX pure

### **🚨 RÈGLES D'URGENCE**

#### **Signalement obligatoire**
```javascript
// Si fallback absolument nécessaire temporairement
const value = criticalData || temporaryFallback;
console.error('🚨 TEMPORARY FALLBACK ACTIVE - MUST BE FIXED');
console.error(`Expected: ${criticalData}, Using: ${temporaryFallback}`);
// TODO: Remove this fallback - Issue #XXX
```

#### **Protection Pattern 13-CALLS**
```javascript
// Dans chaque CALL, validation stricte
if (!inputData) {
  throw new Error(`CALL ${callNumber}: Required input missing`);
}

// Pas de "continue anyway", le pattern s'arrête
```

## 📊 **MÉTRIQUES DE QUALITÉ**

### **Objectifs mesurables**
- **0 occurrence** de `|| 'basic'` ou équivalent
- **0 fonction** commençant par `createFallback`
- **0 masquage** d'erreur dans try-catch
- **100% des erreurs** remontent à l'interface utilisateur
- **Temps de debugging** divisé par 10

### **Tests automatisés**
```javascript
// Test anti-fallback automatique
describe('Anti-fallback validation', () => {
  test('no silent fallbacks in critical functions', () => {
    const criticalFunctions = ['createProject', 'loadTemplate', 'parseRequest'];
    
    criticalFunctions.forEach(funcName => {
      expect(() => funcName(null)).toThrow();
      expect(() => funcName(undefined)).toThrow();
      expect(() => funcName('')).toThrow();
    });
  });
});
```

## 🎯 **PLAN D'IMPLÉMENTATION**

### **Phase 1: Identification (1h)**
1. Scanner tout le code avec grep
2. Lister tous les fallbacks trouvés  
3. Catégoriser : critique/cosmétique/légitime

### **Phase 2: Élimination (2-3h)**
1. Supprimer tous les fallbacks critiques
2. Ajouter validation stricte + erreurs explicites
3. Remplacer fallbacks cosmétiques par configuration explicite

### **Phase 3: Protection (30min)**
1. Ajouter tests anti-fallback automatiques
2. Documentation mise à jour
3. Règles de code review anti-fallback

## 🏆 **RÉSULTAT ATTENDU**

**Avant :** "Ça marche" (mais menteur) → Debugging impossible  
**Après :** "Ça marche" (vérité) ou "Erreur explicite" → Debugging immédiat

**Philosophie :** Préférer l'échec visible au succès mensonger.

---

**"Chaque fallback supprimé est un bug révélé et un futur problème évité."**