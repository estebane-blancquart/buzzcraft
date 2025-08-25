# 01-structure.md

Architecture mono-repo 3 services avec séparation stricte des responsabilités.

## 📋 Organisation
```
buzzcraft/
├── app-api/          # Service Express
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
├── app-server/       # Service Node
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
│   │   ├── reader.js
│   │   ├── writer.js
│   │   ├── extractor.js
│   │   ├── validator.js
│   │   └── compiler.js
│   └── package.json
└── app-client/       # Service React
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
    │   ├── theme.scss
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

## 🔧 Fonctionnement
```
CLIENT ←→ API ←→ SERVER 
```
CLIENT → API : request
API → SERVER : HTTP
SERVER → API : response
API → CLIENT : HTTP

