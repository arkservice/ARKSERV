const fs = require('fs');

// Read the CSV file
const csvContent = fs.readFileSync('evals.csv', 'utf-8');

// Parse CSV with proper handling of multiline cells
function parseCSV(csvContent) {
    const lines = csvContent.split('\n').map(line => line.trim()).filter(line => line);
    if (lines.length === 0) return { headers: [], rows: [] };

    // Extract first logical line for headers
    let firstLine = '';
    let inQuotes = false;
    for (let i = 0; i < csvContent.length; i++) {
        const char = csvContent[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        }
        firstLine += char;
        if (char === '\n' && !inQuotes) {
            break;
        }
    }

    // Detect delimiter
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;
    const delimiter = semicolonCount > commaCount ? ';' : ',';

    // Parse character by character
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
                currentCell += '"';
                i++;
            } else {
                insideQuotes = !insideQuotes;
            }
        } else if (char === delimiter && !insideQuotes) {
            currentRow.push(currentCell.trim());
            currentCell = '';
        } else if (char === '\n' && !insideQuotes) {
            if (currentCell || currentRow.length > 0) {
                currentRow.push(currentCell.trim());
                if (currentRow.some(cell => cell)) {
                    rows.push(currentRow);
                }
                currentRow = [];
                currentCell = '';
            }
        } else if (char === '\r' && nextChar === '\n' && !insideQuotes) {
            if (currentCell || currentRow.length > 0) {
                currentRow.push(currentCell.trim());
                if (currentRow.some(cell => cell)) {
                    rows.push(currentRow);
                }
                currentRow = [];
                currentCell = '';
            }
            i++;
        } else if (char !== '\r') {
            currentCell += char;
        }
        i++;
    }

    if (currentCell || currentRow.length > 0) {
        currentRow.push(currentCell.trim());
        if (currentRow.some(cell => cell)) {
            rows.push(currentRow);
        }
    }

    if (rows.length === 0) return { headers: [], rows: [] };

    const headers = rows[0].map(h => h.trim());
    const dataRows = rows.slice(1);

    return { headers, rows: dataRows };
}

const { headers, rows } = parseCSV(csvContent);

console.log('=== ANALYSE DES IMPORTS CSV ===\n');
console.log(`Total lignes CSV (avec en-tête): 587`);
console.log(`Total lignes de données: ${rows.length}`);
console.log(`Total évaluations en base: 564`);
console.log(`Différence: ${rows.length - 564} lignes non importées\n`);

// Find column indices
const prjIndex = headers.findIndex(h => h.toLowerCase() === 'prj');
const custIndex = headers.findIndex(h => h.toLowerCase() === 'cust');
const nomIndex = headers.findIndex(h => h.toLowerCase().includes('nom'));
const prenomIndex = headers.findIndex(h => h.toLowerCase().includes('prénom') || h.toLowerCase().includes('prenom'));
const emailIndex = headers.findIndex(h => h.toLowerCase().includes('email') || h.toLowerCase().includes('e-mail'));

console.log('=== INDICES DES COLONNES ===');
console.log(`PRJ: ${prjIndex}, CUST: ${custIndex}, Nom: ${nomIndex}, Prénom: ${prenomIndex}, Email: ${emailIndex}\n`);

// Analyze rows
const invalidRows = [];
const validRows = [];
const duplicates = new Map();

rows.forEach((row, index) => {
    const lineNumber = index + 2; // +2 because index 0 is line 2 (after header)
    const prj = row[prjIndex]?.trim() || '';
    const cust = row[custIndex]?.trim() || '';
    const nom = row[nomIndex]?.trim() || '';
    const prenom = row[prenomIndex]?.trim() || '';
    const email = row[emailIndex]?.trim() || '';

    // Check for missing required fields
    if (!prj || !cust || !nom || !email) {
        invalidRows.push({
            line: lineNumber,
            prj,
            cust,
            nom,
            prenom,
            email,
            reason: 'Champs obligatoires manquants'
        });
    } else {
        const key = `${prj}_${email}`;
        if (duplicates.has(key)) {
            duplicates.get(key).push(lineNumber);
        } else {
            duplicates.set(key, [lineNumber]);
        }
        validRows.push({
            line: lineNumber,
            prj,
            cust,
            nom,
            prenom,
            email
        });
    }
});

console.log('=== LIGNES INVALIDES (champs manquants) ===');
if (invalidRows.length === 0) {
    console.log('Aucune ligne invalide trouvée\n');
} else {
    console.log(`Total: ${invalidRows.length} lignes\n`);
    invalidRows.forEach(row => {
        console.log(`Ligne ${row.line}:`);
        console.log(`  PRJ: ${row.prj || 'MANQUANT'}`);
        console.log(`  CUST: ${row.cust || 'MANQUANT'}`);
        console.log(`  Nom: ${row.nom || 'MANQUANT'}`);
        console.log(`  Email: ${row.email || 'MANQUANT'}`);
        console.log('');
    });
}

console.log('=== DOUBLONS DANS LE CSV (même PRJ + Email) ===');
const csvDuplicates = Array.from(duplicates.entries()).filter(([key, lines]) => lines.length > 1);
if (csvDuplicates.length === 0) {
    console.log('Aucun doublon trouvé dans le CSV\n');
} else {
    console.log(`Total: ${csvDuplicates.length} groupes de doublons\n`);
    csvDuplicates.forEach(([key, lines]) => {
        const [prj, email] = key.split('_');
        console.log(`PRJ: ${prj}, Email: ${email}`);
        console.log(`  Lignes: ${lines.join(', ')}`);
        console.log('');
    });
}

console.log('=== RÉSUMÉ ===');
console.log(`Lignes valides uniques: ${validRows.length - csvDuplicates.reduce((sum, [k, lines]) => sum + (lines.length - 1), 0)}`);
console.log(`Lignes invalides: ${invalidRows.length}`);
console.log(`Doublons CSV: ${csvDuplicates.reduce((sum, [k, lines]) => sum + (lines.length - 1), 0)}`);
console.log(`Total en base: 564`);
console.log(`\nLignes potentiellement rejetées lors de l'import: ${rows.length - 564}`);
