# Template Qualiopi - Documentation

## 📋 Vue d'ensemble

Le template Qualiopi a été créé pour générer des PDF d'évaluation des acquis conformes aux exigences Qualiopi. Ce template reproduit exactement le document `template_evaluation.pdf` fourni en exemple.

## 🎯 Caractéristiques

### Structure du PDF (A4 Portrait)

1. **Header (0-30mm)**
   - Logo ARKANCE en haut à droite
   - Code de référence du plan de cours en haut à gauche (ex: PC-FOR-12132-A-ALT25-4-GENERALISTE-SPECIFIQUE)
   - Titre : "EVALUATION DES ACQUIS ET ATTEINTE DES OBJECTIFS PAR LE STAGIAIRE"

2. **Informations stagiaire (30-55mm)**
   - Nom, Prénom
   - Société, Email

3. **Tableau des compétences (55-150mm)**
   - Liste des 12 compétences
   - 3 colonnes de notation (0-5) :
     - À l'entrée en formation (auto-évaluation)
     - À la sortie de formation (auto-évaluation)
     - Évaluation par le formateur

4. **Graphique radar (150-225mm)**
   - Visualisation des 12 compétences sur 3 axes
   - Réutilise la fonction `generateRadarChartImage()` existante
   - Couleurs :
     - Rose/magenta (#EC4899) : Entrée en formation
     - Bleu clair (#3B82F6) : Sortie de formation
     - Vert (#22C55E) : Évaluation formateur

5. **Résultats (225-260mm)**
   - Moyenne de la progression du stagiaire
   - Moyenne de l'évaluation formateur
   - Statut des objectifs : ATTEINTS / PARTIELLEMENT ATTEINTS / NON ATTEINTS
     - ATTEINTS si moyenne formateur >= 4.0
     - PARTIELLEMENT ATTEINTS si moyenne formateur >= 3.0
     - NON ATTEINTS si moyenne formateur < 3.0

## 📂 Fichiers modifiés

### 1. Structure modulaire PDF (`js/utils/pdf/`)
Le code PDF a été refactorisé en modules séparés :
- **`pdfCore.js`** : Utilitaires partagés (hexToRgb, loadImageFromUrl, addImageToPdf)
- **`pdfQualiopi.js`** : Générateur PDF Qualiopi avec fonctions auxiliaires :
  - `generateQualiopiPDF()` : Fonction principale exposée via `window.generateQualiopiPDF`
  - `renderQualiopiHeader()` : Rendu du header avec logo et code de référence
  - `renderQualiopiStagiaireInfo()` : Affichage des informations du stagiaire
  - `renderQualiopiCompetencesTable()` : Création du tableau des compétences
  - `renderQualiopiRadarChart()` : Intégration du graphique radar
  - `renderQualiopiResultats()` : Calcul et affichage des résultats

### 2. `js/components/pages/TemplateBuilderPage.js`
- Ajout du type de document "qualiopi" dans la liste `documentTypes`
- Ajout du cas `case 'qualiopi'` dans le `switch` de génération
- Création de la fonction `getDefaultQualiopiData()` pour les données d'exemple
- Utilise `window.generateQualiopiPDF()` exposé par le module

### 3. `js/components/pages/EvaluationListPage.js`
- Ajout de la fonction `handleExportQualiopi()` pour l'export PDF Qualiopi
- Modification de `createDetailView()` pour ajouter un bouton "PDF Qualiopi" (vert)
- Le bouton "PDF Évaluation" (bleu) reste disponible pour l'ancien format

## 🔧 Structure des données

```javascript
{
  stagiaire_nom: "NION",
  stagiaire_prenom: "Emmanuel",
  stagiaire_societe: "Valdepharm",
  stagiaire_email: "enion.valdepharm@fareva.com",
  formation: {
    pdc: {
      ref: "PC-FOR-12132-A-ALT25-4-GENERALISTE-SPECIFIQUE"
    },
    prj: "PRJ-2025-001"
  },
  qualiopi_themes: {
    theme_1: { 
      titre: "Comprendre l'interface d'AutoCAD", 
      avant: 0, 
      apres: 4 
    },
    // ... themes 2-12
  },
  qualiopi_formateur_themes: {
    theme_1: { note: 5 },
    // ... themes 2-12
  }
}
```

## 🎨 Personnalisation via Template Builder

Le template Qualiopi peut être personnalisé dans le Template Builder avec les paramètres suivants :

- **Logo Header** : Logo ARKANCE en haut à droite
- **Couleurs** :
  - `primaryColor` : Couleur principale (bleu ARKANCE par défaut)
  - `grayColor` : Couleur du texte secondaire
  - `lightGrayColor` : Couleur du texte tertiaire
- **Tailles de police** :
  - `titleSize` : Taille du titre (14pt par défaut)
  - `textSize` : Taille du texte normal (9pt)
  - `labelSize` : Taille des labels (8pt)
  - `tableHeaderSize` : Taille de l'en-tête du tableau (8pt)
  - `tableCellSize` : Taille des cellules du tableau (7pt)

## 🚀 Utilisation

### 1. Prévisualisation dans Template Builder

1. Aller dans "Template Builder"
2. Sélectionner "Évaluation Qualiopi" dans le menu déroulant
3. Personnaliser les paramètres si nécessaire
4. Cliquer sur "Générer Aperçu" pour voir le PDF

### 2. Export depuis la liste des évaluations

1. Aller dans "Évaluations"
2. Cliquer sur une évaluation pour voir les détails
3. Cliquer sur le bouton vert "PDF Qualiopi" pour générer et télécharger

## 📊 Calculs automatiques

Les moyennes sont calculées automatiquement :

```javascript
// Moyenne progression stagiaire
moyenne_progression = sum((apres - avant) pour tous les themes) / nombre_themes

// Moyenne évaluation formateur
moyenne_formateur = sum(note_formateur pour tous les themes) / nombre_themes

// Statut objectifs
if (moyenne_formateur >= 4.0) → ATTEINTS
else if (moyenne_formateur >= 3.0) → PARTIELLEMENT ATTEINTS
else → NON ATTEINTS
```

## ✅ Conformité Qualiopi

Ce template est conçu pour répondre aux exigences Qualiopi concernant :
- L'évaluation des acquis du stagiaire à l'entrée et à la sortie de formation
- L'évaluation par le formateur de la progression des connaissances
- La documentation de l'atteinte des objectifs pédagogiques

## 🔍 Tests recommandés

1. **Test avec données réelles** : Générer un PDF avec une vraie évaluation
2. **Test graphique radar** : Vérifier que toutes les compétences s'affichent correctement
3. **Test logo** : Vérifier que le logo ARKANCE s'affiche en haute qualité
4. **Test calculs** : Vérifier que les moyennes et le statut sont corrects

## 📝 Notes importantes

- Le code de référence (`ref`) provient directement de la base de données (champ `pdc.ref`)
- Le graphique radar réutilise Chart.js via la fonction existante `generateRadarChartImage()`
- Pas de footer dans ce template (contrairement aux autres templates)
- Format A4 portrait uniquement

## 🐛 Dépannage

### Le PDF ne se génère pas
- Vérifier que jsPDF est chargé : `console.log(window.jsPDF)`
- Vérifier que Chart.js est chargé : `console.log(typeof Chart)`
- Vérifier les erreurs dans la console du navigateur

### Le logo ne s'affiche pas
- Vérifier l'URL du logo dans Supabase Storage
- Vérifier les permissions sur le bucket `logos`

### Le graphique radar est vide
- Vérifier que `qualiopi_themes` contient des données
- Vérifier que les valeurs `avant` et `apres` sont des nombres (0-5)

## 🔗 Ressources

- Document de référence : `template_evaluation.pdf`
- **Code principal** :
  - `js/utils/pdf/pdfCore.js` : Utilitaires partagés
  - `js/utils/pdf/pdfQualiopi.js` : Générateur PDF Qualiopi
- Interface d'export : `js/components/pages/EvaluationListPage.js`
- Template Builder : `js/components/pages/TemplateBuilderPage.js`
- **Chargement** : Scripts chargés dans `index.html` (lignes 57-63)
