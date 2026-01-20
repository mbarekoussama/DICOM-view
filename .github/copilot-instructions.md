<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# DICOM Viewer Platform - Instructions pour Copilot

## Contexte du Projet
Ce projet est une plateforme web moderne pour la visualisation, l'annotation et le partage d'images médicales DICOM.

### Technologies Principales
- **Framework**: Next.js 14+ avec App Router
- **Langage**: TypeScript
- **Styling**: Tailwind CSS
- **Librairies clés**:
  - `dcmjs` - Parser et manipulation des fichiers DICOM
  - `cornerstone-core` - Rendu des images médicales
  - `socket.io` - Communication en temps réel pour collaboration

### Structure du Projet
```
src/
├── app/                          # Pages et layout Next.js
│   ├── page.tsx                 # Page principale du viewer
│   ├── layout.tsx               # Layout racine
│   └── globals.css              # Styles globaux
├── components/                   # Composants React réutilisables
│   ├── DICOMViewer.tsx          # Visualiseur principal d'images DICOM
│   ├── FileUploader.tsx         # Upload drag-and-drop de fichiers
│   ├── ToolsPanel.tsx           # Panneau d'outils d'annotation
│   └── DiscussionPanel.tsx      # Panel de discussion collaborative
└── lib/                         # Utilitaires et services
    ├── dicomService.ts          # Service de parsing DICOM
    └── annotationService.ts     # Service d'annotation et mesure
```

## Directives Principales

### 1. Conventions de Code
- Utiliser les composants fonctionnels React avec Hooks
- Ajouter `'use client'` au début des composants client
- TypeScript obligatoire : définir les interfaces pour tous les props
- Noms de fichiers en PascalCase pour les composants React
- Noms de fichiers en kebab-case pour les utilitaires

### 2. Structure des Composants
Chaque composant doit avoir :
```typescript
'use client';

interface ComponentProps {
  prop1: type;
  prop2?: optionalType;
}

export default function ComponentName({ prop1, prop2 }: ComponentProps) {
  // logique du composant
  return <div>...</div>;
}
```

### 3. Gestion d'État
- Utiliser `useState` pour l'état local
- Utiliser `useEffect` pour les effets secondaires
- Utiliser `useRef` pour les références DOM
- Documenter les dépendances de useEffect

### 4. Services DICOM
- `loadDicomFile()` - Charge et parse un fichier DICOM
- `convertDicomToImageData()` - Applique le windowing DICOM
- `getSeriesInfo()` - Extrait les info de patient

### 5. Annotations et Mesures
- Interface `Annotation` pour tous les types d'annotations
- Utiliser `drawAnnotation()` pour renderer sur canvas
- Supporter: rectangle, circle, line, text, measurement
- Fonction `calculateDistance()`, `calculateAngle()`, `calculateArea()`

### 6. Collaboration
- Système de rôles: 'doctor', 'radiologist', 'admin'
- Timestamps pour chaque commentaire
- Interface `Comment` avec author, content, role
- Préparer pour WebSocket via Socket.io

### 7. Styling
- Utiliser Tailwind CSS uniquement
- Classes de couleurs: slate-*, blue-*, purple-*, red-*
- Mode sombre par défaut
- Responsive avec breakpoints lg:

### 8. Gestion des Erreurs
- Try-catch sur les opérations I/O
- Messages d'erreur en français
- États de loading clairs
- Validations des inputs

## Tâches Communes

### Ajouter une nouvelle Feature
1. Créer le composant dans `src/components/`
2. Ajouter les types TypeScript
3. Importer dans le composant parent
4. Ajouter les styles Tailwind
5. Tester avec les données DICOM du dossier `dataset/`

### Ajouter une Annotation
1. Ajouter le type dans `annotationService.ts`
2. Implémenter la fonction de dessin
3. Ajouter le bouton dans `ToolsPanel.tsx`
4. Ajouter la logique dans `DICOMViewer.tsx`

### Intégration WebSocket
- Importer `socket.io-client`
- Créer un hook custom `useSocket`
- Émettre/recevoir des events pour synchroniser les annotations

## Points Importants

- Les fichiers DICOM exemples sont dans `dataset/example-dicom-structural/dicoms/`
- Le windowing DICOM est crucial pour une bonne visualisation
- Les métadonnées DICOM utilisent des tags hexadécimaux (ex: '00100010')
- Toujours gérer l'async/await pour le chargement des fichiers
- Préserver la qualité médicale des images (pas de compression destructive)

## Ressources
- DICOM Standard: https://dicom.nema.org/
- dcmjs Docs: https://github.com/dcmjs-org/dcmjs
- Cornerstone: https://github.com/cornerstonejs/cornerstone
