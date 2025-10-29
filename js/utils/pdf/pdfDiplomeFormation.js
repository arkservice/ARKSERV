// Générateur PDF pour les Diplômes de Formation
// Document de certification de fin de formation en format A4 PAYSAGE
(function() {
    'use strict';

    // Récupérer les utilitaires depuis window.pdfCore et pdfSectionMapper
    const { hexToRgb, addImageToPdf } = window.pdfCore;
    const { getSectionPositions } = window.pdfSectionMapper;

// === FONCTION DE RENDU DU HEADER ===
async function renderDiplomeHeader(doc, data, params, pageWidth, pageHeight, primaryColor, section) {
    console.log('🎨 [DEBUG] Rendu header Diplôme Formation - pleine largeur (paysage)');

    // Add background if configured
    if (params.headerBackground) {
        const bgColor = hexToRgb(params.headerBackground) || params.headerBackground;
        doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        doc.rect(0, section.y, pageWidth, section.height, 'F');
    }

    // Image header en pleine largeur (297mm pour A4 paysage)
    let logoAdded = false;
    if (params.headerLogoLeft) {
        logoAdded = await addImageToPdf(
            doc,
            params.headerLogoLeft,
            0,                    // x = 0 (plaqué à gauche, pas de marge)
            section.y,            // y = position de la section
            pageWidth,            // width = 297mm (toute la largeur de la page en paysage)
            section.height,       // height = hauteur de la section
            params.companyName
        );
    }

    if (!logoAdded) {
        // Fallback si pas d'image : texte ARKANCE centré
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        doc.text('ARKANCE', pageWidth / 2, section.y + section.height / 2, { align: 'center' });
    }
}

// === FONCTION DE RENDU DU TITRE ===
function renderDiplomeTitre(doc, params, pageWidth, grayColor, section) {
    console.log('📝 [DEBUG] Rendu titre Diplôme Formation');

    const centerX = pageWidth / 2;
    const centerY = section.y + section.height / 2;

    doc.setFontSize(26); // +2pt (24 → 26)
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...grayColor);
    doc.text('DIPLOME DE FORMATION', centerX, centerY, { align: 'center' });
}

// === FONCTION DE RENDU CERTIFICATION ===
function renderDiplomeCertification(doc, params, pageWidth, grayColor, section) {
    console.log('✍️ [DEBUG] Rendu certification');

    const centerX = pageWidth / 2;
    const centerY = section.y + section.height / 2;

    doc.setFontSize(15); // +3pt (12 → 15)
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...grayColor);
    doc.text('Nous certifions que', centerX, centerY, { align: 'center' });
}

// === FONCTION DE RENDU NOM STAGIAIRE ===
function renderDiplomeStagiaire(doc, data, params, pageWidth, primaryColor, section) {
    console.log('👤 [DEBUG] Rendu nom stagiaire');

    const centerX = pageWidth / 2;
    const centerY = section.y + section.height / 2;

    // Nom et prénom du stagiaire (SANS civilité, PRÉNOM EN MAJUSCULE)
    const prenom = (data.stagiaire_prenom || '').toUpperCase(); // Prénom en majuscule
    const nom = (data.stagiaire_nom || '').toUpperCase();
    const fullName = `${prenom} ${nom}`.trim();

    doc.setFontSize(19); // +3pt (16 → 19)
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text(fullName, centerX, centerY, { align: 'center' });
}

// === FONCTION DE RENDU TEXTE INTRO ===
function renderDiplomeTexteIntro(doc, params, pageWidth, grayColor, section) {
    console.log('📄 [DEBUG] Rendu texte intro');

    const centerX = pageWidth / 2;
    const centerY = section.y + section.height / 2;

    doc.setFontSize(13); // +2pt (11 → 13)
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...grayColor);
    doc.text('a complété avec succès le programme de formation', centerX, centerY, { align: 'center' });
}

// === FONCTION DE RENDU NOM FORMATION ===
function renderDiplomeFormation(doc, data, params, pageWidth, primaryColor, section) {
    console.log('📚 [DEBUG] Rendu nom formation');

    const centerX = pageWidth / 2;
    let yPos = section.y + 8;

    const nomFormation = data.nom_formation || 'Formation';

    doc.setFontSize(16); // +2pt (14 → 16)
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);

    // Gérer le texte long sur plusieurs lignes
    const maxWidth = pageWidth - 60; // Marges de 30mm de chaque côté
    const lines = doc.splitTextToSize(nomFormation, maxWidth);
    const lineHeight = 7;

    lines.forEach((line, index) => {
        doc.text(line, centerX, yPos + (index * lineHeight), { align: 'center' });
    });

    // Note: Pas de ligne "organisé par la Société ARKANCE" comme demandé
}

// === FONCTION DE RENDU DATES ET DURÉE ===
function renderDiplomeDates(doc, data, params, pageWidth, grayColor, section) {
    console.log('📅 [DEBUG] Rendu dates et durée');

    const leftX = 30; // 30mm du bord gauche
    let yPos = section.y + 10; // +5mm vers le bas (5 → 10)

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...grayColor);

    // Dates (format: "Le(s) : 05/11/2024 - 06/11/2024 - 07/11/2024")
    const dates = data.dates || 'Dates non définies';
    doc.text(dates, leftX, yPos, { align: 'left' });

    yPos += 6;

    // Durée (format: "Durée (heures) : 21")
    const duree = data.duree || 'Durée (heures) : 0';
    doc.text(duree, leftX, yPos, { align: 'left' });
}

// === FONCTION DE RENDU BAS DE PAGE (Fait à, Titulaire, Responsable) ===
function renderDiplomeBasPage(doc, data, params, pageWidth, grayColor, primaryColor, section) {
    console.log('✒️ [DEBUG] Rendu bas de page');

    const leftX = 30; // 30mm du bord gauche
    let yPos = section.y + 5;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...grayColor);

    // Fait à VOISINS-LE-BRETONNEUX + Date (hardcodé, aligné à gauche à 30mm)
    const dateEmission = data.date_emission || new Date().toLocaleDateString('fr-FR');
    doc.text(`Fait à VOISINS-LE-BRETONNEUX, le ${dateEmission}`, leftX, yPos);

    yPos += 6; // Même espacement que entre dates et durée

    // Section signature en deux colonnes
    const rightColX = pageWidth - 60; // Position colonne droite

    // Colonne gauche : "Le Titulaire :" (aligné à gauche à 30mm)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...grayColor);
    doc.text('Le Titulaire :', leftX, yPos, { align: 'left' });

    // Colonne droite : "Le Responsable de Formation :" (aligné au centre à droite)
    doc.text('Le Responsable de Formation :', rightColX, yPos, { align: 'center' });

    // Note: Le footer contiendra la signature/logo selon l'utilisateur
}

// === FONCTION DE RENDU FOOTER ===
async function renderDiplomeFooter(doc, data, params, pageWidth, pageHeight, grayColor, section) {
    console.log('🔽 [DEBUG] Rendu footer Diplôme Formation - pleine largeur (paysage)');

    // Image footer en pleine largeur (297mm pour A4 paysage)
    if (params.footerLogoLeft) {
        await addImageToPdf(
            doc,
            params.footerLogoLeft,
            0,                    // x = 0 (plaqué à gauche, pas de marge)
            section.y,            // y = position de la section
            pageWidth,            // width = 297mm (toute la largeur de la page en paysage)
            section.height,       // height = hauteur de la section
            'Footer avec signature'
        );
    }
}

// === GÉNÉRATEUR PDF POUR DIPLOME DE FORMATION ===
async function generateDiplomeFormationPDF(diplomeData, layoutParams = {}) {
    console.log('🔧 [DEBUG] generateDiplomeFormationPDF appelée');
    console.log('📄 [DEBUG] Données diplôme:', diplomeData);

    // Vérifier que jsPDF est disponible
    let jsPDF;
    if (window.jsPDF) {
        jsPDF = window.jsPDF;
    } else if (window.jspdf && window.jspdf.jsPDF) {
        jsPDF = window.jspdf.jsPDF;
    } else {
        throw new Error('jsPDF n\'est pas chargé');
    }

    // Paramètres par défaut pour Diplôme Formation
    const defaultParams = {
        primaryColor: [19, 62, 94],  // Bleu ARKANCE
        grayColor: [55, 65, 81],     // Gris foncé
        lightGrayColor: [107, 114, 128],
        titleSize: 24,
        textSize: 11,
        labelSize: 10,
        companyName: 'ARKANCE',
        headerLogoLeft: null,
        footerLogoLeft: null
    };

    const params = { ...defaultParams, ...layoutParams };

    // Calculer les positions des sections depuis la configuration
    const sections = params.sections || [];
    const positions = getSectionPositions(sections);
    console.log('📐 [pdfDiplomeFormation] Positions calculées:', positions);

    // Créer le document PDF A4 PAYSAGE (landscape)
    const doc = new jsPDF({
        orientation: 'landscape',  // Format paysage !
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();   // 297mm (A4 paysage)
    const pageHeight = doc.internal.pageSize.getHeight(); // 210mm (A4 paysage)

    const primaryColor = hexToRgb(params.primaryColor) || params.primaryColor;
    const grayColor = hexToRgb(params.grayColor) || params.grayColor;

    // === SECTION HEADER ===
    const headerSection = positions.header || { y: 0, height: 15, width: pageWidth };
    await renderDiplomeHeader(doc, diplomeData, params, pageWidth, pageHeight, primaryColor, headerSection);

    // === SECTION TITRE ===
    const titreSection = positions.titre || { y: 15, height: 30, width: pageWidth };
    renderDiplomeTitre(doc, params, pageWidth, grayColor, titreSection);

    // === SECTION CERTIFICATION ===
    const certificationSection = positions.certification || { y: 45, height: 15, width: pageWidth };
    renderDiplomeCertification(doc, params, pageWidth, grayColor, certificationSection);

    // === SECTION STAGIAIRE ===
    const stagiaireSection = positions.stagiaire || { y: 60, height: 15, width: pageWidth };
    renderDiplomeStagiaire(doc, diplomeData, params, pageWidth, primaryColor, stagiaireSection);

    // === SECTION TEXTE INTRO ===
    const texteIntroSection = positions.texte_intro || { y: 75, height: 10, width: pageWidth };
    renderDiplomeTexteIntro(doc, params, pageWidth, grayColor, texteIntroSection);

    // === SECTION FORMATION ===
    const formationSection = positions.formation || { y: 85, height: 25, width: pageWidth };
    renderDiplomeFormation(doc, diplomeData, params, pageWidth, primaryColor, formationSection);

    // === SECTION DATES ===
    const datesSection = positions.dates || { y: 110, height: 15, width: pageWidth };
    renderDiplomeDates(doc, diplomeData, params, pageWidth, grayColor, datesSection);

    // === SECTION BAS DE PAGE (Fait à, Titulaire, Responsable) ===
    const basPageSection = positions.bas_page || { y: 125, height: 30, width: pageWidth };
    renderDiplomeBasPage(doc, diplomeData, params, pageWidth, grayColor, primaryColor, basPageSection);

    // === SECTION FOOTER ===
    const footerSection = positions.footer || { y: 155, height: 55, width: pageWidth };
    await renderDiplomeFooter(doc, diplomeData, params, pageWidth, pageHeight, grayColor, footerSection);

    return doc.output('blob');
}

// Exposer la fonction principale via window
window.generateDiplomeFormationPDF = generateDiplomeFormationPDF;

console.log('✅ [pdfDiplomeFormation] Module chargé et exposé via window.generateDiplomeFormationPDF');

})();
