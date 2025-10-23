// Page de détail d'un plan de cours (PDC)
function PdcDetailPage({ pdcId, onBack }) {
    const { useState, useEffect } = React;
    const { getPdcById, updatePdc, deletePdc, duplicatePdc, metiersPdc, typesPdc, logiciels } = window.usePdc();
    const { loadTemplateByType, getImageFromLocal } = window.useTemplates();
    const supabase = window.supabaseConfig.client;
    
    const [pdc, setPdc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [savingStep, setSavingStep] = useState(null); // 'saving' | 'generating-pdf' | null

    // Options pour le dropdown catalogue
    const catalogueOptions = [
        { id: 'spécifique', nom: 'Spécifique' },
        { id: 'catalogue', nom: 'Catalogue' }
    ];

    useEffect(() => {
        if (pdcId) {
            fetchPdcDetails();
        }
    }, [pdcId]);
    
    useEffect(() => {
        lucide.createIcons();
    }, [pdc]);
    
    
    const fetchPdcDetails = async () => {
        try {
            setLoading(true);
            setError(null);
            const pdcData = await getPdcById(pdcId);
            setPdc(pdcData);
        } catch (err) {
            console.error('Erreur lors du chargement des détails du PDC:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    const handleEdit = () => {
        if (!pdc) return;
        setEditData({ 
            ...pdc,
            // S'assurer que les IDs des relations sont disponibles pour les dropdowns
            logiciel_id: pdc.logiciel_id || '',
            type_pdc_id: pdc.type_pdc_id || '',
            metier_pdc_id: pdc.metier_pdc_id || ''
        });
        setIsEditing(true);
    };
    
    const handleSave = async () => {
        if (!editData) return;

        try {
            setIsSaving(true);
            setSavingStep('saving');

            // Préparer les données pour la sauvegarde (retirer les objets de relation)
            const { logiciel, type_pdc, metier_pdc, ...dataToSave } = editData;

            await updatePdc(pdc.id, dataToSave);

            // Recharger les données complètes après la sauvegarde
            const updatedPdc = await getPdcById(pdc.id);
            setPdc(updatedPdc);

            // Auto-générer le PDF
            setSavingStep('generating-pdf');
            const pdfSuccess = await handleCreatePdf(updatedPdc, true);

            if (!pdfSuccess) {
                // Si la génération PDF échoue, proposer de créer le PDF manuellement
                const retry = window.confirm(
                    'Les données ont été sauvegardées avec succès, mais la génération du PDF a échoué.\n\n' +
                    'Voulez-vous réessayer de générer le PDF maintenant ?'
                );

                if (retry) {
                    await handleCreatePdf(updatedPdc, false);
                }
            }

            setIsEditing(false);
            setEditData(null);
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            alert('Erreur lors de la sauvegarde du PDC');
        } finally {
            setIsSaving(false);
            setSavingStep(null);
        }
    };
    
    const handleCancel = () => {
        setEditData(null);
        setIsEditing(false);
    };
    
    const handleFieldChange = (field, value) => {
        setEditData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Fonction pour gérer le changement de jour avec cascade chronologique
    const handleJourChange = (pointNum, newJour) => {
        const newJourInt = newJour ? parseInt(newJour) : null;

        setEditData(prev => {
            const updates = {
                [`programme_point_${pointNum}_jour`]: newJourInt
            };

            // Cascade : tous les points suivants doivent être au minimum au même jour
            if (newJourInt) {
                for (let i = pointNum + 1; i <= 12; i++) {
                    const currentJour = prev[`programme_point_${i}_jour`];
                    // Si le point suivant n'a pas de jour ou est à un jour antérieur, le déplacer
                    if (!currentJour || currentJour < newJourInt) {
                        updates[`programme_point_${i}_jour`] = newJourInt;
                    }
                }
            }

            return {
                ...prev,
                ...updates
            };
        });
    };

    // Fonction pour auto-redimensionner les textarea
    const autoResizeTextarea = (textarea) => {
        if (!textarea) return;
        textarea.style.height = 'auto';
        textarea.style.height = Math.max(60, textarea.scrollHeight) + 'px';
    };

    // Fonction helper pour créer les options de jour
    const createJourOptions = () => {
        const dataSource = isEditing ? editData : pdc;
        const maxJours = parseInt(dataSource?.duree_en_jour) || 12;
        const options = [React.createElement('option', { key: 'empty', value: '' }, '-')];
        for (let i = 1; i <= maxJours; i++) {
            options.push(React.createElement('option', { key: i, value: i }, `Jour ${i}`));
        }
        return options;
    };

    const handleDuplicate = async () => {
        if (!pdc) return;
        
        const confirmDuplicate = window.confirm(`Êtes-vous sûr de vouloir dupliquer le PDC "${pdc.ref || pdc.pdc_number}" ?\n\nLe nouveau PDC sera ouvert en mode édition.`);
        if (!confirmDuplicate) return;
        
        try {
            // Créer le nouveau PDC
            const newPdc = await duplicatePdc(pdc);
            
            // Charger les données complètes du nouveau PDC avec toutes les relations
            const fullNewPdc = await getPdcById(newPdc.id);
            
            // Mettre à jour l'état avec le nouveau PDC
            setPdc(fullNewPdc);
            
            // Préparer les données pour l'édition et activer le mode édition
            setEditData({ 
                ...fullNewPdc,
                // S'assurer que les IDs des relations sont disponibles pour les dropdowns
                logiciel_id: fullNewPdc.logiciel_id || '',
                type_pdc_id: fullNewPdc.type_pdc_id || '',
                metier_pdc_id: fullNewPdc.metier_pdc_id || ''
            });
            setIsEditing(true);
            
        } catch (error) {
            console.error('Erreur lors de la duplication:', error);
            alert('Erreur lors de la duplication du PDC');
        }
    };
    
    const handleDelete = async () => {
        if (!pdc) return;
        
        const pdcName = pdc.ref || pdc.pdc_number || `PDC #${pdc.id}`;
        const confirmDelete = window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement le PDC "${pdcName}" ?\n\nCette action est irréversible.`);
        if (!confirmDelete) return;
        
        try {
            await deletePdc(pdc.id);
            alert('PDC supprimé avec succès !');
            onBack(); // Retourner à la liste
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            alert('Erreur lors de la suppression du PDC');
        }
    };
    
    // Fonction pour obtenir l'URL d'une image (locale ou distante)
    const getImageUrl = (imageUrl) => {
        if (!imageUrl) return null;
        
        // Plus de gestion des URLs locales ou templates/ - tout est dans Supabase
        // Les URLs Supabase sont déjà absolues et prêtes à l'emploi
        
        return imageUrl;
    };

    const handleCreatePdf = async (pdcData = null, silent = false) => {
        const sourcePdc = pdcData || pdc;

        if (!sourcePdc) {
            alert('Aucun PDC sélectionné');
            return false;
        }

        try {
            // Afficher un indicateur de chargement si pas en mode silencieux
            if (!silent) {
                const pdfButton = document.querySelector('[data-pdf-button]');
                if (pdfButton) {
                    pdfButton.textContent = 'Génération en cours...';
                    pdfButton.disabled = true;
                }
            }

            // Vérifier que le générateur PDF est disponible
            if (!window.generatePDFWithJsPDF) {
                throw new Error('Le générateur PDF n\'est pas disponible');
            }

            // Utiliser le nouveau système de templates local
            const template = await loadTemplateByType('pdc');
            if (!template) {
                throw new Error('Template PDC non trouvé');
            }

            // Convertir le template en paramètres PDF
            const pdfParams = {
                titleSize: template.styles?.titleSize || 28,
                subtitleSize: template.styles?.subtitleSize || 16,
                textSize: template.styles?.textSize || 8,
                labelSize: template.styles?.labelSize || 8,
                descriptionSize: template.styles?.descriptionSize || 7,
                headerSize: template.styles?.headerSize || 24,
                footerSize: template.styles?.footerSize || 9,
                articleSize: template.styles?.articleSize || 11,
                primaryColor: template.colors?.primary || '#133e5e',
                secondaryColor: template.colors?.secondary || '#2563eb',
                grayColor: template.colors?.text || '#374151',
                lightGrayColor: template.colors?.lightText || '#6b7280',
                headerTextColor: template.colors?.headerText || '#1f2937',
                backgroundColor: template.colors?.background || '#f9fafb',
                borderColor: template.colors?.border || '#e5e7eb',
                marginTop: template.spacing?.marginTop || 20,
                marginSide: template.spacing?.marginSide || 20,
                marginBottom: template.spacing?.marginBottom || 30,
                headerHeight: template.spacing?.headerHeight || 35,
                footerHeight: template.spacing?.footerHeight || 40,
                sectionSpacing: template.spacing?.sectionSpacing || 15,
                lineSpacing: template.spacing?.lineSpacing || 5,
                columnSpacing: template.spacing?.columnSpacing || 5,
                blockPadding: template.spacing?.blockPadding || 10,
                pageFormat: template.layout?.pageFormat || 'a4',
                orientation: template.layout?.orientation || 'portrait',
                columns: template.layout?.columns || 3,
                showHeader: template.layout?.showHeader !== false,
                showFooter: template.layout?.showFooter !== false,
                showLogos: template.layout?.showLogos !== false,
                backgroundBlocks: template.layout?.backgroundBlocks !== false,
                companyName: template.branding?.companyName || 'AUTODESK',
                partnerText: template.branding?.partnerText || 'Platinum Partner',
                brandName: template.branding?.brandName || 'ARKANCE',
                footerAddress: template.branding?.footerAddress || 'LE VAL SAINT QUENTIN - Bâtiment C - 2, rue René Caudron - CS 30764 - 78961 Voisins-le-Bretonneux Cedex',
                footerContact: template.branding?.footerContact || 'www.arkance-systems.fr - formation@arkance-systems.com - Tél. : 01 39 44 18 18',
                headerLogoLeft: getImageUrl(template.header_image),
                headerLogoRight: null,
                footerLogoLeft: getImageUrl(template.footer_image),
                footerLogoRight: null
            };

            // Supprimer l'ancien PDF s'il existe
            if (sourcePdc.pdf_file_url) {
                try {
                    // Extraire le nom du fichier de l'URL
                    const urlParts = sourcePdc.pdf_file_url.split('/');
                    const oldFileName = urlParts[urlParts.length - 1];

                    // Supprimer l'ancien fichier
                    await supabase.storage
                        .from('avatars')
                        .remove([oldFileName]);

                    console.log('Ancien PDF supprimé:', oldFileName);
                } catch (cleanupError) {
                    console.warn('Erreur lors de la suppression de l\'ancien PDF:', cleanupError);
                    // Ne pas bloquer la génération pour une erreur de nettoyage
                }
            }

            // Générer le PDF avec le template par défaut
            const pdfBlob = await window.generatePDFWithJsPDF(sourcePdc, pdfParams);

            // Upload du PDF vers Supabase Storage
            const fileName = `pdc_${sourcePdc.id}_${Date.now()}.pdf`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('avatars') // Réutilise le bucket existant avatars
                .upload(fileName, pdfBlob, {
                    contentType: 'application/pdf',
                    cacheControl: '3600',
                    upsert: true // Permet d'écraser si le fichier existe
                });

            if (uploadError) {
                throw new Error(`Erreur upload: ${uploadError.message}`);
            }

            // Obtenir l'URL publique du PDF
            const { data: publicUrlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            const publicPdfUrl = publicUrlData.publicUrl;

            // Mettre à jour la base de données avec l'URL publique
            await updatePdc(sourcePdc.id, {
                pdf_file_url: publicPdfUrl,
                pdf_generated_at: new Date().toISOString()
            });

            // Mettre à jour l'état local
            setPdc(prev => ({
                ...prev,
                pdf_file_url: publicPdfUrl,
                pdf_generated_at: new Date().toISOString()
            }));

            // Ouvrir le PDF dans un nouvel onglet seulement si pas en mode silencieux
            if (!silent) {
                window.open(publicPdfUrl, '_blank');
                alert(`PDF généré et sauvegardé avec succès !\nTemplate: ${template.name}`);
            }

            return true;

        } catch (error) {
            console.error('Erreur lors de la génération du PDF:', error);
            if (!silent) {
                alert('Erreur lors de la génération du PDF: ' + error.message);
            }
            return false;
        } finally {
            // Restaurer le bouton si pas en mode silencieux
            if (!silent) {
                const pdfButton = document.querySelector('[data-pdf-button]');
                if (pdfButton) {
                    pdfButton.textContent = 'Créer PDF';
                    pdfButton.disabled = false;
                }
            }
        }
    };
    
    const handleDownloadPdf = () => {
        if (pdc.pdf_file_url) {
            window.open(pdc.pdf_file_url, '_blank');
        }
    };
    
    // Fonction pour formater les données du programme en 3 colonnes
    const formatProgrammeForTemplate = (pdc) => {
        const colonnes = [[], [], []];
        
        // Distribuer les 12 points en 3 colonnes de 4 points chacune
        for (let i = 1; i <= 12; i++) {
            const pointKey = `programme_point_${i}`;
            const descriptionKey = `programme_point_${i}_description`;
            
            const point = pdc[pointKey];
            const description = pdc[descriptionKey];
            
            if (point || description) {
                const colonneIndex = Math.floor((i - 1) / 4);
                colonnes[colonneIndex].push({
                    numero: i,
                    titre: point || `Point ${i}`,
                    description: description || ''
                });
            }
        }
        
        return colonnes;
    };
    
    // Fonction pour générer le HTML du programme en 3 colonnes
    const generateProgrammeHtml = (colonnes) => {
        if (!colonnes || colonnes.every(col => col.length === 0)) {
            return '<div style="color: #666; font-style: italic;">Programme détaillé disponible sur demande.</div>';
        }
        
        let html = '<div style="display: flex; gap: 15px;">';
        
        colonnes.forEach((colonne, index) => {
            html += '<div style="flex: 1;">';
            
            colonne.forEach(point => {
                html += '<div style="margin-bottom: 8px; font-size: 10px;">';
                html += `<div style="font-weight: bold; color: #0066cc; margin-bottom: 2px;">${point.numero} - ${point.titre}</div>`;
                if (point.description) {
                    html += `<div style="color: #333; line-height: 1.3; margin-left: 10px;">${point.description}</div>`;
                }
                html += '</div>';
            });
            
            html += '</div>';
        });
        
        html += '</div>';
        return html;
    };
    
    // Fonction pour générer le template PDF complet
    const generatePdfTemplate = (data) => {
        const programmeHtml = generateProgrammeHtml(data.colonnes);
        
        return `
        <div style="font-family: Arial, sans-serif; font-size: 11px; color: #000; background: white; padding: 20px; width: 100%; box-sizing: border-box;">
            
            <!-- En-tête avec logos -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 1px solid #ccc;">
                <div style="display: flex; align-items: center;">
                    <div style="margin-right: 10px;">
                        <div style="font-size: 14px; font-weight: bold; color: #000;">⛰️ AUTODESK</div>
                        <div style="font-size: 8px; color: #666;">Platinum Partner</div>
                    </div>
                </div>
                <div style="font-size: 16px; font-weight: bold; color: #0066cc; letter-spacing: 1px;">⟩⟨ ARKANCE</div>
            </div>
            
            <!-- Titre principal -->
            <div style="text-align: center; margin: 20px 0;">
                <h1 style="font-size: 22px; font-weight: bold; color: #0066cc; margin: 0 0 5px 0;">${data.logiciel}</h1>
                <p style="font-size: 12px; font-style: italic; color: #666; margin: 0;">« ${data.metier_pdc} - Concepts de base »</p>
            </div>
            
            <!-- Informations en 2 colonnes -->
            <div style="display: flex; margin-bottom: 15px;">
                <div style="flex: 1; margin-right: 20px;">
                    <div style="margin-bottom: 4px;"><strong>Métier :</strong> ${data.metier_pdc}</div>
                    <div style="margin-bottom: 4px;"><strong>Durée :</strong> ${data.duree_en_jour} jour${data.duree_en_jour > 1 ? 's' : ''} / ${data.dureeHeures} heures</div>
                    <div style="margin-bottom: 4px;"><strong>Public :</strong> ${data.public_cible || 'Architectes, Ingénieurs, Dessinateurs, Projeteurs'}</div>
                    <div style="margin-bottom: 4px;"><strong>Prérequis :</strong> ${data.prerequis || 'Maîtriser les techniques de dessin. Être en mesure d\'assimiler les concepts de Autodesk AutoCAD LT'}</div>
                </div>
                <div style="flex: 1;">
                    <div style="margin-bottom: 4px;"><strong>Référence :</strong> ${data.reference}</div>
                </div>
            </div>
            
            <!-- Objectifs -->
            <div style="margin-bottom: 15px;">
                <h3 style="font-size: 12px; font-weight: bold; color: #0066cc; margin: 0 0 5px 0;">Objectifs :</h3>
                <div style="line-height: 1.4; text-align: justify;">
                    ${data.objectifs || `Comprendre et manipuler l'organisation de Autodesk AutoCAD LT. Mettre en œuvre et paramétrer un projet sous Autodesk AutoCAD LT. Créer des entités 2D et paramétrer leurs propriétés sous Autodesk AutoCAD LT. Savoir documenter et présenter un dessin AutoCAD LT.`}
                </div>
            </div>
            
            <!-- Moyens -->
            <div style="margin-bottom: 15px;">
                <h3 style="font-size: 12px; font-weight: bold; color: #0066cc; margin: 0 0 5px 0;">Moyens :</h3>
                <div style="line-height: 1.4; text-align: justify;">
                    Avant la formation : qualifier et planifier le parcours de formation du stagiaire en fonction de son niveau, ses attentes et ses besoins.<br>
                    Pendant la formation : valider les acquis du stagiaire et mesurer sa progression par un test en début et en fin de formation. Un stagiaire par poste. Remise d'un support de cours numérique. Questionnaire de satisfaction du stagiaire en fin de formation. Formation réalisée par un formateur certifié ${data.logiciel}®.<br>
                    Après la formation : Transmission d'un certificat de formation numérique. Questionnaire de satisfaction du stagiaire 30 jours après la formation.
                </div>
            </div>
            
            <!-- Programme -->
            <div style="margin-bottom: 15px;">
                <h3 style="font-size: 12px; font-weight: bold; color: #0066cc; margin: 0 0 10px 0;">Programme :</h3>
                ${programmeHtml}
            </div>
            
            <!-- Footer -->
            <div style="margin-top: 30px; padding-top: 10px; border-top: 1px solid #ccc; font-size: 8px; color: #666; text-align: center;">
                <div style="margin-bottom: 5px;">⛰️ AUTODESK</div>
                <div style="margin-bottom: 10px;">Platinum Partner</div>
                <div>LE VAL SAINT QUENTIN - Bâtiment C - 2, rue René Caudron - CS 30764 - 78961 Voisins-le-Bretonneux Cedex</div>
                <div>www.arkance-systems.fr - formation@arkance-systems.com - Tél. : 01 39 44 18 18</div>
                <div style="margin-top: 5px;">Agences : Paris, Rouen, Saint-Etienne, Lyon, Nancy, Strasbourg, Bordeaux, Besançon, Dijon</div>
                <div>S.A.S. au capital de 1 800 000 € - RCS : Versailles B399 - SIRET 399 715 846 00016 - CODE APE 7112B</div>
            </div>
        </div>
        `;
    };
    
    
    if (loading) {
        return React.createElement('div', {
            className: "bg-white rounded-lg border border-gray-200 p-8"
        }, React.createElement('div', {
            className: "animate-pulse space-y-4"
        }, [
            React.createElement('div', {
                key: 'title',
                className: "h-6 bg-gray-200 rounded w-1/3"
            }),
            React.createElement('div', {
                key: 'content',
                className: "h-4 bg-gray-200 rounded w-3/4"
            }),
            React.createElement('div', {
                key: 'content2',
                className: "h-4 bg-gray-200 rounded w-1/2"
            })
        ]));
    }
    
    if (error) {
        return React.createElement('div', {
            className: "bg-red-50 border border-red-200 rounded-lg p-4"
        }, React.createElement('p', {
            className: "text-red-800"
        }, `Erreur: ${error}`));
    }
    
    if (!pdc) {
        return React.createElement('div', {
            className: "bg-white rounded-lg border border-gray-200 p-8"
        }, React.createElement('p', {
            className: "text-gray-600"
        }, "Plan de cours non trouvé"));
    }
    
    // Fonction pour créer une section d'information avec support édition
    const createInfoSection = (label, value, fieldName, inputType = 'text') => {
        const key = `info-${label.replace(/\s+/g, '-').toLowerCase()}`;
        
        return React.createElement('div', { key }, [
            React.createElement('label', {
                key: 'label',
                className: "block text-sm font-medium text-gray-700 mb-1"
            }, label),
            isEditing ? (
                inputType === 'textarea' ? 
                React.createElement('textarea', {
                    key: 'input',
                    value: editData[fieldName] || '',
                    onChange: (e) => handleFieldChange(fieldName, e.target.value),
                    className: "w-full px-3 py-2 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-vertical min-h-[80px]",
                    placeholder: `Entrez ${label.toLowerCase()}`
                }) :
                React.createElement('input', {
                    key: 'input',
                    type: inputType,
                    value: editData[fieldName] || '',
                    onChange: (e) => handleFieldChange(fieldName, e.target.value),
                    className: "w-full px-3 py-2 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm",
                    placeholder: `Entrez ${label.toLowerCase()}`
                })
            ) : (
                React.createElement('p', {
                    key: 'value',
                    className: "text-sm text-gray-900 whitespace-pre-wrap"
                }, value || '-')
            )
        ]);
    };
    
    // Fonction pour créer une section dropdown avec support édition
    const createDropdownSection = (label, value, fieldName, options, valueKey = 'id', labelKey = 'nom') => {
        const key = `dropdown-${label.replace(/\s+/g, '-').toLowerCase()}`;
        
        return React.createElement('div', { key }, [
            React.createElement('label', {
                key: 'label',
                className: "block text-sm font-medium text-gray-700 mb-1"
            }, label),
            isEditing ? (
                React.createElement('select', {
                    key: 'select',
                    value: editData[fieldName] || '',
                    onChange: (e) => handleFieldChange(fieldName, e.target.value),
                    className: "w-full px-3 py-2 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                },
                    options.map(option =>
                        React.createElement('option', {
                            key: option[valueKey],
                            value: option[valueKey]
                        }, option[labelKey] + (option.editeur ? ` (${option.editeur})` : ''))
                    )
                )
            ) : (
                React.createElement('p', {
                    key: 'value',
                    className: "text-sm text-gray-900"
                }, value || '-')
            )
        ]);
    };
    
    // Générer le programme (par jour en lecture, éditable en mode édition)
    const generateProgrammeParJour = () => {
        const dataSource = isEditing ? editData : pdc;

        // Collecter tous les points et les organiser par jour
        const pointsParJour = {};
        const pointsNonAssignes = [];

        for (let i = 1; i <= 12; i++) {
            const pointKey = `programme_point_${i}`;
            const descriptionKey = `programme_point_${i}_description`;
            const jourKey = `programme_point_${i}_jour`;
            const jour = dataSource[jourKey];

            // En mode édition, afficher tous les points (même sans titre)
            // En mode lecture, afficher seulement les points avec titre
            if (isEditing || dataSource[pointKey]) {
                const pointData = {
                    numero: i,
                    titre: dataSource[pointKey] || '',
                    description: dataSource[descriptionKey] || '',
                    pointKey,
                    descriptionKey,
                    jourKey,
                    jour
                };

                if (jour) {
                    if (!pointsParJour[jour]) {
                        pointsParJour[jour] = [];
                    }
                    pointsParJour[jour].push(pointData);
                } else if (isEditing) {
                    // En mode édition, collecter les points non assignés
                    pointsNonAssignes.push(pointData);
                }
            }
        }

        // Fonction pour créer une carte de point (lecture ou édition)
        const createPointCard = (point) => {
            return React.createElement('div', {
                key: `point-${point.numero}`,
                className: `bg-white rounded-lg p-3 border-l-4 ${isEditing ? 'border-blue-300' : 'border-blue-400'}`
            }, [
                React.createElement('div', {
                    key: 'title',
                    className: "flex items-start gap-2"
                }, [
                    React.createElement('span', {
                        key: 'numero',
                        className: `flex-shrink-0 w-6 h-6 ${isEditing ? 'bg-blue-50' : 'bg-blue-100'} text-blue-700 rounded-full flex items-center justify-center text-xs font-bold`
                    }, point.numero),
                    isEditing ?
                        React.createElement('input', {
                            key: 'titre-input',
                            type: 'text',
                            value: point.titre,
                            onChange: (e) => handleFieldChange(point.pointKey, e.target.value),
                            className: "flex-1 px-2 py-1 border border-blue-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500",
                            placeholder: `Titre du point ${point.numero}`
                        }) :
                        React.createElement('h4', {
                            key: 'titre',
                            className: "font-medium text-gray-900 flex-1"
                        }, point.titre),
                    isEditing && React.createElement('select', {
                        key: 'jour-select',
                        value: point.jour || '',
                        onChange: (e) => handleJourChange(point.numero, e.target.value),
                        className: "text-xs px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    }, createJourOptions())
                ]),
                isEditing ?
                    React.createElement('textarea', {
                        key: 'description-input',
                        ref: (textarea) => {
                            if (textarea) {
                                autoResizeTextarea(textarea);
                            }
                        },
                        value: point.description,
                        onChange: (e) => {
                            handleFieldChange(point.descriptionKey, e.target.value);
                            autoResizeTextarea(e.target);
                        },
                        onInput: (e) => autoResizeTextarea(e.target),
                        className: "w-full px-2 py-1 mt-2 ml-8 border border-blue-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none min-h-[60px]",
                        placeholder: `Description du point ${point.numero}`,
                        style: { height: 'auto' }
                    }) :
                    point.description && React.createElement('p', {
                        key: 'description',
                        className: "text-sm text-gray-600 mt-2 ml-8 whitespace-pre-wrap"
                    }, point.description)
            ]);
        };

        // Créer les sections
        const sections = [];

        // En mode édition, afficher d'abord les points non assignés s'il y en a
        if (isEditing && pointsNonAssignes.length > 0) {
            sections.push(React.createElement('div', {
                key: 'non-assignes',
                className: "border border-gray-300 rounded-lg overflow-hidden"
            }, [
                React.createElement('div', {
                    key: 'header',
                    className: "bg-gray-100 px-4 py-3 border-b border-gray-300"
                }, React.createElement('h3', {
                    className: "text-gray-700 font-semibold flex items-center gap-2"
                }, [
                    React.createElement('i', {
                        key: 'icon',
                        'data-lucide': 'circle-dashed',
                        className: "w-4 h-4"
                    }),
                    "Points non assignés"
                ])),
                React.createElement('div', {
                    key: 'content',
                    className: "p-4 bg-gray-50 space-y-3"
                }, pointsNonAssignes.map(point => createPointCard(point)))
            ]));
        }

        // Afficher les sections par jour
        const jours = Object.keys(pointsParJour).sort((a, b) => parseInt(a) - parseInt(b));
        jours.forEach(jour => {
            const points = pointsParJour[jour];
            sections.push(React.createElement('div', {
                key: `jour-${jour}`,
                className: "border border-gray-200 rounded-lg overflow-hidden"
            }, [
                React.createElement('div', {
                    key: 'header',
                    className: "bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3"
                }, React.createElement('h3', {
                    className: "text-white font-semibold"
                }, `Jour ${jour}`)),
                React.createElement('div', {
                    key: 'content',
                    className: "p-4 bg-gray-50 space-y-3"
                }, points.map(point => createPointCard(point)))
            ]));
        });

        // En mode lecture, ne rien afficher si aucune section
        if (!isEditing && sections.length === 0) {
            return React.createElement('p', {
                className: "text-gray-500 text-center py-8"
            }, "Aucun point de programme défini");
        }

        return React.createElement('div', {
            className: "space-y-4"
        }, sections);
    };

    // Fonction pour formater la référence en affichant les versions avec 2 chiffres
    const formatRef = (ref) => {
        if (!ref) return ref;
        // Remplacer les années 4 chiffres (19XX ou 20XX) par leurs 2 derniers chiffres
        return ref.replace(/(19|20)(\d{2})/g, '$2');
    };

    return React.createElement('div', {
        className: "space-y-6"
    }, [
        // En-tête avec navigation et actions
        React.createElement('div', {
            key: 'header',
            className: "bg-white rounded-lg border border-gray-200 p-6"
        }, [
            window.DetailPageHeader({
                onBack: onBack,
                breadcrumbBase: "Plans de cours",
                breadcrumbCurrent: formatRef(pdc.ref) || `PDC #${pdc.pdc_number}`
            }),
            React.createElement('div', {
                key: 'title-section',
                className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            }, [
                React.createElement('div', { key: 'title-info' }, [
                    React.createElement('h1', {
                        key: 'title',
                        className: "text-2xl font-bold text-gray-900"
                    }, formatRef(pdc.ref) || `Plan de cours #${pdc.pdc_number}`),
                    React.createElement('p', {
                        key: 'subtitle',
                        className: "text-gray-600 mt-1"
                    }, `Durée: ${pdc.duree_en_jour || 'Non définie'} • Logiciel: ${pdc.logiciel?.nom || 'Non défini'}${pdc.version_logiciel ? ' ' + pdc.version_logiciel : ''}`)
                ]),
                React.createElement('div', {
                    key: 'actions',
                    className: "flex flex-wrap gap-2"
                }, isEditing ? [
                    // Boutons en mode édition
                    React.createElement('button', {
                        key: 'save',
                        onClick: handleSave,
                        disabled: isSaving,
                        className: `inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                            isSaving
                                ? 'bg-blue-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700'
                        }`
                    }, [
                        React.createElement('i', {
                            key: 'icon',
                            'data-lucide': isSaving ? 'loader-2' : 'save',
                            className: `w-4 h-4 ${isSaving ? 'animate-spin' : ''}`
                        }),
                        isSaving ? (savingStep === 'generating-pdf' ? 'Génération du PDF...' : 'Sauvegarde...') : 'Sauvegarder'
                    ]),
                    React.createElement('button', {
                        key: 'cancel',
                        onClick: handleCancel,
                        disabled: isSaving,
                        className: `inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                            isSaving 
                                ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                                : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                        }`
                    }, [
                        React.createElement('i', {
                            key: 'icon',
                            'data-lucide': 'x',
                            className: "w-4 h-4"
                        }),
                        "Annuler"
                    ])
                ] : [
                    // Boutons en mode lecture
                    React.createElement('button', {
                        key: 'edit',
                        onClick: handleEdit,
                        className: "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    }, [
                        React.createElement('i', {
                            key: 'icon',
                            'data-lucide': 'edit',
                            className: "w-4 h-4"
                        }),
                        "Modifier"
                    ]),
                    React.createElement('button', {
                        key: 'duplicate',
                        onClick: handleDuplicate,
                        className: "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    }, [
                        React.createElement('i', {
                            key: 'icon',
                            'data-lucide': 'copy',
                            className: "w-4 h-4"
                        }),
                        "Dupliquer"
                    ]),
                    React.createElement('button', {
                        key: 'delete',
                        onClick: handleDelete,
                        className: "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                    }, [
                        React.createElement('i', {
                            key: 'icon',
                            'data-lucide': 'trash-2',
                            className: "w-4 h-4"
                        }),
                        "Supprimer"
                    ]),
                    // Boutons PDF
                    ...(pdc.pdf_file_url ? [
                        React.createElement('button', {
                            key: 'download-pdf',
                            onClick: handleDownloadPdf,
                            className: "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                        }, [
                            React.createElement('i', {
                                key: 'icon',
                                'data-lucide': 'download',
                                className: "w-4 h-4"
                            }),
                            "Télécharger PDF"
                        ])
                    ] : [
                        React.createElement('button', {
                            key: 'create-pdf',
                            onClick: handleCreatePdf,
                            className: "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors",
                            'data-pdf-button': true
                        }, [
                            React.createElement('i', {
                                key: 'icon',
                                'data-lucide': 'file-text',
                                className: "w-4 h-4"
                            }),
                            "Créer PDF"
                        ])
                    ])
                ])
            ])
        ]),
        
        
        // Informations générales
        React.createElement('div', {
            key: 'general-info',
            className: "bg-white rounded-lg border border-gray-200 p-6"
        }, [
            React.createElement('h2', {
                key: 'title',
                className: "text-lg font-semibold text-gray-900 mb-4"
            }, "Informations générales"),
            React.createElement('div', {
                key: 'grid',
                className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            }, [
                createInfoSection("Numéro PDC", isEditing ? editData.pdc_number : pdc.pdc_number, 'pdc_number', 'number'),
                createDropdownSection("Logiciel", pdc.logiciel?.nom, 'logiciel_id', logiciels, 'id', 'nom'),
                createInfoSection("Version logiciel", isEditing ? editData.version_logiciel : pdc.version_logiciel, 'version_logiciel', 'number'),
                createInfoSection("Durée (jours)", isEditing ? editData.duree_en_jour : pdc.duree_en_jour, 'duree_en_jour'),
                createDropdownSection("Métier PDC", pdc.metier_pdc?.nom, 'metier_pdc_id', metiersPdc, 'id', 'nom'),
                createDropdownSection("Type PDC", pdc.type_pdc?.nom, 'type_pdc_id', typesPdc, 'id', 'nom'),
                createDropdownSection("Catalogue", pdc.catalogue, 'catalogue', catalogueOptions, 'id', 'nom'),
                createInfoSection("Public cible", isEditing ? editData.public_cible : pdc.public_cible, 'public_cible', 'textarea'),
                !isEditing && createInfoSection("Date de création", pdc.created_at ? new Date(pdc.created_at).toLocaleDateString('fr-FR') : '', 'created_at')
            ])
        ]),
        
        // Prérequis
        (pdc.prerequis || isEditing) && React.createElement('div', {
            key: 'prerequis',
            className: "bg-white rounded-lg border border-gray-200 p-6"
        }, [
            React.createElement('h2', {
                key: 'title',
                className: "text-lg font-semibold text-gray-900 mb-4"
            }, "Prérequis"),
            React.createElement('div', {
                key: 'content',
                className: "prose prose-sm max-w-none"
            }, isEditing ? 
                React.createElement('textarea', {
                    value: editData.prerequis || '',
                    onChange: (e) => handleFieldChange('prerequis', e.target.value),
                    className: "w-full px-3 py-2 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-vertical min-h-[120px]",
                    placeholder: "Entrez les prérequis pour cette formation"
                }) :
                React.createElement('p', {
                    className: "text-gray-700 whitespace-pre-wrap"
                }, pdc.prerequis))
        ]),
        
        // Objectifs
        (pdc.objectifs || isEditing) && React.createElement('div', {
            key: 'objectifs',
            className: "bg-white rounded-lg border border-gray-200 p-6"
        }, [
            React.createElement('h2', {
                key: 'title',
                className: "text-lg font-semibold text-gray-900 mb-4"
            }, "Objectifs de la formation"),
            React.createElement('div', {
                key: 'content',
                className: "prose prose-sm max-w-none"
            }, isEditing ?
                React.createElement('textarea', {
                    value: editData.objectifs || '',
                    onChange: (e) => handleFieldChange('objectifs', e.target.value),
                    className: "w-full px-3 py-2 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-vertical min-h-[120px]",
                    placeholder: "Entrez les objectifs de cette formation"
                }) :
                React.createElement('p', {
                    className: "text-gray-700 whitespace-pre-wrap"
                }, pdc.objectifs))
        ]),

        // Programme
        React.createElement('div', {
            key: 'programme',
            className: "bg-white rounded-lg border border-gray-200 p-6"
        }, [
            React.createElement('div', {
                key: 'header',
                className: "flex items-center gap-2 mb-4"
            }, [
                React.createElement('i', {
                    key: 'icon',
                    'data-lucide': 'calendar-days',
                    className: "w-5 h-5 text-blue-600"
                }),
                React.createElement('h2', {
                    key: 'title',
                    className: "text-lg font-semibold text-gray-900"
                }, "Programme")
            ]),
            generateProgrammeParJour()
        ])
    ]);
}

// Export global
window.PdcDetailPage = PdcDetailPage;