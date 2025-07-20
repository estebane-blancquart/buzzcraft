# Architecture BuzzCraft

## Vue d'ensemble

BuzzCraft génère des sites web complets via une machine à états qui orchestre des workflows de création, build et déploiement.

## Couches Architecture

### **States** (Détection)
Détectent l'état actuel d'un projet.

```
VOID → DRAFT → BUILT → OFFLINE → ONLINE
```

**Responsabilités :**
- Analyser filesystem pour déterminer l'état
- Retourner confidence + evidence
- Pas de side effects, juste détection

### **Engines** (Orchestration)  
Orchestrent les workflows complets.

```javascript
// Exemple : Création d'un projet
executeCreateWorkflow(projectId, template) → {
  1. Vérifier état VOID
  2. Appeler transitions create
  3. Valider résultat  
  4. Retourner état DRAFT
}
```

### **Transitions** (Actions)
Actions atomiques et réversibles.

```javascript
// Exemple : Action création pure
executeCreate(templateData, targetPath) → {
  // Opération atomique avec rollback
}
```

### **Systems** (Services)
Services bas niveau (filesystem, docker, etc.).

## Règles Dépendances

```
engines/ → transitions/ → systems/ → utils/
states/ → independent (appelé par engines)
```

**Interdit :** Dépendances circulaires  
**Validation :** ESLint + tests automatiques

## Machine à États

### Transitions Valides
- `VOID → DRAFT` (create)
- `DRAFT → DRAFT` (save)
- `DRAFT → BUILT` (build)
- `BUILT → DRAFT` (edit)
- `BUILT → OFFLINE` (deploy)
- `OFFLINE → ONLINE` (start)
- `ONLINE → OFFLINE` (stop)
- `OFFLINE → OFFLINE` (update)
- `ANY → VOID` (delete)

### Transitions Bloquées
- `VOID → BUILT` (impossible sans passer par DRAFT)
- `VOID → ONLINE` (impossible sans build+deploy)

## Workspaces

### **app-server** 
Moteur de génération principal.

### **app-client**
Interface React pour le studio visuel.

### **api**  
Couche communication WebSocket/HTTP.

## Développement

### Workflow par Commit
1. Écrire test pour le commit
2. Implémenter fonctionnalité  
3. Valider avec `npm run check`
4. Commit avec message standardisé

### Tests
- **Unit** : Chaque fonction isolée
- **Integration** : Workflows complets  
- **Architecture** : Validation dépendances

### Conventions Code
- ES Modules partout (`type: "module"`)
- Async/await (pas de callbacks)
- Validation stricte des paramètres
- Gestion d'erreurs explicite