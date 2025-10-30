// Générateur PDF pour le Programme de Cours (PDC)
// Template divisé en 5 sections sans lignes de séparation
(function() {
    'use strict';

    // Récupérer les utilitaires depuis window.pdfCore et pdfSectionMapper
    const { DEFAULT_PARAMS, hexToRgb, addImageToPdf } = window.pdfCore;
    const { getSectionPositions } = window.pdfSectionMapper;

// Fonction principale pour générer un PDF Programme de Cours
async function generatePDFWithJsPDF(pdc, layoutParams = {}) {

    // Vérifier que jsPDF est disponible
    let jsPDF;
    if (window.jsPDF) {
        jsPDF = window.jsPDF;
    } else if (window.jspdf && window.jspdf.jsPDF) {
        jsPDF = window.jspdf.jsPDF;
    } else {
        console.log('window.jsPDF:', window.jsPDF);
        console.log('window.jspdf:', window.jspdf);
        console.log('Objets window disponibles:', Object.keys(window).filter(k => k.toLowerCase().includes('pdf')));
        throw new Error('jsPDF n\'est pas chargé. Vérifiez que le CDN est inclus dans index.html');
    }

    // Fusionner avec les paramètres personnalisés
    const params = { ...DEFAULT_PARAMS, ...layoutParams };

    // Calculer les positions des sections depuis la configuration
    const sections = params.sections || [];
    const positions = getSectionPositions(sections);
    console.log('📐 [pdfProgramme] Positions calculées:', positions);

    // Convertir les couleurs hex en RGB si nécessaire
    const primaryColor = hexToRgb(params.primaryColor) || params.primaryColor;
    const grayColor = hexToRgb(params.grayColor) || params.grayColor;
    const lightGrayColor = hexToRgb(params.lightGrayColor) || params.lightGrayColor;

    // Créer le document PDF A4
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        putOnlyUsedFonts: true,
        floatPrecision: 16
    });

    const pageWidth = doc.internal.pageSize.getWidth();  // 210mm
    const pageHeight = doc.internal.pageSize.getHeight(); // 297mm

    // === SECTION 1: HEADER ===
    await renderSection1_Header(doc, params, positions);

    // === SECTION 2: TITRE/SOUS-TITRE ===
    renderSection2_Title(doc, pdc, params, primaryColor, lightGrayColor, positions);

    // === SECTION 3: INFORMATIONS GÉNÉRALES ===
    renderSection3_Infos(doc, pdc, params, primaryColor, grayColor, positions);

    // === SECTION 5: FOOTER ===
    // IMPORTANT: Dessiné AVANT la section 4 pour que le programme apparaisse PAR-DESSUS
    await renderSection5_Footer(doc, params, positions);

    // === SECTION 4: PROGRAMME ===
    // Dessiné EN DERNIER pour se superposer au footer
    renderSection4_Programme(doc, pdc, params, primaryColor, grayColor, positions);

    // Retourner le PDF en tant que Blob
    const pdfBlob = doc.output('blob');
    return pdfBlob;
}

// === SECTION 1: HEADER ===
async function renderSection1_Header(doc, params, positions) {
    const headerSection = positions.header || { y: 0, height: 22, width: 210 };

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

    const headerImageUrl = params.headerLogoLeft;
    const headerImageAdded = await addImageToPdf(
        doc,
        headerImageUrl,
        headerImageX,
        headerImageY,
        headerImageWidth,
        headerImageHeight,
        params.companyName
    );

    if (!headerImageAdded) {
        // Fallback texte si pas d'image
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(31, 41, 55);
        doc.text(params.companyName, 10, headerSection.y + 12);

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(19, 62, 94);
        const arkanceWidth = doc.getTextWidth(params.brandName);
        doc.text(params.brandName, headerSection.width - 10 - arkanceWidth, headerSection.y + 12);
    }
}

// === SECTION 2: TITRE/SOUS-TITRE ===
function renderSection2_Title(doc, pdc, params, primaryColor, lightGrayColor, positions) {
    const titleSection = positions.title || { y: 22, height: 28, width: 210 };

    const pageWidth = titleSection.width;

    // Titre principal centré - ROBOTO simulé, taille 22
    const titre = (pdc.logiciel?.nom || pdc.logiciel || 'Formation');
    doc.setFontSize(22); // Taille fixe 22 pour ROBOTO
    doc.setFont('helvetica', 'bold'); // ROBOTO simulé avec helvetica-bold
    doc.setTextColor(...primaryColor);
    const titreWidth = doc.getTextWidth(titre);
    doc.text(titre, (pageWidth - titreWidth) / 2, titleSection.y + 12);

    // Sous-titre centré - CALIBRI simulé, taille 18
    const metier = pdc.metier_pdc?.nom || pdc.metier_pdc || 'Métier';
    const typePdc = pdc.type_pdc?.nom || pdc.type_pdc || 'Type';
    const sousTitre = `« ${metier} - ${typePdc} »`;
    doc.setFontSize(18); // Taille fixe 18 pour CALIBRI
    doc.setFont('helvetica', 'italic'); // CALIBRI simulé avec helvetica-italic
    doc.setTextColor(...lightGrayColor);
    const sousTitreWidth = doc.getTextWidth(sousTitre);
    doc.text(sousTitre, (pageWidth - sousTitreWidth) / 2, titleSection.y + 22);
}

// === SECTION 3: INFORMATIONS GÉNÉRALES ===
function renderSection3_Infos(doc, pdc, params, primaryColor, grayColor, positions) {
    const infosSection = positions.infos || { y: 50, height: 81, width: 210 };

    const sectionStartY = infosSection.y;
    const sectionHeight = infosSection.height;
    const colKeyX = 10; // Colonne clés à 10mm du bord
    const colValueX = 30; // Colonne valeurs à 30mm du bord
    const valueWidth = infosSection.width - 30 - 10; // Largeur disponible pour les valeurs

    // Ajouter le fond gris avec marges de 8mm
    const defaultBgColor = '#f3f4f6'; // Couleur par défaut
    const bgColorHex = params.infoBackground || defaultBgColor;
    const bgColor = hexToRgb(bgColorHex) || [243, 244, 246]; // Défaut gris clair si conversion échoue

    doc.setFillColor(...bgColor);
    doc.rect(8, sectionStartY, 194, sectionHeight, 'F'); // X=8mm, largeur=194mm (210-16)

    let currentY = sectionStartY + 8;

    // Calculer durée
    const dureeJours = pdc.duree_en_jour || 1;
    const dureeHeures = dureeJours * 7;
    const dureeText = `${dureeJours} jour${dureeJours > 1 ? 's' : ''} / ${dureeHeures} heures`;

    // Fonction pour raccourcir les années à 4 chiffres dans la référence
    // Exemple: RVT2026 → RVT26, ARC2025 → ARC25
    const formatReference = (ref) => {
        if (!ref) return 'Non spécifiée';
        // Remplacer toutes les occurrences d'années à 4 chiffres (20XX) par 2 chiffres (XX)
        return ref.replace(/([A-Z]+)20(\d{2})/g, '$1$2');
    };

    // Données des informations
    const infos = [
        { label: 'Référence :', value: formatReference(pdc.ref) },
        { label: 'Métier :', value: pdc.metier_pdc?.nom || pdc.metier_pdc || 'Métier' },
        { label: 'Durée :', value: dureeText },
        { label: 'Public :', value: pdc.public_cible || 'Dessinateurs/Projeteurs/Ingénieurs/Architectes.' },
        { label: 'Prérequis :', value: pdc.prerequis || 'Maîtriser les techniques de base en informatique.' },
        { label: 'Objectifs :', value: pdc.objectifs || `Être en mesure d'assimiler les concepts de base de ${pdc.logiciel?.nom || 'cette formation'}.` },
        { label: 'Moyens :', value: `Avant la formation : qualifier et planifier le parcours de formation du stagiaire en fonction de son niveau, ses attentes et ses besoins.\nPendant la formation : valider les acquis du stagiaire et mesurer sa progression par un test en début et en fin de formation. Un stagiaire par poste. Remise d'un support de cours numérique. Questionnaire de satisfaction du stagiaire en fin de formation. Formation réalisée par un formateur certifié Autodesk®.\nAprès la formation : Transmission d'un certificat de formation numérique. Questionnaire de satisfaction du stagiaire 30 jours après la formation` }
    ];

    // Rendu de chaque information avec espacement de 1mm après chaque ensemble clé+valeur
    const spacingAfterBlock = 1; // Espacement de 1mm après chaque ensemble clé+valeur

    for (const info of infos) {
        // Vérifier qu'on ne dépasse pas la section
        const sectionEndY = sectionStartY + sectionHeight - 6;
        if (currentY > sectionEndY) {
            console.warn('⚠️ Section 3 déborde, ajustement nécessaire');
            break;
        }

        // Label (colonne 1) - ROBOTO simulé avec helvetica-bold
        doc.setFontSize(params.labelSize);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        doc.text(info.label, colKeyX, currentY);

        // Valeur (colonne 2) - CALIBRI simulé avec helvetica-normal
        doc.setFontSize(params.textSize);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...grayColor);

        let blockHeight = 0; // Hauteur totale occupée par cet ensemble clé+valeur

        // Traitement spécial pour la section "Moyens" avec soulignement
        if (info.label === 'Moyens :') {
            const moyensLines = info.value.split('\n');
            let moyensY = currentY;

            for (const line of moyensLines) {
                // Vérifier si la ligne commence par un titre à souligner
                const isTitle = line.startsWith('Avant la formation :') ||
                               line.startsWith('Pendant la formation :') ||
                               line.startsWith('Après la formation :');

                if (isTitle) {
                    // Extraire le titre et le texte
                    const colonIndex = line.indexOf(' : ');
                    const titre = line.substring(0, colonIndex + 2);
                    const texte = line.substring(colonIndex + 3);

                    // Rendre le titre souligné
                    doc.setFont('helvetica', 'normal');
                    doc.text(titre, colValueX, moyensY);
                    const titreWidth = doc.getTextWidth(titre);
                    doc.line(colValueX, moyensY + 0.5, colValueX + titreWidth, moyensY + 0.5);

                    // Rendre le texte après le titre
                    const texteLines = doc.splitTextToSize(texte, valueWidth - titreWidth - 2);
                    doc.text(texteLines, colValueX + titreWidth + 2, moyensY);
                    moyensY += texteLines.length * 3.5;
                } else {
                    // Ligne normale sans soulignement
                    const normalLines = doc.splitTextToSize(line, valueWidth);
                    doc.text(normalLines, colValueX, moyensY);
                    moyensY += normalLines.length * 3.5;
                }
            }

            // Calculer la hauteur totale occupée par les "Moyens"
            blockHeight = moyensY - currentY;
        } else {
            // Gérer les textes longs avec retour à la ligne (logique normale)
            const valueLines = doc.splitTextToSize(info.value, valueWidth);
            doc.text(valueLines, colValueX, currentY);

            // Calculer la hauteur occupée par cette valeur
            const linesCount = Array.isArray(valueLines) ? valueLines.length : 1;
            blockHeight = Math.max(4, linesCount * 3.5); // Hauteur minimale de 4mm
        }

        // Incrémenter currentY de la hauteur du bloc + espacement
        currentY += blockHeight + spacingAfterBlock;
    }
}

// === SECTION 4: PROGRAMME ===
function renderSection4_Programme(doc, pdc, params, primaryColor, grayColor, positions) {
    const programmeSection = positions.programme || { y: 131, height: 137, width: 210 };

    const sectionStartY = programmeSection.y;
    const sectionHeight = programmeSection.height;
    const sectionEndY = sectionStartY + sectionHeight;

    // Limites de la section - commence juste 2mm après le début
    const lignesStartY = sectionStartY + 2;

    // IMPORTANT: Calculer dynamiquement la position du footer pour qu'il soit toujours en bas de page
    // Le footer doit être plaqué en bas de la page A4 (297mm) quelle que soit sa hauteur
    const pageHeight = 297; // Hauteur page A4 en mm
    const footerHeight = positions.footer?.height || 22;
    const footerStartY = pageHeight - footerHeight; // Calcul dynamique: footer toujours en bas
    const lignesEndY = Math.min(sectionStartY + sectionHeight, footerStartY - 2); // 2mm de marge de sécurité

    // Récupérer tous les points (incluant le point 13)
    const allPoints = formatProgrammeForTemplate(pdc);

    // Dimensions des colonnes
    const pageMargin = 8;
    const contentWidth = 194;
    const columnGap = 2; // RÉDUIT de 4 à 2 (-2mm ≈ -5px) - gap horizontal entre colonnes
    const columnWidth = (contentWidth - (2 * columnGap)) / 3;

    const zonesWidths = [columnWidth, columnWidth, columnWidth];
    const zonesStartX = [
        pageMargin,
        pageMargin + columnWidth + columnGap,
        pageMargin + 2 * (columnWidth + columnGap)
    ];

    if (allPoints.length === 0) {
        doc.setFontSize(params.textSize);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...grayColor);
        doc.text('Programme détaillé disponible sur demande.', 10, lignesStartY + 10);
        return;
    }

    // === CONSTANTES D'ESPACEMENT UNIFIÉES ===
    const PADDING_LEFT = 3;
    const PADDING_RIGHT = 2;
    const PADDING_TOP_ZONE = 1;        // RÉDUIT de 3 à 1 (-2mm ≈ -5px)
    const PADDING_BOTTOM_ZONE = 2.5;   // RÉDUIT de 4 à 2.5mm - Marge en bas de chaque zone grise
    const HEADER_JOUR_HEIGHT = 6;      // Hauteur du titre "Jour X"
    const SPACE_AFTER_HEADER = 3;      // AUGMENTÉ de 2 à 3mm - Espace entre titre jour et premier point
    const SPACE_BETWEEN_POINTS = 4;    // Espace entre les points
    const SPACE_BETWEEN_JOURS = 3;     // Gap vertical entre zones grises de jours différents

    // Hauteur maximale disponible pour le contenu (limitée par le début du footer)
    const maxContentHeight = lignesEndY - (lignesStartY + 2);

    console.log(`📏 Hauteur max disponible: ${maxContentHeight}mm (de ${lignesStartY + 2}mm à ${lignesEndY}mm)`);

    // === PHASE 1: CALCULER LES HAUTEURS PRÉCISES DE CHAQUE POINT ===
    const pointsAvecHauteurs = allPoints.map((point, index) => {
        const availableWidth = columnWidth - PADDING_LEFT - PADDING_RIGHT;

        // === CALCUL PRÉCIS DE LA HAUTEUR DU TITRE ===
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        const titreText = `${point.numero} – ${point.titre}`;
        const titreLines = doc.splitTextToSize(titreText, availableWidth);

        // Hauteur de ligne pour font size 8 : utiliser getLineHeight() pour précision
        const titleLineHeight = doc.getLineHeight() / doc.internal.scaleFactor;
        const hauteurTitre = titreLines.length * titleLineHeight;

        // === CALCUL PRÉCIS DE LA HAUTEUR DE LA DESCRIPTION ===
        let hauteurDescription = 0;
        let descLines = [];
        let espaceTitreDesc = 0;

        if (point.description && point.description.trim()) {
            espaceTitreDesc = 1.0; // RÉDUIT de 1.5 à 1.0mm - Espacement entre titre et description

            doc.setFontSize(params.descriptionSize || 7);
            doc.setFont('helvetica', 'normal');
            descLines = doc.splitTextToSize(point.description.trim(), availableWidth);

            // Hauteur de ligne pour font size 7
            const descLineHeight = doc.getLineHeight() / doc.internal.scaleFactor;
            hauteurDescription = espaceTitreDesc + (descLines.length * descLineHeight);
        }

        const hauteurContenu = hauteurTitre + hauteurDescription;

        // Calculer si c'est le premier point d'un nouveau jour
        const isFirstOfJour = index === 0 || (point.jour && allPoints[index - 1].jour !== point.jour);

        // Calculer l'espacement avant ce point
        let espacementAvant = 0;
        if (isFirstOfJour) {
            if (index === 0) {
                // Tout premier point: juste le header
                espacementAvant = PADDING_TOP_ZONE + HEADER_JOUR_HEIGHT + SPACE_AFTER_HEADER;
            } else {
                // Nouveau jour: espacement entre jours + header
                espacementAvant = SPACE_BETWEEN_JOURS + PADDING_TOP_ZONE + HEADER_JOUR_HEIGHT + SPACE_AFTER_HEADER;
            }
        } else {
            // Point normal: espacement standard
            espacementAvant = SPACE_BETWEEN_POINTS;
        }

        const hauteurTotaleAvecEspaces = espacementAvant + hauteurContenu;

        console.log(`Point ${point.numero}: titre=${titreLines.length}L (${hauteurTitre.toFixed(2)}mm), desc=${descLines.length}L (${hauteurDescription.toFixed(2)}mm), espacement=${espacementAvant.toFixed(2)}mm, total=${hauteurTotaleAvecEspaces.toFixed(2)}mm, jour=${point.jour}`);

        return {
            ...point,
            hauteurTitre,
            hauteurDescription,
            hauteurContenu,
            espacementAvant,
            hauteurTotaleAvecEspaces,
            espaceTitreDesc,
            isFirstOfJour,
            titreLines: titreLines.length,
            descLines: descLines.length
        };
    });

    // === PHASE 2: RÉPARTIR LES POINTS SUR LES 3 COLONNES ===
    const repartition = repartirPointsSurColonnes(pointsAvecHauteurs, maxContentHeight, PADDING_BOTTOM_ZONE);

    console.log('📊 Répartition finale:');
    repartition.forEach((col, i) => {
        console.log(`  Colonne ${i + 1}: ${col.points.length} points, hauteur=${col.hauteurTotale.toFixed(1)}mm`);
    });

    // === PHASE 3: DESSINER LES ZONES GRISES ET LES POINTS ===
    repartition.forEach((colonne, colIndex) => {
        if (colonne.points.length === 0) return;

        let currentY = lignesStartY + 2;
        const xStart = zonesStartX[colIndex];
        const xText = xStart + PADDING_LEFT;
        const availableWidth = columnWidth - PADDING_LEFT - PADDING_RIGHT;

        // Grouper les points par jour
        const pointsParJour = {};
        colonne.points.forEach(point => {
            const jour = point.jour || 1;
            if (!pointsParJour[jour]) {
                pointsParJour[jour] = [];
            }
            pointsParJour[jour].push(point);
        });

        // Dessiner chaque groupe de jour
        Object.keys(pointsParJour).sort((a, b) => parseInt(a) - parseInt(b)).forEach((jour, jourIndex) => {
            const pointsDuJour = pointsParJour[jour];

            // Si ce n'est pas le premier jour de la colonne, ajouter l'espacement entre jours
            if (jourIndex > 0) {
                currentY += SPACE_BETWEEN_JOURS;
            }

            // Vérifier si au moins un point affiche le jour (header)
            const pointsAvecHeader = pointsDuJour.filter(p => p.afficherJour);

            if (pointsAvecHeader.length === 0) {
                // Pas de header dans ce groupe - juste dessiner les points sans zone grise
                pointsDuJour.forEach((point, pointIndex) => {
                    if (pointIndex > 0) {
                        currentY += SPACE_BETWEEN_POINTS;
                    }

                    // === TITRE DU POINT ===
                    // Afficher le titre SAUF si c'est une description seule
                    if (!point.descriptionSeulement) {
                        doc.setFontSize(8);
                        doc.setFont('helvetica', 'bold');
                        doc.setTextColor(...primaryColor);
                        const titreText = `${point.numero} – ${point.titre}`;
                        const titreLines = doc.splitTextToSize(titreText, availableWidth);
                        doc.text(titreLines, xText, currentY);

                        // Avancer de la hauteur EXACTE du titre
                        currentY += point.hauteurTitre;
                    }

                    // === DESCRIPTION ===
                    // Afficher la description SAUF si c'est un titre seul
                    if (!point.titreSeulement && point.description && point.description.trim()) {
                        // Ajouter l'espacement calculé en Phase 1 (sauf si description seule)
                        if (!point.descriptionSeulement) {
                            currentY += point.espaceTitreDesc;
                        }

                        doc.setFontSize(params.descriptionSize || 7);
                        doc.setFont('helvetica', 'normal');
                        doc.setTextColor(...grayColor);
                        const descLines = doc.splitTextToSize(point.description.trim(), availableWidth);
                        doc.text(descLines, xText, currentY);

                        // Avancer de la hauteur des lignes de description
                        const descLineHeight = doc.getLineHeight() / doc.internal.scaleFactor;
                        currentY += descLines.length * descLineHeight;
                    }
                });
                return;
            }

            // Séparer les sous-groupes par header (pour gérer les suites)
            const sousGroupes = [];
            let currentSousGroupe = [];

            pointsDuJour.forEach((point, idx) => {
                if (point.afficherJour && currentSousGroupe.length > 0) {
                    // Nouveau header, sauvegarder le groupe actuel et en commencer un nouveau
                    sousGroupes.push(currentSousGroupe);
                    currentSousGroupe = [point];
                } else {
                    currentSousGroupe.push(point);
                }
            });

            if (currentSousGroupe.length > 0) {
                sousGroupes.push(currentSousGroupe);
            }

            // Dessiner chaque sous-groupe avec sa zone grise
            sousGroupes.forEach((sousGroupe, sousGroupeIndex) => {
                const premierPoint = sousGroupe[0];

                // Si ce n'est pas le premier sous-groupe, ajouter espacement
                if (sousGroupeIndex > 0) {
                    currentY += SPACE_BETWEEN_JOURS;
                }

                // Calculer la hauteur totale de cette zone
                const yStartZone = currentY;
                let yContentStart = currentY + PADDING_TOP_ZONE + HEADER_JOUR_HEIGHT + SPACE_AFTER_HEADER;
                let yContentEnd = yContentStart;

                // Calculer la fin du contenu
                sousGroupe.forEach((point, pointIndex) => {
                    if (pointIndex > 0) {
                        yContentEnd += SPACE_BETWEEN_POINTS;
                    }
                    yContentEnd += point.hauteurContenu;
                });

                const yEndZone = yContentEnd + PADDING_BOTTOM_ZONE;
                const hauteurZone = yEndZone - yStartZone;

                // Dessiner la zone grise
                doc.setFillColor(200, 200, 200);
                doc.rect(xStart, yStartZone, columnWidth, hauteurZone, 'F');

                // Dessiner le header "Jour X" ou "Jour X (suite)"
                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(...primaryColor);

                const labelJour = premierPoint.estSuite ?
                    `Jour ${jour} (suite)` :
                    `Jour ${jour}`;
                doc.text(labelJour, xText, yStartZone + PADDING_TOP_ZONE + 4);

                // Dessiner les points du sous-groupe
                let yPoint = yContentStart;
                sousGroupe.forEach((point, pointIndex) => {
                    if (pointIndex > 0) {
                        yPoint += SPACE_BETWEEN_POINTS;
                    }

                    // === TITRE DU POINT ===
                    // Afficher le titre SAUF si c'est une description seule
                    if (!point.descriptionSeulement) {
                        doc.setFontSize(8);
                        doc.setFont('helvetica', 'bold');
                        doc.setTextColor(...primaryColor);
                        const titreText = `${point.numero} – ${point.titre}`;
                        const titreLines = doc.splitTextToSize(titreText, availableWidth);
                        doc.text(titreLines, xText, yPoint);

                        // Avancer de la hauteur EXACTE du titre (calculée en Phase 1)
                        yPoint += point.hauteurTitre;
                    }

                    // === DESCRIPTION DU POINT ===
                    // Afficher la description SAUF si c'est un titre seul
                    if (!point.titreSeulement && point.description && point.description.trim()) {
                        // Ajouter l'espacement calculé en Phase 1 (sauf si description seule, car déjà inclus dans hauteurContenu)
                        if (!point.descriptionSeulement) {
                            yPoint += point.espaceTitreDesc;
                        }

                        doc.setFontSize(params.descriptionSize || 7);
                        doc.setFont('helvetica', 'normal');
                        doc.setTextColor(...grayColor);
                        const descLines = doc.splitTextToSize(point.description.trim(), availableWidth);
                        doc.text(descLines, xText, yPoint);

                        // Avancer de la hauteur des lignes de description (sans re-ajouter l'espacement)
                        const descLineHeight = doc.getLineHeight() / doc.internal.scaleFactor;
                        yPoint += descLines.length * descLineHeight;
                    }
                });

                // Avancer currentY
                currentY = yEndZone;
            });
        });
    });

    console.log('✅ === FIN renderSection4_Programme ===');
}


// === FONCTION DE RÉPARTITION OPTIMALE SUR 3 COLONNES ===
function repartirPointsSurColonnes(pointsAvecHauteurs, hauteurMax, paddingFin) {
    console.log('🔄 Début répartition sur colonnes - OPTIMISÉE');
    console.log(`📐 Hauteur max par colonne: ${hauteurMax}mm`);

    // Constantes d'espacement (DOIVENT correspondre EXACTEMENT à celles de renderSection4_Programme)
    const PADDING_TOP_ZONE = 1;
    const HEADER_JOUR_HEIGHT = 6;
    const SPACE_AFTER_HEADER = 3;      // AUGMENTÉ de 2 à 3mm
    const SPACE_BETWEEN_POINTS = 4;
    const SPACE_BETWEEN_JOURS = 3;     // AUGMENTÉ de 2 à 3mm

    const colonnes = [
        { points: [], hauteurTotale: 0 },
        { points: [], hauteurTotale: 0 },
        { points: [], hauteurTotale: 0 }
    ];

    let colonneActuelle = 0;
    let dernierJourDansColonne = null;

    for (let i = 0; i < pointsAvecHauteurs.length; i++) {
        const point = { ...pointsAvecHauteurs[i] }; // Clone pour modifications
        const pointSuivant = pointsAvecHauteurs[i + 1];

        // Déterminer le contexte : début de colonne, changement de jour, ou continuation
        const colonneVide = colonnes[colonneActuelle].points.length === 0;
        const changementJour = point.jour && point.jour !== dernierJourDansColonne;

        // Calculer la hauteur nécessaire selon le contexte
        let hauteurNecessaire;

        if (colonneVide) {
            // Premier point de la colonne : toujours avec header de jour
            hauteurNecessaire = PADDING_TOP_ZONE + HEADER_JOUR_HEIGHT + SPACE_AFTER_HEADER + point.hauteurContenu;
            point.isFirstOfJour = true; // Forcer le header
            point.afficherJour = true;
            point.estSuite = false; // Pas une suite si colonne vide
            console.log(`  📍 Point ${point.numero}: Premier de la colonne ${colonneActuelle + 1}`);
        } else if (changementJour) {
            // Changement de jour dans la même colonne
            hauteurNecessaire = SPACE_BETWEEN_JOURS + PADDING_TOP_ZONE + HEADER_JOUR_HEIGHT + SPACE_AFTER_HEADER + point.hauteurContenu;
            point.isFirstOfJour = true; // Header de nouveau jour
            point.afficherJour = true;
            point.estSuite = false; // Premier du jour dans cette colonne
            console.log(`  🆕 Point ${point.numero}: Nouveau jour ${point.jour} dans colonne ${colonneActuelle + 1}`);
        } else {
            // Continuation dans le même jour
            hauteurNecessaire = SPACE_BETWEEN_POINTS + point.hauteurContenu;
            point.isFirstOfJour = false;
            point.afficherJour = false;
            point.estSuite = false;
            console.log(`  ➡️ Point ${point.numero}: Continuation jour ${point.jour}`);
        }

        // NE PAS ajouter paddingFin ici - on le fait seulement à la finalisation de la colonne
        // pour éviter le double comptage qui fait rejeter les points trop tôt

        // Vérifier si le point rentre dans la colonne actuelle
        const hauteurApresAjout = colonnes[colonneActuelle].hauteurTotale + hauteurNecessaire;
        const estDerniereColonne = colonneActuelle === 2;
        const hauteurAvecPaddingFin = hauteurApresAjout + paddingFin;

        console.log(`  🔍 Test: ${hauteurAvecPaddingFin.toFixed(2)}mm (actuel: ${colonnes[colonneActuelle].hauteurTotale.toFixed(2)}mm + nouveau: ${hauteurNecessaire.toFixed(2)}mm + padding: ${paddingFin}mm) vs max: ${hauteurMax}mm`);

        // Appliquer la même limite stricte pour toutes les colonnes pour éviter tout débordement sur le footer
        const seuilMax = hauteurMax;

        if (hauteurAvecPaddingFin > seuilMax && colonneActuelle < 2) {
            // Le point ne rentre pas dans la colonne actuelle
            console.log(`  ⚠️ Point ${point.numero} NE RENTRE PAS ENTIER (${hauteurAvecPaddingFin.toFixed(1)}mm > ${seuilMax}mm)`);

            // === STRATÉGIE 1: Essayer de séparer titre/description ===
            // Calculer la hauteur du titre seul avec les espacements appropriés
            let hauteurTitreSeul;
            if (colonneVide) {
                hauteurTitreSeul = PADDING_TOP_ZONE + HEADER_JOUR_HEIGHT + SPACE_AFTER_HEADER + point.hauteurTitre;
            } else if (changementJour) {
                hauteurTitreSeul = SPACE_BETWEEN_JOURS + PADDING_TOP_ZONE + HEADER_JOUR_HEIGHT + SPACE_AFTER_HEADER + point.hauteurTitre;
            } else {
                hauteurTitreSeul = SPACE_BETWEEN_POINTS + point.hauteurTitre;
            }

            const hauteurTitreAvecPadding = colonnes[colonneActuelle].hauteurTotale + hauteurTitreSeul + paddingFin;

            // Si le titre seul rentre ET qu'il y a une description à séparer
            if (hauteurTitreAvecPadding <= seuilMax && point.hauteurDescription > 0) {
                console.log(`  ✂️ SÉPARATION du point ${point.numero}: titre seul rentre (${hauteurTitreAvecPadding.toFixed(1)}mm <= ${seuilMax}mm)`);

                // Créer une copie pour le titre seul
                const pointTitre = {
                    ...point,
                    titreSeulement: true,
                    hauteurContenu: point.hauteurTitre,
                    hauteurDescription: 0
                };

                // Ajouter le titre dans la colonne actuelle
                colonnes[colonneActuelle].points.push(pointTitre);
                colonnes[colonneActuelle].hauteurTotale += hauteurTitreSeul;
                console.log(`  ➕ Titre du point ${point.numero} ajouté → Col ${colonneActuelle + 1}, h=${hauteurTitreSeul.toFixed(1)}mm`);

                // Finaliser la colonne actuelle avec padding
                colonnes[colonneActuelle].hauteurTotale += paddingFin;
                console.log(`  ✅ Colonne ${colonneActuelle + 1} finalisée: ${colonnes[colonneActuelle].hauteurTotale.toFixed(1)}mm`);

                // Passer à la colonne suivante
                const dernierJourAvantChangement = dernierJourDansColonne;
                colonneActuelle++;
                dernierJourDansColonne = null;
                console.log(`  📍 PASSAGE à la colonne ${colonneActuelle + 1} pour la description`);

                // Créer une copie pour la description seule
                const pointDescription = {
                    ...point,
                    descriptionSeulement: true,
                    hauteurContenu: point.hauteurDescription + point.espaceTitreDesc,
                    hauteurTitre: 0,
                    isFirstOfJour: false,
                    afficherJour: true,   // Afficher header "(suite)"
                    estSuite: true        // Marquer comme suite du jour
                };

                // Calculer hauteur pour la description dans la nouvelle colonne
                hauteurNecessaire = PADDING_TOP_ZONE + HEADER_JOUR_HEIGHT + SPACE_AFTER_HEADER + pointDescription.hauteurContenu;

                // Ajouter la description dans la nouvelle colonne
                colonnes[colonneActuelle].points.push(pointDescription);
                colonnes[colonneActuelle].hauteurTotale += hauteurNecessaire;
                dernierJourDansColonne = point.jour;

                console.log(`  ➕ Description du point ${point.numero} ajoutée → Col ${colonneActuelle + 1}, h=${hauteurNecessaire.toFixed(1)}mm, total=${colonnes[colonneActuelle].hauteurTotale.toFixed(1)}mm`);

                // Passer au point suivant
                continue;
            }

            // === STRATÉGIE 2: Passer le point entier à la colonne suivante ===
            console.log(`  ↪️ Point ${point.numero} passe ENTIER à la colonne suivante`);

            // Finaliser la colonne actuelle avec padding
            if (colonnes[colonneActuelle].points.length > 0) {
                colonnes[colonneActuelle].hauteurTotale += paddingFin;
                console.log(`  ✅ Colonne ${colonneActuelle + 1} finalisée: ${colonnes[colonneActuelle].hauteurTotale.toFixed(1)}mm`);
            }

            // Passer à la colonne suivante
            colonneActuelle++;
            console.log(`  📍 PASSAGE à la colonne ${colonneActuelle + 1}`);

            // Recalculer pour la nouvelle colonne
            const memeJourQuePrecedent = dernierJourDansColonne === point.jour;

            if (memeJourQuePrecedent) {
                // On continue le même jour dans la nouvelle colonne → "(suite)"
                hauteurNecessaire = PADDING_TOP_ZONE + HEADER_JOUR_HEIGHT + SPACE_AFTER_HEADER + point.hauteurContenu;
                point.isFirstOfJour = false; // Pas le premier du jour globalement
                point.afficherJour = true;   // Mais afficher le header "(suite)"
                point.estSuite = true;        // Marquer comme suite
                console.log(`  🔄 Point ${point.numero}: Suite du jour ${point.jour} dans nouvelle colonne`);
            } else {
                // Nouveau jour ou premier point
                hauteurNecessaire = PADDING_TOP_ZONE + HEADER_JOUR_HEIGHT + SPACE_AFTER_HEADER + point.hauteurContenu;
                point.isFirstOfJour = true;
                point.afficherJour = true;
                point.estSuite = false;
                console.log(`  🆕 Point ${point.numero}: Début jour ${point.jour} dans nouvelle colonne`);
            }

            // NE PAS ajouter paddingFin ici non plus

            // Reset du dernier jour (nouvelle colonne)
            dernierJourDansColonne = null;
        }

        // Ajouter le point à la colonne actuelle
        colonnes[colonneActuelle].points.push(point);
        colonnes[colonneActuelle].hauteurTotale += hauteurNecessaire;
        dernierJourDansColonne = point.jour;

        console.log(`  ➕ Point ${point.numero} ajouté → Col ${colonneActuelle + 1}, h=${hauteurNecessaire.toFixed(1)}mm, total=${colonnes[colonneActuelle].hauteurTotale.toFixed(1)}mm`);
    }

    // Finaliser la dernière colonne
    if (colonnes[colonneActuelle].points.length > 0) {
        colonnes[colonneActuelle].hauteurTotale += paddingFin;
    }

    // Vérifier qu'on a tous les points
    const totalPointsRepartis = colonnes.reduce((sum, col) => sum + col.points.length, 0);
    console.log(`📊 Vérification : ${totalPointsRepartis} points répartis sur ${pointsAvecHauteurs.length} points totaux`);

    colonnes.forEach((col, i) => {
        console.log(`  Colonne ${i + 1}: ${col.points.length} points, hauteur finale=${col.hauteurTotale.toFixed(1)}mm`);
    });

    if (totalPointsRepartis !== pointsAvecHauteurs.length) {
        const pointsManquants = pointsAvecHauteurs.length - totalPointsRepartis;
        console.error(`❌ ERREUR CRITIQUE : ${pointsManquants} point(s) manquant(s) !`);
        console.error(`⚠️ Le contenu dépasse la hauteur maximale disponible. Certains points ne seront pas affichés pour éviter le débordement sur le footer.`);
        console.error(`💡 Solution: Réduire le contenu des points ou diminuer les espacements.`);
    }

    return colonnes;
}

// === SECTION 5: FOOTER ===
async function renderSection5_Footer(doc, params, positions) {
    // Calculer dynamiquement la position Y du footer pour qu'il soit toujours en bas de page A4
    const pageHeight = 297; // Hauteur page A4 en mm

    const footerSection = positions.footer ? {
        ...positions.footer,
        y: pageHeight - positions.footer.height // Recalcul: footer plaqué en bas
    } : {
        y: 275, // Par défaut: 297 - 22
        height: 22,
        width: 210
    };

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

    const footerImageUrl = params.footerLogoLeft;
    const footerImageAdded = await addImageToPdf(
        doc,
        footerImageUrl,
        footerImageX,
        footerImageY,
        footerImageWidth,
        footerImageHeight
    );

    if (!footerImageAdded) {
        // Fallback texte si pas d'image
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(107, 114, 128);

        const footerY = footerSection.y + 15;

        const footerText = [
            params.footerAddress,
            params.footerContact
        ];

        let textY = footerY;
        for (const line of footerText) {
            if (line) {
                const lineWidth = doc.getTextWidth(line);
                doc.text(line, (footerSection.width - lineWidth) / 2, textY);
                textY += 4;
            }
        }
    }

    // Numéro de page retiré (plus nécessaire pour un document d'une seule page)
}


// Helper pour générer la liste des points du programme (array linéaire avec jour)
function formatProgrammeForTemplate(pdc) {
    console.log('🔍 [DEBUG] formatProgrammeForTemplate appelée avec PDC:', pdc);

    // Collecter tous les points avec leur jour
    const allPoints = [];

    for (let i = 1; i <= 12; i++) {
        const pointField = `programme_point_${i}`;
        const descriptionField = `programme_point_${i}_description`;
        const jourField = `programme_point_${i}_jour`;

        const point = pdc[pointField];
        const description = pdc[descriptionField];
        const jour = pdc[jourField];

        // Inclure le point s'il y a un titre ou une description
        if (point || description) {
            allPoints.push({
                numero: i,
                titre: point || `Point ${i}`,
                description: description || '',
                jour: jour || null,
                hasContent: Boolean(point || description)
            });
        }
    }

    // Trouver le dernier jour pour le point 13
    let dernierJour = 1;
    allPoints.forEach(p => {
        if (p.jour && p.jour > dernierJour) {
            dernierJour = p.jour;
        }
    });

    // Ajouter le point 13 "Questions/Réponses"
    allPoints.push({
        numero: 13,
        titre: "Questions/Réponses",
        description: "-Echanges, questions et réponses",
        jour: dernierJour,
        hasContent: true
    });

    console.log('📋 [DEBUG] Points collectés (ordre séquentiel avec jour):', allPoints);

    return allPoints;
}

// Exposer la fonction principale via window
window.generatePDFWithJsPDF = generatePDFWithJsPDF;

console.log('✅ [pdfProgramme] Module chargé et exposé via window.generatePDFWithJsPDF');

})();
