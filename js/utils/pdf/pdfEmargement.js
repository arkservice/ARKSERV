// Générateur PDF pour les Feuilles d'Émargement
// Document en format paysage pour les signatures par demi-journée
(function() {
    'use strict';

    // Récupérer les utilitaires depuis window.pdfCore
    const { hexToRgb, addImageToPdf } = window.pdfCore;

async function generateEmargementPDF(emargementData, layoutParams = {}) {
    console.log('🔧 [DEBUG] generateEmargementPDF appelée');
    console.log('📄 [DEBUG] Données émargement:', emargementData);
    console.log('⚙️ [DEBUG] Paramètres layout:', layoutParams);

    // Vérifier que jsPDF est disponible
    let jsPDF;
    if (window.jsPDF) {
        jsPDF = window.jsPDF;
    } else if (window.jspdf && window.jspdf.jsPDF) {
        jsPDF = window.jspdf.jsPDF;
    } else {
        throw new Error('jsPDF n\'est pas chargé');
    }

    // Paramètres par défaut pour émargement - FORMAT PAYSAGE
    const defaultParams = {
        primaryColor: [19, 62, 94],
        grayColor: [55, 65, 81],
        lightGrayColor: [107, 114, 128],
        titleSize: 11,
        textSize: 9,
        headerSize: 10,
        footerSize: 8,
        companyName: 'ARKANCE',
        footerAddress: 'LE VAL SAINT QUENTIN - Bâtiment C - 2, rue René Caudron - CS 30764 - 78961 Voisins-le-Bretonneux Cedex',
        footerContact: 'www.arkance-systems.fr - formation@arkance-systems.com - Tél. : 01 39 44 18 18',
        headerLogoLeft: null,
        footerLogoLeft: null
    };

    const params = { ...defaultParams, ...layoutParams };

    // Créer le document PDF A4 PAYSAGE (297x210mm)
    const doc = new jsPDF({
        orientation: 'landscape', // FORMAT PAYSAGE
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();   // 297mm
    const pageHeight = doc.internal.pageSize.getHeight(); // 210mm

    console.log('📐 [DEBUG] Dimensions paysage:', { pageWidth, pageHeight });

    // Couleurs
    const primaryColor = hexToRgb(params.primaryColor) || params.primaryColor;
    const grayColor = hexToRgb(params.grayColor) || params.grayColor;

    // === SECTION HEADER (297x26mm) ===
    await renderEmargementHeader(doc, emargementData, params, pageWidth);

    // === SECTION CONTENU PRINCIPAL ===
    renderEmargementContent(doc, emargementData, params, pageWidth, pageHeight);

    // === SECTION FOOTER (297x52mm) ===
    await renderEmargementFooter(doc, emargementData, params, pageWidth, pageHeight);

    return doc.output('blob');
}

// Rendu du header spécifique émargement (297x26mm)
async function renderEmargementHeader(doc, data, params, pageWidth) {
    console.log('🎨 [DEBUG] Rendu header émargement');

    // Header avec logo
    const headerImageAdded = await addImageToPdf(
        doc,
        params.headerLogoLeft,
        0, 0,         // Position
        pageWidth, 26, // Dimensions : 297x26mm
        params.companyName
    );

    if (!headerImageAdded) {
        // Fallback texte si pas d'image - style ARKANCE
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(19, 62, 94); // Bleu ARKANCE
        const arkanceWidth = doc.getTextWidth('ARKANCE');
        doc.text('ARKANCE', pageWidth - 10 - arkanceWidth, 16);
    }
}

// Rendu du contenu principal émargement
function renderEmargementContent(doc, data, params, pageWidth, pageHeight) {
    console.log('📋 [DEBUG] Rendu contenu émargement');

    const primaryColor = hexToRgb(params.primaryColor) || params.primaryColor;
    const grayColor = hexToRgb(params.grayColor) || params.grayColor;

    let yPos = 30; // Début après header (26mm + marge)

    // === TITRE ET INFORMATIONS GÉNÉRALES ===
    doc.setFontSize(params.titleSize);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text(`FEUILLE D'ÉMARGEMENT – ${data.numero}`, 10, yPos);
    yPos += 8;

    // Informations projet sur 3 colonnes
    doc.setFontSize(params.textSize);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...grayColor);

    // Colonne 1 - Société et Programme
    doc.text(`Société : ${data.societe}`, 10, yPos);
    doc.text(`Programme : ${data.programme}`, 10, yPos + 5);
    doc.text(`Lieu : ${data.lieu}`, 10, yPos + 10);

    // Colonne 2 - Durée et dates
    const col2X = pageWidth * 0.5;
    doc.text(`Durée : ${data.duree}`, col2X, yPos);
    doc.text(`Nombre de jour(s) : ${data.nombreJours}`, col2X, yPos + 5);
    if (data.codeCPF) {
        doc.text(`Code CPF : ${data.codeCPF}`, col2X, yPos + 10);
    }

    yPos += 18;
    doc.text(`Dates : ${data.dates}`, 10, yPos);
    yPos += 10;

    // === GRILLE D'ÉMARGEMENT ===
    renderEmargementGrid(doc, data, params, pageWidth, yPos);
}

// Rendu de la grille d'émargement avec dates et créneaux
function renderEmargementGrid(doc, data, params, pageWidth, startY) {
    console.log('📊 [DEBUG] Rendu grille émargement');

    const grayColor = hexToRgb(params.grayColor) || params.grayColor;

    // Analyser les données de sessions pour créer la grille
    const sessionDates = [...new Set(data.sessionsDetails?.map(s => s.date) || [])];
    const creneaux = ['9h - 12h', '13h - 17h']; // Créneaux standard

    console.log('📅 [DEBUG] Dates sessions:', sessionDates);

    // Dimensions de la grille
    const gridStartX = 10;
    const gridWidth = pageWidth - 20;
    const nameColumnWidth = 70; // Largeur colonne nom/prénom
    const dateColumnWidth = (gridWidth - nameColumnWidth) / (sessionDates.length * 2); // 2 créneaux par date

    let yPos = startY + 5;

    // === EN-TÊTE DE LA GRILLE ===
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);

    // Ligne d'en-tête principale avec les dates
    let currentX = gridStartX;

    // Cellule "Prénom/Nom des stagiaires"
    doc.rect(currentX, yPos, nameColumnWidth, 10);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...grayColor);
    doc.text('Prénom/Nom', currentX + 2, yPos + 6);
    doc.text('des stagiaires', currentX + 2, yPos + 9);
    currentX += nameColumnWidth;

    // Cellules des dates
    sessionDates.forEach(date => {
        const cellWidth = dateColumnWidth * 2; // 2 créneaux par date
        doc.rect(currentX, yPos, cellWidth, 5);

        // Centrer la date dans la cellule
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        const dateWidth = doc.getTextWidth(date);
        doc.text(date, currentX + (cellWidth - dateWidth) / 2, yPos + 3.5);

        currentX += cellWidth;
    });

    yPos += 5;

    // Ligne des créneaux horaires
    currentX = gridStartX + nameColumnWidth;
    sessionDates.forEach(date => {
        creneaux.forEach(creneau => {
            doc.rect(currentX, yPos, dateColumnWidth, 5);

            // Centrer le créneau dans la cellule
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            const creneauWidth = doc.getTextWidth(creneau);
            doc.text(creneau, currentX + (dateColumnWidth - creneauWidth) / 2, yPos + 3.5);

            currentX += dateColumnWidth;
        });
    });

    yPos += 5;

    // === LIGNES DES STAGIAIRES ===
    const rowHeight = 12;
    const stagiaireName = `${data.stagiaire.prenom} ${data.stagiaire.nom}`;

    // Ligne pour le stagiaire
    currentX = gridStartX;

    // Cellule nom/prénom
    doc.rect(currentX, yPos, nameColumnWidth, rowHeight);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...grayColor);
    doc.text(stagiaireName, currentX + 2, yPos + 7);
    currentX += nameColumnWidth;

    // Cellules d'émargement (vides pour signature)
    sessionDates.forEach(date => {
        creneaux.forEach(creneau => {
            doc.rect(currentX, yPos, dateColumnWidth, rowHeight);
            currentX += dateColumnWidth;
        });
    });

    yPos += rowHeight + 10;

    // === SECTION FORMATEUR ===
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Prénom/Nom', gridStartX + 2, yPos);
    doc.text('des formateurs', gridStartX + 2, yPos + 4);

    const formateurName = `${data.formateur.prenom} ${data.formateur.nom}`;
    yPos += 8;
    doc.setFont('helvetica', 'normal');
    doc.text(formateurName, gridStartX + 2, yPos);

    // Note sur l'émargement
    yPos += 10;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    const noteText = 'Émargements du Formateur par demi-journée (Attestant de l\'exactitude des informations portées ci-dessus)';
    const noteWidth = doc.getTextWidth(noteText);
    doc.text(noteText, (pageWidth - noteWidth) / 2, yPos);
}

// Rendu du footer spécifique émargement (297x52mm)
async function renderEmargementFooter(doc, data, params, pageWidth, pageHeight) {
    console.log('🦶 [DEBUG] Rendu footer émargement');

    const footerStartY = pageHeight - 52; // 52mm depuis le bas

    // Footer avec logo
    const footerImageAdded = await addImageToPdf(
        doc,
        params.footerLogoLeft,
        0, footerStartY,    // Position
        pageWidth, 52,      // Dimensions : 297x52mm
        params.footerContact
    );

    if (!footerImageAdded) {
        // Fallback texte si pas d'image
        doc.setFontSize(params.footerSize);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(107, 114, 128);

        const footerY = footerStartY + 20;

        // Informations de contact centré
        const contactLines = [
            data.contact.adresse,
            `${data.contact.web} - ${data.contact.email} - Tél. : ${data.contact.telephone}`
        ];

        let textY = footerY;
        contactLines.forEach(line => {
            if (line) {
                const lineWidth = doc.getTextWidth(line);
                doc.text(line, (pageWidth - lineWidth) / 2, textY);
                textY += 5;
            }
        });

        // Informations légales en bas
        textY += 10;
        doc.setFontSize(7);
        const legalText = 'S.A.S. au capital de 1 300 000 € - N° de déclaration d\'existence : 11 78 02137 8 - RCS Versailles B132 - SIRET 392 544 026 02 - CODE NAF 7112B';
        const legalWidth = doc.getTextWidth(legalText);
        doc.text(legalText, (pageWidth - legalWidth) / 2, textY);

        // Logos partenaires (texte de remplacement)
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('AUTODESK', 20, footerStartY + 15);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.text('Platinum Partner', 20, footerStartY + 20);
        doc.text('Value Added Services', 20, footerStartY + 25);
        doc.text('Authorized Developer', 20, footerStartY + 28);
        doc.text('Authorized Training Center', 20, footerStartY + 31);
    }
}

// Exposer la fonction principale via window
window.generateEmargementPDF = generateEmargementPDF;

console.log('✅ [pdfEmargement] Module chargé et exposé via window.generateEmargementPDF');

})();
