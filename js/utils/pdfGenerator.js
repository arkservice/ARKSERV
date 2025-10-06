// Générateur PDF local avec jsPDF - VERSION 5 SECTIONS ORGANISÉES
// Template PDF divisé en 5 sections précises sans lignes de séparation

// Fonction principale pour générer un PDF avec jsPDF
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
    
    // Paramètres par défaut
    const defaultParams = {
        primaryColor: [19, 62, 94],      // #133e5e - Bleu Arkance
        grayColor: [55, 65, 81],         // #374151 - Texte principal
        lightGrayColor: [107, 114, 128], // #6b7280 - Texte secondaire
        titleSize: 18,
        subtitleSize: 12,
        textSize: 8,
        labelSize: 8,
        descriptionSize: 7,
        companyName: 'AUTODESK',
        partnerText: 'Platinum Partner',
        brandName: 'ARKANCE',
        headerLogoLeft: null,
        footerLogoLeft: null,
        footerAddress: 'LE VAL SAINT QUENTIN - Bâtiment C - 2, rue René Caudron - CS 30764 - 78961 Voisins-le-Bretonneux Cedex',
        footerContact: 'www.arkance-systems.fr - formation@arkance-systems.com - Tél. : 01 39 44 18 18'
    };
    
    // Fusionner avec les paramètres personnalisés
    const params = { ...defaultParams, ...layoutParams };
    
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
    
    // === SECTION 1: HEADER (0-22mm) ===
    await renderSection1_Header(doc, params);
    
    // === SECTION 2: TITRE/SOUS-TITRE (22-50mm) ===
    renderSection2_Title(doc, pdc, params, primaryColor, lightGrayColor);
    
    // === SECTION 3: INFORMATIONS GÉNÉRALES (50-131mm) ===
    renderSection3_Infos(doc, pdc, params, primaryColor, grayColor);
    
    // === SECTION 5: FOOTER (260-297mm) ===
    // IMPORTANT: Dessiné AVANT la section 4 pour que le programme apparaisse PAR-DESSUS
    await renderSection5_Footer(doc, params);
    
    // === SECTION 4: PROGRAMME (131-268mm) ===
    // Dessiné EN DERNIER pour se superposer au footer
    renderSection4_Programme(doc, pdc, params, primaryColor, grayColor);
    
    // Retourner le PDF en tant que Blob
    const pdfBlob = doc.output('blob');
    return pdfBlob;
}

// === SECTION 1: HEADER (210×22mm) ===
async function renderSection1_Header(doc, params) {
    
    const headerImageUrl = params.headerLogoLeft;
    const headerImageAdded = await addImageToPdf(
        doc, 
        headerImageUrl, 
        0, // Position X = 0 (bord gauche)
        0, // Position Y = 0 (bord haut)
        210, // largeur pleine (210mm)
        22, // hauteur 22mm
        params.companyName
    );
    
    if (!headerImageAdded) {
        // Fallback texte si pas d'image
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(31, 41, 55);
        doc.text(params.companyName, 10, 12);
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(19, 62, 94);
        const arkanceWidth = doc.getTextWidth(params.brandName);
        doc.text(params.brandName, 210 - 10 - arkanceWidth, 12);
    }
}

// === SECTION 2: TITRE/SOUS-TITRE (210×28mm) ===
function renderSection2_Title(doc, pdc, params, primaryColor, lightGrayColor) {
    
    const sectionStartY = 22; // Début section 2
    const pageWidth = 210;
    
    // Titre principal centré - ROBOTO simulé, taille 22
    const titre = (pdc.logiciel?.nom || pdc.logiciel || 'Formation');
    doc.setFontSize(22); // Taille fixe 22 pour ROBOTO
    doc.setFont('helvetica', 'bold'); // ROBOTO simulé avec helvetica-bold
    doc.setTextColor(...primaryColor);
    const titreWidth = doc.getTextWidth(titre);
    doc.text(titre, (pageWidth - titreWidth) / 2, sectionStartY + 12);
    
    // Sous-titre centré - CALIBRI simulé, taille 18
    const metier = pdc.metier_pdc?.nom || pdc.metier_pdc || 'Métier';
    const typePdc = pdc.type_pdc?.nom || pdc.type_pdc || 'Type';
    const sousTitre = `« ${metier} - ${typePdc} »`;
    doc.setFontSize(18); // Taille fixe 18 pour CALIBRI
    doc.setFont('helvetica', 'italic'); // CALIBRI simulé avec helvetica-italic
    doc.setTextColor(...lightGrayColor);
    const sousTitreWidth = doc.getTextWidth(sousTitre);
    doc.text(sousTitre, (pageWidth - sousTitreWidth) / 2, sectionStartY + 22);
}

// === SECTION 3: INFORMATIONS GÉNÉRALES (210×81mm) ===
function renderSection3_Infos(doc, pdc, params, primaryColor, grayColor) {
    
    const sectionStartY = 50; // Début section 3
    const sectionHeight = 81; // Hauteur de la section
    const colKeyX = 10; // Colonne clés à 10mm du bord
    const colValueX = 30; // Colonne valeurs à 30mm du bord
    const valueWidth = 170; // Largeur disponible pour les valeurs (210-30-10)
    
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
        // Vérifier qu'on ne dépasse pas la section (131mm)
        if (currentY > 125) {
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

// === SECTION 4: PROGRAMME (210×137mm) ===
function renderSection4_Programme(doc, pdc, params, primaryColor, grayColor) {
    console.log('🎯 === DÉBUT renderSection4_Programme ===');
    
    const sectionStartY = 131; // Section 3 finit à ~131mm
    const sectionEndY = 268; // AUGMENTÉ de 265 à 268 (+8mm total pour se superposer au footer)
    const sectionHeight = sectionEndY - sectionStartY;

    // Limites de la section - commence juste 2mm après la section 3
    const lignesStartY = sectionStartY + 2;
    const lignesEndY = sectionStartY + 137; // AUGMENTÉ de 134 à 137 (+8mm d'espace disponible)

    // Récupérer tous les points
    const allPoints = formatProgrammeForTemplate(pdc);
    console.log(`📋 Nombre total de points: ${allPoints.length}`);

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
    
    // Hauteur maximale disponible pour le contenu
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
                    doc.setFontSize(8);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(...primaryColor);
                    const titreText = `${point.numero} – ${point.titre}`;
                    const titreLines = doc.splitTextToSize(titreText, availableWidth);
                    doc.text(titreLines, xText, currentY);
                    
                    // Avancer de la hauteur EXACTE du titre
                    currentY += point.hauteurTitre;
                    
                    // === DESCRIPTION ===
                    if (point.description && point.description.trim()) {
                        // Ajouter l'espacement calculé en Phase 1
                        currentY += point.espaceTitreDesc;
                        
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
                    doc.setFontSize(8);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(...primaryColor);
                    const titreText = `${point.numero} – ${point.titre}`;
                    const titreLines = doc.splitTextToSize(titreText, availableWidth);
                    doc.text(titreLines, xText, yPoint);
                    
                    // Avancer de la hauteur EXACTE du titre (calculée en Phase 1)
                    yPoint += point.hauteurTitre;
                    
                    // === DESCRIPTION DU POINT ===
                    if (point.description && point.description.trim()) {
                        // Ajouter l'espacement calculé en Phase 1
                        yPoint += point.espaceTitreDesc;
                        
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
        
        // Pour les colonnes 1 et 2, on teste avec le padding de fin
        // Pour la colonne 3 (dernière), on est plus permissif
        const estDerniereColonne = colonneActuelle === 2;
        const hauteurAvecPaddingFin = hauteurApresAjout + paddingFin;
        
        console.log(`  🔍 Test: ${hauteurAvecPaddingFin.toFixed(2)}mm (actuel: ${colonnes[colonneActuelle].hauteurTotale.toFixed(2)}mm + nouveau: ${hauteurNecessaire.toFixed(2)}mm + padding: ${paddingFin}mm) vs max: ${hauteurMax}mm`);
        
        // Si on est dans la dernière colonne, on accepte un léger dépassement
        const seuilMax = estDerniereColonne ? hauteurMax + 3 : hauteurMax; // +3mm de tolérance pour la dernière colonne
        
        if (hauteurAvecPaddingFin > seuilMax && colonneActuelle < 2) {
            // Le point ne rentre pas dans la colonne actuelle
            console.log(`  ⚠️ Point ${point.numero} NE RENTRE PAS (${hauteurApresAjout.toFixed(1)}mm > ${hauteurMax}mm)`);
            
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
        console.error(`❌ ERREUR CRITIQUE : ${pointsAvecHauteurs.length - totalPointsRepartis} points manquants !`);
    }
    
    return colonnes;
}

// === SECTION 5: FOOTER (210×37mm) ===
async function renderSection5_Footer(doc, params) {
    
    const pageHeight = 297;
    const footerStartY = 260; // Début section 5
    
    const footerImageUrl = params.footerLogoLeft;
    const footerImageAdded = await addImageToPdf(
        doc, 
        footerImageUrl, 
        0, // Position X = 0 (bord gauche)
        footerStartY, // Position Y = 260mm
        210, // largeur pleine (210mm)
        37 // hauteur 37mm
    );
    
    if (!footerImageAdded) {
        // Fallback texte si pas d'image
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
    
    // Numéro de page retiré (plus nécessaire pour un document d'une seule page)
}


// Helper pour générer la liste des points du programme (array linéaire avec jour)
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

// Helper pour charger une image depuis une URL avec gestion d'erreur améliorée
async function loadImageFromUrl(url) {
    if (!url) {
        console.warn('⚠️ [DEBUG] URL image vide ou nulle');
        return null;
    }
    
    try {
        console.log('🖼️ [DEBUG] Chargement image depuis URL:', url);
        
        // Validation de l'URL
        try {
            new URL(url);
        } catch (urlError) {
            console.error('❌ [DEBUG] URL invalide:', url);
            return null;
        }
        
        // Chargement depuis Supabase Storage avec gestion d'erreurs réseau
        console.log('📁 [DEBUG] Chargement image depuis Supabase Storage:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'image/*',
            },
            // Ajouter un timeout côté fetch si le navigateur le supporte
            signal: AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined
        });
        
        if (!response.ok) {
            if (response.status === 404) {
                console.error('❌ [DEBUG] Image non trouvée sur Supabase (404):', url);
            } else if (response.status === 403) {
                console.error('❌ [DEBUG] Accès refusé à l\'image Supabase (403):', url);
            } else {
                console.error(`❌ [DEBUG] Erreur HTTP ${response.status} lors du chargement image:`, url);
            }
            throw new Error(`HTTP ${response.status}`);
        }
        
        const blob = await response.blob();
        
        // Vérifier que c'est bien une image
        if (!blob.type.startsWith('image/')) {
            console.error('❌ [DEBUG] Le contenu récupéré n\'est pas une image:', blob.type);
            return null;
        }
        
        console.log('✅ [DEBUG] Image récupérée depuis Supabase, type:', blob.type, 'taille:', blob.size);
        
        // Convertir en base64 pour jsPDF
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result;
                console.log('✅ [DEBUG] Image convertie en base64, taille:', base64.length);
                resolve(base64);
            };
            reader.onerror = () => {
                console.error('❌ [DEBUG] Erreur conversion base64');
                reject(new Error('Erreur conversion base64'));
            };
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
            console.error('❌ [DEBUG] Timeout lors du chargement image depuis Supabase:', url);
        } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            console.error('❌ [DEBUG] Erreur réseau lors du chargement image:', url);
        } else {
            console.error('❌ [DEBUG] Erreur chargement image:', error.message);
        }
        return null;
    }
}

// Helper pour ajouter une image au PDF avec gestion d'erreur améliorée
async function addImageToPdf(doc, imageUrl, x, y, width, height, fallbackText = null) {
    if (!imageUrl) {
        if (fallbackText) {
            console.log('🔤 [DEBUG] Pas d\'image, utilisation du texte fallback:', fallbackText);
            return false;
        }
        console.warn('⚠️ [DEBUG] Aucune URL d\'image fournie');
        return true;
    }
    
    try {
        console.log('🖼️ [DEBUG] Tentative d\'ajout image:', { imageUrl, x, y, width, height });
        
        // Tentative de chargement avec timeout
        const imageData = await Promise.race([
            loadImageFromUrl(imageUrl),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout chargement image')), 10000)
            )
        ]);
        
        if (!imageData) {
            console.warn('⚠️ [DEBUG] Image non chargée depuis Supabase, utilisation du fallback');
            return false;
        }
        
        // Validation du format de données
        if (!imageData.startsWith('data:image/')) {
            console.error('❌ [DEBUG] Format de données image invalide');
            return false;
        }
        
        // Déterminer le format de l'image
        let format = 'JPEG';
        if (imageData.includes('data:image/png')) format = 'PNG';
        else if (imageData.includes('data:image/gif')) format = 'GIF';
        else if (imageData.includes('data:image/svg')) format = 'SVG';
        else if (imageData.includes('data:image/webp')) format = 'WEBP';
        
        console.log('🖼️ [DEBUG] Format image détecté:', format);
        
        // Tentative d'ajout de l'image avec gestion d'erreur spécifique
        try {
            doc.addImage(imageData, format, x, y, width, height);
            console.log('✅ [DEBUG] Image ajoutée avec succès depuis Supabase');
            return true;
        } catch (addImageError) {
            console.error('❌ [DEBUG] Erreur jsPDF addImage:', addImageError);
            // Essayer avec un format par défaut
            if (format !== 'JPEG') {
                try {
                    doc.addImage(imageData, 'JPEG', x, y, width, height);
                    console.log('✅ [DEBUG] Image ajoutée avec format JPEG fallback');
                    return true;
                } catch (fallbackError) {
                    console.error('❌ [DEBUG] Erreur même avec format JPEG:', fallbackError);
                }
            }
            return false;
        }
    } catch (error) {
        if (error.message === 'Timeout chargement image') {
            console.error('❌ [DEBUG] Timeout lors du chargement image depuis Supabase:', imageUrl);
        } else {
            console.error('❌ [DEBUG] Erreur générale ajout image:', error);
        }
        return false;
    }
}

// Helper pour convertir hex en RGB
function hexToRgb(hex) {
    console.log('🎨 [DEBUG] hexToRgb appelée avec:', hex, 'type:', typeof hex);
    
    if (typeof hex !== 'string' || !hex.startsWith('#')) {
        console.log('❌ [DEBUG] hexToRgb: Format invalide, retour null');
        return null;
    }
    
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
        const rgb = [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ];
        console.log('✅ [DEBUG] hexToRgb conversion réussie:', hex, '->', rgb);
        return rgb;
    } else {
        console.log('❌ [DEBUG] hexToRgb: Regex ne correspond pas, retour null');
        return null;
    }
}

// === GÉNÉRATEUR PDF POUR CONVOCATION ===
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

// === GÉNÉRATEUR PDF POUR ÉMARGEMENT ===
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

// === GÉNÉRATEUR PDF POUR CONVENTION ===
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
    
    // Titre principal
    let yPos = 35;
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
    
    // Parties contractantes
    yPos += 15;
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

    // Articles de la convention
    yPos += 5;
    
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
            contenu: `La durée de ce contrat sera de ${conventionData.duree || '5 jour(s)'} réparti(s) comme suit : ${datesSessions}`
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
                { text: 'La formation se déroulera ', style: 'normal' },
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
    
    // Tarifs
    yPos += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('COÛT DE LA FORMATION :', 20, yPos);
    yPos += 8;
    
    doc.setFont('helvetica', 'normal');
    const tarifLines = [
        `Formation ${conventionData.formation || 'Formation'} : ${conventionData.cout || '0,00'} €`,
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
    
    // Footer
    await addImageToPdf(doc, params.footerLogoLeft, 0, pageHeight - 37, pageWidth, 37, params.footerContact);
    
    return doc.output('blob');
}

// Export global
console.log('🚀 [DEBUG] pdfGenerator.js chargé - VERSION 5 SECTIONS + CONVOCATION + CONVENTION + ÉMARGEMENT');
window.generatePDFWithJsPDF = generatePDFWithJsPDF;
window.generateConvocationPDF = generateConvocationPDF;
window.generateConventionPDF = generateConventionPDF;
window.generateEmargementPDF = generateEmargementPDF;
console.log('✅ [DEBUG] Générateurs PDF exportés:', {
    pdc: typeof window.generatePDFWithJsPDF,
    convocation: typeof window.generateConvocationPDF,
    convention: typeof window.generateConventionPDF,
    emargement: typeof window.generateEmargementPDF
});