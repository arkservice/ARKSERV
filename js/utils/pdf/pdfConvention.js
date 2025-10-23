// Générateur PDF pour les Conventions de Formation
// Document contractuel formel
(function() {
    'use strict';

    // Récupérer les utilitaires depuis window.pdfCore et pdfSectionMapper
    const { hexToRgb, addImageToPdf } = window.pdfCore;
    const { getSectionPositions } = window.pdfSectionMapper;

async function generateConventionPDF(conventionData, layoutParams = {}) {
    console.log('🔧 [DEBUG] generateConventionPDF appelée');
    console.log('📄 [DEBUG] Données convention:', conventionData);
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

    // Paramètres par défaut pour convention
    const defaultParams = {
        primaryColor: [19, 62, 94],
        grayColor: [55, 65, 81],
        lightGrayColor: [107, 114, 128],
        titleSize: 11,        // ~15px réels (11pt ≈ 15px)
        subtitleSize: 8,      // ~10px réels (8pt ≈ 10px)
        textSize: 6,          // ~8px réels (6pt ≈ 8px)
        headerSize: 14,
        footerSize: 8,
        articleSize: 7,       // ~9px réels (7pt ≈ 9px)
        companyName: 'ARKANCE',
        footerAddress: 'LE VAL SAINT QUENTIN - Bâtiment C - 2, rue René Caudron - CS 30764 - 78961 Voisins-le-Bretonneux Cedex',
        footerContact: 'www.arkance-systems.fr - formation@arkance-systems.com - Tél. : 01 39 44 18 18',
        headerLogoLeft: null,
        footerLogoLeft: null
    };

    const params = { ...defaultParams, ...layoutParams };

    // Calculer les positions des sections depuis la configuration
    const sections = params.sections || [];
    const positions = getSectionPositions(sections);
    console.log('📐 [pdfConvention] Positions calculées:', positions);

    // Créer le document PDF A4
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Couleurs
    const primaryColor = hexToRgb(params.primaryColor) || params.primaryColor;
    const grayColor = hexToRgb(params.grayColor) || params.grayColor;

    // === SECTION HEADER ===
    const headerSection = positions.header || { y: 0, height: 22, width: pageWidth };

    // Add background if configured
    if (params.headerBackground) {
        const bgColor = hexToRgb(params.headerBackground) || params.headerBackground;
        doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        doc.rect(0, headerSection.y, headerSection.width, headerSection.height, 'F');
    }

    // Handle padding
    const headerPadding = params.headerPadding || 0;
    const headerImageX = headerPadding;
    const headerImageY = headerSection.y + headerPadding;
    const headerImageWidth = headerSection.width - (2 * headerPadding);
    const headerImageHeight = headerSection.height - (2 * headerPadding);

    // Add logo with constraints
    await addImageToPdf(
        doc,
        params.headerLogoLeft,
        headerImageX,
        headerImageY,
        headerImageWidth,
        headerImageHeight,
        params.companyName
    );

    // === SECTION TITLE ===
    const titleSection = positions.title || { y: 22, height: 40, width: pageWidth };
    let yPos = titleSection.y + 13;
    doc.setFontSize(params.titleSize);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('CONVENTION DE', 20, yPos);
    yPos += 7;
    doc.text('FORMATION PROFESSIONNELLE', 20, yPos);

    // Numéro de convention
    yPos += 10;
    doc.setFontSize(params.subtitleSize);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text(`${conventionData.numero || '202701 - PR-1234'}`, 20, yPos);

    // === SECTION PARTIES ===
    const partiesSection = positions.parties || { y: 62, height: 55, width: pageWidth };
    yPos = partiesSection.y + 3;
    doc.setFontSize(params.textSize);
    doc.setFont('helvetica', 'bold');
    doc.text('ENTRE LES SOUSSIGNÉS :', 20, yPos);

    yPos += 8;

    // Sauvegarder position Y de départ pour les 2 colonnes
    const startY = yPos;

    // === COLONNE GAUCHE - PARTIE ARKANCE (statique) ===
    let leftY = startY;
    const leftX = 20; // Position X colonne gauche

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(params.textSize);
    doc.text('D\'une part, la société :', leftX, leftY);
    leftY += 4;

    doc.setFont('helvetica', 'bold');
    doc.text('ARKANCE', leftX, leftY);
    leftY += 4;

    doc.setFont('helvetica', 'normal');
    doc.text('VAL SAINT QUENTIN', leftX, leftY);
    leftY += 4;
    doc.text('2 Rue René Caudron', leftX, leftY);
    leftY += 4;
    doc.text('Bâtiment C', leftX, leftY);
    leftY += 4;
    doc.text('78960 Voisins-le-Bretonneux', leftX, leftY);
    leftY += 4;

    // === COLONNE DROITE - PARTIE CLIENT (dynamique) ===
    let rightY = startY;
    const rightX = 110; // Position X colonne droite

    doc.setFont('helvetica', 'normal');
    doc.text('Et d\'autre part, la société :', rightX, rightY);
    rightY += 4;

    // Nom société client en gras
    doc.setFont('helvetica', 'bold');
    doc.text(conventionData.societe || 'SOCIETE CLIENT', rightX, rightY);
    rightY += 4;

    // Adresse client (peut être multi-lignes)
    doc.setFont('helvetica', 'normal');
    const adresseClient = conventionData.adresse || 'Adresse du client';
    const adresseLines = doc.splitTextToSize(adresseClient, pageWidth - rightX - 20);
    adresseLines.forEach(line => {
        doc.text(line, rightX, rightY);
        rightY += 4;
    });

    doc.text(`représenté par : ${conventionData.representant || 'Représentant légal'}`, rightX, rightY);
    rightY += 4;

    // === AVANCER Y POSITION BASÉE SUR LA HAUTEUR MAXIMALE ===
    yPos = Math.max(leftY, rightY) + 8;

    // === TEXTE FINAL ===
    doc.setFont('helvetica', 'bold');
    doc.text('IL A ÉTÉ CONVENU ET ARRÊTÉ CE QUI SUIT :', 20, yPos);

    // === SECTION ARTICLES ===
    const articlesSection = positions.articles || { y: 117, height: 100, width: pageWidth };

    // Fonction utilitaire pour rendre du texte mixte (normal/gras)
    const renderMixedText = (segments, startX, startY, maxWidth) => {
        let currentX = startX;
        let currentY = startY;
        const lineHeight = 4;

        segments.forEach(segment => {
            // Définir le style de police
            doc.setFont('helvetica', segment.style || 'normal');

            // Calculer la largeur du texte
            const textWidth = doc.getTextWidth(segment.text);

            // Vérifier si le texte dépasse la largeur maximale
            if (currentX + textWidth > startX + maxWidth && currentX > startX) {
                // Aller à la ligne suivante
                currentY += lineHeight;
                currentX = startX;
            }

            // Rendre le texte
            doc.text(segment.text, currentX, currentY);
            currentX += textWidth;

            // Forcer un retour à la ligne si demandé
            if (segment.breakAfter) {
                currentY += lineHeight;
                currentX = startX;
            }
        });

        // Retourner la position Y finale
        return currentY + lineHeight;
    };

    // Articles de la convention - commencer dans la section articles
    yPos = articlesSection.y + 5;

    // Données dynamiques pour les articles
    const listeStagiaires = conventionData.stagiaires || 'Liste des stagiaires à définir';
    const datesSessions = conventionData.dates || 'Dates de formation à définir';

    // LOGS DE DÉBOGAGE - Vérifier les données reçues
    console.log('🔍 [PDF DEBUG] conventionData reçu:', conventionData);
    console.log('🔍 [PDF DEBUG] lieu_formation:', conventionData.lieu_formation);
    console.log('🔍 [PDF DEBUG] lieu_type:', conventionData.lieu_type);

    // CORRECTION Article 4: Utiliser l'adresse exacte des sessions formatée par session
    const lieuFormation = conventionData.lieu_formation ?
        conventionData.lieu_formation : // Déjà formaté comme "Session 1: lieu1, Session 2: lieu2"
        (conventionData.lieu_type === 'distance' ? 'à distance' : 'à l\'adresse à définir');

    console.log('🔍 [PDF DEBUG] lieuFormation final:', lieuFormation);

    const programmeFormate = `Formation ${conventionData.editeur || 'Autodesk'} ${conventionData.logiciel || conventionData.formation || 'Logiciel'} 2025 - ${conventionData.type_pdc || 'Concepts de base'}`;

    // Fonction helper pour formater les sessions détaillées de l'Article II
    const renderSessionsDetails = (data) => {
        if (data.sessionsFormattees && Array.isArray(data.sessionsFormattees)) {
            return data.sessionsFormattees.map((session) => ({
                text: session,
                style: 'bold',
                breakAfter: true
            }));
        }
        // Fallback si pas de sessions détaillées
        return [{ text: data.dates || 'Dates à définir selon planning', style: 'bold' }];
    };

    const articles = [
        {
            titre: 'Article I',
            segments: [
                { text: `La formation professionnelle faisant l'objet de la présente convention sera suivie par le personnel de la Société ${conventionData.societe || 'SOCIETE CLIENT'} suivant : `, style: 'normal' },
                { text: listeStagiaires, style: 'bold' }
            ]
        },
        {
            titre: 'Article II',
            segments: [
                { text: `La durée de ce contrat sera de ${conventionData.duree || '5 jour(s)'} réparti(s) comme suit :`, style: 'normal', breakAfter: true },
                ...renderSessionsDetails(conventionData)
            ]
        },
        {
            titre: 'Article III',
            segments: [
                { text: 'La formation sera assurée par le(s) formateur(s) désigné(s) ci-dessous : ', style: 'normal' },
                { text: conventionData.formateur || 'Formateur ARKANCE', style: 'bold' }
            ]
        },
        {
            titre: 'Article IV',
            segments: [
                { text: `Le programme de la formation est le suivant : « ${programmeFormate} »`, style: 'normal', breakAfter: true },
                { text: 'La formation se déroulera ', style: 'normal', breakAfter: true },
                { text: lieuFormation, style: 'bold' }
            ]
        },
        {
            titre: 'Article V',
            contenu: 'Les horaires de formation seront les suivants : 09h00 à 12h00 et de 13h00 à 17h00'
        },
        {
            titre: 'Article VI',
            contenu: 'Au terme de la formation susmentionnée, le centre de formation délivrera un certificat de fin de stage à chaque participant.'
        },
        {
            titre: 'Article VII',
            contenu: `En contrepartie de la formation dispensée, la société ${conventionData.societe || 'SOCIETE CLIENT'} ${conventionData.adresse || 'Adresse non renseignée'}\ns'engage à acquitter au centre de formation signataire de la présente convention, le coût de cette formation fixé à :`
        }
    ];

    articles.forEach(article => {
        // Rendre le titre de l'article
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(params.articleSize);
        doc.text(article.titre, 20, yPos);
        yPos += 3;

        // Rendre le contenu selon le type (segments ou contenu uniforme)
        doc.setFontSize(params.textSize);

        if (article.segments) {
            // Rendu avec texte mixte (normal/gras)
            yPos = renderMixedText(article.segments, 20, yPos, pageWidth - 40);
            yPos += 2; // Espacement après l'article
        } else {
            // Rendu uniforme (texte normal)
            doc.setFont('helvetica', 'normal');
            const lines = doc.splitTextToSize(article.contenu, pageWidth - 40);
            lines.forEach(line => {
                doc.text(line, 20, yPos);
                yPos += 4;
            });
            yPos += 6;
        }
    });

    // === SECTION TARIFS ===
    const tarifsSection = positions.tarifs || { y: 217, height: 60, width: pageWidth };
    yPos = tarifsSection.y + 10;
    doc.setFont('helvetica', 'bold');
    doc.text('COÛT DE LA FORMATION :', 20, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'normal');
    const tarifLines = [
        `${conventionData.formation || 'Formation'} : ${conventionData.cout || '0,00'} €`,
        `TVA 20% : ${conventionData.tva || '0,00'} €`,
        `TOTAL TTC : ${conventionData.total || '0,00'} €`
    ];

    tarifLines.forEach(line => {
        doc.text(line, 20, yPos);
        yPos += 5;
    });

    // Signatures
    yPos += 20;
    doc.text('LE CENTRE DE FORMATION', 50, yPos);
    doc.text('L\'ENTREPRISE', 150, yPos);
    yPos += 5;
    doc.text('(Signature et cachet)', 50, yPos);
    doc.text('(Signature et cachet)', 150, yPos);

    // === SECTION FOOTER ===
    const footerSection = positions.footer || { y: pageHeight - 37, height: 37, width: pageWidth };

    // Add background if configured
    if (params.footerBackground) {
        const bgColor = hexToRgb(params.footerBackground) || params.footerBackground;
        doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        doc.rect(0, footerSection.y, footerSection.width, footerSection.height, 'F');
    }

    // Handle padding
    const footerPadding = params.footerPadding || 0;
    const footerImageX = footerPadding;
    const footerImageY = footerSection.y + footerPadding;
    const footerImageWidth = footerSection.width - (2 * footerPadding);
    const footerImageHeight = footerSection.height - (2 * footerPadding);

    // Add logo with constraints
    await addImageToPdf(
        doc,
        params.footerLogoLeft,
        footerImageX,
        footerImageY,
        footerImageWidth,
        footerImageHeight,
        params.footerContact
    );

    return doc.output('blob');
}

// Exposer la fonction principale via window
window.generateConventionPDF = generateConventionPDF;

console.log('✅ [pdfConvention] Module chargé et exposé via window.generateConventionPDF');

})();
