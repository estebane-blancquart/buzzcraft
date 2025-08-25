# 04-client.md

Interface React avec hooks métier et composants spécialisés.

## 📋 Organisation

- **pages/** : Pages principales avec composants spécialisés par domaine
- **hooks/** : Logique métier pure (useDashboard, useEditor, useWorkflows)
- **configs/** : Configuration centralisée (api.js, constants.js)
- **themes/** : Theme global + variables partagées (variables, base, theme, main)
```


```

**Composants métier :**
- **MetricCard** : Affichage métriques individuelles
- **MetricsModule** : Conteneur métriques avec filtres
- **ProjectCard** : Actions contextuelles selon état projet
- **NewProjectButton** : Déclencheur création projet
- **NewProjectModal** : Interface création nouveau projet
- **ProjectActions** : Actions disponibles par projet
- **ProjectsModule** : Gestion complète liste projets
- **LogMessage** : Message individuel terminal
- **ConsoleOutput** : Sortie console workflows
- **TerminalModule** : Terminal temps réel complet
- **ElementTree** : Navigation structure hiérarchique
- **StructureModule** : Gestion structure projet
- **CanvasFrame** : Rendu visuel responsive
- **PreviewModule** : Prévisualisation par device
- **PropertyField** : Champ édition propriété
- **PropertiesModule** : Panneau propriétés élément
- **DeviceToggle** : Sélecteur device preview
- **ToolbarModule** : Barre outils éditeur

**Hooks React :**
- **useDashboard** : Logique métier dashboard
- **useEditor** : Logique métier éditeur
- **useWorkflows** : Gestion workflows et communications API

**Signatures :**

*Hooks métier (hooks/) :*
```javascript
useDashboard()
useEditor()  
useWorkflows()
```

## 🔧 Fonctionnement

Interface responsive avec feedback temps réel via états transitoires ([BUILDING], [DEPLOYING], etc.). Dashboard pour gestion projets, Editor pour modification état DRAFT uniquement. Communication HTTP avec app-api sur port 3000.