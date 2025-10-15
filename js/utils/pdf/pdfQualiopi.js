// Générateur PDF pour les Évaluations Qualiopi (Template officiel)
// Document d'évaluation conforme aux exigences Qualiopi
(function() {
    'use strict';

    // Récupérer les utilitaires depuis window.pdfCore
    const { hexToRgb, addImageToPdf } = window.pdfCore;

// === FONCTION HELPER : GÉNÉRER IMAGE DU GRAPHIQUE RADAR ===
// (Dupliquée depuis pdfEvaluation.js pour autonomie du module)
async function generateRadarChartImage(themes, formateurThemes) {
    return new Promise((resolve, reject) => {
        try {
            // Vérifier que Chart.js est disponible
            if (typeof Chart === 'undefined') {
                console.error('Chart.js non disponible');
                reject(new Error('Chart.js non disponible'));
                return;
            }

            const canvas = document.createElement('canvas');
            canvas.width = 1600;
            canvas.height = 1200;
            const ctx = canvas.getContext('2d');

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

            const chart = new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: labels,
                    datasets: datasets
                },
                options: {
                    responsive: false,
                    animation: false,
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
                            display: false
                        }
                    }
                }
            });

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

// Rendu du header Qualiopi (0-30mm)
async function renderQualiopiHeader(doc, data, params, pageWidth, primaryColor, grayColor) {
    console.log('🎨 [DEBUG] Rendu header Qualiopi');

    const refCode = data.formation?.pdc?.ref || 'PC-FOR-XXXXX';

    // Logo ARKANCE en haut à droite
    let logoAdded = false;
    if (params.headerLogoLeft) {
        logoAdded = await addImageToPdf(
            doc,
            params.headerLogoLeft,
            pageWidth - 60, 5,
            55, 15,
            params.companyName
        );
    }

    if (!logoAdded) {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        const arkanceWidth = doc.getTextWidth('ARKANCE');
        doc.text('ARKANCE', pageWidth - 10 - arkanceWidth, 15);
    }

    // Code de référence en haut à gauche
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...grayColor);
    doc.text(refCode, 10, 10);

    // Titre principal centré
    let yTitle = 25;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...primaryColor);
    const titre = 'EVALUATION DES ACQUIS ET ATTEINTE DES OBJECTIFS';
    const titreWidth = doc.getTextWidth(titre);
    doc.text(titre, (pageWidth - titreWidth) / 2, yTitle);

    yTitle += 5;
    const sousTitre = 'PAR LE STAGIAIRE';
    const sousTitreWidth = doc.getTextWidth(sousTitre);
    doc.text(sousTitre, (pageWidth - sousTitreWidth) / 2, yTitle);
}

// Rendu des informations stagiaire (30-55mm)
function renderQualiopiStagiaireInfo(doc, data, params, pageWidth, grayColor, startY) {
    console.log('👤 [DEBUG] Rendu informations stagiaire');

    let yPos = startY;

    doc.setFontSize(params.textSize);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...grayColor);

    const col1X = 15;
    const col2X = 110;

    // Ligne 1
    doc.setFont('helvetica', 'bold');
    doc.text('Nom du stagiaire :', col1X, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(data.stagiaire_nom || '', col1X + 35, yPos);

    doc.setFont('helvetica', 'bold');
    doc.text('Société :', col2X, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(data.stagiaire_societe || '', col2X + 20, yPos);

    yPos += 6;

    // Ligne 2
    doc.setFont('helvetica', 'bold');
    doc.text('Prénom du stagiaire :', col1X, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(data.stagiaire_prenom || '', col1X + 35, yPos);

    doc.setFont('helvetica', 'bold');
    doc.text('Email du stagiaire :', col2X, yPos);
    doc.setFont('helvetica', 'normal');
    const emailText = data.stagiaire_email || '';
    const emailWidth = doc.getTextWidth(emailText);
    if (emailWidth > 80) {
        doc.setFontSize(7);
    }
    doc.text(emailText, col2X + 32, yPos);

    return yPos + 10;
}

// Rendu du tableau des compétences (55-150mm)
function renderQualiopiCompetencesTable(doc, data, params, pageWidth, primaryColor, grayColor, startY) {
    console.log('📊 [DEBUG] Rendu tableau compétences');

    const themes = data.qualiopi_themes || {};
    const formateurThemes = data.qualiopi_formateur_themes || {};

    const themeKeys = Object.keys(themes).sort((a, b) => {
        const numA = parseInt(a.replace('theme_', ''));
        const numB = parseInt(b.replace('theme_', ''));
        return numA - numB;
    });

    if (themeKeys.length === 0) {
        return startY;
    }

    let yPos = startY;

    // En-tête du tableau
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('COMPETENCES A ACQUERIR LORS DE LA FORMATION', 15, yPos);

    yPos += 7;

    // Dimensions du tableau
    const tableStartX = 15;
    const tableWidth = pageWidth - 30;
    const col1Width = 110;
    const col2Width = 25;
    const col3Width = 25;
    const col4Width = 25;

    // En-tête du tableau avec fond gris
    doc.setFillColor(200, 200, 200);
    doc.rect(tableStartX, yPos - 5, tableWidth, 10, 'F');

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);

    doc.text('COMPETENCES A ACQUERIR LORS DE LA FORMATION', tableStartX + 2, yPos);
    doc.text('A L\'ENTREE EN', tableStartX + col1Width + 2, yPos - 2);
    doc.text('FORMATION', tableStartX + col1Width + 2, yPos + 1.5);
    doc.text('A LA SORTIE DE', tableStartX + col1Width + col2Width + 2, yPos - 2);
    doc.text('FORMATION', tableStartX + col1Width + col2Width + 2, yPos + 1.5);
    doc.text('EVALUATION', tableStartX + col1Width + col2Width + col3Width + 2, yPos - 2);
    doc.text('PAR LE', tableStartX + col1Width + col2Width + col3Width + 2, yPos + 1);
    doc.text('FORMATEUR A', tableStartX + col1Width + col2Width + col3Width + 2, yPos + 2.5);
    doc.text('LA SORTIE', tableStartX + col1Width + col2Width + col3Width + 2, yPos + 5);

    yPos += 8;

    // Lignes du tableau
    doc.setFontSize(params.tableCellSize);
    doc.setFont('helvetica', 'normal');

    const rowHeight = 6;
    let rowIndex = 0;

    themeKeys.forEach(themeKey => {
        const theme = themes[themeKey];
        const formateurTheme = formateurThemes[themeKey] || {};
        const pointNumber = themeKey.replace('theme_', '');

        // Fond alterné
        if (rowIndex % 2 === 0) {
            doc.setFillColor(249, 250, 251);
            doc.rect(tableStartX, yPos - 4, tableWidth, rowHeight, 'F');
        }

        // Bordures des cellules
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.1);
        doc.rect(tableStartX, yPos - 4, col1Width, rowHeight);
        doc.rect(tableStartX + col1Width, yPos - 4, col2Width, rowHeight);
        doc.rect(tableStartX + col1Width + col2Width, yPos - 4, col3Width, rowHeight);
        doc.rect(tableStartX + col1Width + col2Width + col3Width, yPos - 4, col4Width, rowHeight);

        // Contenu
        doc.setTextColor(...grayColor);
        doc.setFont('helvetica', 'normal');

        const competenceText = `${pointNumber} – ${theme.titre}`;
        const competenceLines = doc.splitTextToSize(competenceText, col1Width - 4);
        doc.text(competenceLines[0], tableStartX + 2, yPos);

        // Notes centrées
        doc.setFont('helvetica', 'bold');
        const entree = (theme.avant || 0).toString();
        const sortie = (theme.apres || 0).toString();
        const formateur = (formateurTheme.note || 0).toString();

        doc.text(entree, tableStartX + col1Width + col2Width / 2 - doc.getTextWidth(entree) / 2, yPos);
        doc.text(sortie, tableStartX + col1Width + col2Width + col3Width / 2 - doc.getTextWidth(sortie) / 2, yPos);
        doc.text(formateur, tableStartX + col1Width + col2Width + col3Width + col4Width / 2 - doc.getTextWidth(formateur) / 2, yPos);

        yPos += rowHeight;
        rowIndex++;
    });

    return yPos + 2;
}

// Rendu du graphique radar (150-225mm)
async function renderQualiopiRadarChart(doc, data, params, pageWidth, startY) {
    console.log('📈 [DEBUG] Rendu graphique radar Qualiopi');

    const themes = data.qualiopi_themes || {};
    const formateurThemes = data.qualiopi_formateur_themes || null;

    if (Object.keys(themes).length === 0) {
        return startY;
    }

    let yPos = startY;

    // === DESSINER LA LÉGENDE MANUELLEMENT ===
    const legendItems = [
        { label: 'À l\'entrée en formation', color: [236, 72, 153] },
        { label: 'À la sortie de formation', color: [59, 130, 246] }
    ];

    if (formateurThemes) {
        legendItems.push({ label: 'Évaluation formateur', color: [34, 197, 94] });
    }

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    const circleRadius = 2;
    const circleTextGap = 3;
    const itemGap = 8;

    let totalLegendWidth = 0;
    const itemWidths = [];

    legendItems.forEach((item, index) => {
        const textWidth = doc.getTextWidth(item.label);
        const itemWidth = circleRadius * 2 + circleTextGap + textWidth;
        itemWidths.push(itemWidth);
        totalLegendWidth += itemWidth;
        if (index < legendItems.length - 1) {
            totalLegendWidth += itemGap;
        }
    });

    let xLegend = (pageWidth - totalLegendWidth) / 2;
    const yLegend = yPos;

    legendItems.forEach((item, index) => {
        doc.setFillColor(...item.color);
        doc.circle(xLegend + circleRadius, yLegend - 1, circleRadius, 'F');

        doc.setTextColor(55, 65, 81);
        doc.text(item.label, xLegend + circleRadius * 2 + circleTextGap, yLegend);

        xLegend += itemWidths[index] + itemGap;
    });

    yPos += 8;

    // === DESSINER LE GRAPHIQUE RADAR ===
    try {
        const radarImageData = await generateRadarChartImage(themes, formateurThemes);

        const graphWidth = 140;
        const graphHeight = 105;
        const graphX = (pageWidth - graphWidth) / 2;

        doc.addImage(radarImageData, 'PNG', graphX, yPos, graphWidth, graphHeight);
        yPos += graphHeight + 2;
    } catch (error) {
        console.error('Erreur insertion graphique radar:', error);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(220, 38, 38);
        doc.text('[ Erreur génération graphique ]', 20, yPos + 30);
        yPos += 75;
    }

    return yPos;
}

// Rendu des résultats (225-260mm)
function renderQualiopiResultats(doc, data, params, pageWidth, primaryColor, grayColor, startY) {
    console.log('📊 [DEBUG] Rendu résultats');

    let yPos = startY;

    // Titre section
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('Analyse des résultats :', 15, yPos);

    yPos += 5;

    // Note explicative
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...grayColor);
    const noteLines = [
        'Arkance établit, à partir de ces notes d\'autoévaluation du stagiaire, une moyenne de sa progression entre l\'entrée et la sortie de la formation.',
        'Arkance réalise la moyenne de l\'évaluation formateur ce qui donne lieu à une appréciation des objectifs du programme (Non atteints,',
        'Partiellement atteints, Atteints).'
    ];
    noteLines.forEach(line => {
        doc.text(line, 15, yPos);
        yPos += 2.5;
    });

    yPos += 3;

    // Calculer les moyennes
    const themes = data.qualiopi_themes || {};
    const formateurThemes = data.qualiopi_formateur_themes || {};
    const themeKeys = Object.keys(themes);

    let totalProgression = 0;
    let totalFormateur = 0;
    let countThemes = 0;

    themeKeys.forEach(key => {
        const theme = themes[key];
        const progression = (theme.apres || 0) - (theme.avant || 0);
        totalProgression += progression;

        if (formateurThemes[key]) {
            totalFormateur += (formateurThemes[key].note || 0);
        }
        countThemes++;
    });

    const moyenneProgression = countThemes > 0 ? (totalProgression / countThemes).toFixed(1) : '0.0';
    const moyenneFormateur = countThemes > 0 ? (totalFormateur / countThemes).toFixed(1) : '0.0';

    // Déterminer l'atteinte des objectifs
    let objectifsStatus = 'NON ATTEINTS';
    const moyFormateurNum = parseFloat(moyenneFormateur);
    if (moyFormateurNum >= 4.0) {
        objectifsStatus = 'ATTEINTS';
    } else if (moyFormateurNum >= 3.0) {
        objectifsStatus = 'PARTIELLEMENT ATTEINTS';
    }

    // Encadré des résultats
    doc.setFillColor(243, 244, 246);
    doc.rect(15, yPos - 3, pageWidth - 30, 25, 'F');

    doc.setFontSize(params.textSize);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);

    doc.text('Moyenne de la progression du stagiaire :', 20, yPos + 3);
    doc.setFont('helvetica', 'normal');
    doc.text(moyenneProgression, 120, yPos + 3);

    yPos += 7;

    doc.setFont('helvetica', 'bold');
    doc.text('Moyenne de l\'évaluation formateur :', 20, yPos + 3);
    doc.setFont('helvetica', 'normal');
    doc.text(moyenneFormateur, 120, yPos + 3);

    yPos += 7;

    doc.setFont('helvetica', 'bold');
    doc.text('Objectifs de la formation :', 20, yPos + 3);

    // Couleur selon le statut
    if (objectifsStatus === 'ATTEINTS') {
        doc.setTextColor(34, 197, 94);
    } else if (objectifsStatus === 'PARTIELLEMENT ATTEINTS') {
        doc.setTextColor(251, 146, 60);
    } else {
        doc.setTextColor(220, 38, 38);
    }
    doc.text(objectifsStatus, 120, yPos + 3);
}

// === GÉNÉRATEUR PDF POUR QUALIOPI ===
async function generateQualiopiPDF(evaluationData, layoutParams = {}) {
    console.log('🔧 [DEBUG] generateQualiopiPDF appelée');
    console.log('📄 [DEBUG] Données évaluation Qualiopi:', evaluationData);

    // Vérifier que jsPDF est disponible
    let jsPDF;
    if (window.jsPDF) {
        jsPDF = window.jsPDF;
    } else if (window.jspdf && window.jspdf.jsPDF) {
        jsPDF = window.jspdf.jsPDF;
    } else {
        throw new Error('jsPDF n\'est pas chargé');
    }

    // Paramètres par défaut pour Qualiopi
    const defaultParams = {
        primaryColor: [19, 62, 94],
        grayColor: [55, 65, 81],
        lightGrayColor: [107, 114, 128],
        titleSize: 14,
        textSize: 9,
        labelSize: 8,
        tableHeaderSize: 8,
        tableCellSize: 7,
        companyName: 'ARKANCE',
        headerLogoLeft: null
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

    // === HEADER (0-30mm) ===
    await renderQualiopiHeader(doc, evaluationData, params, pageWidth, primaryColor, grayColor);

    // === INFORMATIONS STAGIAIRE (30-55mm) ===
    let yPos = renderQualiopiStagiaireInfo(doc, evaluationData, params, pageWidth, grayColor, 30);

    // === TABLEAU DES COMPÉTENCES (55-150mm) ===
    yPos = renderQualiopiCompetencesTable(doc, evaluationData, params, pageWidth, primaryColor, grayColor, yPos);

    // === GRAPHIQUE RADAR (150-225mm) ===
    yPos = await renderQualiopiRadarChart(doc, evaluationData, params, pageWidth, yPos);

    // === RÉSULTATS (225-260mm) ===
    renderQualiopiResultats(doc, evaluationData, params, pageWidth, primaryColor, grayColor, yPos);

    return doc.output('blob');
}

// Exposer la fonction principale via window
window.generateQualiopiPDF = generateQualiopiPDF;

console.log('✅ [pdfQualiopi] Module chargé et exposé via window.generateQualiopiPDF');

})();
