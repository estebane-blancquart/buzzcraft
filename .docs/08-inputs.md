# 08-inputs.md

Système de templates JSON et Handlebars pour la génération.

## 📋 Organisation

**Templates structure (JSON) :**
```
inputs/structure/
├── components/       # heading.json, paragraph.json, button.json, etc.
├── containers/       # div.json, form.json, list.json
├── sections/         # hero.json, menu.json, contact.json
└── projects/         # basic.json, restaurant.json, contact.json
```

**Templates code (Handlebars) :**
```
inputs/code/
├── front/            # Composants React interface publique
├── api/              # Routes et middleware Express
├── back/             # Logique métier et services
├── database/         # Schémas et migrations
└── admin/            # Interface administration
```

**Variables disponibles :**
Chaque template Handlebars reçoit les données du project.json : métadonnées projet, contenu des éléments, propriétés spécifiques par type, et arrays pour les containers.

**Compilation :**
project.json + template.hbs → service.ts/tsx/js selon le besoin

## 🔧 Fonctionnement

Les templates structure définissent la hiérarchie DOM par défaut pour chaque type d'élément. Les templates code génèrent le code source des 5 services à partir des données du project.json.

Le système scan automatiquement les types utilisés dans le project.json et ne génère que les templates nécessaires. La compilation Handlebars injecte les variables contextuelles et produit du code TypeScript prêt à l'emploi.