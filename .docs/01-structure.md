# 01-structure.md

Architecture monolithe bien structuré avec séparation claire des responsabilités.

## 📋 Organisation
```
buzzcraft/
├── app-api/          # Serveur Express
│   ├── requests/
│   │   ├── parser.js
│   │   └── processor.js
│   ├── responses/
│   │   ├── parser.js
│   │   └── processor.js
│   ├── cores/
│   │   ├── routes.js
│   │   ├── tracker.js
│   │   └── server.js
│   └── package.json
├── app-server/       # Librairie utilitaires
│   ├── engines/
│   │   └── [ACTION]/
│   │       └── coordinator.js
│   ├── probes/
│   │   └── [STATE]/
│   │       └── detector.js
│   ├── data/
│   │   ├── inputs/
│   │   │   ├── structure/
│   │   │   └── code/
│   │   └── outputs/
│   ├── cores/
│   │   ├── constants.js
│   │   ├── extractor.js
│   │   ├── handlebars.js
│   │   ├── path.js
│   │   ├── projects.js
│   │   ├── reader.js
│   │   ├── services.js
│   │   ├── templates.js
│   │   ├── schema-validator.js
│   │   ├── template-validator.js
│   │   ├── variable-generator.js
│   │   └── writer.js
│   └── package.json
└── app-client/       # Interface React
    ├── pages/
    │   ├── dashboard/
    │   │   ├── metrics/
    │   │   │   ├── MetricCard.jsx
    │   │   │   ├── MetricsModule.scss
    │   │   │   └── MetricsModule.jsx
    │   │   ├── projects/
    │   │   │   ├── NewProjectButton.jsx
    │   │   │   ├── NewProjectModal.jsx
    │   │   │   ├── ProjectCard.jsx
    │   │   │   ├── ProjectActions.jsx
    │   │   │   ├── ProjectsModule.scss
    │   │   │   └── ProjectsModule.jsx
    │   │   ├── terminal/
    │   │   │   ├── LogMessage.jsx
    │   │   │   ├── ConsoleOutput.jsx
    │   │   │   ├── TerminalModule.scss
    │   │   │   └── TerminalModule.jsx
    │   │   ├── Dashboard.scss
    │   │   └── Dashboard.jsx
    │   └── editor/
    │       ├── structure/
    │       │   ├── ElementTree.jsx
    │       │   ├── StructureModule.scss
    │       │   └── StructureModule.jsx
    │       ├── preview/
    │       │   ├── CanvasFrame.jsx
    │       │   ├── PreviewModule.scss
    │       │   └── PreviewModule.jsx
    │       ├── properties/
    │       │   ├── PropertyField.jsx
    │       │   ├── PropertiesModule.scss
    │       │   └── PropertiesModule.jsx
    │       ├── toolbar/
    │       │   ├── DeviceToggle.jsx
    │       │   ├── ToolbarModule.scss
    │       │   └── ToolbarModule.jsx
    │       ├── Editor.scss
    │       └── Editor.jsx
    ├── themes/
    │   ├── base.scss
    │   ├── variables.scss
    │   └── main.scss
    ├── hooks/
    │   ├── useDashboard.js
    │   ├── useEditor.js
    │   └── useWorkflows.js
    ├── configs/
    │       ├── api.js
    │       └── constants.js
    ├── cores/
    │   ├── index.html
    │   ├── Main.jsx
    │   └── Router.jsx
    └── package.json
```

**Flux de données :**
- CLIENT → API : Requêtes HTTP
- API → app-server : Imports directs des modules
- API → CLIENT : Réponses HTTP

**Architecture :**
- **Monolithe structuré** : Un seul processus Node.js
- **Séparation logique** : Responsabilités claires par dossier
- **Communication directe** : app-api importe app-server (pas de latence réseau)

## 🎯 Avantages architecturaux

**Simplicité opérationnelle :**
- Déploiement : Un seul serveur
- Debugging : Stack trace complète
- Transactions : ACID native

**Performance :**
- Pas de latence réseau interne
- Pas de sérialisation/désérialisation
- Optimisations compilateur JavaScript

**Maintenabilité :**
- Structure claire et prévisible
- Refactoring facile (IDE traverse tout)
- Tests d'intégration simples

## 📦 Responsabilités par couche

**app-api (Interface HTTP) :**
- Routes HTTP et middleware Express
- Parsing/validation des requêtes
- Formatage des réponses
- Gestion des erreurs HTTP

**app-server (Logique métier) :**
- Workflows et coordinateurs d'actions
- Détection d'états projets
- Génération de code à partir de templates
- Utilitaires système (I/O, validation, etc.)

**app-client (Interface utilisateur) :**
- Interface React responsive
- Gestion des états UI
- Communication avec API via HTTP
- Composants réutilisables