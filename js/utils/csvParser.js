// Utilitaires pour parser les fichiers CSV d'import de projets
(function() {
    'use strict';

/**
 * Parse un fichier CSV avec délimiteur point-virgule
 * @param {string} csvContent - Contenu brut du fichier CSV
 * @returns {Array} - Tableau d'objets représentant les lignes
 */
function parseCSV(csvContent) {
    const lines = csvContent.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
        throw new Error('Le fichier CSV doit contenir au moins une ligne d\'en-tête et une ligne de données');
    }

    // Nettoyer le BOM UTF-8 s'il existe
    const firstLine = lines[0].replace(/^\uFEFF/, '');
    const headers = firstLine.split(';').map(h => h.trim());

    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        const values = line.split(';');
        const row = {};

        headers.forEach((header, index) => {
            row[header] = values[index] ? values[index].trim() : '';
        });

        data.push(row);
    }

    return data;
}

/**
 * Extrait le numéro du PRJ
 * @param {string} prjString - Ex: "PRJ15626"
 * @returns {string} - Ex: "15626"
 */
function extractPRJNumber(prjString) {
    if (!prjString) return '';
    const match = prjString.match(/PRJ(\d+)/i);
    return match ? match[1] : '';
}

/**
 * Extrait le nom de l'entreprise en retirant le code CUST
 * @param {string} customerString - Ex: "CUST195093 AURIGE"
 * @returns {string} - Ex: "AURIGE"
 */
function extractCompanyName(customerString) {
    if (!customerString) return '';
    // Retirer le code CUST suivi de chiffres et espaces
    return customerString.replace(/^CUST\d+\s*:?\s*\d*\s*/i, '').trim();
}

/**
 * Extrait le numéro de PDC depuis le champ "Link to Documents"
 * @param {string} linkString - Ex: "GE0004-PC-FOR-11553-A-ACA25-5-GENERALISTE-BASE"
 * @returns {string|null} - Ex: "11553"
 */
function extractPDCNumber(linkString) {
    if (!linkString) return null;
    const match = linkString.match(/FOR-(\d+)/i);
    return match ? match[1] : null;
}

/**
 * Parse une date française (JJ/MM/AAAA)
 * @param {string} dateStr - Ex: "27/10/2025"
 * @returns {Date|null}
 */
function parseDate(dateStr) {
    if (!dateStr) return null;
    const parts = dateStr.trim().split('/');
    if (parts.length !== 3) return null;

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Les mois commencent à 0
    const year = parseInt(parts[2], 10);

    const date = new Date(year, month, day);
    if (isNaN(date.getTime())) return null;

    return date;
}

/**
 * Parse une chaîne de dates et les groupe en sessions
 * Une session = groupe de dates consécutives (écart <= 2 jours)
 * @param {string} datesString - Ex: "09/10/2025 - 10/10/2025 - 13/10/2025 - 14/10/2025"
 * @returns {Array<Array<Date>>} - Ex: [[Date(09/10), Date(10/10)], [Date(13/10), Date(14/10)]]
 */
function parseTrainingDatesIntoSessions(datesString) {
    if (!datesString) return [];

    // Séparer par " - " (avec espaces) et parser chaque date
    // Regex pour gérer les variations d'espaces autour du tiret ET tous les types de tirets
    // \u002D = tiret normal (-), \u2013 = en dash (–), \u2014 = em dash (—)
    const dateStrings = datesString.split(/\s*[\u002D\u2013\u2014]\s*/).map(s => s.trim()).filter(s => s.length > 0);

    console.log(`[CSV Parser] Dates brutes: "${datesString}"`);
    console.log(`[CSV Parser] Dates après split: ${dateStrings.length} dates trouvées`, dateStrings);

    const dates = dateStrings
        .map((str, index) => {
            const parsed = parseDate(str);
            if (!parsed) {
                console.warn(`[CSV Parser] Impossible de parser la date "${str}" (index ${index})`);
            }
            return parsed;
        })
        .filter(d => d !== null)
        .sort((a, b) => a - b); // Trier par ordre chronologique

    console.log(`[CSV Parser] Dates parsées avec succès: ${dates.length} dates`);

    if (dates.length === 0) return [];

    // Grouper en sessions (écart > 2 jours = nouvelle session)
    const sessions = [];
    let currentSession = [dates[0]];

    for (let i = 1; i < dates.length; i++) {
        const prevDate = dates[i - 1];
        const currentDate = dates[i];

        // Calculer l'écart en jours
        const diffMs = currentDate - prevDate;
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        if (diffDays <= 2) {
            // Dates consécutives ou proches, même session
            currentSession.push(currentDate);
        } else {
            // Écart > 2 jours, nouvelle session
            sessions.push(currentSession);
            currentSession = [currentDate];
        }
    }

    // Ajouter la dernière session
    if (currentSession.length > 0) {
        sessions.push(currentSession);
    }

    return sessions;
}

/**
 * Parse les horaires de formation
 * @param {string} hoursString - Ex: "09h00 à 12h00 et de 13h00 à 17h00 tous les jours"
 * @returns {Object} - {startTime: "09:00", endTime: "17:00"}
 */
function parseTrainingHours(hoursString) {
    if (!hoursString) {
        return { startTime: '09:00', endTime: '17:00' };
    }

    // Pattern pour extraire les heures (ex: 09h00, 17h00)
    const timeRegex = /(\d{1,2})h(\d{2})/g;
    const matches = [...hoursString.matchAll(timeRegex)];

    if (matches.length === 0) {
        return { startTime: '09:00', endTime: '17:00' };
    }

    // Première heure trouvée = heure de début
    const startHour = matches[0][1].padStart(2, '0');
    const startMin = matches[0][2];
    const startTime = `${startHour}:${startMin}`;

    // Dernière heure trouvée = heure de fin
    const lastMatch = matches[matches.length - 1];
    const endHour = lastMatch[1].padStart(2, '0');
    const endMin = lastMatch[2];
    const endTime = `${endHour}:${endMin}`;

    return { startTime, endTime };
}

/**
 * Combine une date et une heure
 * @param {Date} date
 * @param {string} time - Format "HH:MM"
 * @returns {Date}
 */
function combineDateAndTime(date, time) {
    const [hours, minutes] = time.split(':').map(n => parseInt(n, 10));
    const combined = new Date(date);
    combined.setHours(hours, minutes, 0, 0);
    return combined;
}

/**
 * Formate une date en français
 * @param {Date} date
 * @returns {string} - Ex: "27/10/2025"
 */
function formatDateFr(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

/**
 * Détecte les doublons de PRJ dans les données CSV
 * @param {Array} rows - Données parsées du CSV
 * @returns {Object} - {duplicates: Array, uniqueRows: Array}
 */
function detectDuplicates(rows) {
    const prjMap = new Map();
    const duplicates = [];

    rows.forEach((row, index) => {
        const prjNumber = extractPRJNumber(row.ID || '');

        if (!prjNumber) {
            console.warn(`Ligne ${index + 2} : PRJ invalide ou manquant`);
            return;
        }

        if (prjMap.has(prjNumber)) {
            // Doublon détecté
            const firstOccurrence = prjMap.get(prjNumber);

            // Vérifier si ce doublon est déjà dans la liste
            let duplicateGroup = duplicates.find(d => d.prj === prjNumber);

            if (!duplicateGroup) {
                duplicateGroup = {
                    prj: prjNumber,
                    rows: [firstOccurrence]
                };
                duplicates.push(duplicateGroup);
            }

            duplicateGroup.rows.push({
                index: index + 2, // +2 car ligne 1 = header, et index commence à 0
                data: row
            });
        } else {
            prjMap.set(prjNumber, {
                index: index + 2,
                data: row
            });
        }
    });

    // Récupérer les lignes uniques (sans doublons)
    const uniqueRows = Array.from(prjMap.values()).map(item => item.data);

    return {
        duplicates,
        uniqueRows: duplicates.length > 0 ? [] : uniqueRows // Si doublons, on retourne rien
    };
}

/**
 * Valide les données d'une ligne CSV
 * @param {Object} row - Ligne de données
 * @returns {Object} - {valid: boolean, errors: Array}
 */
function validateRow(row) {
    const errors = [];

    if (!row.ID || !extractPRJNumber(row.ID)) {
        errors.push('ID (PRJ) manquant ou invalide');
    }

    if (!row.Customer || !extractCompanyName(row.Customer)) {
        errors.push('Customer manquant ou invalide');
    }

    if (!row.Software) {
        errors.push('Software manquant');
    }

    if (!row['Training Dates']) {
        errors.push('Training Dates manquant');
    }

    if (!row['Training Location']) {
        errors.push('Training Location manquant');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Parse une ligne CSV complète et extrait toutes les informations nécessaires
 * @param {Object} row - Ligne de données brutes
 * @returns {Object} - Données structurées et prêtes pour l'import
 */
function parseProjectRow(row) {
    const prjNumber = extractPRJNumber(row.ID || '');
    const companyName = extractCompanyName(row.Customer || '');
    const pdcNumber = extractPDCNumber(row['Link to Documents'] || '');
    const sessions = parseTrainingDatesIntoSessions(row['Training Dates'] || '');
    const hours = parseTrainingHours(row['Training Hours'] || '');

    return {
        prj: prjNumber,
        netsuiteId: prjNumber,
        companyName,
        software: row.Software || '',
        pdcNumber,
        trainingLength: row['Training Length (Days)'] || '',
        duration: row['Duration (Hr)'] || '',
        sessions,
        hours,
        location: row['Training Location'] || '',
        numberOfClients: parseInt(row['Number of clients'] || '0', 10),
        salesRep: row['Sales Rep'] || '',
        formateur: row.formateur || '',
        rawRow: row
    };
}

// Export global
window.csvParser = {
    parseCSV,
    extractPRJNumber,
    extractCompanyName,
    extractPDCNumber,
    parseDate,
    parseTrainingDatesIntoSessions,
    parseTrainingHours,
    combineDateAndTime,
    formatDateFr,
    detectDuplicates,
    validateRow,
    parseProjectRow
};

})();
