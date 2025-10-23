// Page Template Builder - VERSION SIMPLIFIÉE ET LOCALE
function TemplateBuilderPage() {
    const { useState, useEffect } = React;
    
    // États pour l'application
    const [notification, setNotification] = useState(null);
    const [currentTemplate, setCurrentTemplate] = useState(null);
    const [previewPdf, setPreviewPdf] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [uploadingImages, setUploadingImages] = useState({});
    const [selectedDocumentType, setSelectedDocumentType] = useState('pdc');
    const [selectedPdc, setSelectedPdc] = useState(null);
    const [selectedProject, setSelectedProject] = useState(null);
    const [selectedFormation, setSelectedFormation] = useState(null);
    const [selectedEvaluation, setSelectedEvaluation] = useState(null);
    const [projectSessions, setProjectSessions] = useState([]);
    const [imageModalOpen, setImageModalOpen] = useState(null); // null ou 'header_image'/'footer_image'

    // États pour le layout editor
    const [sections, setSections] = useState([]);
    const [selectedSectionId, setSelectedSectionId] = useState(null);
    const [viewMode, setViewMode] = useState('visual'); // 'visual' ou 'pdf'
    const [imagesExpanded, setImagesExpanded] = useState(true); // Pour toggle section images
    const iframeRef = React.useRef(null);
    
    // Fonction pour afficher une notification
    const showNotification = (message, type = 'info') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 4000);
    };
    
    // Types de documents disponibles
    const documentTypes = [
        { id: 'pdc', label: 'Plan de Cours (PDC)', icon: 'book-open', description: 'Templates pour les plans de cours de formation' },
        { id: 'convocation', label: 'Convocation', icon: 'users', description: 'Templates pour les convocations de formation' },
        { id: 'convention', label: 'Convention', icon: 'file-signature', description: 'Templates pour les conventions de formation professionnelle' },
        { id: 'emargement', label: 'Émargement', icon: 'clipboard-check', description: 'Templates pour les feuilles d\'émargement par stagiaire' },
        { id: 'qualiopi', label: 'Évaluation Qualiopi', icon: 'award', description: 'Templates pour les évaluations Qualiopi (EVALUATION DES ACQUIS)' },
        { id: 'attestation', label: 'Attestation', icon: 'award', description: 'Templates pour les attestations de formation' }
    ];
    
    // Hooks pour les données
    const { pdcs, loading: pdcsLoading } = window.usePdc();
    const { projects, loading: projectsLoading } = window.useProjects();
    const { sessions: formations, loading: formationsLoading, fetchSessions, getSessionById } = window.useFormation();
    const { evaluations, loading: evaluationsLoading } = window.useEvaluation();
    const { getSessionsForProject } = window.useProjectSessions();
    const {
        loadTemplateByType,
        saveTemplateByType,
        uploadImage,
        deleteImage,
        getImageFromLocal,
        loading: templateLoading,
        error: templateError,
        loadSectionsByType,
        saveSectionsByType
    } = window.useTemplates();
    
    // Chargement initial
    useEffect(() => {
        loadCurrentTemplate();
        loadCurrentSections();
        if (pdcs && pdcs.length > 0 && !selectedPdc) {
            setSelectedPdc(pdcs[0]);
        }
        if (projects && projects.length > 0 && !selectedProject) {
            setSelectedProject(projects[0]);
        }
        if (formations && formations.length > 0 && !selectedFormation) {
            setSelectedFormation(formations[0]);
        }
        if (evaluations && evaluations.length > 0 && !selectedEvaluation) {
            setSelectedEvaluation(evaluations[0]);
        }
    }, [pdcs, projects, formations, evaluations, selectedDocumentType]);
    
    // Charger les sessions du projet sélectionné
    useEffect(() => {
        const loadProjectSessions = async () => {
            if (selectedProject?.id) {
                try {
                    const sessions = await getSessionsForProject(selectedProject.id);
                    setProjectSessions(sessions);
                } catch (error) {
                    console.warn('Erreur chargement sessions:', error);
                    setProjectSessions([]);
                }
            } else {
                setProjectSessions([]);
            }
        };
        
        loadProjectSessions();
    }, [selectedProject?.id]);

    // Écouter les mises à jour de formation depuis d'autres pages
    useEffect(() => {
        if (!window.EventBus || !window.EventBusEvents) return;

        const handleFormationUpdated = async (data) => {
            console.log('📡 [TemplateBuilderPage] Formation mise à jour reçue:', data);

            // Rafraîchir la liste des formations
            await fetchSessions();

            // Si la formation modifiée est celle actuellement sélectionnée, la rafraîchir
            if (selectedFormation?.id === data.formationId) {
                try {
                    const freshFormation = await getSessionById(data.formationId);
                    setSelectedFormation(freshFormation);
                    console.log('✅ [TemplateBuilderPage] Formation sélectionnée rafraîchie');
                } catch (error) {
                    console.error('❌ [TemplateBuilderPage] Erreur refresh formation:', error);
                }
            }
        };

        // S'abonner à l'événement
        const unsubscribe = window.EventBus.on(
            window.EventBusEvents.FORMATION_UPDATED,
            handleFormationUpdated
        );

        // Cleanup lors du démontage du composant
        return unsubscribe;
    }, [selectedFormation?.id]);

    // Charger le template actuel
    const loadCurrentTemplate = async () => {
        try {
            const template = await loadTemplateByType(selectedDocumentType);
            if (template) {
                setCurrentTemplate(template);
                // Reset image errors when loading new template
                setImageErrors({});
                
                // Vérifier les URLs d'images après chargement
                if (template.header_image) {
                    const img = new Image();
                    img.onload = () => {}; // Image accessible
                    img.onerror = () => console.warn('⚠️ Header image non accessible:', template.header_image);
                    img.src = template.header_image;
                }
                if (template.footer_image) {
                    const img = new Image();
                    img.onload = () => {}; // Image accessible
                    img.onerror = () => console.warn('⚠️ Footer image non accessible:', template.footer_image);
                    img.src = template.footer_image;
                }
            }
        } catch (error) {
            console.error('Erreur chargement template:', error);
            showNotification('Erreur lors du chargement du template', 'error');
        }
    };

    // Charger les sections du type de document actuel
    const loadCurrentSections = async () => {
        try {
            const loadedSections = await loadSectionsByType(selectedDocumentType);
            setSections(loadedSections);
            // Sélectionner la première section par défaut
            if (loadedSections && loadedSections.length > 0) {
                setSelectedSectionId(loadedSections[0].id);
            }
        } catch (error) {
            console.error('Erreur chargement sections:', error);
            setSections([]);
        }
    };

    // Auto-sauvegarde du template
    const autoSaveTemplate = async () => {
        if (isSaving || !currentTemplate) return;
        
        setIsSaving(true);
        try {
            await saveTemplateByType(selectedDocumentType, currentTemplate);
        } catch (error) {
            console.error('Erreur auto-sauvegarde:', error);
            showNotification('Erreur lors de la sauvegarde automatique', 'error');
        } finally {
            setIsSaving(false);
        }
    };
    
    const updateTemplateName = (name) => {
        setCurrentTemplate(prev => ({ ...prev, name }));
    };
    
    // Gestion de l'upload d'images (partagées entre templates)
    const handleImageUpload = async (file, imageType) => {
        if (!file) return;

        setUploadingImages(prev => ({ ...prev, [imageType]: true }));

        try {
            const url = await uploadImage(file, imageType);
            setCurrentTemplate(prev => ({ ...prev, [imageType]: url }));
            showNotification('Image téléchargée avec succès', 'success');
        } catch (error) {
            console.error('Erreur upload image:', error);
            showNotification(`Erreur lors du téléchargement: ${error.message}`, 'error');
        } finally {
            setUploadingImages(prev => ({ ...prev, [imageType]: false }));
        }
    };

    // Suppression d'une image (partagée)
    const handleImageDelete = async (imageType) => {
        if (!currentTemplate[imageType]) return;

        try {
            await deleteImage(currentTemplate[imageType], imageType);
            setCurrentTemplate(prev => ({ ...prev, [imageType]: null }));
            showNotification('Image supprimée', 'success');
        } catch (error) {
            console.error('Erreur suppression image:', error);
            showNotification('Erreur lors de la suppression', 'error');
        }
    };
    
    // Génération de la prévisualisation PDF
    const generatePreview = async () => {
        if (!currentTemplate) return;

        setIsGenerating(true);
        try {
            // Auto-refresh: Rafraîchir la formation sélectionnée avant génération
            let formationToUse = selectedFormation;
            if ((selectedDocumentType === 'convocation' || selectedDocumentType === 'convention') && selectedFormation?.id) {
                try {
                    console.log('🔄 [generatePreview] Rafraîchissement de la formation avant génération');
                    formationToUse = await getSessionById(selectedFormation.id);
                    console.log('✅ [generatePreview] Formation rafraîchie:', formationToUse);
                } catch (error) {
                    console.error('❌ [generatePreview] Erreur refresh formation:', error);
                    // Continuer avec les données existantes en cas d'erreur
                }
            }

            const pdfParams = convertTemplateToParams(currentTemplate, sections);

            let pdfBlob;

            switch (selectedDocumentType) {
                case 'pdc':
                    if (!selectedPdc || !window.generatePDFWithJsPDF) return;
                    pdfBlob = await window.generatePDFWithJsPDF(selectedPdc, pdfParams);
                    break;

                case 'convocation':
                    if (!window.generateConvocationPDF) {
                        showNotification('Générateur de convocation non disponible', 'error');
                        return;
                    }
                    // Les formations sont des projets avec type='formation'
                    const convocationData = await getConvocationDataFromProject(formationToUse);
                    pdfBlob = await window.generateConvocationPDF(convocationData, pdfParams);
                    break;

                case 'convention':
                    if (!window.generateConventionPDF) {
                        showNotification('Générateur de convention non disponible', 'error');
                        return;
                    }
                    // Les formations sont des projets avec type='formation'
                    console.log('🔍 [TemplateBuilderPage] formationToUse:', formationToUse);
                    console.log('🔍 [TemplateBuilderPage] formationToUse.formateur:', formationToUse?.formateur);
                    const conventionData = await getConventionDataFromProject(formationToUse);
                    console.log('🔍 [TemplateBuilderPage] conventionData.formateur:', conventionData?.formateur);
                    const conventionParams = getSpecificParams('convention', currentTemplate, sections);
                    pdfBlob = await window.generateConventionPDF(conventionData, conventionParams);
                    break;

                case 'emargement':
                    if (!window.generateEmargementPDF) {
                        showNotification('Générateur d\'émargement non disponible', 'error');
                        return;
                    }
                    const emargementData = await getEmargementDataFromProject(selectedProject, getSessionsForProject);
                    pdfBlob = await window.generateEmargementPDF(emargementData, pdfParams);
                    break;

                case 'qualiopi':
                    if (!window.generateQualiopiPDF) {
                        showNotification('Générateur Qualiopi non disponible', 'error');
                        return;
                    }
                    // Utiliser l'évaluation sélectionnée ou les données par défaut
                    const qualiopiData = selectedEvaluation || getDefaultQualiopiData();
                    pdfBlob = await window.generateQualiopiPDF(qualiopiData, pdfParams);
                    break;

                case 'attestation':
                    if (!window.generateDiplomePDF) {
                        showNotification('Générateur d\'attestation non disponible', 'error');
                        return;
                    }
                    // Utiliser l'évaluation sélectionnée
                    const diplomeData = await getDiplomeDataFromEvaluation(selectedEvaluation);
                    pdfBlob = await window.generateDiplomePDF(diplomeData, pdfParams);
                    break;

                default:
                    showNotification('Type de document non supporté', 'error');
                    return;
            }
            
            const url = URL.createObjectURL(pdfBlob);
            
            if (previewPdf) {
                URL.revokeObjectURL(previewPdf);
            }
            
            setPreviewPdf(url);
        } catch (error) {
            console.error('Erreur génération preview:', error);
            showNotification('Erreur lors de la génération du PDF', 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    // Génération en mode "Prod Test" - Simule le flux de production sans upload
    const generateProdTest = async () => {
        if (!currentTemplate) return;

        setIsGenerating(true);
        try {
            console.log('🚀 [PROD TEST] Début de la génération en mode production');

            // Auto-refresh: Rafraîchir la formation sélectionnée avant génération
            let formationToUse = selectedFormation;
            if ((selectedDocumentType === 'convocation' || selectedDocumentType === 'convention') && selectedFormation?.id) {
                try {
                    console.log('🔄 [generateProdTest] Rafraîchissement de la formation avant génération');
                    formationToUse = await getSessionById(selectedFormation.id);
                    console.log('✅ [generateProdTest] Formation rafraîchie:', formationToUse);
                } catch (error) {
                    console.error('❌ [generateProdTest] Erreur refresh formation:', error);
                    // Continuer avec les données existantes en cas d'erreur
                }
            }

            const pdfParams = convertTemplateToParams(currentTemplate, sections);
            let pdfBlob;

            switch (selectedDocumentType) {
                case 'pdc':
                    if (!selectedPdc || !window.generatePDFWithJsPDF) return;
                    pdfBlob = await window.generatePDFWithJsPDF(selectedPdc, pdfParams);
                    break;

                case 'convocation':
                    if (!window.generateConvocationPDF) {
                        showNotification('Générateur de convocation non disponible', 'error');
                        return;
                    }
                    // IMPORTANT: Précharger les sessions comme en production
                    let convocationSessions = [];
                    if (formationToUse?.id) {
                        convocationSessions = await getSessionsForProject(formationToUse.id);
                        console.log('🔍 [PROD TEST CONVOCATION] Sessions préchargées:', convocationSessions);
                    }
                    const convocationData = await getConvocationDataFromProject(formationToUse, convocationSessions);
                    pdfBlob = await window.generateConvocationPDF(convocationData, pdfParams);
                    break;

                case 'convention':
                    if (!window.generateConventionPDF) {
                        showNotification('Générateur de convention non disponible', 'error');
                        return;
                    }
                    // IMPORTANT: Précharger les sessions comme en production
                    let conventionSessions = [];
                    if (formationToUse?.id) {
                        conventionSessions = await getSessionsForProject(formationToUse.id);
                        console.log('🔍 [PROD TEST CONVENTION] Sessions préchargées:', conventionSessions);
                    }
                    console.log('🔍 [PROD TEST] formationToUse:', formationToUse);
                    const conventionData = await getConventionDataFromProject(formationToUse, conventionSessions);
                    console.log('🔍 [PROD TEST] conventionData:', conventionData);
                    const conventionParams = getSpecificParams('convention', currentTemplate, sections);
                    pdfBlob = await window.generateConventionPDF(conventionData, conventionParams);
                    break;

                case 'emargement':
                    if (!window.generateEmargementPDF) {
                        showNotification('Générateur d\'émargement non disponible', 'error');
                        return;
                    }
                    const emargementData = await getEmargementDataFromProject(selectedProject, getSessionsForProject);
                    pdfBlob = await window.generateEmargementPDF(emargementData, pdfParams);
                    break;

                case 'qualiopi':
                    if (!window.generateQualiopiPDF) {
                        showNotification('Générateur Qualiopi non disponible', 'error');
                        return;
                    }
                    const qualiopiData = selectedEvaluation || getDefaultQualiopiData();
                    pdfBlob = await window.generateQualiopiPDF(qualiopiData, pdfParams);
                    break;

                case 'attestation':
                    if (!window.generateDiplomePDF) {
                        showNotification('Générateur d\'attestation non disponible', 'error');
                        return;
                    }
                    // Utiliser l'évaluation sélectionnée
                    const diplomeProdData = await getDiplomeDataFromEvaluation(selectedEvaluation);
                    pdfBlob = await window.generateDiplomePDF(diplomeProdData, pdfParams);
                    break;

                default:
                    showNotification('Type de document non supporté', 'error');
                    return;
            }

            const url = URL.createObjectURL(pdfBlob);

            if (previewPdf) {
                URL.revokeObjectURL(previewPdf);
            }

            setPreviewPdf(url);

            // Télécharger automatiquement le PDF
            const fileName = `${selectedDocumentType}_prod_test_${new Date().getTime()}.pdf`;
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showNotification('PDF généré et téléchargé en mode production (test)', 'success');
            console.log('✅ [PROD TEST] Génération et téléchargement terminés');
        } catch (error) {
            console.error('❌ [PROD TEST] Erreur génération:', error);
            showNotification('Erreur lors de la génération du PDF', 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    // Générer des données par défaut pour convocation
    const getDefaultConvocationData = () => {
        return {
            destinataire: 'Monsieur/Madame',
            objet: 'Convocation pour une formation',
            date: new Date().toLocaleDateString('fr-FR'),
            formation: 'Formation',
            concept: 'Formation professionnelle',
            lieu: 'À définir',
            dates: 'Dates à définir',
            heures: '09h00 à 17h00',
            stagiaires: 'Stagiaires à définir',
            signataire: 'Responsable formation',
            titre_signataire: 'Service Formation'
        };
    };
    
    // Générer des données par défaut pour convention
    const getDefaultConventionData = () => {
        return {
            numero: new Date().getFullYear() + '01 - PR-0000',
            societe: 'Société cliente',
            adresse: 'Adresse de la société',
            representant: 'Représentant légal',
            duree: '1 jour',
            formateur: 'Formateur ARKANCE',
            programme: 'Programme de formation',
            moyens: 'Moyens pédagogiques',
            formation: 'Formation professionnelle',
            cout: '0,00',
            tva: '0,00',
            total: '0,00'
        };
    };
    
    // Générer des données par défaut pour Qualiopi
    const getDefaultQualiopiData = () => {
        return {
            stagiaire_nom: 'NION',
            stagiaire_prenom: 'Emmanuel',
            stagiaire_societe: 'Valdepharm',
            stagiaire_email: 'enion.valdepharm@fareva.com',
            formation: {
                pdc: {
                    ref: 'PC-FOR-12132-A-ALT25-4-GENERALISTE-SPECIFIQUE'
                },
                prj: 'PRJ-2025-001'
            },
            qualiopi_themes: {
                theme_1: { titre: "Comprendre l'interface d'AutoCAD", avant: 0, apres: 4 },
                theme_2: { titre: "Maîtriser les outils de dessin et de modification", avant: 0, apres: 4 },
                theme_3: { titre: "Comprendre les outils de dessin paramétrique", avant: 0, apres: 2 },
                theme_4: { titre: "Contrôler les commandes usuelles de l'interface", avant: 0, apres: 4 },
                theme_5: { titre: "Savoir s'informer sur les différentes propriétés et mesures", avant: 0, apres: 4 },
                theme_6: { titre: "Apprendre à gérer les éléments de bibliothèque Electrique et PID", avant: 0, apres: 4 },
                theme_7: { titre: "Savoir annoter un plan", avant: 0, apres: 4 },
                theme_8: { titre: "Maîtriser les PDF", avant: 0, apres: 4 },
                theme_9: { titre: "Maîtriser l'utilisation des références externes et autres liens", avant: 0, apres: 4 },
                theme_10: { titre: "Savoir mettre en page et imprimer", avant: 0, apres: 4 },
                theme_11: { titre: "Utiliser les outils avancés", avant: 0, apres: 4 },
                theme_12: { titre: "Savoir personnaliser AutoCAD", avant: 0, apres: 4 }
            },
            qualiopi_formateur_themes: {
                theme_1: { note: 5 },
                theme_2: { note: 5 },
                theme_3: { note: 2 },
                theme_4: { note: 5 },
                theme_5: { note: 5 },
                theme_6: { note: 5 },
                theme_7: { note: 5 },
                theme_8: { note: 5 },
                theme_9: { note: 5 },
                theme_10: { note: 5 },
                theme_11: { note: 5 },
                theme_12: { note: 5 }
            }
        };
    };
    
    // Utiliser le service centralisé pour les données de convocation
    const getConvocationDataFromProject = async (project) => {
        const supabase = window.supabaseConfig.client;
        return await window.DocumentDataService.getConvocationDataFromProject(project, supabase);
    };

    // Utiliser le service centralisé pour les données de convention
    const getConventionDataFromProject = async (project, projectSessions = null) => {
        const supabase = window.supabaseConfig.client;
        return await window.DocumentDataService.getConventionDataFromProject(project, projectSessions, supabase);
    };

    // Utiliser le service centralisé pour les données de diplôme
    const getDiplomeDataFromEvaluation = async (evaluation) => {
        const supabase = window.supabaseConfig.client;
        return await window.DocumentDataService.getDiplomeDataFromEvaluation(evaluation, supabase);
    };

    // Convertir les données projet en données émargement
    const getEmargementDataFromProject = async (project, sessionsGetter) => {
        if (!project) return getDefaultEmargementData();
        
        const entreprise = project.entreprise || {};
        const commercial = project.commercial || {};
        const contact = project.contact || {};
        const logiciel = project.logiciel || {};
        const pdc = project.pdc || {};
        
        // Récupérer les sessions détaillées du projet
        let sessions = [];
        try {
            sessions = await sessionsGetter(project.id);
        } catch (error) {
            console.warn('Erreur récupération sessions pour émargement:', error);
        }
        
        // Extraire les dates uniques des sessions
        const sessionDates = [];
        const sessionDetails = [];
        
        sessions.forEach(session => {
            if (session.events && session.events.length > 0) {
                session.events.forEach(event => {
                    const dateStr = event.dateDebut.toLocaleDateString('fr-FR');
                    if (!sessionDates.includes(dateStr)) {
                        sessionDates.push(dateStr);
                    }
                    sessionDetails.push({
                        date: dateStr,
                        heureDebut: event.dateDebut.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                        heureFin: event.dateFin.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                        lieu: event.lieu || project.lieu_projet || 'Formation à distance',
                        formateur: event.formateur?.nom || commercial.prenom + ' ' + commercial.nom || 'Formateur ARKANCE'
                    });
                });
            }
        });
        
        // Calculer durée et nombre de jours
        const nombreJours = sessionDates.length;
        const dureeHeures = nombreJours * 7; // 7h par jour par défaut
        
        return {
            // Informations document
            numero: `${new Date().getFullYear()}01/PRJ${project.id?.slice(-3) || '134'}`,
            
            // Informations société
            societe: entreprise.nom || 'IMPLENIA SUISSE SA',
            
            // Informations formation
            programme: pdc.nom || logiciel.nom || project.name || 'Autodesk Revit & HOLIXA METHODS 2021 - Concepts de base',
            lieu: project.lieu_projet || 'Formation à distance',
            dates: sessionDates.join(' - ') || '07/10/2020 - 08/10/2020 - 30/11/2020 - 01/12/2020 - 02/12/2020',
            
            // Durée
            duree: `${dureeHeures} heures`,
            nombreJours: nombreJours,
            codeCPF: '', // À compléter si nécessaire
            
            // Sessions détaillées avec créneaux
            sessionsDetails: sessionDetails,
            
            // Stagiaire (sera remplacé par la sélection dans l'interface)
            stagiaire: {
                prenom: 'Christelle',
                nom: 'CHAUMONTET'
            },
            
            // Formateur
            formateur: {
                prenom: 'Alain',
                nom: 'GUINET'
            },
            
            // Informations de contact
            contact: {
                adresse: 'LE VAL SAINT QUENTIN - Bâtiment C - 2, rue René Caudron - CS 30764 - 78961 Voisins-le-Bretonneux Cedex',
                telephone: '01 39 44 18 18',
                email: 'formation@arkance-systems.com',
                web: 'www.arkance-systems.fr'
            }
        };
    };
    
    // Générer des données par défaut pour émargement
    const getDefaultEmargementData = () => {
        return {
            numero: '202701/PRJ134',
            societe: 'IMPLENIA SUISSE SA',
            programme: 'Autodesk Revit & HOLIXA METHODS 2021 - Concepts de base',
            lieu: 'Formation à distance',
            dates: '07/10/2020 - 08/10/2020 - 30/11/2020 - 01/12/2020 - 02/12/2020',
            duree: '35 heures',
            nombreJours: 5,
            codeCPF: '',
            sessionsDetails: [
                { date: '07/10/2020', heureDebut: '09:00', heureFin: '12:00', lieu: 'Formation à distance', formateur: 'Alain GUINET' },
                { date: '07/10/2020', heureDebut: '13:00', heureFin: '17:00', lieu: 'Formation à distance', formateur: 'Alain GUINET' },
                { date: '08/10/2020', heureDebut: '09:00', heureFin: '12:00', lieu: 'Formation à distance', formateur: 'Alain GUINET' },
                { date: '08/10/2020', heureDebut: '13:00', heureFin: '17:00', lieu: 'Formation à distance', formateur: 'Alain GUINET' },
                { date: '30/11/2020', heureDebut: '09:00', heureFin: '12:00', lieu: 'Formation à distance', formateur: 'Alain GUINET' }
            ],
            stagiaire: { prenom: 'Christelle', nom: 'CHAUMONTET' },
            formateur: { prenom: 'Alain', nom: 'GUINET' },
            contact: {
                adresse: 'LE VAL SAINT QUENTIN - Bâtiment C - 2, rue René Caudron - CS 30764 - 78961 Voisins-le-Bretonneux Cedex',
                telephone: '01 39 44 18 18',
                email: 'formation@arkance-systems.com',
                web: 'www.arkance-systems.fr'
            }
        };
    };

    // Note: getConventionDataFromFormation a été supprimée - utiliser getConventionDataFromProject à la place
    // car les formations sont en fait des projets avec type='formation'

    // Convertir le template en paramètres pour le générateur PDF
    const convertTemplateToParams = (template, layoutSections = null) => {
        if (!template) return {};

        return {
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
            infoBackground: template.colors?.infoBackground || '#f3f4f6',
            tableHeader: template.colors?.tableHeader || '#f3f4f6',
            marginTop: template.spacing?.marginTop || 20,
            marginSide: template.spacing?.marginSide || 20,
            marginBottom: template.spacing?.marginBottom || 30,
            headerHeight: template.spacing?.headerHeight || 35,
            footerHeight: template.spacing?.footerHeight || 40,
            sectionSpacing: template.spacing?.sectionSpacing || 15,
            lineSpacing: template.spacing?.lineSpacing || 5,
            columnSpacing: template.spacing?.columnSpacing || 5,
            blockPadding: template.spacing?.blockPadding || 10,
            tableSpacing: template.spacing?.tableSpacing || 6,
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
            footerLogoRight: null,
            sections: layoutSections || [] // Ajouter les sections pour le layout dynamique
        };
    };
    
    // Fonction pour obtenir des paramètres spécifiques selon le type de document
    const getSpecificParams = (documentType, template, layoutSections = null) => {
        const baseParams = convertTemplateToParams(template, layoutSections);

        // Paramètres spécifiques pour Convention (tailles en points jsPDF)
        if (documentType === 'convention') {
            return {
                ...baseParams,
                titleSize: 15,        // 15pt
                subtitleSize: 10,     // 10pt
                textSize: 8,          // 8pt
                articleSize: 9        // 9pt en gras
            };
        }

        // Pour tous les autres types (PDC, Convocation, Émargement), utiliser les valeurs par défaut
        return baseParams;
    };
    
    // Fonction pour obtenir l'URL d'une image (locale ou distante)
    const getImageUrl = (imageUrl) => {
        if (!imageUrl) return null;
        
        // Vérifier que l'URL est valide
        try {
            new URL(imageUrl);
            return imageUrl;
        } catch (error) {
            console.warn('URL d\'image invalide:', imageUrl);
            return null;
        }
    };
    
    // État pour tracking des erreurs d'images
    const [imageErrors, setImageErrors] = useState({});
    
    // Créer la section d'image
    const createImageSection = (imageType, label) => {
        const currentImageUrl = currentTemplate[imageType];
        const displayUrl = getImageUrl(currentImageUrl);
        const hasError = imageErrors[imageType];

        // Extraire le nom du fichier depuis l'URL
        const getFileNameFromUrl = (url) => {
            if (!url) return null;
            try {
                const parts = url.split('/');
                const fileName = parts[parts.length - 1];
                return decodeURIComponent(fileName);
            } catch (error) {
                return url;
            }
        };

        const fileName = getFileNameFromUrl(displayUrl);

        return React.createElement('div', { className: 'flex-1' },
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, label),
            React.createElement('div', { className: 'flex flex-col gap-3' },
                React.createElement('div', { className: 'relative flex items-center gap-2' },
                    displayUrl && !hasError && fileName ? [
                        React.createElement('div', {
                            key: 'filename',
                            className: 'flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-700 truncate',
                            title: fileName
                        }, fileName),
                        currentImageUrl && React.createElement('button', {
                            key: 'delete',
                            onClick: () => handleImageDelete(imageType),
                            className: 'bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm hover:bg-red-600 flex-shrink-0',
                            title: 'Supprimer l\'image'
                        }, '×')
                    ] : React.createElement('div', {
                        className: `flex-1 px-3 py-2 border-2 border-dashed rounded flex items-center justify-center text-xs ${
                            hasError ? 'border-red-300 bg-red-50 text-red-500' : 'border-gray-300 text-gray-400 bg-gray-50'
                        }`
                    }, hasError ? 'Erreur' : 'Aucune image sélectionnée')
                ),
                React.createElement('div', { className: 'flex flex-col gap-2' },
                    React.createElement('button', {
                        type: 'button',
                        onClick: () => setImageModalOpen(imageType),
                        className: 'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2',
                        disabled: uploadingImages[imageType]
                    }, [
                        React.createElement('i', { key: 'icon', 'data-lucide': 'image', className: 'w-4 h-4' }),
                        React.createElement('span', { key: 'text' }, 'Choisir une image')
                    ]),
                    uploadingImages[imageType] && React.createElement('div', {
                        className: 'text-sm text-blue-600 flex items-center gap-2'
                    }, [
                        React.createElement('div', { key: 'spinner', className: 'animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600' }),
                        React.createElement('span', { key: 'text' }, 'Upload en cours...')
                    ])
                )
            )
        );
    };
    
    // Auto-génération de la prévisualisation
    useEffect(() => {
        if (currentTemplate) {
            // Pour PDC, on a besoin d'un PDC sélectionné
            if (selectedDocumentType === 'pdc' && !selectedPdc) {
                return;
            }
            // Pour convocation et convention, on a besoin d'une formation sélectionnée
            if ((selectedDocumentType === 'convocation' || selectedDocumentType === 'convention') && !selectedFormation) {
                return;
            }
            // Pour émargement, on a besoin d'un projet sélectionné
            if (selectedDocumentType === 'emargement' && !selectedProject) {
                return;
            }
            // Pour attestation et qualiopi, on a besoin d'une évaluation sélectionnée
            if ((selectedDocumentType === 'attestation' || selectedDocumentType === 'qualiopi') && !selectedEvaluation) {
                return;
            }

            const timeoutId = setTimeout(() => {
                generatePreview();
            }, 500);
            return () => clearTimeout(timeoutId);
        }
    }, [currentTemplate, selectedPdc, selectedProject, selectedFormation, selectedEvaluation, selectedDocumentType]);
    
    // Auto-sauvegarde
    useEffect(() => {
        if (currentTemplate) {
            const timeoutId = setTimeout(() => {
                autoSaveTemplate();
            }, 1000);
            return () => clearTimeout(timeoutId);
        }
    }, [currentTemplate]);
    
    // Cleanup
    useEffect(() => {
        return () => {
            if (previewPdf) {
                URL.revokeObjectURL(previewPdf);
            }
        };
    }, []);
    
    if (!currentTemplate) {
        return React.createElement('div', { className: 'p-6 flex items-center justify-center h-screen' },
            React.createElement('div', { className: 'text-center' },
                React.createElement('div', { className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4' }),
                React.createElement('p', { className: 'text-gray-600' }, 'Chargement du template...')
            )
        );
    }
    
    return React.createElement('div', { className: 'p-6 bg-gray-50 h-screen flex flex-col' },
        
        // En-tête
        React.createElement('div', { className: 'mb-6' },
            React.createElement('div', { className: 'flex items-center justify-between' },
                React.createElement('div', {},
                    React.createElement('h1', { className: 'text-3xl font-bold text-gray-900 mb-2' }, 'Template PDF'),
                    React.createElement('p', { className: 'text-gray-600' }, 'Créez et personnalisez vos templates PDF (stockage local)')
                ),
                React.createElement('div', { className: 'flex items-center gap-2' },
                    React.createElement('div', { className: 'flex items-center gap-2 px-3 py-1 bg-white rounded-full shadow-sm' },
                        isSaving ? [
                            React.createElement('div', { key: 'spinner', className: 'animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600' }),
                            React.createElement('span', { key: 'text', className: 'text-xs text-blue-600' }, 'Sauvegarde...')
                        ] : [
                            React.createElement('i', { key: 'icon', 'data-lucide': 'check-circle', className: 'w-3 h-3 text-green-600' }),
                            React.createElement('span', { key: 'text', className: 'text-xs text-green-600' }, 'Sauvegardé')
                        ]
                    )
                )
            )
        ),
        
        // Section Type de document + Données de test (NOUVELLE STRUCTURE)
        React.createElement('div', { className: 'mb-6 flex gap-4' }, [

            // Type de document (35%)
            React.createElement('div', { key: 'type', className: 'flex-[35] bg-white rounded-lg shadow-md p-4' },
                React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 'Type de document'),
                React.createElement('select', {
                    value: selectedDocumentType,
                    onChange: (e) => setSelectedDocumentType(e.target.value),
                    className: 'w-full p-3 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                },
                    documentTypes.map(docType =>
                        React.createElement('option', {
                            key: docType.id,
                            value: docType.id,
                            disabled: docType.disabled
                        }, docType.label)
                    )
                )
            ),

            // Données de test (65%)
            React.createElement('div', { key: 'data', className: 'flex-[65] bg-white rounded-lg shadow-md p-4' },
                React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 'Données de test'),
                selectedDocumentType === 'pdc' ? (
                    pdcsLoading ?
                        React.createElement('div', { className: 'text-center py-2 text-sm text-gray-500' }, 'Chargement...') :
                        React.createElement('select', {
                            value: selectedPdc?.id || '',
                            onChange: (e) => {
                                const pdc = pdcs.find(p => p.id === e.target.value);
                                setSelectedPdc(pdc);
                            },
                            className: 'w-full p-3 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                        },
                            React.createElement('option', { value: '' }, 'Sélectionner un PDC...'),
                            pdcs?.map(pdc =>
                                React.createElement('option', {
                                    key: pdc.id,
                                    value: pdc.id
                                }, `PDC ${pdc.pdc_number} - ${pdc.logiciel?.nom || 'N/A'}`)
                            )
                        )
                ) : selectedDocumentType === 'convocation' ? (
                    formationsLoading ?
                        React.createElement('div', { className: 'text-center py-2 text-sm text-gray-500' }, 'Chargement des formations...') :
                        React.createElement('select', {
                            value: selectedFormation?.id || '',
                            onChange: (e) => {
                                const formation = formations.find(f => f.id === e.target.value);
                                setSelectedFormation(formation);
                            },
                            className: 'w-full p-3 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                        },
                            React.createElement('option', { value: '' }, 'Sélectionner une formation...'),
                            formations?.map(formation =>
                                React.createElement('option', {
                                    key: formation.id,
                                    value: formation.id
                                }, `${formation.prj} - ${formation.pdc?.ref || 'N/A'} (${formation.nombre_stagiaire || 0} stagiaires)`)
                            )
                        )
                ) : selectedDocumentType === 'convention' ? (
                    formationsLoading ?
                        React.createElement('div', { className: 'text-center py-2 text-sm text-gray-500' }, 'Chargement des formations...') :
                        React.createElement('select', {
                            value: selectedFormation?.id || '',
                            onChange: (e) => {
                                const formation = formations.find(f => f.id === e.target.value);
                                setSelectedFormation(formation);
                            },
                            className: 'w-full p-3 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                        },
                            React.createElement('option', { value: '' }, 'Sélectionner une formation...'),
                            formations?.map(formation =>
                                React.createElement('option', {
                                    key: formation.id,
                                    value: formation.id
                                }, `${formation.prj} - ${formation.pdc?.ref || 'N/A'} (${formation.nombre_stagiaire || 0} stagiaires)`)
                            )
                        )
                ) : selectedDocumentType === 'emargement' ? (
                    projectsLoading ?
                        React.createElement('div', { className: 'text-center py-2 text-sm text-gray-500' }, 'Chargement des projets...') :
                        React.createElement('select', {
                            value: selectedProject?.id || '',
                            onChange: (e) => {
                                const project = projects.find(p => p.id === e.target.value);
                                setSelectedProject(project);
                            },
                            className: 'w-full p-3 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                        },
                            React.createElement('option', { value: '' }, 'Sélectionner un projet...'),
                            projects?.map(project =>
                                React.createElement('option', {
                                    key: project.id,
                                    value: project.id
                                }, `${project.name} - ${project.entreprise?.nom || 'N/A'} (${project.nombre_stagiaire || 0} stagiaires)`)
                            )
                        )
                ) : selectedDocumentType === 'qualiopi' ? (
                    evaluationsLoading ?
                        React.createElement('div', { className: 'text-center py-2 text-sm text-gray-500' }, 'Chargement des évaluations...') :
                        React.createElement('select', {
                            value: selectedEvaluation?.id || '',
                            onChange: (e) => {
                                const evaluation = evaluations.find(ev => ev.id === e.target.value);
                                setSelectedEvaluation(evaluation);
                            },
                            className: 'w-full p-3 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                        },
                            React.createElement('option', { value: '' }, 'Sélectionner une évaluation...'),
                            evaluations?.map(evaluation =>
                                React.createElement('option', {
                                    key: evaluation.id,
                                    value: evaluation.id
                                }, `${evaluation.stagiaire_prenom} ${evaluation.stagiaire_nom} - ${evaluation.formation?.pdc?.ref || 'N/A'} - ${evaluation.formation?.prj || 'N/A'}`)
                            )
                        )
                ) : selectedDocumentType === 'attestation' ? (
                    evaluationsLoading ?
                        React.createElement('div', { className: 'text-center py-2 text-sm text-gray-500' }, 'Chargement des évaluations...') :
                        React.createElement('select', {
                            value: selectedEvaluation?.id || '',
                            onChange: (e) => {
                                const evaluation = evaluations.find(ev => ev.id === e.target.value);
                                setSelectedEvaluation(evaluation);
                            },
                            className: 'w-full p-3 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                        },
                            React.createElement('option', { value: '' }, 'Sélectionner une évaluation...'),
                            evaluations?.map(evaluation =>
                                React.createElement('option', {
                                    key: evaluation.id,
                                    value: evaluation.id
                                }, `${evaluation.stagiaire_prenom} ${evaluation.stagiaire_nom} - ${evaluation.formation?.pdc?.ref || 'N/A'}`)
                            )
                        )
                ) : (
                    React.createElement('div', { className: 'text-center py-2 text-sm text-gray-500' },
                        'Sélectionnez un type de document')
                )
            )
        ]),

        // Layout principal - VERTICAL
        React.createElement('div', { className: 'flex flex-col gap-6 flex-1' },

            // Rangée horizontale: Layout Editor + Prévisualisation
            React.createElement('div', { className: 'flex-1 flex gap-6' }, [

                // Mise en page : Images + Layout Editor (1/3)
                React.createElement('div', {
                    key: 'layout-editor',
                    className: 'flex-[1] bg-white rounded-lg shadow-md overflow-hidden flex flex-col'
                }, [
                    // Section Images (pliable)
                    React.createElement('div', {
                        key: 'images-section',
                        className: 'border-b border-gray-200'
                    }, [
                        // Header avec toggle
                        React.createElement('button', {
                            key: 'toggle',
                            onClick: () => setImagesExpanded(!imagesExpanded),
                            className: 'w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors'
                        }, [
                            React.createElement('span', {
                                key: 'title',
                                className: 'text-sm font-semibold text-gray-700'
                            }, 'Images'),
                            React.createElement('i', {
                                key: 'icon',
                                'data-lucide': imagesExpanded ? 'chevron-up' : 'chevron-down',
                                className: 'w-4 h-4 text-gray-500'
                            })
                        ]),
                        // Contenu pliable
                        imagesExpanded && React.createElement('div', {
                            key: 'content',
                            className: 'p-4 space-y-4 bg-gray-50'
                        }, [
                            createImageSection('header_image', 'En-tête'),
                            createImageSection('footer_image', 'Pied de page')
                        ])
                    ]),
                    // Layout Editor
                    React.createElement('div', {
                        key: 'layout',
                        className: 'flex-1 overflow-hidden'
                    },
                        sections.length > 0 && React.createElement(window.TemplateLayoutEditor, {
                            documentType: selectedDocumentType,
                            sections: sections,
                            onSectionsChange: (updatedSections) => setSections(updatedSections),
                            selectedSectionId: selectedSectionId,
                            onSectionSelect: (sectionId) => setSelectedSectionId(sectionId)
                        })
                    )
                ]),

                // Section prévisualisation (2/3)
                React.createElement('div', {
                    key: 'preview',
                    className: 'flex-[2]'
                },
                    React.createElement('div', { className: 'bg-white rounded-lg shadow-md p-4 h-full flex flex-col' },
                        React.createElement('div', { className: 'flex items-center justify-between mb-4' },
                            React.createElement('div', { className: 'flex items-center gap-4' }, [
                                React.createElement('h2', { key: 'title', className: 'text-xl font-semibold' }, 'Prévisualisation'),
                                // Toggle mode visuel / PDF
                                React.createElement('div', {
                                    key: 'toggle',
                                    className: 'flex bg-gray-100 rounded-lg p-1'
                                }, [
                                    React.createElement('button', {
                                        key: 'visual',
                                        onClick: () => setViewMode('visual'),
                                        className: `px-4 py-1 rounded-md text-sm transition-colors ${
                                            viewMode === 'visual'
                                                ? 'bg-blue-600 text-white'
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`
                                    }, 'Mode visuel'),
                                    React.createElement('button', {
                                        key: 'pdf',
                                        onClick: () => setViewMode('pdf'),
                                        className: `px-4 py-1 rounded-md text-sm transition-colors ${
                                            viewMode === 'pdf'
                                                ? 'bg-blue-600 text-white'
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`
                                    }, 'Mode PDF')
                                ])
                            ]),
                            viewMode === 'pdf' && React.createElement('div', { className: 'flex gap-2' }, [
                                React.createElement('button', {
                                    key: 'preview',
                                    onClick: generatePreview,
                                    disabled: isGenerating || (selectedDocumentType === 'pdc' && !selectedPdc) || (selectedDocumentType === 'convocation' && !selectedFormation) || (selectedDocumentType === 'convention' && !selectedFormation) || (selectedDocumentType === 'emargement' && !selectedProject) || (selectedDocumentType === 'qualiopi' && !selectedEvaluation) || (selectedDocumentType === 'attestation' && !selectedEvaluation),
                                    className: 'bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50'
                                }, isGenerating ? 'Génération...' : 'Actualiser'),
                                React.createElement('button', {
                                    key: 'prod-test',
                                    onClick: generateProdTest,
                                    disabled: isGenerating || (selectedDocumentType === 'pdc' && !selectedPdc) || (selectedDocumentType === 'convocation' && !selectedFormation) || (selectedDocumentType === 'convention' && !selectedFormation) || (selectedDocumentType === 'emargement' && !selectedProject) || (selectedDocumentType === 'qualiopi' && !selectedEvaluation) || (selectedDocumentType === 'attestation' && !selectedEvaluation),
                                    className: 'bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50'
                                }, isGenerating ? 'Génération...' : 'Prod Test')
                            ])
                        ),

                        React.createElement('div', {
                            className: 'border border-gray-200 rounded-lg overflow-hidden flex-1 relative',
                            style: { overflow: 'hidden' }
                        },
                            // Mode visuel : Afficher le VisualLayoutEditor
                            viewMode === 'visual' ?
                                React.createElement(window.VisualLayoutEditor, {
                                    sections: sections,
                                    selectedSectionId: selectedSectionId,
                                    onSectionsChange: (updatedSections) => setSections(updatedSections),
                                    onSectionSelect: (sectionId) => setSelectedSectionId(sectionId)
                                }) :
                            // Mode PDF : Afficher la prévisualisation PDF
                            (selectedDocumentType === 'pdc' && !selectedPdc) ?
                                React.createElement('div', { className: 'flex items-center justify-center h-full text-gray-500' },
                                    'Sélectionnez un PDC pour commencer') :
                            (selectedDocumentType === 'convocation' && !selectedFormation) ?
                                React.createElement('div', { className: 'flex items-center justify-center h-full text-gray-500' },
                                    'Sélectionnez une formation pour commencer') :
                            (selectedDocumentType === 'convention' && !selectedFormation) ?
                                React.createElement('div', { className: 'flex items-center justify-center h-full text-gray-500' },
                                    'Sélectionnez une formation pour commencer') :
                            (selectedDocumentType === 'emargement' && !selectedProject) ?
                                React.createElement('div', { className: 'flex items-center justify-center h-full text-gray-500' },
                                    'Sélectionnez un projet pour commencer') :
                            (selectedDocumentType === 'qualiopi' && !selectedEvaluation) ?
                                React.createElement('div', { className: 'flex items-center justify-center h-full text-gray-500' },
                                    'Sélectionnez une évaluation pour commencer') :
                            (selectedDocumentType === 'attestation' && !selectedEvaluation) ?
                                React.createElement('div', { className: 'flex items-center justify-center h-full text-gray-500' },
                                    'Sélectionnez une évaluation pour commencer') :
                            (!selectedDocumentType || (selectedDocumentType !== 'pdc' && selectedDocumentType !== 'convocation' && selectedDocumentType !== 'convention' && selectedDocumentType !== 'emargement' && selectedDocumentType !== 'qualiopi' && selectedDocumentType !== 'attestation')) ?
                                React.createElement('div', { className: 'flex items-center justify-center h-full text-gray-500' },
                                    'Sélectionnez un type de document pour commencer') :
                            isGenerating ?
                                React.createElement('div', { className: 'flex items-center justify-center h-full' },
                                    React.createElement('div', { className: 'text-center' },
                                        React.createElement('div', { className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2' }),
                                        React.createElement('div', { className: 'text-gray-600' }, 'Génération du PDF...')
                                    )
                                ) :
                            previewPdf ?
                                React.createElement('iframe', {
                                    key: 'iframe',
                                    ref: iframeRef,
                                    src: `${previewPdf}#toolbar=0&navpanes=0&scrollbar=0&view=FitV&zoom=page-fit`,
                                    className: 'w-full h-full border-0',
                                    title: 'PDF Preview',
                                    style: { touchAction: 'none', userSelect: 'none' },
                                    onWheel: (e) => {
                                        // Bloquer le zoom avec Ctrl+molette
                                        if (e.ctrlKey) {
                                            e.preventDefault();
                                        }
                                    }
                                }) :
                                React.createElement('div', { className: 'flex items-center justify-center h-full text-gray-500' },
                                    'Cliquez sur "Actualiser" pour voir la prévisualisation')
                        )
                    )
                )
            ])
        ),

        // Modal de sélection d'image (partagée entre tous les templates)
        imageModalOpen && React.createElement(window.ImageSelectorModal, {
            imageType: imageModalOpen,
            onSelect: (url) => {
                // Mettre à jour le template avec l'URL de l'image sélectionnée
                setCurrentTemplate(prev => ({ ...prev, [imageModalOpen]: url }));
                setImageModalOpen(null);
                showNotification('Image sélectionnée avec succès', 'success');
            },
            onClose: () => setImageModalOpen(null)
        }),

        // Notification toast
        notification && React.createElement('div', {
            className: `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
                notification.type === 'success' ? 'bg-green-500 text-white' :
                notification.type === 'error' ? 'bg-red-500 text-white' :
                'bg-blue-500 text-white'
            }`
        },
            React.createElement('div', { className: 'flex items-center gap-2' },
                React.createElement('i', {
                    'data-lucide': notification.type === 'success' ? 'check-circle' : 
                                 notification.type === 'error' ? 'alert-circle' : 'info',
                    className: 'w-5 h-5'
                }),
                React.createElement('span', {}, notification.message)
            )
        )
    );
}

// Export global
window.TemplateBuilderPage = TemplateBuilderPage;