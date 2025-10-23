// Générateur PDF pour les Évaluations Qualiopi (Template officiel)
// Document d'évaluation conforme aux exigences Qualiopi
(function() {
    'use strict';

    // Récupérer les utilitaires depuis window.pdfCore et pdfSectionMapper
    const { hexToRgb, addImageToPdf } = window.pdfCore;
    const { getSectionPositions } = window.pdfSectionMapper;

// === FONCTION HELPER : GÉNÉRER IMAGE DU GRAPHIQUE RADAR (LEGACY - PNG) ===
// CETTE FONCTION N'EST PLUS UTILISÉE - Remplacée par drawRadarChartVector (vectoriel)
// Conservée pour référence et rollback si nécessaire
async function generateRadarChartImage_LEGACY(themes, formateurThemes) {
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
                                color: 'rgba(107, 114, 128, 0.8)',  // Gris plus foncé (#6b7280)
                                lineWidth: 2  // Ligne plus épaisse
                            },
                            angleLines: {
                                color: 'rgba(107, 114, 128, 0.8)',  // Même couleur que les cercles concentriques
                                lineWidth: 2  // Même épaisseur que les cercles concentriques
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

// === FONCTION HELPER : DESSINER GRAPHIQUE RADAR VECTORIEL ===
// Dessine le graphique radar directement avec les primitives jsPDF (vectoriel, ultra-léger)
function drawRadarChartVector(doc, themes, formateurThemes, x, y, width, height) {
    // Calculer le centre et le rayon du graphique
    const cx = x + width / 2;
    const cy = y + height / 2;
    const radius = (Math.min(width, height) / 2 - 20) * 1.43; // Rayon +43% par rapport à l'original

    // Extraire et trier les clés des thèmes
    const themeKeys = Object.keys(themes).sort((a, b) => {
        const numA = parseInt(a.replace('theme_', ''));
        const numB = parseInt(b.replace('theme_', ''));
        return numA - numB;
    });

    const numPoints = themeKeys.length;
    const angleStep = (2 * Math.PI) / numPoints;

    // Fonction helper : convertir coordonnées polaires en cartésiennes
    const polarToCartesian = (angle, r) => {
        // Rotation de -90° pour que le premier point soit en haut
        const adjustedAngle = angle - Math.PI / 2;
        return {
            x: cx + r * Math.cos(adjustedAngle),
            y: cy + r * Math.sin(adjustedAngle)
        };
    };

    // === 1. DESSINER LA GRILLE ===
    doc.setDrawColor(107, 114, 128); // Gris foncé #6b7280
    doc.setLineWidth(0.15); // 50% plus fin qu'avant

    // Cercles concentriques (5 niveaux pour notes de 1 à 5)
    for (let level = 1; level <= 5; level++) {
        const r = (radius / 5) * level;
        doc.circle(cx, cy, r, 'S');
    }

    // Axes radiaux (un par thème)
    for (let i = 0; i < numPoints; i++) {
        const angle = i * angleStep;
        const endPoint = polarToCartesian(angle, radius);
        doc.line(cx, cy, endPoint.x, endPoint.y);
    }

    // === 2. DESSINER LES POLYGONES EN PELURES D'OIGNON ===
    // Fonction helper pour calculer les points d'un polygone
    const getPolygonPoints = (data) => {
        return themeKeys.map((key, i) => {
            const value = data[i] || 0;
            const r = (radius / 5) * value; // Échelle 0-5
            const angle = i * angleStep;
            return polarToCartesian(angle, r);
        });
    };

    // Fonction helper pour calculer la moyenne d'un dataset
    const calculateAverage = (data) => {
        if (!data || data.length === 0) return 0;
        const sum = data.reduce((acc, val) => acc + (val || 0), 0);
        return sum / data.length;
    };

    // Fonction pour dessiner le remplissage d'un polygone (sans contour) avec transparence
    const drawPolygonFill = (points, color) => {
        if (!points || points.length === 0) return;

        // Activer la transparence à 75% (opacité 25%)
        const gs = new doc.GState({ opacity: 0.25 });
        doc.setGState(gs);

        doc.setFillColor(color[0], color[1], color[2]);

        // Créer un tableau de lignes relatives au premier point
        const lines = [];
        for (let i = 1; i < points.length; i++) {
            lines.push([
                points[i].x - points[i - 1].x,
                points[i].y - points[i - 1].y
            ]);
        }
        // Fermer le polygone en revenant au premier point
        lines.push([
            points[0].x - points[points.length - 1].x,
            points[0].y - points[points.length - 1].y
        ]);

        // Dessiner avec remplissage seulement ('F')
        doc.lines(lines, points[0].x, points[0].y, [1, 1], 'F');

        // Réinitialiser l'opacité
        doc.setGState(new doc.GState({ opacity: 1.0 }));
    };

    // Fonction pour dessiner le contour d'un polygone (sans remplissage)
    const drawPolygonOutline = (points, color) => {
        if (!points || points.length === 0) return;

        doc.setDrawColor(color[0], color[1], color[2]);
        doc.setLineWidth(0.4); // 50% plus fin qu'avant

        // Dessiner les lignes du polygone
        for (let i = 0; i < points.length; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % points.length];
            doc.line(p1.x, p1.y, p2.x, p2.y);
        }
    };

    // Données pour chaque série
    const dataAvant = themeKeys.map(key => themes[key].avant || 0);
    const dataApres = themeKeys.map(key => themes[key].apres || 0);
    const dataFormateur = formateurThemes ? themeKeys.map(key => formateurThemes[key]?.note || 0) : null;

    // Couleurs
    const colorAvant = [236, 72, 153];  // Rose
    const colorApres = [59, 130, 246];   // Bleu
    const colorFormateur = [34, 197, 94]; // Vert

    // Créer les datasets avec leurs points et moyennes
    const datasets = [
        { data: dataAvant, color: colorAvant, points: getPolygonPoints(dataAvant), moy: calculateAverage(dataAvant) }
    ];

    if (dataApres) {
        datasets.push({ data: dataApres, color: colorApres, points: getPolygonPoints(dataApres), moy: calculateAverage(dataApres) });
    }

    if (dataFormateur) {
        datasets.push({ data: dataFormateur, color: colorFormateur, points: getPolygonPoints(dataFormateur), moy: calculateAverage(dataFormateur) });
    }

    // Trier par moyenne décroissante (le plus grand sera dessiné en premier)
    datasets.sort((a, b) => b.moy - a.moy);

    // PHASE 1 : Dessiner tous les remplissages opaques (du plus grand au plus petit)
    datasets.forEach(ds => {
        drawPolygonFill(ds.points, ds.color);
    });

    // PHASE 2 : Redessiner tous les contours pour qu'ils restent visibles
    datasets.forEach(ds => {
        drawPolygonOutline(ds.points, ds.color);
    });

    // === 3. AJOUTER LES LABELS AUTOUR DU RADAR ===
    doc.setFontSize(5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);

    themeKeys.forEach((key, i) => {
        const theme = themes[key];
        const pointNumber = key.replace('theme_', '');
        const titre = theme.titre || key;
        const labelText = `${pointNumber} - ${titre}`;
        const shortLabel = labelText.length > 30 ? labelText.substring(0, 30) + '...' : labelText;

        const angle = i * angleStep;
        const labelRadius = radius + 3; // 3mm de marge pour rapprocher les labels du cercle
        const labelPoint = polarToCartesian(angle, labelRadius);

        const textWidth = doc.getTextWidth(shortLabel);

        // Déterminer l'alignement selon la position du point par rapport au centre
        let textX = labelPoint.x;
        let textY = labelPoint.y;

        // Alignement horizontal basé sur la position par rapport au centre
        const deltaX = labelPoint.x - cx;
        if (Math.abs(deltaX) < 2) {
            // Centre horizontal → centrer le texte
            textX = labelPoint.x - textWidth / 2;
        } else if (deltaX > 0) {
            // Droite du centre → aligner le texte à gauche (texte commence au point)
            textX = labelPoint.x + 1; // +1mm de marge
        } else {
            // Gauche du centre → aligner le texte à droite (texte finit au point)
            textX = labelPoint.x - textWidth - 1; // -1mm de marge
        }

        // Ajustement vertical (centrage vertical du texte sur le point)
        textY = labelPoint.y + 1.5; // +1.5mm pour centrage vertical du texte

        doc.text(shortLabel, textX, textY);
    });

    // === 4. AJOUTER LES LABELS DE VALEUR (0-5) SUR LES CERCLES ===
    doc.setFontSize(4);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);

    for (let level = 1; level <= 5; level++) {
        const r = (radius / 5) * level;
        const labelPoint = { x: cx, y: cy - r };
        doc.text(level.toString(), labelPoint.x - 1, labelPoint.y - 1);
    }
}

// Rendu du header Qualiopi (0-30mm)
async function renderQualiopiHeader(doc, data, params, pageWidth, primaryColor, grayColor, positions) {
    console.log('🎨 [DEBUG] Rendu header Qualiopi');

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

    // Logo ARKANCE en pleine largeur - utilise toute la hauteur de la section
    let logoAdded = false;
    if (params.headerLogoLeft) {
        logoAdded = await addImageToPdf(
            doc,
            params.headerLogoLeft,
            headerImageX,
            headerImageY,
            headerImageWidth,
            headerImageHeight,
            params.companyName
        );
    }

    if (!logoAdded) {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        const arkanceWidth = doc.getTextWidth('ARKANCE');
        doc.text('ARKANCE', pageWidth - 10 - arkanceWidth, headerSection.y + headerSection.height / 2);
    }

    // Texte en superposition de l'image d'en-tête (aligné à gauche, bleu, gras, sur 2 lignes)
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);

    const headerCenterY = headerSection.y + headerSection.height / 2;
    doc.text('EVALUATION DES ACQUIS ET ATTEINTE DES', 15, headerCenterY + 2);
    doc.text('OBJECTIFS PAR LE STAGIAIRE', 15, headerCenterY + 7.5);
}

// Rendu des informations stagiaire
function renderQualiopiStagiaireInfo(doc, data, params, pageWidth, grayColor, section) {
    console.log('👤 [DEBUG] Rendu informations stagiaire');

    // Fond gris clair pour toute la section
    doc.setFillColor(243, 244, 246);
    doc.rect(0, section.y, pageWidth, section.height, 'F');

    let yPos = section.y + 5;  // Commencer avec un padding de 5mm

    doc.setFontSize(params.textSize);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...grayColor);

    const col1X = 15;
    const col2X = 110;

    // Ligne 1
    doc.setFont('helvetica', 'normal');
    doc.text('Nom du stagiaire :', col1X, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(data.stagiaire_nom || '', col1X + 35, yPos);

    doc.setFont('helvetica', 'normal');
    doc.text('Société :', col2X, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(data.stagiaire_societe || '', col2X + 20, yPos);

    yPos += 6;

    // Ligne 2
    doc.setFont('helvetica', 'normal');
    doc.text('Prénom du stagiaire :', col1X, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(data.stagiaire_prenom || '', col1X + 35, yPos);

    doc.setFont('helvetica', 'normal');
    doc.text('Email du stagiaire :', col2X, yPos);
    doc.setFont('helvetica', 'bold');
    const emailText = data.stagiaire_email || '';
    const emailWidth = doc.getTextWidth(emailText);
    if (emailWidth > 80) {
        doc.setFontSize(7);
    }
    doc.text(emailText, col2X + 32, yPos);

    return yPos + 10;
}

// Rendu du tableau des compétences
function renderQualiopiCompetencesTable(doc, data, params, pageWidth, primaryColor, grayColor, section) {
    console.log('📊 [DEBUG] Rendu tableau compétences');

    const themes = data.qualiopi_themes || {};
    const formateurThemes = data.qualiopi_formateur_themes || {};

    const themeKeys = Object.keys(themes).sort((a, b) => {
        const numA = parseInt(a.replace('theme_', ''));
        const numB = parseInt(b.replace('theme_', ''));
        return numA - numB;
    });

    if (themeKeys.length === 0) {
        return section.y;
    }

    let yPos = section.y;

    // En-tête du tableau
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    const prjName = data.formation?.prj || 'PRJ';
    const pdcRef = data.formation?.pdc?.ref || 'PDC';
    const tableTitle = `${prjName} - ${pdcRef}`;
    doc.text(tableTitle, 15, yPos);

    yPos += 7;

    // Dimensions du tableau
    const tableStartX = 15;
    const col1Width = 95;
    const col2Width = 25;
    const col3Width = 25;
    const col4Width = 40;
    const tableWidth = col1Width + col2Width + col3Width + col4Width;  // 185mm

    // En-tête du tableau avec fond gris
    doc.setFillColor(200, 200, 200);
    doc.rect(tableStartX, yPos - 5, tableWidth, 10, 'F');

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);

    // Colonne 1 - Compétences
    doc.text('COMPETENCES A ACQUERIR LORS DE LA FORMATION', tableStartX + 2, yPos);

    // Colonne 2 - Auto-évaluation entrée (texte sur 2 lignes, centré)
    const col2CenterX = tableStartX + col1Width + col2Width / 2;
    const text1Line1 = 'Auto-évaluation';
    const text1Line2 = 'entrée formation';
    doc.text(text1Line1, col2CenterX - doc.getTextWidth(text1Line1) / 2, yPos - 1);
    doc.text(text1Line2, col2CenterX - doc.getTextWidth(text1Line2) / 2, yPos + 2.5);

    // Colonne 3 - Auto-évaluation sortie (texte sur 2 lignes, centré)
    const col3CenterX = tableStartX + col1Width + col2Width + col3Width / 2;
    const text2Line1 = 'Auto-évaluation';
    const text2Line2 = 'sortie formation';
    doc.text(text2Line1, col3CenterX - doc.getTextWidth(text2Line1) / 2, yPos - 1);
    doc.text(text2Line2, col3CenterX - doc.getTextWidth(text2Line2) / 2, yPos + 2.5);

    // Colonne 4 - Évaluation formateur (texte sur 2 lignes, centré)
    const col4CenterX = tableStartX + col1Width + col2Width + col3Width + col4Width / 2;
    const text3Line1 = 'Evaluation';
    const text3Line2 = 'formateur';
    doc.text(text3Line1, col4CenterX - doc.getTextWidth(text3Line1) / 2, yPos - 1);
    doc.text(text3Line2, col4CenterX - doc.getTextWidth(text3Line2) / 2, yPos + 2.5);

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

        // Notes centrées avec couleurs correspondant à la légende
        doc.setFont('helvetica', 'bold');
        const entree = (theme.avant || 0).toString();
        const sortie = (theme.apres || 0).toString();
        const formateur = (formateurTheme.note || 0).toString();

        // Colonne 2 - Entrée (Rose comme dans la légende)
        doc.setTextColor(236, 72, 153);
        doc.text(entree, tableStartX + col1Width + col2Width / 2 - doc.getTextWidth(entree) / 2, yPos);

        // Colonne 3 - Sortie (Bleu comme dans la légende)
        doc.setTextColor(59, 130, 246);
        doc.text(sortie, tableStartX + col1Width + col2Width + col3Width / 2 - doc.getTextWidth(sortie) / 2, yPos);

        // Colonne 4 - Formateur (Vert comme dans la légende)
        doc.setTextColor(34, 197, 94);
        doc.text(formateur, tableStartX + col1Width + col2Width + col3Width + col4Width / 2 - doc.getTextWidth(formateur) / 2, yPos);

        yPos += rowHeight;
        rowIndex++;
    });

    return yPos + 2;
}

// Rendu du graphique radar
async function renderQualiopiRadarChart(doc, data, params, pageWidth, section) {
    console.log('📈 [DEBUG] Rendu graphique radar Qualiopi');

    const themes = data.qualiopi_themes || {};
    const formateurThemes = data.qualiopi_formateur_themes || null;

    if (Object.keys(themes).length === 0) {
        return section.y;
    }

    let yPos = section.y;

    // === DESSINER LA LÉGENDE MANUELLEMENT ===
    const legendItems = [
        { label: 'À l\'entrée en formation', color: [236, 72, 153] },
        { label: 'À la sortie de formation', color: [59, 130, 246] }
    ];

    if (formateurThemes) {
        legendItems.push({ label: 'Évaluation formateur', color: [34, 197, 94] });
    }

    doc.setFontSize(7);  // Réduit à 75% (9 * 0.75 ≈ 7)
    doc.setFont('helvetica', 'normal');

    const circleRadius = 1.5;  // Réduit à 75% (2 * 0.75 = 1.5)
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

    // === DESSINER LE GRAPHIQUE RADAR VECTORIEL ===
    try {
        // Calculer hauteur disponible depuis la section
        const availableHeight = section.height - 8;  // 8mm pour la légende
        const graphHeight = Math.min(availableHeight - 5, 90);  // Max 90mm pour le graphique, 5mm de marge
        const graphWidth = Math.min(graphHeight * 1.33, 140);  // Ratio 4:3
        const graphX = (pageWidth - graphWidth) / 2;

        // Dessiner le graphique vectoriel (léger et net)
        drawRadarChartVector(doc, themes, formateurThemes, graphX, yPos, graphWidth, graphHeight);
        yPos += graphHeight + 2;
    } catch (error) {
        console.error('Erreur insertion graphique radar:', error);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(220, 38, 38);
        doc.text('[ Erreur génération graphique ]', 20, yPos + 30);
        yPos += Math.min(section.height - 8, 75);
    }

    return yPos;
}

// Rendu des résultats
function renderQualiopiResultats(doc, data, params, pageWidth, primaryColor, grayColor, section) {
    console.log('📊 [DEBUG] Rendu résultats');

    let yPos = section.y + 5;  // Commencer avec un padding de 5mm

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
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(params.textSize + 2);
    doc.text(moyenneProgression, 120, yPos + 3);

    yPos += 7;

    doc.setFontSize(params.textSize);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('Moyenne de l\'évaluation formateur :', 20, yPos + 3);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(params.textSize + 2);
    doc.text(moyenneFormateur, 120, yPos + 3);

    yPos += 7;

    doc.setFontSize(params.textSize);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('Objectifs de la formation :', 20, yPos + 3);

    // Couleur selon le statut
    if (objectifsStatus === 'ATTEINTS') {
        doc.setTextColor(34, 197, 94);
    } else if (objectifsStatus === 'PARTIELLEMENT ATTEINTS') {
        doc.setTextColor(251, 146, 60);
    } else {
        doc.setTextColor(220, 38, 38);
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(params.textSize + 2);
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

    // Calculer les positions des sections depuis la configuration
    const sections = params.sections || [];
    const positions = getSectionPositions(sections);
    console.log('📐 [pdfQualiopi] Positions calculées:', positions);

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

    // === SECTION HEADER (0-22mm) ===
    await renderQualiopiHeader(doc, evaluationData, params, pageWidth, primaryColor, grayColor, positions);

    // === SECTION INFORMATIONS STAGIAIRE (22-47mm) ===
    const stagiaireSection = positions.stagiaire || { y: 22, height: 25, width: pageWidth };
    renderQualiopiStagiaireInfo(doc, evaluationData, params, pageWidth, grayColor, stagiaireSection);

    // === SECTION TABLEAU DES COMPÉTENCES (47-139mm) ===
    const tableSection = positions.table || { y: 47, height: 92, width: pageWidth };
    renderQualiopiCompetencesTable(doc, evaluationData, params, pageWidth, primaryColor, grayColor, tableSection);

    // === SECTION GRAPHIQUE RADAR (139-239mm) ===
    const radarSection = positions.radar || { y: 139, height: 100, width: pageWidth };
    await renderQualiopiRadarChart(doc, evaluationData, params, pageWidth, radarSection);

    // === SECTION ANALYSE DES RÉSULTATS (239-289mm) ===
    const resultatsSection = positions.analyse_resultats || { y: 239, height: 50, width: pageWidth };
    renderQualiopiResultats(doc, evaluationData, params, pageWidth, primaryColor, grayColor, resultatsSection);

    return doc.output('blob');
}

// Exposer la fonction principale via window
window.generateQualiopiPDF = generateQualiopiPDF;

console.log('✅ [pdfQualiopi] Module chargé et exposé via window.generateQualiopiPDF');

})();
