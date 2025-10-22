// Générateur PDF pour les Convocations
// Document formel de convocation à une formation
(function() {
    'use strict';

    // Récupérer les utilitaires depuis window.pdfCore et pdfSectionMapper
    const { hexToRgb, addImageToPdf } = window.pdfCore;
    const { getSectionPositions } = window.pdfSectionMapper;

async function generateConvocationPDF(convocationData, layoutParams = {}) {
    console.log('🔧 [DEBUG] generateConvocationPDF appelée');
    console.log('📄 [DEBUG] Données convocation:', convocationData);
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

    // Paramètres par défaut pour convocation - TOUS LES TEXTES EN 9px
    const defaultParams = {
        primaryColor: [19, 62, 94],
        grayColor: [55, 65, 81],
        lightGrayColor: [107, 114, 128],
        titleSize: 9,
        subtitleSize: 9,
        textSize: 9,
        headerSize: 9,
        footerSize: 9,
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
    console.log('📐 [pdfConvocation] Positions calculées:', positions);

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
    const headerSection = positions.header || { y: 0, height: 32, width: pageWidth };

    // Add background if configured
    if (params.headerBackground) {
        const bgColor = hexToRgb(params.headerBackground) || params.headerBackground;
        doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        doc.rect(0, headerSection.y, headerSection.width, headerSection.height, 'F');
    }

    // Image header en pleine largeur (210mm pour A4 portrait)
    await addImageToPdf(
        doc,
        params.headerLogoLeft,
        0,                      // x = 0 (plaqué à gauche, pas de marge)
        headerSection.y,        // y = position de la section
        pageWidth,              // width = 210mm (toute la largeur de la page)
        headerSection.height,   // height = hauteur de la section
        params.companyName
    );

    // === SECTION REFERENCES (SOASF + PRJ) - En dessous du header ===
    const referencesSection = positions.references || { y: 32, height: 8, width: pageWidth };

    if (convocationData.references) {
        doc.setFontSize(params.textSize);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        doc.text(convocationData.references, 25, referencesSection.y + 4);
    }

    // === SECTION BODY ===
    const bodySection = positions.body || { y: 42, height: 218, width: pageWidth };
    const bodyStartY = bodySection.y;

    // Adresse destinataire (coin supérieur droit) - entreprise cliente
    doc.setFontSize(params.textSize);
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);

    // Fonction utilitaire pour formater l'adresse de l'entreprise cliente
    const formatClientAddress = (nom, adresse) => {
        const lines = [nom || 'Entreprise'];

        if (adresse) {
            // Si l'adresse contient des retours à la ligne
            if (adresse.includes('\n')) {
                lines.push(...adresse.split('\n').filter(line => line.trim()));
            } else {
                // Parsing intelligent pour une adresse sur une ligne
                // Exemple: "789 Boulevard Créatif, 33000 Bordeaux"
                const parts = adresse.split(',').map(part => part.trim());
                lines.push(...parts);
            }
        }

        return lines;
    };

    const adresseLines = formatClientAddress(
        convocationData.entreprise_nom,
        convocationData.entreprise_adresse
    );

    let yPos = bodyStartY + 5;
    adresseLines.forEach(line => {
        doc.text(line, pageWidth - 16, yPos, { align: 'right' });
        yPos += 5;
    });

    // Destinataire
    yPos = bodyStartY + 40;
    doc.setFontSize(params.textSize);
    doc.text(`À l'attention de ${convocationData.destinataire || 'Monsieur/Madame'}`, 25, yPos);

    // Objet et date
    yPos = bodyStartY + 55;
    doc.setFontSize(params.subtitleSize);
    doc.setFont('helvetica', 'bold');
    doc.text(`OBJET : ${convocationData.objet || 'Convocation pour une formation'}`, 25, yPos);

    yPos += 15;
    doc.setFontSize(params.textSize);
    doc.setFont('helvetica', 'normal');
    doc.text(`Le ${convocationData.date || new Date().toLocaleDateString('fr-FR')}`, pageWidth - 16, yPos, { align: 'right' });

    // Corps du message
    yPos = bodyStartY + 80;
    doc.text('Madame, Monsieur,', 25, yPos);

    yPos += 10;

    // Message d'introduction
    const introLines = [
        `Nous avons le plaisir de vous confirmer les dates du stage : ${convocationData.formation || 'Formation'}`,
        ''
    ];

    // Affichage des sessions individuelles
    const sessionLines = [];
    if (convocationData.sessions && convocationData.sessions.length > 0) {
        convocationData.sessions.forEach(session => {
            sessionLines.push(session);
        });
    } else {
        // Fallback vers l'ancien format si pas de sessions détaillées
        sessionLines.push(`qui se déroulera (ou dérouleront) dans les locaux de "${convocationData.lieu || 'Formation à distance'}"`);
        sessionLines.push('');
        sessionLines.push(`Le(s) ${convocationData.dates || '00/00/0000'}`);
    }

    // Message de fin et instructions
    const outroLines = [
        '',
        `Les horaires sont : ${convocationData.heures || '09h00 à 17h00'}`,
        '',
        'Nous vous remercions de préparer une salle de formation équipée d\'un poste informatique par stagiaire.',
        'Au-delà d\'un stagiaire nous préconisons un vidéo-projecteur. Pour toute question relative à l\'installation',
        'de la salle, vous pouvez prendre contact avec nos services.',
        ''
    ];

    // Gérer l'affichage des stagiaires avec accord grammatical
    const stagiairesData = convocationData.stagiairesListe || convocationData.stagiaires;
    let stagiairesArray = [];

    if (Array.isArray(stagiairesData)) {
        stagiairesArray = stagiairesData;
    } else if (typeof stagiairesData === 'string') {
        // Si c'est une string, la diviser par virgule
        stagiairesArray = stagiairesData.split(',').map(s => s.trim()).filter(s => s);
    }

    // Déterminer le singulier ou pluriel
    const nombreStagiaires = stagiairesArray.length;
    const titreStagiaires = nombreStagiaires <= 1 ?
        'Nom du stagiaire :' :
        'Noms des stagiaires :';

    outroLines.push(titreStagiaires);
    outroLines.push('');

    // Ajouter chaque stagiaire sur une ligne
    if (nombreStagiaires > 0) {
        stagiairesArray.forEach(stagiaire => {
            outroLines.push(`- ${stagiaire}`);
        });
    } else {
        outroLines.push('Liste des stagiaires à définir');
    }

    // Combiner toutes les lignes
    const messageLines = [...introLines, ...sessionLines, ...outroLines];

    messageLines.forEach(line => {
        if (line === '') {
            yPos += 5;
        } else {
            const lines = doc.splitTextToSize(line, pageWidth - 50);
            lines.forEach(textLine => {
                doc.text(textLine, 25, yPos);
                yPos += 5;
            });
        }
    });

    // Signature
    yPos += 10;
    doc.text('Nous vous prions de croire, Monsieur, à l\'assurance de nos sentiments les meilleurs.', 25, yPos);

    yPos += 20;
    doc.setFont('helvetica', 'bold');
    doc.text(convocationData.signataire || 'Nom du signataire', pageWidth - 16, yPos, { align: 'right' });
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.text(convocationData.titre_signataire || 'Titre du signataire', pageWidth - 16, yPos, { align: 'right' });

    // === SECTION FOOTER ===
    const footerSection = positions.footer || { y: pageHeight - 37, height: 37, width: pageWidth };

    // Add background if configured
    if (params.footerBackground) {
        const bgColor = hexToRgb(params.footerBackground) || params.footerBackground;
        doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        doc.rect(0, footerSection.y, footerSection.width, footerSection.height, 'F');
    }

    // Image footer en pleine largeur, sans padding, pour toucher le bas de la page
    await addImageToPdf(
        doc,
        params.footerLogoLeft,
        0,                      // x = 0 (plaqué à gauche, pas de marge)
        footerSection.y,        // y = position de la section
        pageWidth,              // width = toute la largeur de la page
        footerSection.height,   // height = hauteur de la section
        params.footerContact
    );

    return doc.output('blob');
}

// Exposer la fonction principale via window
window.generateConvocationPDF = generateConvocationPDF;

console.log('✅ [pdfConvocation] Module chargé et exposé via window.generateConvocationPDF');

})();
