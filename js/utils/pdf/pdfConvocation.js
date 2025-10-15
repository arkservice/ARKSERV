// Générateur PDF pour les Convocations
// Document formel de convocation à une formation
(function() {
    'use strict';

    // Récupérer les utilitaires depuis window.pdfCore
    const { hexToRgb, addImageToPdf } = window.pdfCore;

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

    // Header avec logo
    await addImageToPdf(doc, params.headerLogoLeft, 0, 0, pageWidth, 22, params.companyName);

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

    let yPos = 35;
    adresseLines.forEach(line => {
        doc.text(line, pageWidth - 10, yPos, { align: 'right' });
        yPos += 5;
    });

    // Destinataire
    yPos = 70;
    doc.setFontSize(params.textSize);
    doc.text(`À l'attention de ${convocationData.destinataire || 'Monsieur/Madame'}`, 20, yPos);

    // Objet et date
    yPos = 85;
    doc.setFontSize(params.subtitleSize);
    doc.setFont('helvetica', 'bold');
    doc.text(`OBJET : ${convocationData.objet || 'Convocation pour une formation'}`, 20, yPos);

    yPos += 15;
    doc.setFontSize(params.textSize);
    doc.setFont('helvetica', 'normal');
    doc.text(`Le ${convocationData.date || new Date().toLocaleDateString('fr-FR')}`, pageWidth - 10, yPos, { align: 'right' });

    // Corps du message
    yPos = 110;
    doc.text('Monsieur,', 20, yPos);

    yPos += 10;

    // Message d'introduction
    const introLines = [
        `Nous avons le plaisir de vous confirmer les dates du (ou des) stage(s) ${convocationData.formation || 'Formation'} - ${convocationData.concept || 'Concepts de base'}`,
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
        `de ${convocationData.heures || '09h00 à 17h00'}`,
        '',
        'Nous vous remercions de préparer une salle de formation équipée d\'un poste informatique par stagiaire.',
        'Au-delà d\'un stagiaire nous préconisons un vidéo-projecteur. Pour toute question relative à l\'installation',
        'de la salle, vous pouvez prendre contact avec nos services.',
        '',
        'Nom(s) du (ou des) stagiaire(s) :',
        '',
        convocationData.stagiaires || 'Liste des stagiaires'
    ];

    // Combiner toutes les lignes
    const messageLines = [...introLines, ...sessionLines, ...outroLines];

    messageLines.forEach(line => {
        if (line === '') {
            yPos += 5;
        } else {
            const lines = doc.splitTextToSize(line, pageWidth - 40);
            lines.forEach(textLine => {
                doc.text(textLine, 20, yPos);
                yPos += 5;
            });
        }
    });

    // Signature
    yPos += 10;
    doc.text('Nous vous prions de croire, Monsieur, à l\'assurance de nos sentiments les meilleurs.', 20, yPos);

    yPos += 20;
    doc.setFont('helvetica', 'bold');
    doc.text(convocationData.signataire || 'Nom du signataire', pageWidth - 10, yPos, { align: 'right' });
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.text(convocationData.titre_signataire || 'Titre du signataire', pageWidth - 10, yPos, { align: 'right' });

    // Footer
    await addImageToPdf(doc, params.footerLogoLeft, 0, pageHeight - 37, pageWidth, 37, params.footerContact);

    return doc.output('blob');
}

// Exposer la fonction principale via window
window.generateConvocationPDF = generateConvocationPDF;

console.log('✅ [pdfConvocation] Module chargé et exposé via window.generateConvocationPDF');

})();
