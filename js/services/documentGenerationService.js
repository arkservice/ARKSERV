// Service pour la génération de documents (convocation et convention)
function useDocumentGenerationService() {
    const { useState, useCallback } = React;
    const supabase = window.supabaseConfig.client;
    const { loadTemplateByType } = window.useTemplates();
    const { getSessionsForProject } = window.useProjectSessions();
    const { completeTask, updateTaskDescription } = window.useTasks();
    
    // États
    const [generatingConvocation, setGeneratingConvocation] = useState(false);
    const [generatingConvention, setGeneratingConvention] = useState(false);
    
    // Fonction pour récupérer les URLs des documents depuis la base de données
    const fetchDocumentUrls = useCallback(async (projectId) => {
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('pdf_convocation, pdf_convention')
                .eq('id', projectId)
                .single();
            
            if (error) {
                console.error('Erreur récupération URLs documents:', error);
                return { pdf_convocation: null, pdf_convention: null };
            }
            
            return {
                pdf_convocation: data.pdf_convocation,
                pdf_convention: data.pdf_convention
            };
        } catch (error) {
            console.error('Erreur fetchDocumentUrls:', error);
            return { pdf_convocation: null, pdf_convention: null };
        }
    }, [supabase]);
    
    // Fonctions utilitaires copiées depuis TemplateBuilderPage.js
    
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
    const getConvocationDataFromProject = async (project) => {
        if (!project) return getDefaultConvocationData();
        
        const entreprise = project.entreprise || {};
        const commercial = project.commercial || {};
        const contact = project.contact || {};
        const logiciel = project.logiciel || {};
        
        // Récupérer les sessions détaillées du projet
        let sessions = [];
        try {
            sessions = await getSessionsForProject(project.id);
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
            // Sessions détaillées au lieu de champs agrégés
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
    
    // Convertir les données projet en données convention (ASYNC pour récupérer les sessions)
    const getConventionDataFromProject = async (project, projectSessions = null) => {
        if (!project) return getDefaultConventionData();
        
        // LOGS DE DÉBOGAGE - DÉBUT
        console.log('🔍 [DEBUG] getConventionDataFromProject - Données projet complètes:', project);
        
        const entreprise = project.entreprise || {};
        const commercial = project.commercial || {};
        const contact = project.contact || {};
        const logiciel = project.logiciel || {};
        const pdc = project.pdc || {};
        
        console.log('🔍 [DEBUG] Données PDC extraites:', pdc);
        console.log('🔍 [DEBUG] PDC duree_en_jour:', pdc.duree_en_jour);
        console.log('🔍 [DEBUG] Project.pdc_id:', project.pdc_id);
        
        // Utiliser les sessions préchargées ou les récupérer si nécessaire
        let sessions = projectSessions || [];
        let formateurInfo = null;
        let lieuFormation = 'Lieu à définir';
        
        try {
            if (!projectSessions || projectSessions.length === 0) {
                console.log('🔍 [DEBUG] Récupération des sessions car pas de sessions préchargées');
                sessions = await getSessionsForProject(project.id);
            } else {
                console.log('✅ [DEBUG] Utilisation des sessions préchargées:', projectSessions.length, 'sessions');
            }
            console.log('🔍 [DEBUG] Sessions utilisées:', sessions);
            
            // Récupérer le formateur de la première session
            if (sessions.length > 0) {
                const premiereSession = sessions[0];
                console.log('🔍 [DEBUG] Première session:', premiereSession);
                console.log('🔍 [DEBUG] Formateur dans première session:', premiereSession.formateur);
                
                if (premiereSession.formateur) {
                    // Le formateur est déjà formaté dans useProjectSessions avec la structure { id, nom }
                    formateurInfo = premiereSession.formateur.nom || 'Formateur non défini';
                    console.log('🔍 [DEBUG] Formateur formaté:', formateurInfo);
                }
                
                // FORMATAGE DU LIEU - LOGS DÉTAILLÉS
                console.log('🔍 [DEBUG] === DÉBUT FORMATAGE LIEU ===');
                console.log('🔍 [DEBUG] Nombre de sessions:', sessions.length);
                console.log('🔍 [DEBUG] Sessions avec leurs lieux:', sessions.map(s => ({ 
                    titre: s.titre, 
                    lieu: s.lieu,
                    index: sessions.indexOf(s)
                })));
                
                // Formater comme "Session 1: lieu1, Session 2: lieu2"
                const sessionsAvecLieux = sessions
                    .map((session, index) => {
                        const lieu = session.lieu || 'à distance';
                        const sessionFormatee = `Session ${index + 1}: ${lieu}`;
                        console.log(`🔍 [DEBUG] Session ${index + 1} formatée:`, sessionFormatee);
                        return sessionFormatee;
                    })
                    .filter(sessionText => sessionText !== ''); // Supprimer les sessions vides
                
                console.log('🔍 [DEBUG] Sessions formatées:', sessionsAvecLieux);
                
                if (sessionsAvecLieux.length > 0) {
                    lieuFormation = sessionsAvecLieux.join(', ');
                    console.log('✅ [DEBUG] lieuFormation FINAL formaté par sessions:', lieuFormation);
                } else {
                    // Fallback vers la logique simple si pas de sessions
                    const lieuxUniques = [...new Set(sessions.map(s => s.lieu).filter(lieu => lieu))];
                    if (lieuxUniques.length > 0) {
                        lieuFormation = lieuxUniques.join(' et ');
                    }
                    console.warn('⚠️ [DEBUG] FALLBACK - lieuFormation:', lieuFormation);
                }
                console.log('🔍 [DEBUG] === FIN FORMATAGE LIEU ===');
            } else {
                console.warn('⚠️ [DEBUG] Aucune session trouvée pour ce projet');
                // Améliorer le fallback pour éviter "à l'adresse à définir"
                lieuFormation = 'formation à distance ou en présentiel selon modalités';
            }
        } catch (error) {
            console.error('🔍 [DEBUG] Erreur récupération sessions pour convention:', error);
        }
        
        // Générer un numéro de convention basé sur l'année et l'ID du projet
        const year = new Date().getFullYear();
        const projectShortId = project.id ? project.id.slice(-8) : '12345678';
        
        // Calculer la durée depuis le PDC
        const dureeJours = pdc.duree_en_jour || 5;
        const dureeText = dureeJours === 1 ? '1 jour' : `${dureeJours} jour(s)`;
        console.log('🔍 [DEBUG] Durée calculée:', dureeText, 'depuis pdc.duree_en_jour:', pdc.duree_en_jour);
        
        const conventionData = {
            numero: `${year}01 - PR-${projectShortId}`,
            societe: entreprise.nom || 'Société',
            adresse: entreprise.adresse || 'Adresse non renseignée',
            representant: contact.prenom && contact.nom ? 
                `${contact.prenom.charAt(0).toUpperCase() + contact.prenom.slice(1)} ${contact.nom.toUpperCase()}` : 
                'Monsieur le Directeur',
            duree: dureeText, // CORRECTION Article 2: Durée dynamique depuis PDC
            formateur: formateurInfo || 'Formateur ARKANCE', // CORRECTION Article 3: Formateur des sessions
            programme: project.name || 'Formation spécialisée',
            moyens: 'Formation en présentiel avec supports pédagogiques et exercices pratiques',
            formation: logiciel.nom ? `Formation ${logiciel.nom}` : project.name || 'Formation',
            cout: '6750,00', // Valeurs par défaut - à terme, récupérer du devis
            tva: '1350,00',
            total: '8100,00',
            
            // Nouvelles données pour les 7 articles détaillés
            stagiaires: `${project.nombre_stagiaire || 1} participant(s)`,
            dates: project.periode_souhaitee || 'Dates à définir selon planning',
            lieu_type: project.lieu_projet?.toLowerCase().includes('distance') ? 'distance' : 'sur_site',
            lieu_formation: lieuFormation, // CORRECTION Article 4: Adresse exacte des sessions
            editeur: 'Autodesk', // Valeur par défaut - éditeur principal
            logiciel: logiciel.nom || project.name || 'Logiciel',
            type_pdc: pdc.nom || project.type_formation || 'Concepts de base'
        };
        
        console.log('🔍 [DEBUG] Données de convention finales:', conventionData);
        // LOGS DE DÉBOGAGE - FIN
        
        return conventionData;
    };
    
    // Convertir le template en paramètres pour le générateur PDF
    const convertTemplateToParams = (template) => {
        if (!template) return {};
        
        // Helper pour obtenir l'URL d'image
        const getImageUrl = (imageUrl) => {
            if (!imageUrl) return null;
            if (typeof imageUrl === 'string' && imageUrl.startsWith('http')) {
                return imageUrl;
            }
            return null;
        };
        
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
            companyName: template.branding?.companyName || 'AUTODESK',
            partnerText: template.branding?.partnerText || 'Platinum Partner',
            brandName: template.branding?.brandName || 'ARKANCE',
            footerAddress: template.branding?.footerAddress || 'LE VAL SAINT QUENTIN - Bâtiment C - 2, rue René Caudron - CS 30764 - 78961 Voisins-le-Bretonneux Cedex',
            footerContact: template.branding?.footerContact || 'www.arkance-systems.fr - formation@arkance-systems.com - Tél. : 01 39 44 18 18',
            headerLogoLeft: getImageUrl(template.header_image),
            footerLogoLeft: getImageUrl(template.footer_image)
        };
    };
    
    // Fonction pour obtenir des paramètres spécifiques selon le type de document
    const getSpecificParams = (documentType, template) => {
        const baseParams = convertTemplateToParams(template);
        
        // Paramètres spécifiques pour la convention
        if (documentType === 'convention') {
            return {
                ...baseParams,
                titleSize: 15,    // "CONVENTION DE FORMATION PROFESSIONNELLE" en 15pt
                subtitleSize: 10, // "202501 - PR-..." en 10pt  
                textSize: 8,      // Texte général en 8pt
                articleSize: 9    // Titres d'articles en 9pt gras
            };
        }
        
        // Paramètres par défaut pour les autres types
        return baseParams;
    };
    
    // Fonction pour récupérer les données fraîches du projet
    const getFreshProjectData = useCallback(async (projectId) => {
        try {
            const { data, error } = await supabase
                .from('projects')
                .select(`
                    *,
                    entreprise(*),
                    commercial:user_profile!commercial_id(*),
                    contact:user_profile!contact_id(*),
                    logiciel(*),
                    pdc(*)
                `)
                .eq('id', projectId)
                .single();
            
            if (error) {
                console.error('Erreur récupération données projet fraîches:', error);
                return null;
            }
            
            return data;
        } catch (error) {
            console.error('Erreur getFreshProjectData:', error);
            return null;
        }
    }, [supabase]);

    // Fonction pour générer la convocation
    const generateConvocation = useCallback(async (tache, onNavigateToProject, setTache) => {
        try {
            setGeneratingConvocation(true);
            console.log('🔄 Génération de la convocation...');
            
            // Récupérer les données fraîches du projet
            const freshProjectData = await getFreshProjectData(tache.project.id);
            const projectToUse = freshProjectData || tache.project;
            console.log('📊 Utilisation des données projet:', freshProjectData ? 'fraîches' : 'cache');
            
            // Charger le template convocation
            const template = await loadTemplateByType('convocation');
            if (!template) {
                throw new Error('Template convocation non disponible');
            }
            
            // Convertir les données du projet en format convocation
            const convocationData = await getConvocationDataFromProject(projectToUse);
            console.log('📋 Données convocation préparées:', convocationData);
            
            // Convertir le template en paramètres PDF
            const templateParams = convertTemplateToParams(template);
            console.log('🎨 Paramètres template:', templateParams);
            
            // Générer le PDF avec le générateur de convocation spécifique
            const pdfBlob = await window.generateConvocationPDF(convocationData, templateParams);
            
            // Nom de fichier fixe (écrase l'ancien)
            const fileName = `convocation_projet_${projectToUse.id}.pdf`;
            const filePath = `convocation/${fileName}`;
            
            // Upload vers Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('pdfs')
                .upload(filePath, pdfBlob, {
                    contentType: 'application/pdf',
                    cacheControl: '3600',
                    upsert: true
                });
            
            if (uploadError) {
                throw new Error(`Erreur upload convocation: ${uploadError.message}`);
            }
            
            // Obtenir l'URL publique
            const { data } = supabase.storage.from('pdfs').getPublicUrl(filePath);
            const publicUrl = data.publicUrl;
            
            // Mettre à jour le projet avec l'URL de la convocation
            const { error: updateError } = await supabase
                .from('projects')
                .update({ pdf_convocation: publicUrl })
                .eq('id', projectToUse.id);
            
            if (updateError) {
                throw new Error(`Erreur mise à jour projet: ${updateError.message}`);
            }
            
            // Mettre à jour l'état local
            setTache(prev => ({
                ...prev,
                project: {
                    ...prev.project,
                    pdf_convocation: publicUrl
                }
            }));
            
            console.log('✅ Convocation générée avec succès:', publicUrl);
            alert('Convocation générée avec succès !');
            
        } catch (error) {
            console.error('Erreur lors de la génération de la convocation:', error);
            alert('Erreur lors de la génération de la convocation: ' + error.message);
        } finally {
            setGeneratingConvocation(false);
        }
    }, [loadTemplateByType, getFreshProjectData]);
    
    // Fonction pour générer la convention
    const generateConvention = useCallback(async (tache, onNavigateToProject, setTache) => {
        try {
            setGeneratingConvention(true);
            console.log('🔄 Génération de la convention...');
            
            // Récupérer les données fraîches du projet
            const freshProjectData = await getFreshProjectData(tache.project.id);
            const projectToUse = freshProjectData || tache.project;
            console.log('📊 Utilisation des données projet:', freshProjectData ? 'fraîches' : 'cache');
            
            // CORRECTION: Précharger les sessions comme dans TemplateBuilderPage
            let projectSessions = [];
            try {
                projectSessions = await getSessionsForProject(projectToUse.id);
                console.log('📊 Sessions préchargées pour la convention:', projectSessions);
            } catch (error) {
                console.warn('⚠️ Erreur préchargement sessions:', error);
            }
            
            // Charger le template convention
            const template = await loadTemplateByType('convention');
            if (!template) {
                throw new Error('Template convention non disponible');
            }
            
            // Convertir les données du projet en format convention avec sessions préchargées
            const conventionData = await getConventionDataFromProject(projectToUse, projectSessions);
            console.log('📋 Données convention préparées:', conventionData);
            
            // Convertir le template en paramètres PDF avec spécifications convention
            const templateParams = getSpecificParams('convention', template);
            console.log('🎨 Paramètres template (convention):', templateParams);
            
            // Générer le PDF avec le générateur de convention spécifique
            const pdfBlob = await window.generateConventionPDF(conventionData, templateParams);
            
            // Nom de fichier fixe (écrase l'ancien)
            const fileName = `convention_projet_${projectToUse.id}.pdf`;
            const filePath = `convention/${fileName}`;
            
            // Upload vers Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('pdfs')
                .upload(filePath, pdfBlob, {
                    contentType: 'application/pdf',
                    cacheControl: '3600',
                    upsert: true
                });
            
            if (uploadError) {
                throw new Error(`Erreur upload convention: ${uploadError.message}`);
            }
            
            // Obtenir l'URL publique
            const { data } = supabase.storage.from('pdfs').getPublicUrl(filePath);
            const publicUrl = data.publicUrl;
            
            // Mettre à jour le projet avec l'URL de la convention
            const { error: updateError } = await supabase
                .from('projects')
                .update({ pdf_convention: publicUrl })
                .eq('id', projectToUse.id);
            
            if (updateError) {
                throw new Error(`Erreur mise à jour projet: ${updateError.message}`);
            }
            
            // Mettre à jour l'état local
            setTache(prev => ({
                ...prev,
                project: {
                    ...prev.project,
                    pdf_convention: publicUrl
                }
            }));
            
            console.log('✅ Convention générée avec succès:', publicUrl);
            alert('Convention générée avec succès !');
            
        } catch (error) {
            console.error('Erreur lors de la génération de la convention:', error);
            alert('Erreur lors de la génération de la convention: ' + error.message);
        } finally {
            setGeneratingConvention(false);
        }
    }, [loadTemplateByType, getFreshProjectData]);
    
    // Fonction pour télécharger la convocation
    const downloadConvocation = useCallback((tache) => {
        if (tache.project?.pdf_convocation) {
            window.open(tache.project.pdf_convocation, '_blank');
        }
    }, []);
    
    // Fonction pour télécharger la convention
    const downloadConvention = useCallback((tache) => {
        if (tache.project?.pdf_convention) {
            window.open(tache.project.pdf_convention, '_blank');
        }
    }, []);
    
    // Fonction pour valider les documents et compléter la tâche
    const validateDocuments = useCallback(async (tache, onNavigateToProject, setTache) => {
        try {
            console.log('🔄 Validation des documents pour la tâche:', tache.id);
            
            // Vérifier que les deux documents existent
            if (!tache.project?.pdf_convocation || !tache.project?.pdf_convention) {
                throw new Error('Les deux documents doivent être générés avant la validation');
            }
            
            // Marquer la tâche comme terminée
            await completeTask(tache.id);
            
            // Mettre à jour la description de la tâche
            const newDescription = "Documents de formation générés et validés : convocation et convention disponibles.";
            await updateTaskDescription(tache.id, newDescription);
            
            // Mettre à jour l'état local
            setTache(prev => ({
                ...prev,
                status: 'completed',
                description: newDescription
            }));
            
            console.log('✅ Tâche "Génération documents" validée avec succès');
            
            // Redirection vers la page projet avec animation
            if (onNavigateToProject) {
                setTimeout(() => {
                    onNavigateToProject(tache.project.id, tache.id);
                }, 500);
            }
            
        } catch (error) {
            console.error('Erreur lors de la validation des documents:', error);
            alert('Erreur lors de la validation des documents: ' + error.message);
        }
    }, []);
    
    return {
        // États
        generatingConvocation,
        generatingConvention,
        
        // Fonctions
        generateConvocation,
        generateConvention,
        downloadConvocation,
        downloadConvention,
        validateDocuments,
        fetchDocumentUrls
    };
}

// FONCTION DE TEST TEMPORAIRE pour tracer et valider la correction du lieu
window.testLieuFormationCorrection = async (projectId) => {
    console.log('🧪 [TEST CORRECTION] Test complet de la correction du lieu pour projet:', projectId);
    
    try {
        // Test du service documentGeneration (comme dans la vraie génération)
        const supabase = window.supabaseConfig.client;
        const { data: project } = await supabase
            .from('projects')
            .select(`*,entreprise(*),commercial:user_profile!commercial_id(*),contact:user_profile!contact_id(*),logiciel(*),pdc(*)`)
            .eq('id', projectId)
            .single();
            
        console.log('🧪 [TEST CORRECTION] 1. Projet récupéré');
        
        // Précharger les sessions comme dans generateConvention()
        const { getSessionsForProject } = window.useProjectSessions();
        const projectSessions = await getSessionsForProject(project.id);
        console.log('🧪 [TEST CORRECTION] 2. Sessions préchargées:', projectSessions.length);
        
        // Tester getConventionDataFromProject avec sessions préchargées
        const conventionData = await getConventionDataFromProject(project, projectSessions);
        console.log('🧪 [TEST CORRECTION] 3. Convention data avec lieu_formation:', conventionData.lieu_formation);
        
        // Simuler la génération PDF
        if (window.generateConventionPDF) {
            const { loadTemplateByType } = window.useTemplates();
            const template = await loadTemplateByType('convention');
            const templateParams = getSpecificParams('convention', template);
            
            console.log('🧪 [TEST CORRECTION] 4. Génération du PDF...');
            const pdfBlob = await window.generateConventionPDF(conventionData, templateParams);
            
            // Télécharger pour vérification
            const url = URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `test_correction_lieu_${new Date().getTime()}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log('✅ [TEST CORRECTION] PDF généré et téléchargé - Vérifiez l\'Article IV !');
        }
        
        return conventionData;
        
    } catch (error) {
        console.error('❌ [TEST CORRECTION] Erreur:', error);
    }
};

// FONCTION DE TEST TEMPORAIRE pour tracer le problème du lieu
window.testLieuFormation = async (projectId) => {
    console.log('🧪 [TEST LIEU] Test du lieu de formation pour projet:', projectId);
    
    try {
        // Étape 1: Vérifier les sessions
        const { getSessionsForProject } = window.useProjectSessions();
        const sessions = await getSessionsForProject(projectId);
        console.log('🧪 [TEST LIEU] Sessions récupérées:', sessions);
        console.log('🧪 [TEST LIEU] Lieux des sessions:', sessions.map(s => s.lieu));
        
        // Étape 2: Récupérer les données du projet
        const supabase = window.supabaseConfig.client;
        const { data: project } = await supabase
            .from('projects')
            .select(`*,entreprise(*),commercial:user_profile!commercial_id(*),contact:user_profile!contact_id(*),logiciel(*),pdc(*)`)
            .eq('id', projectId)
            .single();
            
        console.log('🧪 [TEST LIEU] Projet récupéré:', project);
        
        // Étape 3: Tester getConventionDataFromProject
        const conventionData = await getConventionDataFromProject(project);
        console.log('🧪 [TEST LIEU] Convention data généré:', conventionData);
        console.log('🧪 [TEST LIEU] lieu_formation dans conventionData:', conventionData.lieu_formation);
        
        return conventionData;
        
    } catch (error) {
        console.error('❌ [TEST LIEU] Erreur:', error);
    }
};

// FONCTION DE TEST TEMPORAIRE pour vérifier le rendu des articles en gras
window.testConventionPDFRendering = async (projectId) => {
    console.log('🧪 [TEST PDF] Test du rendu PDF avec texte en gras pour projet:', projectId);
    
    try {
        // Récupérer les données du projet
        const supabase = window.supabaseConfig.client;
        const { data: project, error } = await supabase
            .from('projects')
            .select(`
                *,
                entreprise(*),
                commercial:user_profile!commercial_id(*),
                contact:user_profile!contact_id(*),
                logiciel(*),
                pdc(*)
            `)
            .eq('id', projectId)
            .single();
            
        if (error) {
            console.error('❌ [TEST PDF] Erreur récupération projet:', error);
            return;
        }
        
        // Générer les données de convention
        const conventionData = await getConventionDataFromProject(project);
        console.log('📋 [TEST PDF] Données convention:', conventionData);
        
        // Charger le template
        const { loadTemplateByType } = window.useTemplates();
        const template = await loadTemplateByType('convention');
        const templateParams = getSpecificParams('convention', template);
        
        // Générer le PDF
        if (window.generateConventionPDF) {
            const pdfBlob = await window.generateConventionPDF(conventionData, templateParams);
            
            // Créer un lien de téléchargement pour tester
            const url = URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `test_convention_gras_${new Date().getTime()}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log('✅ [TEST PDF] PDF généré avec succès et téléchargé');
        } else {
            console.error('❌ [TEST PDF] Générateur de convention non disponible');
        }
        
    } catch (error) {
        console.error('❌ [TEST PDF] Erreur dans testConventionPDFRendering:', error);
    }
};

// FONCTION DE TEST TEMPORAIRE
window.testConventionData = async (projectId) => {
    console.log('🧪 [TEST] Test des données de convention pour projet:', projectId);
    
    try {
        // Invalider le cache des projets et forcer le rechargement
        if (window.useProjects) {
            const { invalidateCache } = window.useProjects();
            await invalidateCache();
        }
        
        // Récupérer les données fraîches du projet 
        const supabase = window.supabaseConfig.client;
        const { data: project, error } = await supabase
            .from('projects')
            .select(`
                *,
                entreprise(*),
                commercial:user_profile!commercial_id(*),
                contact:user_profile!contact_id(*),
                logiciel(*),
                pdc(*)
            `)
            .eq('id', projectId)
            .single();
            
        if (error) {
            console.error('❌ [TEST] Erreur récupération projet:', error);
            return;
        }
        
        console.log('📊 [TEST] Données projet récupérées:', project);
        
        // Tester la récupération des données de convention
        const conventionData = await getConventionDataFromProject(project);
        console.log('📋 [TEST] Données convention générées:', conventionData);
        
        return conventionData;
        
    } catch (error) {
        console.error('❌ [TEST] Erreur dans testConventionData:', error);
    }
};

// Export global
window.useDocumentGenerationService = useDocumentGenerationService;