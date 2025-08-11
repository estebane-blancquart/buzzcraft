# BUILD Workflow - DRAFT → BUILT

## Flow
```
coordinator → detector → loader → generator → writer
```

## Pattern validé
- **Detector** : vérifie état DRAFT
- **Loader** : charge templates Handlebars
- **Generator** : compile JSON → TypeScript
- **Writer** : écrit services filesystem

## Tests
- Unitaires : built/detector.js
- Intégration : CREATE → BUILD complet