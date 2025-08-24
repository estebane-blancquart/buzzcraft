# 02-server.md

Service Node.js moteur de compilation avec machine à états déterministe.

## 📋 Organisation

**Machine à états :**
```
VOID → DRAFT → BUILT → OFFLINE → ONLINE
```

**Définitions :**
- **VOID** : Projet inexistant, pas de project.json
- **DRAFT** : Structure JSON créée, éditable, pas de code généré
- **BUILT** : Services générés, prêts pour déploiement
- **OFFLINE** : Containers créés mais arrêtés  
- **ONLINE** : Services actifs, site accessible

**Actions par état :**
```
VOID     → CREATE  → DRAFT
DRAFT    → EDIT    → DRAFT
DRAFT    → BUILD   → BUILT
BUILT    → REVERT  → DRAFT
BUILT    → DEPLOY  → OFFLINE
OFFLINE  → REVERT  → BUILT
OFFLINE  → START   → ONLINE
ONLINE   → STOP    → OFFLINE
ONLINE   → UPDATE  → ONLINE
ANY      → DELETE  → VOID
```

**États transitoires :**
[BUILDING], [DEPLOYING], [STARTING], [REVERTING] pour feedback UI.

**Composants système :**
- **engines/** : Coordinateurs d'actions
- **probes/** : Détecteurs d'état avec confidence + evidence
- **cores/** : Utilitaires (reader, writer, extractor, validator, compiler)

**Signatures :**

*Coordinateurs d'actions (engines/) :*
```javascript
createWorkflow(projectId: string, config: object) → WorkflowResult
buildWorkflow(projectId: string, config: object) → WorkflowResult
deployWorkflow(projectId: string, config: object) → WorkflowResult
startWorkflow(projectId: string, config: object) → WorkflowResult
stopWorkflow(projectId: string, config: object) → WorkflowResult
deleteWorkflow(projectId: string, config: object) → WorkflowResult
```

*Détecteurs d'état (probes/) :*
```javascript
detectVoidState(projectPath: string) → StateDetectionResult
detectDraftState(projectPath: string) → StateDetectionResult
detectBuiltState(projectPath: string) → StateDetectionResult
detectOfflineState(projectPath: string) → StateDetectionResult
detectOnlineState(projectPath: string) → StateDetectionResult
```

*Utilitaires système (cores/) :*
```javascript
readPath(path: string, options?: object) → ReadResult
writePath(path: string, data: string|object, options?: object) → WriteResult
extractAllElements(projectData: object) → Element[]
validateProjectSchema(projectData: object, options?: object) → ValidationResult
generateServices(projectData: object, templatesData: object, options?: object) → GenerationResult
```

## 🔧 Fonctionnement

Progression linéaire obligatoire sans possibilité de sauter des étapes. Détection d'état analyse filesystem + containers Docker. Rollback automatique en cas d'échec après génération. Validation continue à chaque transition.