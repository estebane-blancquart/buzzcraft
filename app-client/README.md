# ��� BuzzCraft - Architecture Finale

## Structure
```
app-client/
├── components/     # UI pur (Button, Modal, Input)
├── modules/        # Métier (ProjectCard, ProjectList) 
├── pages/          # Pages (Dashboard, Editor, Settings)
├── hooks/          # Logique métier (useProjects, useWebSocket)
├── utils/          # Helpers (api, formatters, validators)
├── theme/          # Styles (variables CSS, base)
└── config/         # Configuration (API, constants)
```

## Patterns
- **Styles:** CSS Modules + Variables CSS
- **Logic:** Hooks centralisés, import sélectif  
- **Tests:** Centralisés dans `.tests/`

## Commandes
```bash
npm install
npm run dev
```
