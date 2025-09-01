# 13-collaboration.md

Guide de collaboration efficace pour développement avec Claude

## 📋 Philosophie de Travail

**Principe central :** Scripts VSCode Terminal pour itération rapide et audit systématique.

**Avantages :**
- Copie/colle direct dans terminal → Exécution immédiate
- Pas de manipulation manuelle de fichiers → Moins d'erreurs
- Traçabilité complète des changements → Backups automatiques
- Audit méthodique → Qualité constante

## 🚀 Workflow Optimal

### **Phase 1 : Diagnostic**
```bash
# Toujours commencer par un script d'audit
echo "🔍 SCANNING FOR ISSUES..."
grep -r "problème_pattern" app-client app-server app-api
```

### **Phase 2 : Fix avec Backup**
```bash
# Backup automatique avant modification
cp fichier.js fichier.js.backup-description
# Modification sécurisée
cat > fichier.js << 'EOF'
[nouveau contenu]
EOF
```

### **Phase 3 : Validation**
```bash
# Vérification immédiate
echo "🧪 TESTING CHANGES..."
grep -n "pattern_attendu" fichier.js
```

## 🎯 Bonnes Pratiques

### **Demandes Efficaces**

**✅ BON EXEMPLE :**
```
Le REVERT ne marche plus depuis le dernier changement.
Logs d'erreur : 
[copie des logs Node]

Console browser :
[copie erreurs JS]
```

**❌ MAUVAIS EXEMPLE :**
```
"Ça marche pas, peux-tu regarder ?"
```

### **Informations Critiques à Fournir**

1. **Logs Node complets** (inclure timestamps, modules, erreurs)
2. **Console Browser** (F12 → Console, erreurs JS)  
3. **Comportement attendu vs observé**
4. **Derniers changements effectués**

### **Format de Collaboration**

**Structure standard :**
```
CONTEXTE: [Ce qui devrait marcher]
PROBLÈME: [Ce qui ne marche pas]  
LOGS: [Logs complets]
OBJECTIF: [Résultat souhaité]
```

## 🛠️ Types de Scripts

### **Audit & Diagnostic**
```bash
# Pattern standard d'audit
echo "🔍 AUDIT [COMPOSANT]..."
grep -r "pattern_suspect" dossier/
echo "📍 Issues trouvées:"
[commandes de vérification]
```

### **Fix & Correction**  
```bash
# Pattern standard de correction
echo "🔧 FIXING [PROBLÈME]..."
cp fichier.js fichier.js.backup-[description]
[modifications]
echo "✅ [PROBLÈME] corrigé"
```

### **Test & Validation**
```bash
# Pattern standard de test
echo "🧪 TESTING [FONCTIONNALITÉ]..."
[commandes de test]
echo "📊 RÉSULTATS:"
[vérifications]
```

## 🚨 Erreurs à Éviter

### **Architecture**

**❌ ERREURS CRITIQUES :**
- Modifier plusieurs fichiers sans backup
- Scripts sed complexes sur fichiers sensibles
- Mélanger logiques de différentes couches
- Fallbacks silencieux qui masquent les bugs

**✅ APPROCHES SÉCURISÉES :**
- Un fichier à la fois avec backup
- Recréation complète si sed échoue
- Respect strict des couches (API/Server/Client)
- Fail-fast avec erreurs explicites

### **Debugging**

**❌ PIÈGES COURANTS :**
- "Ça marche pas" sans logs
- Modifier le code sans comprendre la cause
- Tester une seule partie d'un workflow
- Ignorer les warnings/deprecations

**✅ MÉTHODES EFFICACES :**
- Logs complets Node + Browser
- Comprendre la root cause avant fix  
- Tester le workflow end-to-end
- Traiter warnings comme des erreurs potentielles

## 📋 Checklist Collaboration

### **Avant de Demander de l'Aide**
- [ ] Logs Node complets copiés
- [ ] Console browser F12 vérifiée
- [ ] Comportement décrit précisément  
- [ ] Context des derniers changements

### **Avant d'Appliquer un Script**
- [ ] Backup des fichiers importants
- [ ] Compréhension de ce que fait le script
- [ ] Terminal dans le bon dossier (buzzcraft/)
- [ ] Serveur arrêté si modification de config

### **Après Application d'un Script**  
- [ ] Vérification que le serveur redémarre
- [ ] Test de la fonctionnalité corrigée
- [ ] Validation que rien d'autre n'est cassé
- [ ] Logs propres sans erreurs

## 🎖️ Standards de Qualité

### **Code Quality**
- **Honnêteté technique :** Pas de success mensonger
- **Logs structurés :** Format unifié avec workflowId
- **Gestion d'erreurs :** Fail-fast avec messages explicites
- **Documentation :** JSDoc sur fonctions publiques

### **Architecture**
- **Pattern 13 CALLS :** Respecté pour tous workflows
- **Séparation couches :** Client → API → Server
- **États cohérents :** Machine à états stricte
- **Communication :** HTTP uniquement entre services

### **Maintienabilité**
- **Tests anti-regression :** Validation automatique
- **Backups systématiques :** Avant chaque modification
- **Documentation synchrone :** .docs/ à jour
- **Traçabilité :** Git commits descriptifs

## 🔧 Outils Recommandés

### **Terminal VSCode**
```bash
# Setup optimal
cd /f/BuzzTech/Dev/buzzcraft
npm start  # Terminal 1
# Script Claude → Terminal 2
```

### **Browser Developer Tools**
- F12 → Console (erreurs JS)
- F12 → Network (requêtes API)
- F12 → Application → Storage (vérifier localStorage vide)

### **Monitoring**
```bash  
# Logs en temps réel
tail -f app-api/logs/* app-server/logs/*

# Analyse patterns
grep -r "ERROR\|FAILED" app-* --exclude-dir=node_modules
```

## 💡 Tips Avancés

### **Debugging Workflow Pattern 13 CALLS**
```bash
# Tracer un workflow complet
grep "Workflow.*wf_[0-9].*_[a-z0-9]*" logs/ | sort
```

### **Validation États Machine**
```bash
# Vérifier cohérence états projets
find app-server/data/outputs -name "project.json" -exec jq '.state' {} \;
```

### **Performance Monitoring** 
```bash
# Temps de réponse API
grep "ms)" logs/ | awk '{print $NF}' | sort -n
```

## 🎯 Résultats Attendus

### **Collaboration Efficace**
- Scripts appliqués en <2min  
- Problèmes diagnostiqués en <5min
- Corrections testées immédiatement
- Qualité maintenue constamment

### **Développement Robuste**
- Zero régression après changement
- Logs qui permettent debug immédiat  
- Architecture respectée strictement
- Documentation toujours synchrone

---

**Philosophie :** "Automatiser tout ce qui peut l'être, documenter tout ce qui ne peut pas l'être, tester tout ce qui a été automatisé."