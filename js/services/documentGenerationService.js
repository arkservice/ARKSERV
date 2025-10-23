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
    
    // Utilisation des fonctions centralisées du DocumentDataService
    // Les fonctions de données par défaut sont maintenant dans documentDataService.js
    
    // Utiliser le service centralisé pour convertir les données
    const getConvocationDataFromProject = async (project) => {
        return await window.DocumentDataService.getConvocationDataFromProject(project, supabase);
    };
    
    // Utiliser le service centralisé pour convertir les données
    const getConventionDataFromProject = async (project, projectSessions = null) => {
        return await window.DocumentDataService.getConventionDataFromProject(project, projectSessions, supabase);
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
                    formateur:formateur_id(
                        id,
                        nom,
                        prenom,
                        email
                    ),
                    pdc(*, logiciel:logiciel_id(nom, logo))
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

            // Obtenir l'URL publique avec cache-busting timestamp
            const { data } = supabase.storage.from('pdfs').getPublicUrl(filePath);
            const timestamp = new Date().getTime();
            const publicUrl = `${data.publicUrl}?v=${timestamp}`;

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

            // Obtenir l'URL publique avec cache-busting timestamp
            const { data } = supabase.storage.from('pdfs').getPublicUrl(filePath);
            const timestamp = new Date().getTime();
            const publicUrl = `${data.publicUrl}?v=${timestamp}`;

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

// Export global
window.useDocumentGenerationService = useDocumentGenerationService;