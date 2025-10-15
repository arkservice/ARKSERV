// Générateur PDF pour les Évaluations
// Document d'évaluation avec graphique radar Qualiopi
(function() {
    'use strict';

    // Récupérer les utilitaires depuis window.pdfCore
    const { hexToRgb, addImageToPdf } = window.pdfCore;

// === FONCTION HELPER : GÉNÉRER IMAGE DU GRAPHIQUE RADAR ===
async function generateRadarChartImage(themes, formateurThemes) {
    return new Promise((resolve, reject) => {
        try {
            // Vérifier que Chart.js est disponible
            if (typeof Chart === 'undefined') {
                console.error('Chart.js non disponible');
                reject(new Error('Chart.js non disponible'));
                return;
            }

            // Créer un canvas temporaire - FORMAT RECTANGULAIRE pour équilibrer les paddings
            // Plus large que haut car les labels sur les côtés sont plus longs
            const canvas = document.createElement('canvas');
            canvas.width = 1600;   // Largeur augmentée pour les labels longs
            canvas.height = 1200;  // Hauteur réduite pour équilibrer
            const ctx = canvas.getContext('2d');

            // Préparer les données comme dans RadarChart.js
            // Trier les thèmes numériquement (1, 2, 3... 10, 11, 12) au lieu d'alphabétiquement
            const themeKeys = Object.keys(themes).sort((a, b) => {
                const numA = parseInt(a.replace('theme_', ''));
                const numB = parseInt(b.replace('theme_', ''));
                return numA - numB;
            });
            const labels = themeKeys.map(key => {
                const pointNumber = key.replace('theme_', '');
                const titre = themes[key].titre || key;
                const labelWithNumber = `${pointNumber} - ${titre}`;
                return labelWithNumber.length > 35 ? labelWithNumber.substring(0, 35) + '...' : labelWithNumber;
            });

            const dataAvant = themeKeys.map(key => themes[key].avant || 0);
            const dataApres = themeKeys.map(key => themes[key].apres || 0);
            const dataFormateur = formateurThemes ? themeKeys.map(key => formateurThemes[key]?.note || 0) : null;

            // Construire les datasets
            const datasets = [
                {
                    label: 'À l\'entrée en formation',
                    data: dataAvant,
                    borderColor: 'rgb(236, 72, 153)',
                    backgroundColor: 'rgba(236, 72, 153, 0.2)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgb(236, 72, 153)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgb(236, 72, 153)'
                },
                {
                    label: 'À la sortie de formation',
                    data: dataApres,
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgb(59, 130, 246)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgb(59, 130, 246)'
                }
            ];

            // Ajouter dataset formateur si disponible
            if (dataFormateur) {
                datasets.push({
                    label: 'Évaluation formateur',
                    data: dataFormateur,
                    borderColor: 'rgb(34, 197, 94)',
                    backgroundColor: 'rgba(34, 197, 94, 0.2)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgb(34, 197, 94)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgb(34, 197, 94)'
                });
            }

            // Créer le graphique Chart.js SANS légende (on la dessinera manuellement)
            const chart = new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: labels,
                    datasets: datasets
                },
                options: {
                    responsive: false,
                    animation: false, // Désactiver l'animation pour l'export
                    layout: {
                        padding: {
                            top: 2,
                            bottom: 2,
                            left: 2,
                            right: 2
                        }
                    },
                    scales: {
                        r: {
                            min: 0,
                            max: 5,
                            ticks: {
                                stepSize: 1,
                                callback: function(value) {
                                    return value;
                                },
                                backdropPadding: 1,
                                font: {
                                    size: 16
                                }
                            },
                            pointLabels: {
                                font: {
                                    size: 18
                                },
                                padding: 5
                            },
                            grid: {
                                lineWidth: 1
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false  // DÉSACTIVER la légende Chart.js
                        }
                    }
                }
            });

            // Attendre que le graphique soit rendu
            setTimeout(() => {
                const imageData = canvas.toDataURL('image/png');
                chart.destroy();
                resolve(imageData);
            }, 500);

        } catch (error) {
            console.error('Erreur génération graphique radar:', error);
            reject(error);
        }
    });
}

// Helper: Render header (réutilisé depuis PDC)
async function renderHeader(doc, params) {
    const headerImageUrl = params.headerLogoLeft;
    const headerImageAdded = await addImageToPdf(
        doc,
        headerImageUrl,
        0, 0, 210, 22,
        params.companyName
    );

    if (!headerImageAdded) {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(31, 41, 55);
        doc.text(params.companyName, 10, 12);

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(19, 62, 94);
        const arkanceWidth = doc.getTextWidth(params.brandName || 'ARKANCE');
        doc.text(params.brandName || 'ARKANCE', 210 - 10 - arkanceWidth, 12);
    }
}

// Helper: Render footer (réutilisé depuis PDC)
async function renderFooter(doc, params) {
    const pageHeight = 297;
    const footerStartY = 260;

    const footerImageUrl = params.footerLogoLeft;
    const footerImageAdded = await addImageToPdf(
        doc,
        footerImageUrl,
        0, footerStartY, 210, 37,
        params.footerContact
    );

    if (!footerImageAdded) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(107, 114, 128);

        const footerY = footerStartY + 15;
        const footerText = [
            params.footerAddress,
            params.footerContact
        ];

        let textY = footerY;
        for (const line of footerText) {
            if (line) {
                const lineWidth = doc.getTextWidth(line);
                doc.text(line, (210 - lineWidth) / 2, textY);
                textY += 4;
            }
        }
    }
}

// === GÉNÉRATEUR PDF POUR ÉVALUATION ===
async function generateEvaluationPDF(evaluationData, layoutParams = {}) {
    console.log('🔧 [DEBUG] generateEvaluationPDF appelée');
    console.log('📄 [DEBUG] Données évaluation:', evaluationData);

    // Vérifier que jsPDF est disponible
    let jsPDF;
    if (window.jsPDF) {
        jsPDF = window.jsPDF;
    } else if (window.jspdf && window.jspdf.jsPDF) {
        jsPDF = window.jspdf.jsPDF;
    } else {
        throw new Error('jsPDF n\'est pas chargé');
    }

    // Paramètres par défaut
    const defaultParams = {
        primaryColor: [19, 62, 94],
        grayColor: [55, 65, 81],
        lightGrayColor: [107, 114, 128],
        titleSize: 16,
        textSize: 9,
        labelSize: 9,
        companyName: 'ARKANCE',
        brandName: 'ARKANCE',
        footerAddress: 'LE VAL SAINT QUENTIN - Bâtiment C - 2, rue René Caudron - CS 30764 - 78961 Voisins-le-Bretonneux Cedex',
        footerContact: 'www.arkance-systems.fr - formation@arkance-systems.com - Tél. : 01 39 44 18 18',
        headerLogoLeft: null,
        footerLogoLeft: null
    };

    const params = { ...defaultParams, ...layoutParams };

    // Créer le document PDF A4 portrait
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const primaryColor = hexToRgb(params.primaryColor) || params.primaryColor;
    const grayColor = hexToRgb(params.grayColor) || params.grayColor;

    // === HEADER (0-22mm) ===
    await renderHeader(doc, params);

    // === TITRE ET INFOS (22-75mm) ===
    let yPos = 28;

    // Titre centré
    doc.setFontSize(params.titleSize);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    const titre = 'ÉVALUATION QUALIOPI';
    const titreWidth = doc.getTextWidth(titre);
    doc.text(titre, (pageWidth - titreWidth) / 2, yPos);

    yPos += 8;

    // Sous-titre Formation + PRJ
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...grayColor);
    const formation = evaluationData.formation || {};
    const sousTitre = `${formation.pdc?.ref || 'N/A'} - PRJ ${formation.prj || 'N/A'}`;
    const sousTitreWidth = doc.getTextWidth(sousTitre);
    doc.text(sousTitre, (pageWidth - sousTitreWidth) / 2, yPos);

    yPos += 12;

    // Encadré informations
    doc.setFillColor(243, 244, 246);
    doc.rect(15, yPos, pageWidth - 30, 26, 'F');

    yPos += 7;
    doc.setFontSize(params.textSize);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('Stagiaire:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...grayColor);
    doc.text(`${evaluationData.stagiaire_prenom || ''} ${evaluationData.stagiaire_nom || ''}`, 50, yPos);

    yPos += 5;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('Société:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...grayColor);
    doc.text(evaluationData.stagiaire_societe || 'N/A', 50, yPos);

    yPos += 5;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('Formateur:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...grayColor);
    const formateur = formation.formateur || {};
    doc.text(`${formateur.prenom || ''} ${formateur.nom || ''}`, 50, yPos);

    yPos += 5;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('Date:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...grayColor);
    const dateEval = evaluationData.submitted_at ? new Date(evaluationData.submitted_at).toLocaleDateString('fr-FR') : 'N/A';
    doc.text(dateEval, 50, yPos);

    // Statut en badge couleur
    const xStatut = 120;
    const statut = evaluationData.statut || 'À traiter';
    const isTraitee = statut === 'Traitée';
    doc.setFillColor(isTraitee ? 220 : 254, isTraitee ? 252 : 243, isTraitee ? 231 : 199);
    doc.roundedRect(xStatut, yPos - 4, 30, 6, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(isTraitee ? 21 : 161, isTraitee ? 128 : 98, isTraitee ? 61 : 7);
    doc.text(statut, xStatut + 3, yPos);

    yPos += 9;

    // === GRAPHIQUE RADAR (75-145mm) ===
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('Graphique Qualiopi', 20, yPos);

    yPos += 8;

    // Générer et insérer le graphique radar
    const themes = evaluationData.qualiopi_themes || {};
    const formateurThemes = evaluationData.qualiopi_formateur_themes || null;

    if (Object.keys(themes).length > 0) {
        try {
            const radarImageData = await generateRadarChartImage(themes, formateurThemes);

            // Dimensions du graphique : 150mm de large × 60mm de haut (centré)
            const graphWidth = 150;
            const graphHeight = 60;
            const graphX = (pageWidth - graphWidth) / 2;

            doc.addImage(radarImageData, 'PNG', graphX, yPos, graphWidth, graphHeight);
            yPos += graphHeight + 5;
        } catch (error) {
            console.error('Erreur insertion graphique radar:', error);
            // Fallback : afficher un message d'erreur
            doc.setFontSize(10);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(220, 38, 38);
            doc.text('[ Erreur génération graphique ]', 20, yPos + 30);
            yPos += 70;
        }
    } else {
        // Pas de données Qualiopi
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(107, 114, 128);
        doc.text('[ Aucune donnée Qualiopi disponible ]', 20, yPos + 30);
        yPos += 70;
    }

    // === TABLEAU DES NOTES (170-260mm) ===
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('Notes détaillées par thème', 20, yPos);

    yPos += 8;

    const themeKeys = Object.keys(themes).sort();

    // Tableau sur 2 colonnes
    const colWidth = (pageWidth - 50) / 2;
    let col1Y = yPos;
    let col2Y = yPos;
    const col1X = 20;
    const col2X = 20 + colWidth + 10;

    doc.setFontSize(8);

    themeKeys.forEach((themeKey, index) => {
        const theme = themes[themeKey];
        const pointNumber = themeKey.replace('theme_', '');
        const isCol1 = index % 2 === 0;
        const xStart = isCol1 ? col1X : col2X;
        let currentY = isCol1 ? col1Y : col2Y;

        // Fond alterné
        if (index % 4 < 2) {
            doc.setFillColor(249, 250, 251);
            doc.rect(xStart, currentY - 2.5, colWidth, 13, 'F');
        }

        // Titre thème
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        doc.setFontSize(7.5);
        const titreTheme = `${pointNumber}. ${theme.titre || themeKey}`;
        const titreLines = doc.splitTextToSize(titreTheme, colWidth - 4);
        doc.text(titreLines[0], xStart + 2, currentY);
        currentY += 3.5;

        // Notes
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...grayColor);
        doc.setFontSize(6.5);
        doc.text(`Entrée: ${theme.avant || 0}/5`, xStart + 2, currentY);
        doc.text(`Sortie: ${theme.apres || 0}/5`, xStart + 2, currentY + 2.5);

        const progression = (theme.apres || 0) - (theme.avant || 0);
        const progressionText = progression > 0 ? `+${progression}` : `${progression}`;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(progression > 0 ? 34 : progression < 0 ? 220 : 107, progression > 0 ? 197 : progression < 0 ? 38 : 114, progression > 0 ? 94 : progression < 0 ? 38 : 128);
        doc.text(`Prog: ${progressionText}`, xStart + 2, currentY + 5);

        // Note formateur si disponible
        if (formateurThemes && formateurThemes[themeKey]) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6.5);
            doc.setTextColor(34, 197, 94);
            doc.text(`Form: ${formateurThemes[themeKey].note || 0}/5`, xStart + 2, currentY + 7.5);
        }

        currentY += 13;

        // Mettre à jour la hauteur de la colonne
        if (isCol1) {
            col1Y = currentY;
        } else {
            col2Y = currentY;
        }
    });

    // === FOOTER (260-297mm) ===
    await renderFooter(doc, params);

    return doc.output('blob');
}

// Exposer la fonction principale via window
window.generateEvaluationPDF = generateEvaluationPDF;

console.log('✅ [pdfEvaluation] Module chargé et exposé via window.generateEvaluationPDF');

})();
