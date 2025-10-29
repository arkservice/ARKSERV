// Utilitaires pour parser les fichiers CSV d'import d'évaluations de formation
(function() {
    'use strict';

/**
 * Parse une ligne CSV en tenant compte des guillemets
 * @param {string} line - Ligne CSV
 * @param {string} delimiter - Délimiteur (virgule ou point-virgule)
 * @returns {Array} - Tableau de valeurs
 */
function parseCSVLine(line, delimiter) {
    const values = [];
    let currentValue = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
            // Gérer les guillemets doublés ("") comme un guillemet littéral
            if (insideQuotes && nextChar === '"') {
                currentValue += '"';
                i++; // Sauter le prochain guillemet
            } else {
                // Basculer l'état des guillemets
                insideQuotes = !insideQuotes;
            }
        } else if (char === delimiter && !insideQuotes) {
            // Nouvelle valeur (seulement si on n'est pas entre guillemets)
            values.push(currentValue.trim());
            currentValue = '';
        } else {
            currentValue += char;
        }
    }

    // Ajouter la dernière valeur
    values.push(currentValue.trim());

    return values;
}

/**
 * Extrait la première ligne logique du CSV (jusqu'au premier \n hors guillemets)
 * @param {string} csvContent - Contenu brut du CSV
 * @returns {string} - Première ligne logique
 */
function extractFirstLogicalLine(csvContent) {
    let insideQuotes = false;
    let firstLine = '';

    for (let i = 0; i < csvContent.length; i++) {
        const char = csvContent[i];
        const nextChar = csvContent[i + 1];

        if (char === '"') {
            if (insideQuotes && nextChar === '"') {
                // Guillemet échappé ""
                firstLine += '""';
                i++; // Sauter le prochain guillemet
            } else {
                // Basculer l'état des guillemets
                insideQuotes = !insideQuotes;
                firstLine += char;
            }
        } else if ((char === '\n' || (char === '\r' && nextChar === '\n') || char === '\r') && !insideQuotes) {
            // Fin de la première ligne logique (hors guillemets)
            break;
        } else {
            firstLine += char;
        }
    }

    return firstLine;
}

/**
 * Détecte le délimiteur utilisé dans le CSV
 * @param {string} csvContent - Contenu brut du CSV
 * @returns {string} - Délimiteur détecté (',', ';' ou '\t')
 */
function detectDelimiter(csvContent) {
    // Extraire la première ligne logique (respecte les guillemets)
    const firstLine = extractFirstLogicalLine(csvContent);

    // Compter les virgules, points-virgules et tabulations hors guillemets
    let commaCount = 0;
    let semicolonCount = 0;
    let tabCount = 0;
    let insideQuotes = false;

    for (let i = 0; i < firstLine.length; i++) {
        const char = firstLine[i];
        const nextChar = firstLine[i + 1];

        if (char === '"') {
            if (insideQuotes && nextChar === '"') {
                // Guillemet échappé ""
                i++; // Sauter le prochain
            } else {
                insideQuotes = !insideQuotes;
            }
        } else if (!insideQuotes) {
            if (char === ',') commaCount++;
            if (char === ';') semicolonCount++;
            if (char === '\t') tabCount++;
        }
    }

    // Retourner le délimiteur le plus fréquent
    if (tabCount > commaCount && tabCount > semicolonCount) return '\t';
    return commaCount > semicolonCount ? ',' : ';';
}

/**
 * Parse un fichier CSV avec délimiteur virgule ou point-virgule
 * Gère correctement les sauts de ligne à l'intérieur des cellules entre guillemets
 * @param {string} csvContent - Contenu brut du fichier CSV
 * @returns {Array} - Tableau d'objets représentant les lignes
 */
function parseCSV(csvContent) {
    // Nettoyer le BOM UTF-8 s'il existe
    if (csvContent.charCodeAt(0) === 0xFEFF) {
        csvContent = csvContent.substring(1);
    }

    // Détecter automatiquement le délimiteur
    const delimiter = detectDelimiter(csvContent);
    const delimiterName = delimiter === '\t' ? 'TAB' : delimiter;
    console.log(`[CSV Evaluation Parser] Délimiteur détecté: "${delimiterName}"`);

    // Parser caractère par caractère en respectant les guillemets
    const rows = [];
    let currentRow = [];
    let currentCell = '';
    let insideQuotes = false;
    let i = 0;

    while (i < csvContent.length) {
        const char = csvContent[i];
        const nextChar = csvContent[i + 1];

        if (char === '"') {
            if (insideQuotes && nextChar === '"') {
                // Guillemet échappé ("") → ajouter un seul guillemet
                currentCell += '"';
                i++; // Sauter le prochain guillemet
            } else {
                // Basculer l'état des guillemets
                insideQuotes = !insideQuotes;
            }
        } else if (char === delimiter && !insideQuotes) {
            // Fin de cellule (hors guillemets)
            currentRow.push(currentCell.trim());
            currentCell = '';
        } else if (char === '\r' && nextChar === '\n' && !insideQuotes) {
            // Fin de ligne Windows (\r\n) hors guillemets
            currentRow.push(currentCell.trim());
            if (currentRow.some(cell => cell !== '')) {
                rows.push(currentRow);
            }
            currentRow = [];
            currentCell = '';
            i++; // Sauter le \n
        } else if (char === '\n' && !insideQuotes) {
            // Fin de ligne Unix (\n) hors guillemets
            currentRow.push(currentCell.trim());
            if (currentRow.some(cell => cell !== '')) {
                rows.push(currentRow);
            }
            currentRow = [];
            currentCell = '';
        } else if (char === '\r' && !insideQuotes) {
            // Fin de ligne Mac (\r) hors guillemets
            currentRow.push(currentCell.trim());
            if (currentRow.some(cell => cell !== '')) {
                rows.push(currentRow);
            }
            currentRow = [];
            currentCell = '';
        } else {
            // Caractère normal (ou saut de ligne DANS des guillemets)
            currentCell += char;
        }

        i++;
    }

    // Ajouter la dernière cellule/ligne si elle existe
    if (currentCell || currentRow.length > 0) {
        currentRow.push(currentCell.trim());
        if (currentRow.some(cell => cell !== '')) {
            rows.push(currentRow);
        }
    }

    if (rows.length < 2) {
        throw new Error('Le fichier CSV doit contenir au moins une ligne d\'en-tête et une ligne de données');
    }

    // Première ligne = en-têtes
    const headers = rows[0];
    console.log(`[CSV Evaluation Parser] ${headers.length} colonnes détectées`);

    // Convertir les lignes en objets
    const data = [];
    for (let i = 1; i < rows.length; i++) {
        const values = rows[i];
        const row = {};

        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });

        data.push(row);
    }

    console.log(`[CSV Evaluation Parser] ${data.length} lignes parsées`);
    return data;
}

/**
 * Extrait le nom de l'entreprise depuis le code CUST
 * @param {string} custString - Ex: "CUST67221 EIFFAGE GENIE CIVIL (Vélizy)"
 * @returns {string} - Ex: "EIFFAGE GENIE CIVIL"
 */
function extractCompanyName(custString) {
    if (!custString) return '';

    // Retirer le code CUST et les informations entre parenthèses
    let name = custString.replace(/^CUST\d+\s*/i, '').trim();

    // Retirer les informations entre parenthèses à la fin (ex: "(Vélizy)")
    name = name.replace(/\s*\([^)]*\)\s*$/, '').trim();

    return name;
}

/**
 * Extrait le nom et prénom depuis un email
 * Gère les variations de domaine (arkance-systems.com, arkance.world)
 * @param {string} email - Ex: "jean-philippe.gelebart@arkance-systems.com"
 * @returns {Object} - {prenom: "Jean-Philippe", nom: "Gelebart", fullName: "Jean-Philippe Gelebart"}
 */
function extractNameFromEmail(email) {
    if (!email) return null;

    // Extraire la partie avant @
    const localPart = email.split('@')[0];
    if (!localPart) return null;

    // Séparer par . uniquement (pour prénom.nom) et capitaliser en conservant les tirets
    const parts = localPart.split('.').map(part => {
        if (!part) return '';
        // Capitaliser chaque mot séparé par un tiret (pour les prénoms composés)
        return part.split('-').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join('-');
    });

    if (parts.length < 2) return null;

    // Premier élément = prénom, reste = nom
    const prenom = parts[0];
    const nom = parts.slice(1).join(' ');

    return {
        prenom,
        nom,
        fullName: `${prenom} ${nom}`
    };
}

/**
 * Convertit une note textuelle en note numérique (1-5)
 * @param {string} noteText - Ex: "Très bien", "Bien", "Moyen", "Mauvais", "Très mauvais"
 * @returns {number|null} - Note de 1 à 5, ou null si vide/invalide
 */
function convertTextToNote(noteText) {
    if (!noteText || noteText.trim() === '') return null;

    const noteUpper = noteText.toUpperCase().trim();

    // Mapping des notes textuelles (5 niveaux)
    const noteMap = {
        'TRÈS BIEN': 5,
        'TRES BIEN': 5,
        'BIEN': 4,
        'MOYEN': 3,
        'MAUVAIS': 2,
        'TRÈS MAUVAIS': 1,
        'TRES MAUVAIS': 1
    };

    return noteMap[noteUpper] || null;
}

/**
 * Convertit une note sur échelle 1-10 en échelle 1-5
 * Mapping intelligent pour conserver les nuances des évaluations
 * @param {number|string} note10 - Note sur 10 (peut être string ou number)
 * @returns {number|null} - Note sur 5, ou null si invalide/vide
 */
function mapScale10To5(note10) {
    if (!note10 || note10 === '') return null;

    const value = parseInt(note10, 10);
    if (isNaN(value) || value < 1 || value > 10) return null;

    // Mapping intelligent : 1-2→1, 3-4→2, 5-6→3, 7-8→4, 9-10→5
    if (value <= 2) return 1;
    if (value <= 4) return 2;
    if (value <= 6) return 3;
    if (value <= 8) return 4;
    return 5;
}

/**
 * Parse une date française (DD/MM/YYYY ou DD-MM-YY)
 * @param {string} dateStr - Ex: "01-07-25" ou "07/01/2025"
 * @returns {Date|null}
 */
function parseDate(dateStr) {
    if (!dateStr) return null;

    // Format 1: DD/MM/YYYY ou DD-MM-YYYY ou DD-MM-YY
    let parts = dateStr.trim().split(/[/-]/);

    if (parts.length !== 3) return null;

    let day = parseInt(parts[0], 10);
    let month = parseInt(parts[1], 10) - 1; // Les mois commencent à 0
    let year = parseInt(parts[2], 10);

    // Si l'année est sur 2 chiffres, on suppose 20XX
    if (year < 100) {
        year += 2000;
    }

    const date = new Date(year, month, day);
    if (isNaN(date.getTime())) return null;

    return date;
}

/**
 * Parse une date américaine (MM-DD-YY)
 * Utilisée spécifiquement pour la colonne "Date de saisie" du CSV d'évaluations
 * @param {string} dateStr - Ex: "01-17-25" (17 janvier 2025)
 * @returns {Date|null}
 */
function parseDateSaisie(dateStr) {
    if (!dateStr) return null;

    // Format américain: MM-DD-YY ou MM/DD/YY
    let parts = dateStr.trim().split(/[/-]/);

    if (parts.length !== 3) return null;

    let month = parseInt(parts[0], 10) - 1; // Les mois commencent à 0 en JavaScript
    let day = parseInt(parts[1], 10);
    let year = parseInt(parts[2], 10);

    // Si l'année est sur 2 chiffres, on suppose 20XX
    if (year < 100) {
        year += 2000;
    }

    const date = new Date(year, month, day);
    if (isNaN(date.getTime())) return null;

    return date;
}

/**
 * Parse les dates de formation depuis une chaîne
 * Gère les formats: "06/01/2025 - 07/01/2025" ou "06/01/2025 - 07/01/2025 - 08/01/2025"
 * @param {string} datesString - Ex: "06/01/2025 - 07/01/2025 - 08/01/2025"
 * @returns {Array<Date>} - Tableau de dates parsées
 */
function parseFormationDates(datesString) {
    if (!datesString) return [];

    // Séparer par " - " et parser chaque date
    const dateStrings = datesString.split(/\s*-\s*/).map(s => s.trim()).filter(s => s.length > 0);

    const dates = dateStrings
        .map(str => parseDate(str))
        .filter(d => d !== null)
        .sort((a, b) => a - b); // Trier par ordre chronologique

    return dates;
}

/**
 * Sépare le nom complet en prénom et nom
 * Gestion intelligente de "NOM PRENOM" (tout majuscule) vs "Prénom Nom" (casse mixte)
 * @param {string} fullName - Ex: "LETELLIER THOMAS" ou "Thomas Letellier"
 * @returns {Object} - {prenom: string, nom: string}
 */
function separateNameParts(fullName) {
    if (!fullName) return { prenom: '', nom: '' };

    const parts = fullName.trim().split(/\s+/);

    if (parts.length === 0) {
        return { prenom: '', nom: '' };
    } else if (parts.length === 1) {
        return { prenom: parts[0], nom: '' };
    } else {
        // Si tout en majuscules, on suppose NOM PRENOM
        const isAllUpperCase = fullName === fullName.toUpperCase();

        if (isAllUpperCase) {
            // Format "NOM PRENOM" → inverser
            const nom = parts[0];
            const prenom = parts.slice(1).join(' ');
            return { prenom, nom };
        } else {
            // Format "Prénom Nom" → ordre normal
            const prenom = parts[0];
            const nom = parts.slice(1).join(' ');
            return { prenom, nom };
        }
    }
}

/**
 * Parse une ligne d'évaluation complète
 * @param {Object} row - Ligne CSV brute
 * @returns {Object} - Données structurées
 */
function parseEvaluationRow(row) {
    // Extraction des métadonnées
    const prj = (row['PRJ'] || '').trim();
    const companyName = extractCompanyName(row['CUST'] || '');
    const dateSaisie = parseDate(row['Date de saisie'] || ''); // Format français DD/MM/YYYY
    const formationDates = parseFormationDates(row['Dates'] || ''); // Format français DD/MM/YYYY

    // Extraction des métadonnées pour enrichissement projet
    const logiciel = (row['Logiciel'] || '').trim() || null;
    const dureeHeures = (row['durée'] || row['durée (h)'] || '').trim() || null;

    // Extraction formateur et commercial
    const formateurInfo = extractNameFromEmail(row['Email du formateur'] || '');
    const commercialInfo = extractNameFromEmail(row['Email du commercial'] || '');

    // Extraction stagiaire
    const stagiaireFullName = row['Nom et Prénom'] || '';
    const stagiaireParts = separateNameParts(stagiaireFullName);
    const civilite = row['Madame/ Monsieur'] || '';

    // Questions organisation (notes 1-5)
    const orgCommunication = convertTextToNote(row['Communication des objectifs et du programme avant la formation']);
    const orgDuree = convertTextToNote(row['Durée de la formation']);
    // Gestion colonne cassée : "Composition du groupe (nombre de participants, niveaux homogènes" OU "Composition du groupe (nombre de participants"
    const orgComposition = convertTextToNote(
        row['Composition du groupe (nombre de participants, niveaux homogènes'] ||
        row['Composition du groupe (nombre de participants']
    );
    const orgRespect = convertTextToNote(row['Respect des engagements']);
    const orgCommentaires = row['Vos commentaires concernant l\'organisation'] || '';

    // Questions moyens (notes 1-5)
    const moyensLocaux = convertTextToNote(row['Les locaux (si formation en agence Arkance Systems)']);
    const moyensMateriel = convertTextToNote(row['Le matériel informatique (si fourni par Arkance Systems)']);
    const moyensSupports = convertTextToNote(row['Les supports mis à disposition']);
    const moyensDistance = convertTextToNote(row['La formation à distance (si vous étiez dans cette configuration)']);
    const moyensRestauration = convertTextToNote(row['La restauration (si prise en charge par Arkance Systems)']);
    const moyensCommentaires = row['Vos commentaires concernant les moyens'] || '';

    // Questions pédagogie (notes 1-5)
    const pedaDifficulte = convertTextToNote(row['Niveau de difficulté']);
    const pedaRythme = convertTextToNote(row['Rythme de la progression']);
    const pedaTheorique = convertTextToNote(row['Qualité du contenu théorique']);
    // Gestion colonne cassée : "Qualité du contenu pratique (exercices, cas d'usages, exemples...etc)" OU "Qualité du contenu pratique (exercices"
    const pedaPratique = convertTextToNote(
        row['Qualité du contenu pratique (exercices, cas d\'usages, exemples...etc)'] ||
        row['Qualité du contenu pratique (exercices']
    );
    const pedaConnaissance = convertTextToNote(row['Connaissance du formateur de votre métier']);
    const pedaApproche = convertTextToNote(row['Qualité de l\'approche pédagogique du formateur']);
    const pedaEcoute = convertTextToNote(row['Ecoute et disponibilité du formateur']);
    const pedaAnimation = convertTextToNote(row['Animation du formateur']);
    const pedaCommentaires = row['Vos commentaires concernant la pédagogie'] || '';

    // Questions satisfaction (notes 1-10 converties en 1-5)
    const satisfAttentes = mapScale10To5(row['La formation a-t-elle répondu à vos attentes initiales ?']);
    const satisfObjectifs = mapScale10To5(row['Pensez-vous avoir atteint les objectifs pédagogiques prévus lors de la formation ?']);
    const satisfAdequation = mapScale10To5(row['Estimez-vous que la formation était en adéquation avec le métier ou les réalités du secteur ?']);
    const satisfRecommandation = mapScale10To5(row['Recommanderiez-vous notre service à un ami ou un collègue ?']);
    const satisfGlobal = mapScale10To5(row['Quel est votre niveau de satisfaction globale ?']);
    const satisfCommentaires = row['Vos commentaires concernant votre satisfaction'] || '';
    const satisfBesoinComplementaire = row['Ressentez-vous le besoin d\'une formation complémentaire ou d\'un accompagnement spécifique ? Si oui, merci de préciser ?'] || '';

    return {
        // Métadonnées
        prj,
        companyName,
        dateSaisie,
        formationDates,
        logiciel,
        dureeHeures,

        // Formateur
        formateurEmail: row['Email du formateur'] || '',
        formateurPrenom: formateurInfo?.prenom || '',
        formateurNom: formateurInfo?.nom || '',
        formateurFullName: formateurInfo?.fullName || '',

        // Commercial
        commercialEmail: row['Email du commercial'] || '',
        commercialPrenom: commercialInfo?.prenom || '',
        commercialNom: commercialInfo?.nom || '',
        commercialFullName: commercialInfo?.fullName || '',

        // Stagiaire
        stagiaireCivilite: civilite,
        stagiairePrenom: stagiaireParts.prenom,
        stagiaireNom: stagiaireParts.nom,
        stagiaireFonction: row['Fonction'] || '',
        stagiaireEmail: row['Email'] || '',
        stagiaireSociete: companyName,

        // Evaluation - Organisation
        orgCommunicationObjectifs: orgCommunication,
        orgDureeFormation: orgDuree,
        orgCompositionGroupe: orgComposition,
        orgRespectEngagements: orgRespect,
        orgCommentaires,

        // Evaluation - Moyens
        moyensEvaluationLocaux: moyensLocaux,
        moyensMaterielInformatique: moyensMateriel,
        moyensSupportCours: moyensSupports,
        moyensFormationDistance: moyensDistance,
        moyensRestauration: moyensRestauration,
        moyensCommentaires,

        // Evaluation - Pédagogie
        pedaNiveauDifficulte: pedaDifficulte,
        pedaRythmeProgression: pedaRythme,
        pedaQualiteContenuTheorique: pedaTheorique,
        pedaQualiteContenuPratique: pedaPratique,
        pedaConnaissanceFormateur: pedaConnaissance,
        pedaApprochePedagogique: pedaApproche,
        pedaEcouteDisponibilite: pedaEcoute,
        pedaAnimationFormateur: pedaAnimation,
        pedaCommentaires,

        // Evaluation - Satisfaction
        satisfReponduAttentes: satisfAttentes,
        satisfAtteintObjectifs: satisfObjectifs,
        satisfAdequationMetier: satisfAdequation,
        satisfRecommandation: satisfRecommandation,
        satisfNiveauGlobal: satisfGlobal,
        satisfCommentaires,
        satisfBesoinFormationComplementaire: satisfBesoinComplementaire,

        // Ligne brute pour debug
        rawRow: row
    };
}

/**
 * Valide les données d'une ligne CSV d'évaluation
 * @param {Object} row - Ligne de données
 * @returns {Object} - {valid: boolean, errors: Array, warnings: Array}
 */
function validateEvaluationRow(row) {
    const errors = [];
    const warnings = [];

    // Vérifications critiques (erreurs)
    if (!row['PRJ'] || !row['PRJ'].trim()) {
        errors.push('PRJ manquant');
    }

    if (!row['CUST'] || !extractCompanyName(row['CUST'])) {
        errors.push('CUST manquant ou invalide');
    }

    if (!row['Nom et Prénom'] || !row['Nom et Prénom'].trim()) {
        errors.push('Nom et prénom du stagiaire manquant');
    }

    if (!row['Email'] || !row['Email'].trim()) {
        errors.push('Email du stagiaire manquant');
    }

    // Vérifications non-critiques (avertissements)
    if (!row['Email du formateur']) {
        warnings.push('Email du formateur manquant');
    }

    if (!row['Email du commercial']) {
        warnings.push('Email du commercial manquant');
    }

    if (!row['Dates']) {
        warnings.push('Dates de formation manquantes');
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Crée une clé unique basée sur toutes les valeurs de la ligne CSV
 * @param {Object} row - Une ligne CSV (objet avec colonnes comme clés)
 * @returns {string} - Clé unique représentant toutes les valeurs
 */
function createFullRowKey(row) {
    // Obtenir toutes les valeurs de l'objet et les concaténer
    // Normaliser les espaces et la casse pour une comparaison cohérente
    const values = Object.values(row);
    return values.map(cell =>
        (cell || '').toString().trim().toLowerCase()
    ).join('|');
}

/**
 * Détecte les doublons d'évaluations (lignes complètement identiques)
 * @param {Array} rows - Lignes CSV parsées
 * @returns {Object} - {duplicates: Array, uniqueRows: Array}
 */
function detectDuplicates(rows) {
    const evaluationMap = new Map();
    const duplicates = [];

    rows.forEach((row, index) => {
        const parsed = parseEvaluationRow(row);
        // Créer une clé basée sur TOUTES les valeurs de la ligne
        const key = createFullRowKey(row);

        if (evaluationMap.has(key)) {
            // Doublon détecté (ligne complètement identique)
            const firstOccurrence = evaluationMap.get(key);

            let duplicateGroup = duplicates.find(d => d.key === key);

            if (!duplicateGroup) {
                duplicateGroup = {
                    key,
                    prj: parsed.prj,
                    stagiairePrenom: parsed.stagiairePrenom,
                    stagiaireNom: parsed.stagiaireNom,
                    stagiaireEmail: parsed.stagiaireEmail,
                    rows: [firstOccurrence]
                };
                duplicates.push(duplicateGroup);
            }

            duplicateGroup.rows.push({
                index: index + 2, // +2 car ligne 1 = header, et index commence à 0
                data: row
            });
        } else {
            evaluationMap.set(key, {
                index: index + 2,
                data: row
            });
        }
    });

    // Récupérer les lignes uniques (sans doublons)
    const uniqueRows = Array.from(evaluationMap.values()).map(item => item.data);

    return {
        duplicates,
        uniqueRows: duplicates.length > 0 ? uniqueRows : rows
    };
}

// Export global
window.csvEvaluationParser = {
    parseCSV,
    extractCompanyName,
    extractNameFromEmail,
    convertTextToNote,
    mapScale10To5,
    parseDate,
    parseDateSaisie,
    parseFormationDates,
    separateNameParts,
    parseEvaluationRow,
    validateEvaluationRow,
    detectDuplicates
};

})();
