# Architecture ARK SERVICE

## Vue d'ensemble

ARK SERVICE est une application web de gestion de formations utilisant:
- **Frontend**: React (via CDN), Vanilla JavaScript
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Génération PDF**: jsPDF
- **Emails**: Resend API (via Edge Functions)

## Structure du projet

```
ARK_SERVICE/
├── docs/                          # Documentation
│   ├── deployment/                # Documentation de déploiement
│   ├── features/                  # Documentation des fonctionnalités
│   ├── ARCHITECTURE.md            # Ce fichier
│   └── CLAUDE_INSTRUCTIONS.md     # Instructions pour Claude Code
│
├── scripts/                       # Scripts de déploiement
│   ├── deploy-prepare.ps1         # Préparation du déploiement
│   ├── deploy-ftp.ps1             # Upload FTP
│   └── check-deploy.ps1           # Vérification du déploiement
│
├── supabase/                      # Configuration Supabase
│   └── functions/                 # Edge Functions
│       ├── send-formation-email/  # Envoi emails formations
│       └── send-evaluation-email/ # Envoi emails évaluations
│
├── css/                           # Styles CSS
│   └── styles.css                 # Styles personnalisés
│
├── js/                            # Code JavaScript
│   ├── config/                    # Configuration
│   │   └── supabase.js            # Config client Supabase
│   │
│   ├── utils/                     # Utilitaires
│   │   ├── pdf/                   # Générateurs PDF
│   │   │   ├── shared/            # Code partagé PDF
│   │   │   ├── pdfCore.js         # Core PDF
│   │   │   ├── pdfProgramme.js    # PDF Programme
│   │   │   ├── pdfConvocation.js  # PDF Convocation
│   │   │   ├── pdfConvention.js   # PDF Convention
│   │   │   ├── pdfEmargement.js   # PDF Émargement
│   │   │   └── pdfQualiopi.js     # PDF Qualiopi
│   │   ├── dateUtils.js           # Utilitaires dates
│   │   ├── projectUtils.js        # Utilitaires projets
│   │   ├── sessionUtils.js        # Utilitaires sessions
│   │   ├── formationUtils.js      # Utilitaires formations
│   │   ├── sessionFormatUtils.js  # Formatage sessions
│   │   ├── eventBus.js            # Event bus
│   │   ├── pdfSigner.js           # Signature PDF
│   │   ├── taskWorkflowUtils.js   # Workflow tâches
│   │   └── signatureUtils.js      # Utilitaires signatures
│   │
│   ├── services/                  # Services métier
│   │   ├── email/                 # Services email
│   │   ├── documentGenerationService.js
│   │   ├── documentDataService.js
│   │   ├── documentSignatureService.js
│   │   ├── qualificationService.js
│   │   ├── devisService.js
│   │   ├── planificationService.js
│   │   └── addressAutocompleteService.js
│   │
│   ├── hooks/                     # React Hooks (organisés par domaine)
│   │   ├── auth/                  # Authentification
│   │   │   ├── useAuth.js
│   │   │   ├── useUserProfile.js
│   │   │   ├── useCurrentUserEntreprise.js
│   │   │   └── useCurrentUserRole.js
│   │   │
│   │   ├── entities/              # Entités CRUD
│   │   │   ├── useAgences.js
│   │   │   ├── useContacts.js
│   │   │   ├── useEntreprises.js
│   │   │   ├── useLogiciels.js
│   │   │   ├── useMetierPdc.js
│   │   │   ├── usePdc.js
│   │   │   ├── useServices.js
│   │   │   ├── useTypePdc.js
│   │   │   └── useUsers.js
│   │   │
│   │   ├── formations/            # Formations
│   │   │   ├── formateurs/        # Sous-module formateurs
│   │   │   ├── useEvaluation.js
│   │   │   ├── useFormateurs.js
│   │   │   ├── useFormation.js
│   │   │   └── useProjectSessions.js
│   │   │
│   │   ├── projects/              # Projets
│   │   │   ├── useProjects.js
│   │   │   ├── useTasks.js
│   │   │   └── useTaskWorkflow.js
│   │   │
│   │   ├── planning/              # Planning
│   │   │   ├── useAllPlanning.js
│   │   │   └── useUserPlanning.js
│   │   │
│   │   ├── ui/                    # Interface
│   │   │   ├── useRealtime.js
│   │   │   ├── useTemplates.js
│   │   │   └── useToaster.js
│   │   │
│   │   └── core/                  # Utilitaires génériques
│   │       ├── useSimpleCRUD.js
│   │       ├── useArkanceUsers.js
│   │       ├── useUserCompetences.js
│   │       └── useLogicielsWithCompetences.js
│   │
│   └── components/                # Composants React
│       ├── common/                # Composants communs
│       │   ├── TableView.js
│       │   ├── GroupedTableView.js
│       │   ├── SearchableDropdown.js
│       │   ├── FormationSessionPicker.js
│       │   ├── RadarChart.js
│       │   ├── SignaturePad.js
│       │   ├── Sidebar.js
│       │   └── ...
│       │
│       ├── modals/                # Modales
│       │   ├── LoginModal.js
│       │   ├── ContactModal.js
│       │   └── ...
│       │
│       ├── pages/                 # Pages (organisées par type)
│       │   ├── lists/             # Pages de liste CRUD
│       │   │   ├── AgencesPage.js
│       │   │   ├── CollaborateursPage.js
│       │   │   ├── EntreprisesPage.js
│       │   │   ├── LogicielsPage.js
│       │   │   ├── PdcPage.js
│       │   │   ├── ProjectsPage.js
│       │   │   ├── ServicesPage.js
│       │   │   ├── TasksPage.js
│       │   │   └── UsersPage.js
│       │   │
│       │   ├── details/           # Pages de détail
│       │   │   ├── EntrepriseDetailPage.js
│       │   │   ├── LogicielDetailPage.js
│       │   │   ├── PdcDetailPage.js
│       │   │   ├── ProjectDetailPage.js
│       │   │   ├── TaskDetailPage.js
│       │   │   └── UserDetailPage.js
│       │   │
│       │   ├── formation/         # Pages formation
│       │   │   ├── FormationPrepPage.js
│       │   │   ├── EvaluationFormPage.js
│       │   │   ├── EvaluationFormPreview.js
│       │   │   └── EvaluationListPage.js
│       │   │
│       │   ├── PlanningPage.js
│       │   ├── TemplateBuilderPage.js
│       │   └── AppointmentBookingPage.js
│       │
│       ├── tasks/                 # Composants tâches
│       │   └── ...
│       │
│       ├── AuthProvider.js        # Provider auth
│       └── Layout.js              # Layout principal
│
├── index.html                     # Point d'entrée
└── .editorconfig                  # Config éditeur

```

## Principes architecturaux

### 1. Séparation des préoccupations

- **Hooks** : Logique métier et gestion d'état
- **Components** : Interface utilisateur
- **Services** : Logique métier complexe partagée
- **Utils** : Fonctions utilitaires pures

### 2. Modularisation

Les gros fichiers (>1000 lignes) sont progressivement modularisés:
- Extraction de composants
- Création de sous-dossiers thématiques
- Export/Import clairs via fichiers index.js

### 3. Conventions de nommage

#### Fichiers
- **Components**: PascalCase (ex: `EvaluationListPage.js`)
- **Hooks**: camelCase avec préfixe `use` (ex: `useEvaluation.js`)
- **Services**: camelCase avec suffixe `Service` (ex: `emailService.js`)
- **Utils**: camelCase (ex: `dateUtils.js`)

#### Variables/Fonctions
- **camelCase** pour variables et fonctions
- **PascalCase** pour composants React
- **UPPER_CASE** pour constantes

### 4. Flux de données

```
User Interaction
    ↓
Component (React)
    ↓
Hook (useXXX)
    ↓
Service (si logique complexe)
    ↓
Supabase Client
    ↓
Supabase Backend (DB/Storage/Functions)
```

### 5. Gestion des emails

**Workflow actuel:**
1. Frontend génère le PDF
2. Frontend upload le PDF sur Supabase Storage
3. Frontend met à jour la DB avec l'URL du PDF
4. Frontend appelle directement l'Edge Function
5. Edge Function télécharge le PDF et l'envoie via Resend

**Pattern:**
- Pas de triggers PostgreSQL
- Appel direct depuis le frontend pour plus de contrôle
- Logs visibles et debuggables

## Modules principaux

### Authentification
- **Hook**: `useAuth.js`
- **Component**: `AuthProvider.js`, `LoginModal.js`
- **Supabase**: Auth magic link

### Formations
- **Hooks**: `useFormation.js`, `useFormateurs.js`
- **Pages**: `FormationPrepPage.js`
- **PDF**: `pdfProgramme.js`, `pdfConvocation.js`, `pdfConvention.js`, `pdfEmargement.js`
- **Email**: Edge Function `send-formation-email`

### Évaluations
- **Hook**: `useEvaluation.js`
- **Pages**: `EvaluationListPage.js`, `EvaluationFormPage.js`
- **PDF**: `pdfQualiopi.js`
- **Email**: Edge Function `send-evaluation-email`

### Templates
- **Hook**: `useTemplates.js`
- **Page**: `TemplateBuilderPage.js`
- **Logique**: Styles configurables pour les PDFs

## Patterns à suivre

### Création d'un nouveau hook

```javascript
function useMyFeature() {
    const { useState, useEffect } = React;
    const supabase = window.supabaseConfig.client;

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Méthodes CRUD...

    return {
        data,
        loading,
        error,
        // méthodes...
    };
}

window.useMyFeature = useMyFeature;
```

### Création d'un nouveau service

```javascript
class MyService {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
    }

    async doSomething(params) {
        // Logique...
    }
}

window.MyService = MyService;
```

### Création d'un composant modulaire

```javascript
function MyComponent({ prop1, prop2 }) {
    const { useState } = React;
    // Logique...

    return React.createElement('div', {},
        // Rendu...
    );
}

window.MyComponent = MyComponent;
```

## Déploiement

Voir `docs/deployment/DEPLOY.md` pour les instructions complètes.

**Commandes rapides:**
```bash
# 1. Préparation des fichiers
.\scripts\deploy-prepare.ps1

# 2. Upload FTP
.\scripts\deploy-ftp.ps1

# 3. Vérification (optionnel)
.\scripts\check-deploy.ps1
```

## Contribution

### Avant de modifier

1. Lire ce document d'architecture
2. Lire `docs/CLAUDE_INSTRUCTIONS.md` pour les instructions Claude
3. Respecter les conventions de nommage
4. Tester localement avant de committer

### Workflow Git

1. Commits atomiques
2. Messages clairs (format: `Type: Description`)
3. Types: `feat`, `fix`, `refactor`, `docs`, `style`, `test`

Exemple:
```
feat: Add email service for evaluations
refactor: Modularize useFormateurs hook
docs: Update architecture documentation
```

## Évolution future

### Court terme
- ✅ Modularisation de `useFormateurs.js`
- ✅ Modularisation de `FormationPrepPage.js`
- ✅ Modularisation de `TemplateBuilderPage.js`
- ✅ Création de helpers PDF partagés
- ✅ Création de services email

### Moyen terme
- Migration vers TypeScript (Edge Functions d'abord)
- Tests unitaires (Jest)
- CI/CD automatisé

### Long terme
- Migration vers framework moderne (Next.js/Vite)
- API REST structurée
- Tests end-to-end

## Ressources

- [Supabase Docs](https://supabase.com/docs)
- [React Docs](https://react.dev)
- [jsPDF Docs](https://github.com/parallax/jsPDF)
- [Resend API](https://resend.com/docs)
