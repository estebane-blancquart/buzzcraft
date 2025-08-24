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
│   ├── inputs/
│   │   ├── structure/
│   │   └── code/
│   ├── outputs/
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
    │   │   ├── projects/
    │   │   └── terminal/
    │   └── editor/
    │       ├── structure/
    │       ├── preview/
    │       ├── properties/
    │       └── toolbar/
    ├── hooks/
    ├── configs/
    ├── cores/
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

