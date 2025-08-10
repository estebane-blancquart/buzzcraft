# CREATE Workflow - VOID → DRAFT

## Flow
```
coordinator → detector → loader → generator → writer
```

## Pattern validé
- **Detector** : vérifie état
- **Loader** : charge template  
- **Generator** : enrichit données
- **Writer** : crée fichier

## Tests
- Unitaires : reader, writer, detector
- Intégration : flow complet + doublon
