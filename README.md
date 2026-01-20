# 🏥 DICOM Viewer Platform - Plateforme Web de Visualisation d'Images Médicales

Une plateforme web moderne et collaborative pour la visualisation, l'annotation et le partage d'images médicales au format DICOM.

## 📋 Table des matières

- [Fonctionnalités](#fonctionnalités)
- [Installation](#installation)
- [Démarrage rapide](#démarrage-rapide)
- [Architecture](#architecture)
- [Utilisation](#utilisation)
- [API & Services](#api--services)
- [Contribution](#contribution)
- [Licence](#licence)

## ✨ Fonctionnalités

### 1. 🖼️ Visualisation DICOM
- ✅ Import et affichage d'images DICOM
- ✅ Support des séries d'images (stack viewer)
- ✅ Fenêtrage DICOM (Window Level & Window Width)
- ✅ Zoom et dézoom fluide
- ✅ Déplacement (Pan) de l'image
- ✅ Métadonnées Patient et Étude

### 2. 🎨 Outils d'Annotation
- ✅ Dessin de formes géométriques :
  - Rectangle
  - Cercle
  - Ligne
- ✅ Annotations textuelles
- ✅ Mesures (distance entre deux points)
- ✅ Rotation et miroir d'image
- ✅ Ajustement du contraste et luminosité
- ✅ Export/Import des annotations

### 3. 💬 Collaboration en Temps Réel
- ✅ Système de discussion intégré
- ✅ Commentaires avec horodatage
- ✅ Gestion des rôles (Médecin, Radiologue, Admin)
- ✅ Contrôle d'accès basé sur les rôles
- ✅ Historique des discussions

### 4. 📊 Mesures Avancées
- ✅ Calcul de distances
- ✅ Calcul d'angles
- ✅ Calcul de surface
- ✅ Étiquetage des mesures

## 🚀 Installation

### Prérequis
- Node.js 18+ 
- npm ou yarn
- Un navigateur moderne (Chrome, Firefox, Safari, Edge)

### Étapes d'installation

```bash
# Cloner le repository
git clone <votre-repo-url>
cd pfe

# Installer les dépendances
npm install

# Configuration des variables d'environnement (optionnel)
cp .env.example .env.local
```

### Dépendances Principales

```json
{
  "next": "^14.0.0",
  "react": "^18.0.0",
  "dcmjs": "^0.2.9",
  "cornerstone-core": "^2.0.0",
  "socket.io": "^4.5.0",
  "socket.io-client": "^4.5.0",
  "tailwindcss": "^3.0.0"
}
```

## 🏃 Démarrage Rapide

### En Mode Développement

```bash
npm run dev
```

L'application sera accessible à `http://localhost:3000`

### En Mode Production

```bash
npm run build
npm start
```

## 🏗️ Architecture

### Structure du Projet

```
pfe/
├── .github/
│   └── copilot-instructions.md    # Instructions pour Copilot
├── dataset/
│   └── example-dicom-structural/  # Fichiers DICOM d'exemple
│       └── dicoms/                # 100+ fichiers DICOM
├── src/
│   ├── app/
│   │   ├── page.tsx               # Page principale
│   │   ├── layout.tsx             # Layout racine
│   │   └── globals.css            # Styles globaux
│   ├── components/
│   │   ├── DICOMViewer.tsx        # Viewer DICOM principal
│   │   ├── FileUploader.tsx       # Upload drag-and-drop
│   │   ├── ToolsPanel.tsx         # Panneau d'outils
│   │   └── DiscussionPanel.tsx    # Panel de discussion
│   └── lib/
│       ├── dicomService.ts        # Services DICOM
│       └── annotationService.ts   # Services d'annotation
├── public/                        # Fichiers statiques
├── package.json
└── tsconfig.json
```

### Architecture Composants

```
┌─────────────────────────────────────────┐
│         Page Principale (Home)          │
├─────────────────────────────────────────┤
│ ┌──────────┬─────────────┬──────────┐   │
│ │ File     │  DICOM      │Discussion│   │
│ │Uploader  │  Viewer     │Panel     │   │
│ │ Panel    │             │          │   │
│ │          ├─────────────┤          │   │
│ │          │ Tools Panel │          │   │
│ └──────────┴─────────────┴──────────┘   │
└─────────────────────────────────────────┘
```

## 💻 Utilisation

### 1. Charger une Image DICOM

```typescript
// Drag & drop dans la zone de téléchargement
// OU Cliquer pour parcourir les fichiers
// Fichiers supportés: .dcm
```

### 2. Manipuler l'Image

| Action | Contrôle |
|--------|----------|
| **Zoom In** | Scroll vers le haut / Bouton 🔍 |
| **Zoom Out** | Scroll vers le bas |
| **Déplacement** | Bouton ✋ + Souris |
| **Window Level** | Slider dans le viewer |
| **Window Width** | Slider dans le viewer |
| **Rotation** | Bouton ↻ |
| **Miroir** | Bouton ↔ |

### 3. Annoter l'Image

```typescript
// Sélectionner un outil dans le panneau Tools
// Rectangle: Cliquez et glissez
// Cercle: Cliquez le centre, puis le bord
// Ligne: Cliquez les points successifs
// Texte: Entrez le texte et cliquez pour placer
// Mesure: Cliquez deux points
```

### 4. Discuter Collaboration

```typescript
// Panneau Discussion à droite
// Sélectionner votre rôle (Médecin, Radiologue, Admin)
// Ajouter un commentaire
// Tous les commentaires sont horodatés
```

## 🔧 API & Services

### Service DICOM

```typescript
import { 
  loadDicomFile, 
  convertDicomToImageData,
  getSeriesInfo 
} from '@/lib/dicomService';

// Charger un fichier DICOM
const dicomImage = await loadDicomFile(file);
// retourne: {
//   filename: string
//   metadata: DicomMetadata
//   pixelData: Uint8Array | Uint16Array
//   rows: number
//   columns: number
// }

// Convertir avec windowing DICOM
const imageData = convertDicomToImageData(
  pixelData,
  rows,
  columns,
  windowLevel,
  windowWidth
);

// Obtenir les infos du patient
const info = getSeriesInfo(metadata);
```

### Service d'Annotation

```typescript
import {
  calculateDistance,
  calculateAngle,
  calculateArea,
  drawAnnotation
} from '@/lib/annotationService';

// Calcul de distance
const distance = calculateDistance(point1, point2);

// Calcul d'angle
const angle = calculateAngle(pointA, pointB, pointC);

// Calcul de surface
const area = calculateArea([p1, p2, p3, p4]);

// Dessiner une annotation
drawAnnotation(canvas2dContext, annotation, zoomLevel);
```

## 📊 Types TypeScript

### Métadonnées DICOM

```typescript
interface DicomMetadata {
  patientName?: string;
  patientID?: string;
  studyDate?: string;
  studyTime?: string;
  modality?: string;
  institutionName?: string;
  windowCenter?: number;
  windowWidth?: number;
  pixelSpacing?: number[];
}
```

### Annotations

```typescript
interface Annotation {
  id: string;
  type: 'rectangle' | 'circle' | 'line' | 'text' | 'measurement';
  points: Point[];
  text?: string;
  color?: string;
  label?: string;
  createdAt: Date;
  createdBy: string;
}

interface Point {
  x: number;
  y: number;
}
```

### Commentaires

```typescript
interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: Date;
  role: 'doctor' | 'radiologist' | 'admin';
}
```

## 🔐 Sécurité & Confidentialité

- ✅ Données DICOM traitées côté client
- ✅ Pas de stockage des images sur le serveur (par défaut)
- ✅ Support du contrôle d'accès basé sur les rôles (RBAC)
- ✅ Authentification et autorisation (à implémenter)
- ✅ Conformité HIPAA (recommandé pour production)

## 🚦 Roadmap & Extensions

### À Court Terme
- [ ] Intégration authentification (OAuth, SSO)
- [ ] Base de données patients
- [ ] Export en PDF/PNG
- [ ] Historique des modifications
- [ ] Sauvegarde des annotations

### À Moyen Terme
- [ ] Support WebSocket pour collaboration en temps réel
- [ ] Algorithmes IA pour détection de zones d'intérêt
- [ ] Mesures avancées (aire, périmètre, densité)
- [ ] Intégration PACS (Picture Archiving System)
- [ ] Support multi-modal (CT, MRI, Xray, etc.)

### À Long Terme
- [ ] Machine Learning pour aide au diagnostic
- [ ] Téléconsultation intégrée
- [ ] Support 3D et volumes
- [ ] Intégration dossier patient électronique
- [ ] Backup & Archive automatiques

## 🧪 Tests

```bash
# Lancer les tests
npm run test

# Tests avec couverture
npm run test:coverage

# Tests en mode watch
npm run test:watch
```

## 🐛 Débogage

### Logs DICOM
```typescript
// Dans dicomService.ts, les parsings sont loggés
console.log('DICOM Dictionary:', dicomDict);
```

### Inspector Canvas
```typescript
// Debug du rendu Canvas
canvas.toDataURL('image/png'); // Exporter pour inspection
```

## 📝 Fichiers d'Exemple DICOM

Le projet inclut 100+ fichiers DICOM d'exemple dans :
```
dataset/example-dicom-structural/dicoms/
```

Fichiers: N2D_0001.dcm à N2D_0100.dcm

Source: [Example DICOM Structural Dataset](https://github.com/dcmjs-org/data)

## 🤝 Contribution

Les contributions sont les bienvenues !

1. Fork le repository
2. Créez une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

### Guidelines

- Respecter la structure du projet
- Ajouter des types TypeScript
- Tester avec les fichiers DICOM d'exemple
- Documenter les nouvelles fonctionnalités
- Tester sur responsive design

## 📚 Documentation Supplémentaire

- [DICOM Standard Official](https://dicom.nema.org/)
- [dcmjs Documentation](https://github.com/dcmjs-org/dcmjs)
- [Cornerstone Documentation](https://github.com/cornerstonejs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 📞 Support & Questions

Pour les questions ou problèmes:
1. Vérifier la [documentation](./README.md)
2. Ouvrir une Issue sur GitHub
3. Consulter la documentation DICOM officielle

## 📄 Licence

Ce projet est sous licence MIT. Voir [LICENSE](LICENSE) pour plus de détails.

---

**Développé avec ❤️ pour l'imagerie médicale open-source**

Plateforme développée selon les spécifications du sujet proposé par l'Équipe Imagerie Médicale du Laboratoire de Recherche en Technologies Avancées et Systèmes Intelligents – École Nationale d'Ingénieurs de Sousse.
