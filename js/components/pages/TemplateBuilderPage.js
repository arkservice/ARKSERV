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
    const [projectSessions, setProjectSessions] = useState([]);
    
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
        { id: 'emargement', label: 'Émargement', icon: 'clipboard-check', description: 'Templates pour les feuilles d\'émargement par stagiaire' }
    ];
    
    // Hooks pour les données
    const { pdcs, loading: pdcsLoading } = window.usePdc();
    const { projects, loading: projectsLoading } = window.useProjects();
    const { getSessionsForProject } = window.useProjectSessions();
    const { 
        loadTemplateByType, 
        saveTemplateByType, 
        uploadImage, 
        deleteImage,
        getImageFromLocal,
        loading: templateLoading,
        error: templateError
    } = window.useTemplates();
    
    // Chargement initial
    useEffect(() => {
        loadCurrentTemplate();
        if (pdcs && pdcs.length > 0 && !selectedPdc) {
            setSelectedPdc(pdcs[0]);
        }
        if (projects && projects.length > 0 && !selectedProject) {
            setSelectedProject(projects[0]);
        }
    }, [pdcs, projects, selectedDocumentType]);
    
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
    
    // Gestion de l'upload d'images
    const handleImageUpload = async (file, imageType) => {
        if (!file) return;
        
        setUploadingImages(prev => ({ ...prev, [imageType]: true }));
        
        try {
            const url = await uploadImage(file, imageType, selectedDocumentType);
            setCurrentTemplate(prev => ({ ...prev, [imageType]: url }));
            showNotification('Image téléchargée avec succès', 'success');
        } catch (error) {
            console.error('Erreur upload image:', error);
            showNotification(`Erreur lors du téléchargement: ${error.message}`, 'error');
        } finally {
            setUploadingImages(prev => ({ ...prev, [imageType]: false }));
        }
    };
    
    // Suppression d'une image
    const handleImageDelete = async (imageType) => {
        if (!currentTemplate[imageType]) return;
        
        try {
            await deleteImage(currentTemplate[imageType]);
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
            const pdfParams = convertTemplateToParams(currentTemplate);
            
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
                    const convocationData = await getConvocationDataFromProject(selectedProject, getSessionsForProject);
                    pdfBlob = await window.generateConvocationPDF(convocationData, pdfParams);
                    break;
                    
                case 'convention':
                    if (!window.generateConventionPDF) {
                        showNotification('Générateur de convention non disponible', 'error');
                        return;
                    }
                    const conventionData = await getConventionDataFromProject(selectedProject, projectSessions);
                    const conventionParams = getSpecificParams('convention', currentTemplate);
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
    
    // Convertir les données projet en données convocation
    const getConvocationDataFromProject = async (project, sessionsGetter) => {
        if (!project) return getDefaultConvocationData();
        
        const entreprise = project.entreprise || {};
        const commercial = project.commercial || {};
        const contact = project.contact || {};
        const logiciel = project.logiciel || {};
        
        // Récupérer les sessions détaillées du projet
        let sessions = [];
        try {
            sessions = await sessionsGetter(project.id);
        } catch (error) {
            console.warn('Erreur récupération sessions pour convocation:', error);
        }
        
        // Formater les sessions pour l'affichage
        const formatSession = (session, index) => {
            const dateDebut = session.dateDebut;
            const dateFin = session.dateFin;
            const lieu = session.lieu || 'Formation à distance';
            
            // Format date : si même jour = "le DD/MM/YYYY", sinon "du DD/MM/YYYY au DD/MM/YYYY"
            let dateText;
            if (dateDebut.toDateString() === dateFin.toDateString()) {
                dateText = `le ${dateDebut.toLocaleDateString('fr-FR')}`;
            } else {
                dateText = `du ${dateDebut.toLocaleDateString('fr-FR')} au ${dateFin.toLocaleDateString('fr-FR')}`;
            }
            
            return `Session ${index + 1} : ${dateText} à ${lieu}`;
        };
        
        const sessionsFormattees = sessions.length > 0 ? 
            sessions.map(formatSession) : 
            [`Session 1 : ${project.periode_souhaitee || 'Dates à définir'} à ${project.lieu_projet || 'Formation à distance'}`];
        
        // Récupérer les noms des stagiaires depuis les sessions
        const stagiairesList = sessions.length > 0 ? 
            [...new Set(sessions.flatMap(s => s.stagiaires))].join(', ') :
            `${project.nombre_stagiaire || 1} participant(s) pour ${project.name || 'la formation'}`;
        
        return {
            destinataire: contact.prenom && contact.nom ? 
                `${contact.prenom.charAt(0).toUpperCase() + contact.prenom.slice(1)} ${contact.nom.toUpperCase()}` : 
                'Monsieur/Madame',
            objet: 'Convocation pour une formation',
            date: new Date().toLocaleDateString('fr-FR'),
            formation: project.name || 'Formation',
            concept: logiciel.nom ? `Formation ${logiciel.nom}` : 'Formation spécialisée',
            // NOUVEAU: Sessions détaillées au lieu de champs agrégés
            sessions: sessionsFormattees,
            // Garder les anciens champs comme fallback
            lieu: project.lieu_projet || 'Formation à distance',
            dates: project.periode_souhaitee || 'Dates à définir',
            heures: '09h00 à 12h00 et de 13h00 à 17h00',
            stagiaires: stagiairesList,
            signataire: commercial.prenom && commercial.nom ? 
                `${commercial.prenom} ${commercial.nom}` : 
                'Geoffrey La MENDOLA',
            titre_signataire: 'Ingénieur Commercial',
            // Informations entreprise cliente pour l'adresse en haut à droite
            entreprise_nom: entreprise.nom || 'Entreprise',
            entreprise_adresse: entreprise.adresse || 'Adresse non renseignée'
        };
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
    
    // Convertir les données projet en données convention
    const getConventionDataFromProject = async (project, projectSessions = null) => {
        if (!project) return getDefaultConventionData();
        
        const entreprise = project.entreprise || {};
        const commercial = project.commercial || {};
        const contact = project.contact || {};
        const logiciel = project.logiciel || {};
        const pdc = project.pdc || {};
        
        // Récupérer les sessions si pas fournies
        let sessions = projectSessions;
        if (!sessions) {
            try {
                sessions = await getSessionsForProject(project.id);
            } catch (error) {
                console.warn('Erreur récupération sessions:', error);
                sessions = [];
            }
        }
        
        // Extraire le formateur de la première session
        let formateurInfo = 'Formateur à définir';
        if (sessions.length > 0 && sessions[0].formateur) {
            formateurInfo = sessions[0].formateur.nom || 'Formateur à définir';
        }
        
        // Extraire la liste des stagiaires de toutes les sessions
        const tousLesStagiaires = sessions.flatMap(session => session.stagiaires || []);
        const stagiairesList = [...new Set(tousLesStagiaires)]; // Supprimer les doublons
        const stagiairesText = stagiairesList.length > 0 ? 
            stagiairesList.join(', ') : 
            `${project.nombre_stagiaire || 1} participant(s)`;
        
        // Calculer la durée depuis le PDC
        const dureeJours = pdc.duree_en_jour || 5;
        const dureeText = dureeJours === 1 ? '1 jour' : `${dureeJours} jour(s)`;
        
        // Générer un numéro de convention basé sur l'année et l'ID du projet
        const year = new Date().getFullYear();
        const projectShortId = project.id ? project.id.slice(-8) : '12345678';
        
        return {
            numero: `${year}01 - PR-${projectShortId}`,
            societe: entreprise.nom || 'Société',
            adresse: entreprise.adresse || 'Adresse non renseignée',
            representant: contact.prenom && contact.nom ? 
                `${contact.prenom.charAt(0).toUpperCase() + contact.prenom.slice(1)} ${contact.nom.toUpperCase()}` : 
                'Monsieur le Directeur',
            duree: dureeText, // Durée dynamique depuis PDC
            formateur: formateurInfo, // Formateur depuis les sessions
            programme: project.name || 'Formation spécialisée',
            moyens: 'Formation en présentiel avec supports pédagogiques et exercices pratiques',
            formation: logiciel.nom ? `Formation ${logiciel.nom}` : project.name || 'Formation',
            cout: '6750,00', // Valeurs par défaut - à terme, récupérer du devis
            tva: '1350,00',
            total: '8100,00',
            // Nouvelles données pour les articles détaillés
            stagiaires: stagiairesText, // Liste des noms des stagiaires
            dates: project.periode_souhaitee || 'Dates à définir selon planning',
            lieu_type: project.lieu_projet?.toLowerCase().includes('distance') ? 'distance' : 'sur_site',
            editeur: 'Autodesk', // Valeur par défaut
            logiciel: logiciel.nom || project.name || 'Logiciel',
            type_pdc: pdc.nom || project.type_formation || 'Concepts de base'
        };
    };
    
    // Convertir le template en paramètres pour le générateur PDF
    const convertTemplateToParams = (template) => {
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
            footerLogoRight: null
        };
    };
    
    // Fonction pour obtenir des paramètres spécifiques selon le type de document
    const getSpecificParams = (documentType, template) => {
        const baseParams = convertTemplateToParams(template);
        
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
        
        const handleImageError = () => {
            console.error(`Erreur chargement image ${imageType}:`, displayUrl);
            setImageErrors(prev => ({ ...prev, [imageType]: true }));
            showNotification(`Erreur chargement ${label.toLowerCase()}`, 'error');
        };
        
        const handleImageLoad = () => {
            // Reset error state when image loads successfully
            setImageErrors(prev => ({ ...prev, [imageType]: false }));
        };
        
        return React.createElement('div', { className: 'mb-4' },
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, label),
            React.createElement('div', { className: 'flex items-center gap-3' },
                React.createElement('div', { className: 'relative' },
                    displayUrl && !hasError ? [
                        React.createElement('img', {
                            key: 'image',
                            src: displayUrl,
                            alt: label,
                            className: 'w-16 h-16 object-contain border border-gray-200 rounded',
                            onError: handleImageError,
                            onLoad: handleImageLoad
                        }),
                        currentImageUrl && React.createElement('button', {
                            key: 'delete',
                            onClick: () => handleImageDelete(imageType),
                            className: 'absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600',
                            title: 'Supprimer l\'image'
                        }, '×')
                    ] : React.createElement('div', { 
                        className: `w-16 h-16 border-2 border-dashed rounded flex items-center justify-center text-xs ${
                            hasError ? 'border-red-300 bg-red-50 text-red-500' : 'border-gray-300 text-gray-400'
                        }` 
                    }, hasError ? 'Erreur' : 'Pas d\'image')
                ),
                React.createElement('div', { className: 'flex flex-col gap-2' },
                    React.createElement('input', {
                        type: 'file',
                        accept: 'image/*',
                        onChange: (e) => handleImageUpload(e.target.files[0], imageType),
                        className: 'text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100',
                        disabled: uploadingImages[imageType]
                    }),
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
            // Pour convocation, convention et émargement, on a besoin d'un projet sélectionné
            if ((selectedDocumentType === 'convocation' || selectedDocumentType === 'convention' || selectedDocumentType === 'emargement') && !selectedProject) {
                return;
            }

            const timeoutId = setTimeout(() => {
                generatePreview();
            }, 500);
            return () => clearTimeout(timeoutId);
        }
    }, [currentTemplate, selectedPdc, selectedProject, selectedDocumentType]);
    
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
        
        // Sélecteur de type de document
        React.createElement('div', { className: 'mb-6' },
            React.createElement('div', { className: 'bg-white rounded-lg shadow-md p-4' },
                React.createElement('div', { className: 'flex items-center gap-4' },
                    React.createElement('h2', { className: 'text-lg font-semibold text-gray-900' }, 'Type de document :'),
                    React.createElement('div', { className: 'flex gap-2' },
                        documentTypes.map(docType =>
                            React.createElement('button', {
                                key: docType.id,
                                onClick: () => !docType.disabled && setSelectedDocumentType(docType.id),
                                className: `px-4 py-2 rounded-lg border transition-all ${
                                    selectedDocumentType === docType.id
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : docType.disabled
                                        ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                }`
                            },
                                React.createElement('div', { className: 'flex items-center gap-2' },
                                    React.createElement('i', { 'data-lucide': docType.icon, className: 'w-4 h-4' }),
                                    React.createElement('span', { className: 'text-sm' }, docType.label)
                                )
                            )
                        )
                    )
                )
            )
        ),
        
        // Layout principal
        React.createElement('div', { className: 'flex gap-6 flex-1' },
            
            // Colonne paramètres
            React.createElement('div', { 
                className: 'space-y-6 overflow-y-auto',
                style: { width: '350px', flexShrink: 0 }
            },
                
                // Images
                React.createElement('div', { className: 'bg-white rounded-lg shadow-md p-6' },
                    React.createElement('h2', { className: 'text-xl font-semibold mb-4' }, 'Images'),
                    React.createElement('div', { className: 'space-y-4' },
                        createImageSection('header_image', 'Image d\'en-tête'),
                        createImageSection('footer_image', 'Image de pied de page')
                    )
                ),
                
                // Données de test
                React.createElement('div', { className: 'bg-white rounded-lg shadow-md p-6' },
                    React.createElement('h2', { className: 'text-xl font-semibold mb-4' }, 'Données de test'),
                    selectedDocumentType === 'pdc' ? (
                        pdcsLoading ? 
                            React.createElement('div', { className: 'text-center py-4' }, 'Chargement...') :
                            React.createElement('div', { className: 'space-y-3' },
                                React.createElement('select', {
                                    value: selectedPdc?.id || '',
                                    onChange: (e) => {
                                        const pdc = pdcs.find(p => p.id === e.target.value);
                                        setSelectedPdc(pdc);
                                    },
                                    className: 'w-full p-2 border border-gray-300 rounded-md'
                                },
                                    React.createElement('option', { value: '' }, 'Sélectionner un PDC...'),
                                    pdcs?.map(pdc => 
                                        React.createElement('option', { 
                                            key: pdc.id, 
                                            value: pdc.id 
                                        }, `PDC ${pdc.pdc_number} - ${pdc.logiciel?.nom || 'N/A'}`)
                                    )
                                ),
                                selectedPdc && React.createElement('div', { className: 'p-3 bg-blue-50 rounded-md text-sm text-blue-700' },
                                    `PDC ${selectedPdc.pdc_number} - ${selectedPdc.logiciel?.nom || 'N/A'}`
                                )
                            )
                    ) : (selectedDocumentType === 'convocation' || selectedDocumentType === 'convention' || selectedDocumentType === 'emargement') ? (
                        projectsLoading ?
                            React.createElement('div', { className: 'text-center py-4' }, 'Chargement des projets...') :
                            React.createElement('div', { className: 'space-y-3' },
                                React.createElement('select', {
                                    value: selectedProject?.id || '',
                                    onChange: (e) => {
                                        const project = projects.find(p => p.id === e.target.value);
                                        setSelectedProject(project);
                                    },
                                    className: 'w-full p-2 border border-gray-300 rounded-md'
                                },
                                    React.createElement('option', { value: '' }, 'Sélectionner un projet...'),
                                    projects?.map(project =>
                                        React.createElement('option', {
                                            key: project.id,
                                            value: project.id
                                        }, `${project.name} - ${project.entreprise?.nom || 'N/A'} (${project.nombre_stagiaire || 0} stagiaires)`)
                                    )
                                ),
                                selectedProject && React.createElement('div', { 
                                    className: selectedDocumentType === 'convocation' ? 
                                        'p-3 bg-green-50 rounded-md text-sm text-green-700' : 
                                        selectedDocumentType === 'convention' ?
                                        'p-3 bg-purple-50 rounded-md text-sm text-purple-700' :
                                        'p-3 bg-orange-50 rounded-md text-sm text-orange-700'
                                },
                                    React.createElement('div', { className: 'font-medium mb-2' }, 
                                        selectedDocumentType === 'convocation' ? 'Données projet - Convocation' : 
                                        selectedDocumentType === 'convention' ? 'Données projet - Convention' :
                                        'Données projet - Émargement'
                                    ),
                                    React.createElement('div', {}, `• Projet : ${selectedProject.name}`),
                                    React.createElement('div', {}, `• Entreprise : ${selectedProject.entreprise?.nom || 'N/A'}`),
                                    React.createElement('div', {}, `• Logiciel : ${selectedProject.logiciel?.nom || 'N/A'}`),
                                    React.createElement('div', {}, `• Commercial : ${selectedProject.commercial?.prenom || ''} ${selectedProject.commercial?.nom || 'N/A'}`),
                                    React.createElement('div', {}, `• Contact : ${selectedProject.contact?.prenom || ''} ${selectedProject.contact?.nom || 'N/A'}`),
                                    // Affichage du formateur depuis les sessions
                                    projectSessions.length > 0 && projectSessions[0].formateur && 
                                        React.createElement('div', {},
                                            '• Formateur : ',
                                            React.createElement('span', { className: 'font-bold' }, projectSessions[0].formateur.nom)
                                        ),
                                    // Affichage de la liste des stagiaires depuis les sessions
                                    (() => {
                                        const tousLesStagiaires = projectSessions.flatMap(session => session.stagiaires || []);
                                        const stagiairesList = [...new Set(tousLesStagiaires)];
                                        if (stagiairesList.length > 0) {
                                            return React.createElement('div', {},
                                                '• Stagiaires : ',
                                                React.createElement('span', { className: 'font-bold' }, stagiairesList.join(', '))
                                            );
                                        } else {
                                            return React.createElement('div', {},
                                                '• Stagiaires : ',
                                                React.createElement('span', { className: 'font-bold' }, `${selectedProject.nombre_stagiaire || 0} participant(s)`)
                                            );
                                        }
                                    })(),
                                    // Affichage du lieu depuis les sessions avec formatage par session
                                    (() => {
                                        // Formater comme "Session 1: lieu1, Session 2: lieu2"
                                        const sessionsAvecLieux = projectSessions
                                            .map((session, index) => {
                                                const lieu = session.lieu || 'à distance';
                                                return `Session ${index + 1}: ${lieu}`;
                                            })
                                            .filter(sessionText => sessionText);
                                        
                                        let lieuText;
                                        if (sessionsAvecLieux.length > 0) {
                                            lieuText = sessionsAvecLieux.join(', ');
                                        } else {
                                            // Fallback vers logique simple ou lieu du projet
                                            const lieuxUniques = [...new Set(projectSessions.map(s => s.lieu).filter(lieu => lieu))];
                                            lieuText = lieuxUniques.length > 0 ? 
                                                lieuxUniques.join(' et ') : 
                                                selectedProject.lieu_projet;
                                        }
                                        
                                        if (lieuText) {
                                            return React.createElement('div', {},
                                                '• Lieu : ',
                                                React.createElement('span', { className: 'font-bold' }, lieuText)
                                            );
                                        }
                                        return null;
                                    })(),
                                    selectedProject.periode_souhaitee && React.createElement('div', {}, `• Période : ${selectedProject.periode_souhaitee}`)
                                )
                            )
                    ) : (
                        React.createElement('div', { className: 'text-center py-4 text-gray-500' }, 
                            'Sélectionnez un type de document actif')
                    )
                )
            ),
            
            // Colonne prévisualisation
            React.createElement('div', { className: 'flex-1' },
                React.createElement('div', { className: 'bg-white rounded-lg shadow-md p-4 h-full flex flex-col' },
                    React.createElement('div', { className: 'flex items-center justify-between mb-4' },
                        React.createElement('h2', { className: 'text-xl font-semibold' }, 'Prévisualisation PDF'),
                        React.createElement('button', {
                            onClick: generatePreview,
                            disabled: isGenerating || (selectedDocumentType === 'pdc' && !selectedPdc) || ((selectedDocumentType === 'convocation' || selectedDocumentType === 'convention' || selectedDocumentType === 'emargement') && !selectedProject),
                            className: 'bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50'
                        }, isGenerating ? 'Génération...' : 'Actualiser')
                    ),
                    
                    React.createElement('div', { className: 'border border-gray-200 rounded-lg overflow-hidden flex-1' },
                        (selectedDocumentType === 'pdc' && !selectedPdc) ?
                            React.createElement('div', { className: 'flex items-center justify-center h-full text-gray-500' },
                                'Sélectionnez un PDC pour commencer') :
                        ((selectedDocumentType === 'convocation' || selectedDocumentType === 'convention' || selectedDocumentType === 'emargement') && !selectedProject) ?
                            React.createElement('div', { className: 'flex items-center justify-center h-full text-gray-500' },
                                'Sélectionnez un projet pour commencer') :
                        (!selectedDocumentType || (selectedDocumentType !== 'pdc' && selectedDocumentType !== 'convocation' && selectedDocumentType !== 'convention' && selectedDocumentType !== 'emargement')) ?
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
                                src: `${previewPdf}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`,
                                className: 'w-full h-full border-0',
                                title: 'PDF Preview'
                            }) :
                            React.createElement('div', { className: 'flex items-center justify-center h-full text-gray-500' }, 
                                'Cliquez sur "Actualiser" pour voir la prévisualisation')
                    )
                )
            )
        ),
        
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

// FONCTION DE TEST TEMPORAIRE pour vérifier les données de test
window.testTemplateBuilderData = () => {
    const { projects } = window.useProjects();
    const { getSessionsForProject } = window.useProjectSessions();
    
    console.log('🧪 [TEST Template Builder] Projets disponibles:', projects);
    
    if (projects && projects.length > 0) {
        const testProject = projects.find(p => 
            p.name?.toLowerCase().includes('3ds max') ||
            p.entreprise?.nom?.toLowerCase().includes('design studio')
        ) || projects[0];
        
        console.log('🧪 [TEST Template Builder] Projet de test sélectionné:', testProject);
        
        // Tester le chargement des sessions
        getSessionsForProject(testProject.id).then(sessions => {
            console.log('🧪 [TEST Template Builder] Sessions récupérées:', sessions);
            
            if (sessions.length > 0) {
                console.log('🧪 [TEST Template Builder] Formateur première session:', sessions[0].formateur);
                console.log('🧪 [TEST Template Builder] Stagiaires toutes sessions:', 
                    sessions.flatMap(s => s.stagiaires || [])
                );
            }
        }).catch(error => {
            console.error('❌ [TEST Template Builder] Erreur récupération sessions:', error);
        });
    }
};

// Export global
window.TemplateBuilderPage = TemplateBuilderPage;