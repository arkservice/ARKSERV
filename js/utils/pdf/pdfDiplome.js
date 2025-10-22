// Générateur PDF pour les Diplômes de Formation
// Document de certification de fin de formation
(function() {
    'use strict';

    // Récupérer les utilitaires depuis window.pdfCore et pdfSectionMapper
    const { hexToRgb, addImageToPdf } = window.pdfCore;
    const { getSectionPositions } = window.pdfSectionMapper;

// === FONCTION DE RENDU DU HEADER ===
async function renderDiplomeHeader(doc, data, params, pageWidth, pageHeight, primaryColor, section) {
    console.log('🎨 [DEBUG] Rendu header Diplôme - pleine largeur');

    // Add background if configured
    if (params.headerBackground) {
        const bgColor = hexToRgb(params.headerBackground) || params.headerBackground;
        doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        doc.rect(0, section.y, pageWidth, section.height, 'F');
    }

    // Image header en pleine largeur (210mm pour A4 portrait)
    let logoAdded = false;
    if (params.headerLogoLeft) {
        logoAdded = await addImageToPdf(
            doc,
            params.headerLogoLeft,
            0,                    // x = 0 (plaqué à gauche, pas de marge)
            section.y,            // y = position de la section
            pageWidth,            // width = 210mm (toute la largeur de la page)
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
    console.log('📝 [DEBUG] Rendu titre Diplôme');

    const centerX = pageWidth / 2;
    const centerY = section.y + section.height / 2;

    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...grayColor);
    doc.text('ATTESTATION', centerX, centerY, { align: 'center' });
}

// === FONCTION DE RENDU CERTIFICATION ===
function renderDiplomeCertification(doc, params, pageWidth, grayColor, section) {
    console.log('✍️ [DEBUG] Rendu certification');

    const centerX = pageWidth / 2;
    const centerY = section.y + section.height / 2;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...grayColor);
    doc.text('Je soussigné, Olivier PISCART, certifie que :', centerX, centerY, { align: 'center' });
}

// === FONCTION DE RENDU NOM STAGIAIRE ===
function renderDiplomeStagiaire(doc, data, params, pageWidth, primaryColor, section) {
    console.log('👤 [DEBUG] Rendu nom stagiaire');

    const centerX = pageWidth / 2;
    let yPos = section.y + 5;

    // Nom et prénom du stagiaire
    const prenom = data.stagiaire_prenom || '';
    const nom = (data.stagiaire_nom || '').toUpperCase();
    const fullName = `${prenom} ${nom}`.trim();

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...primaryColor);
    doc.text(fullName, centerX, yPos, { align: 'center' });

    // Société du stagiaire (si disponible)
    if (data.stagiaire_societe) {
        yPos += 7;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'italic');
        doc.text(`de la société : ${data.stagiaire_societe}`, centerX, yPos, { align: 'center' });
    }
}

// === FONCTION DE RENDU TEXTE INTRO ===
function renderDiplomeTexteIntro(doc, params, pageWidth, grayColor, section) {
    console.log('📄 [DEBUG] Rendu texte intro');

    const centerX = pageWidth / 2;
    const centerY = section.y + section.height / 2;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...grayColor);
    doc.text('a participé au stage', centerX, centerY, { align: 'center' });
}

// === FONCTION DE RENDU NOM FORMATION ===
function renderDiplomeFormation(doc, data, params, pageWidth, primaryColor, grayColor, section) {
    console.log('📚 [DEBUG] Rendu nom formation');

    const centerX = pageWidth / 2;
    let yPos = section.y + 5;

    const nomFormation = data.nom_formation || 'Formation';

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);

    // Gérer le texte long sur plusieurs lignes
    const maxWidth = pageWidth - 40; // Marges de 20mm de chaque côté
    const lines = doc.splitTextToSize(nomFormation, maxWidth);
    const lineHeight = 7;

    lines.forEach((line, index) => {
        doc.text(line, centerX, yPos + (index * lineHeight), { align: 'center' });
    });

    // Ajouter le texte "organisé par la Société ARKANCE" en dessous
    yPos += (lines.length * lineHeight) + 5;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...grayColor);
    doc.text('organisé par la Société ARKANCE', centerX, yPos, { align: 'center' });
}

// === FONCTION DE RENDU LIEU FORMATION ===
function renderDiplomeLieuFormation(doc, data, params, pageWidth, grayColor, section) {
    console.log('📍 [DEBUG] Rendu lieu formation');

    const centerX = pageWidth / 2;
    let yPos = section.y + 5;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...grayColor);

    // Logique conditionnelle selon le lieu de formation
    let lieuText = '';

    if (data.lieu_formation === 'Dans nos locaux') {
        lieuText = 'dans nos locaux au 2, rue rené Caudron Le Val Saint Quentin 78960 Voisins-le-Bretonneux';
    } else if (data.lieu_formation === 'Dans vos locaux') {
        const adresse = data.adresse_formation || 'adresse non renseignée';
        lieuText = `dans les locaux du client au ${adresse}`;
    } else if (data.lieu_formation === 'À distance') {
        lieuText = 'à distance';
    } else {
        // Fallback si le lieu n'est pas reconnu
        lieuText = data.lieu_formation || 'lieu non renseigné';
    }

    // Gérer le texte long sur plusieurs lignes
    const maxWidth = pageWidth - 40; // Marges de 20mm de chaque côté
    const lines = doc.splitTextToSize(lieuText, maxWidth);
    const lineHeight = 6;

    lines.forEach((line, index) => {
        doc.text(line, centerX, yPos + (index * lineHeight), { align: 'center' });
    });
}

// === FONCTION DE RENDU DATES ET DURÉE ===
function renderDiplomeDates(doc, data, params, pageWidth, grayColor, section) {
    console.log('📅 [DEBUG] Rendu dates et durée');

    const centerX = pageWidth / 2;
    let yPos = section.y + 5;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...grayColor);

    // Dates (déjà formatées avec "le :" ou "les :" + année)
    const dates = data.dates || 'Dates non définies';
    doc.text(dates, centerX, yPos, { align: 'center' });

    yPos += 6;

    // Durée (déjà formatée avec "Durée : X heures")
    const duree = data.duree || 'Durée : 0 heures';
    doc.text(duree, centerX, yPos, { align: 'center' });
}

// === FONCTION DE RENDU SIGNATURE ===
function renderDiplomeSignature(doc, data, params, pageWidth, grayColor, section) {
    console.log('✒️ [DEBUG] Rendu signature');

    const centerX = pageWidth / 2;
    let yPos = section.y + 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...grayColor);

    // Lieu et date
    const lieu = data.lieu || 'VOISINS-LE-BRETONNEUX';
    const dateEmission = data.date_emission || new Date().toLocaleDateString('fr-FR');
    doc.text(`Fait à ${lieu}, le ${dateEmission}`, centerX, yPos, { align: 'center' });

    yPos += 10; // Espace pour signature

    // Nom du directeur
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Olivier PISCART', centerX, yPos, { align: 'center' });

    yPos += 6;

    // Titre du directeur
    doc.setFont('helvetica', 'normal');
    doc.text('Directeur', centerX, yPos, { align: 'center' });
}

// === FONCTION DE RENDU FOOTER ===
async function renderDiplomeFooter(doc, data, params, pageWidth, pageHeight, grayColor, section) {
    console.log('🔽 [DEBUG] Rendu footer Diplôme - pleine largeur');

    // Image footer en pleine largeur (210mm pour A4 portrait)
    if (params.footerLogoLeft) {
        await addImageToPdf(
            doc,
            params.footerLogoLeft,
            0,                    // x = 0 (plaqué à gauche, pas de marge)
            section.y,            // y = position de la section (plaqué en bas)
            pageWidth,            // width = 210mm (toute la largeur de la page)
            section.height,       // height = hauteur de la section
            'Footer'
        );
    }
}

// === GÉNÉRATEUR PDF POUR DIPLOME ===
async function generateDiplomePDF(diplomeData, layoutParams = {}) {
    console.log('🔧 [DEBUG] generateDiplomePDF appelée');
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

    // Paramètres par défaut pour Diplôme
    const defaultParams = {
        primaryColor: [19, 62, 94],  // Bleu ARKANCE
        grayColor: [55, 65, 81],     // Gris foncé
        lightGrayColor: [107, 114, 128],
        titleSize: 24,
        textSize: 11,
        labelSize: 10,
        companyName: 'ARKANCE',
        headerLogoLeft: null,
        footerLogoLeft: null,
        footerAddress: 'LE VAL SAINT QUENTIN - Bâtiment C - 2, rue René Caudron - CS 30764 - 78961 Voisins-le-Bretonneux Cedex',
        footerContact: 'www.arkance-systems.fr - formation@arkance-systems.com - Tél. : 01 39 44 18 18'
    };

    const params = { ...defaultParams, ...layoutParams };

    // Calculer les positions des sections depuis la configuration
    const sections = params.sections || [];
    const positions = getSectionPositions(sections);
    console.log('📐 [pdfDiplome] Positions calculées:', positions);

    // Créer le document PDF A4 PORTRAIT
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();   // 210mm (A4 portrait)
    const pageHeight = doc.internal.pageSize.getHeight(); // 297mm (A4 portrait)

    const primaryColor = hexToRgb(params.primaryColor) || params.primaryColor;
    const grayColor = hexToRgb(params.grayColor) || params.grayColor;

    // === SECTION HEADER (0-20mm) ===
    const headerSection = positions.header || { y: 0, height: 20, width: pageWidth };
    await renderDiplomeHeader(doc, diplomeData, params, pageWidth, pageHeight, primaryColor, headerSection);

    // === SECTION TITRE (20-60mm) ===
    const titreSection = positions.titre || { y: 20, height: 40, width: pageWidth };
    renderDiplomeTitre(doc, params, pageWidth, grayColor, titreSection);

    // === SECTION CERTIFICATION (60-75mm) ===
    const certificationSection = positions.certification || { y: 60, height: 15, width: pageWidth };
    renderDiplomeCertification(doc, params, pageWidth, grayColor, certificationSection);

    // === SECTION STAGIAIRE (75-95mm) ===
    const stagiaireSection = positions.stagiaire || { y: 75, height: 20, width: pageWidth };
    renderDiplomeStagiaire(doc, diplomeData, params, pageWidth, primaryColor, stagiaireSection);

    // === SECTION TEXTE INTRO (95-105mm) ===
    const texteIntroSection = positions.texte_intro || { y: 95, height: 10, width: pageWidth };
    renderDiplomeTexteIntro(doc, params, pageWidth, grayColor, texteIntroSection);

    // === SECTION FORMATION (105-130mm) ===
    const formationSection = positions.formation || { y: 105, height: 25, width: pageWidth };
    renderDiplomeFormation(doc, diplomeData, params, pageWidth, primaryColor, grayColor, formationSection);

    // === SECTION DATES (130-145mm) ===
    const datesSection = positions.dates || { y: 130, height: 15, width: pageWidth };
    renderDiplomeDates(doc, diplomeData, params, pageWidth, grayColor, datesSection);

    // === SECTION LIEU FORMATION (145-155mm) ===
    const lieuFormationSection = positions.lieu_formation || { y: 145, height: 10, width: pageWidth };
    renderDiplomeLieuFormation(doc, diplomeData, params, pageWidth, grayColor, lieuFormationSection);

    // === SECTION SIGNATURE (155-185mm) ===
    const signatureSection = positions.signature || { y: 155, height: 30, width: pageWidth };
    renderDiplomeSignature(doc, diplomeData, params, pageWidth, grayColor, signatureSection);

    // === SECTION FOOTER (185-210mm) ===
    const footerSection = positions.footer || { y: 185, height: 25, width: pageWidth };
    await renderDiplomeFooter(doc, diplomeData, params, pageWidth, pageHeight, grayColor, footerSection);

    return doc.output('blob');
}

// Exposer la fonction principale via window
window.generateDiplomePDF = generateDiplomePDF;

console.log('✅ [pdfDiplome] Module chargé et exposé via window.generateDiplomePDF');

})();
