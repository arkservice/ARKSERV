// Hook pour la gestion des templates PDF - VERSION SUPABASE STORAGE
function useTemplates() {
    const { useState, useEffect } = React;
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Référence au client Supabase
    const supabase = window.supabaseConfig.client;

    // Fonction pour normaliser les types d'images
    const normalizeImageType = (type) => {
        if (type === 'header_image') return 'header';
        if (type === 'footer_image') return 'footer';
        return type;
    };

    // Charger un template par type de document
    const loadTemplateByType = async (documentType) => {
        setLoading(true);
        setError(null);
        
        try {
            console.log(`🔄 Chargement template ${documentType} depuis Supabase`);
            
            // Charger directement depuis Supabase (bypasse localStorage)
            const template = await getDefaultTemplate(documentType);
            
            console.log(`✅ Template ${documentType} chargé:`, template);
            return template;
            
        } catch (err) {
            console.error('Erreur chargement template par type:', err);
            const userMessage = err.message.includes('timeout') 
                ? 'Délai d\'attente dépassé lors du chargement des images'
                : err.message.includes('network')
                ? 'Problème de connexion réseau'
                : 'Erreur lors du chargement du template';
            setError(userMessage);
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Sauvegarder la configuration du template (images sélectionnées)
    const saveTemplateByType = async (documentType, templateData) => {
        console.log(`💾 Sauvegarde configuration images pour ${documentType}`);

        try {
            setLoading(true);

            // Extraire les URLs d'images du template
            const headerImageUrl = templateData.header_image || null;
            const footerImageUrl = templateData.footer_image || null;

            // Mettre à jour la configuration dans la table template_configurations
            const { error: updateError } = await supabase
                .from('template_configurations')
                .update({
                    header_image_url: headerImageUrl,
                    footer_image_url: footerImageUrl,
                    updated_at: new Date().toISOString()
                })
                .eq('document_type', documentType);

            if (updateError) {
                console.error('Erreur sauvegarde configuration:', updateError);
                throw updateError;
            }

            console.log(`✅ Configuration sauvegardée pour ${documentType}`, {
                header: headerImageUrl,
                footer: footerImageUrl
            });

            return templateData;

        } catch (error) {
            console.error('Erreur sauvegarde configuration:', error);
            setError(error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Upload d'image vers Supabase Storage (partagée entre tous les templates)
    const uploadImage = async (file, imageType) => {
        if (!file) throw new Error('Aucun fichier sélectionné');

        try {
            setLoading(true);

            // Normaliser le type d'image
            const normalizedType = normalizeImageType(imageType);

            // Validation du fichier
            if (!file.type.match(/^image\/(jpeg|jpg|png|gif|svg\+xml)$/)) {
                throw new Error('Format d\'image non supporté. Utilisez JPG, PNG, SVG ou GIF.');
            }

            if (file.size > 5 * 1024 * 1024) {
                throw new Error('L\'image est trop grande. Taille maximum: 5MB.');
            }

            // Générer un nom de fichier unique avec timestamp
            const fileExt = file.name.split('.').pop().toLowerCase();
            const timestamp = Date.now();
            const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-z0-9]/gi, '-').toLowerCase();
            const fileName = `${cleanName}-${timestamp}.${fileExt}`;
            const filePath = `${normalizedType}s/${fileName}`;

            // Upload vers Supabase Storage
            const { data, error: uploadError } = await supabase.storage
                .from('template-assets')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false // Ne pas écraser, générer un nouveau fichier à chaque fois
                });

            if (uploadError) throw uploadError;

            // Obtenir l'URL publique
            const { data: publicData } = supabase.storage
                .from('template-assets')
                .getPublicUrl(filePath);

            // Sauvegarder dans la base de données (sans document_type)
            const { data: existingImage } = await supabase
                .from('images_template')
                .select('id')
                .eq('file_path', filePath)
                .single();

            if (existingImage) {
                // Mettre à jour l'image existante (cas rare car upsert=false)
                const { error: updateError } = await supabase
                    .from('images_template')
                    .update({
                        file_url: publicData.publicUrl,
                        file_size: file.size,
                        mime_type: file.type,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existingImage.id);

                if (updateError) throw updateError;
            } else {
                // Créer une nouvelle entrée (image partagée)
                const { error: insertError } = await supabase
                    .from('images_template')
                    .insert({
                        name: file.name,
                        type: normalizedType,
                        file_path: filePath,
                        file_url: publicData.publicUrl,
                        file_size: file.size,
                        mime_type: file.type
                    });

                if (insertError) throw insertError;
            }

            console.log(`📁 Image partagée uploadée vers Supabase: ${publicData.publicUrl}`);
            return publicData.publicUrl;
            
        } catch (error) {
            console.error('Erreur lors de l\'upload d\'image:', error);
            setError(error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Supprimer une image de Supabase Storage
    const deleteImage = async (imageUrl, imageType) => {
        if (!imageUrl) return;

        try {
            setLoading(true);

            // Normaliser le type d'image
            const normalizedType = normalizeImageType(imageType);

            // Extraire le chemin du fichier depuis l'URL
            if (imageUrl.includes('template-assets/')) {
                const filePath = imageUrl.split('template-assets/')[1];

                // Supprimer de Supabase Storage
                const { error: deleteError } = await supabase.storage
                    .from('template-assets')
                    .remove([filePath]);

                if (deleteError) throw deleteError;

                // Supprimer de la base de données (par file_url)
                const { error: dbError } = await supabase
                    .from('images_template')
                    .delete()
                    .eq('file_url', imageUrl);

                if (dbError) throw dbError;

                console.log(`🗑️ Image partagée supprimée: ${imageUrl}`);
                return true;
            }

            // Si c'est une URL par défaut, ne rien faire
            return true;
            
        } catch (error) {
            console.error('Erreur lors de la suppression d\'image:', error);
            setError(error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Réinitialiser aux valeurs par défaut
    const resetToDefaults = async (documentType) => {
        try {
            console.log(`🔄 Réinitialisation template ${documentType} aux valeurs par défaut`);
            
            const defaultTemplate = await getDefaultTemplate(documentType);
            const result = await saveTemplateByType(documentType, defaultTemplate);
            
            console.log(`✅ Template ${documentType} réinitialisé`);
            return result;
            
        } catch (error) {
            console.error('Erreur réinitialisation template:', error);
            throw error;
        }
    };

    // Obtenir un template par défaut avec images Supabase
    const getDefaultTemplate = async (documentType) => {
        try {
            // Valider le type de document
            const validTypes = ['pdc', 'convocation', 'convention', 'emargement', 'qualiopi', 'attestation'];
            if (!validTypes.includes(documentType)) {
                console.warn(`Type de document non supporté: ${documentType}, utilisation de 'pdc'`);
                documentType = 'pdc';
            }
            
            // Récupérer la configuration sauvegardée depuis template_configurations
            let headerImage = null;
            let footerImage = null;

            try {
                const { data: config, error: configError } = await supabase
                    .from('template_configurations')
                    .select('header_image_url, footer_image_url')
                    .eq('document_type', documentType)
                    .single();

                if (!configError && config) {
                    headerImage = config.header_image_url;
                    footerImage = config.footer_image_url;
                    console.log(`🔧 Configuration chargée pour ${documentType}:`, config);
                } else {
                    console.log(`⚠️ Aucune configuration trouvée pour ${documentType}, utilisation des images par défaut`);
                }
            } catch (error) {
                console.warn('Erreur chargement configuration:', error);
            }

            // Fallback 1: Si aucune configuration sauvegardée, charger la dernière image uploadée pour ce type
            if (!headerImage) {
                headerImage = await getImageFromSupabase('header', documentType);
            }
            if (!footerImage) {
                footerImage = await getImageFromSupabase('footer', documentType);
            }

            // Fallback 2: Essayer avec 'default'
            const fallbackHeaderImage = headerImage || await getImageFromSupabase('header', 'default');
            const fallbackFooterImage = footerImage || await getImageFromSupabase('footer', 'default');
            
            // Styles spécifiques par type de document
            const getStylesForDocumentType = (docType) => {
                if (docType === 'convocation') {
                    return {
                        titleSize: 9,
                        subtitleSize: 9,
                        textSize: 9,
                        labelSize: 9,
                        descriptionSize: 9,
                        headerSize: 9,
                        footerSize: 9,
                        articleSize: 9
                    };
                }
                // Styles par défaut pour PDC et autres
                return {
                    titleSize: 28,
                    subtitleSize: 16,
                    textSize: 8,
                    labelSize: 8,
                    descriptionSize: 7,
                    headerSize: 24,
                    footerSize: 9,
                    articleSize: 11
                };
            };

            return {
                id: null,
                name: `Template ${documentType.toUpperCase()}`,
                document_type: documentType,
                styles: getStylesForDocumentType(documentType),
                colors: {
                    primary: '#133e5e',
                    secondary: '#2563eb',
                    text: '#374151',
                    lightText: '#6b7280',
                    headerText: '#1f2937',
                    background: '#f9fafb',
                    border: '#e5e7eb'
                },
                spacing: {
                    marginTop: 20,
                    marginSide: 20,
                    marginBottom: 30,
                    headerHeight: 35,
                    footerHeight: 40,
                    sectionSpacing: 15,
                    lineSpacing: 5,
                    columnSpacing: 5,
                    blockPadding: 10
                },
                layout: {
                    pageFormat: 'a4',
                    orientation: 'portrait',
                    columns: 3,
                    showHeader: true,
                    showFooter: true,
                    showLogos: true,
                    backgroundBlocks: true
                },
                branding: {
                    companyName: 'AUTODESK',
                    partnerText: 'Platinum Partner',
                    brandName: 'ARKANCE',
                    footerAddress: 'LE VAL SAINT QUENTIN - Bâtiment C - 2, rue René Caudron - CS 30764 - 78961 Voisins-le-Bretonneux Cedex',
                    footerContact: 'www.arkance-systems.fr - formation@arkance-systems.com - Tél. : 01 39 44 18 18'
                },
                header_image: fallbackHeaderImage,
                footer_image: fallbackFooterImage
            };
        } catch (error) {
            console.error('Erreur lors de la récupération du template par défaut:', error);
            // Fallback simple sans images en cas d'erreur
            return {
                id: null,
                name: `Template ${documentType.toUpperCase()}`,
                document_type: documentType,
                styles: {
                    titleSize: 28,
                    subtitleSize: 16,
                    textSize: 8,
                    labelSize: 8,
                    descriptionSize: 7,
                    headerSize: 24,
                    footerSize: 9,
                    articleSize: 11
                },
                colors: {
                    primary: '#133e5e',
                    secondary: '#2563eb',
                    text: '#374151',
                    lightText: '#6b7280',
                    headerText: '#1f2937',
                    background: '#f9fafb',
                    border: '#e5e7eb'
                },
                spacing: {
                    marginTop: 20,
                    marginSide: 20,
                    marginBottom: 30,
                    headerHeight: 35,
                    footerHeight: 40,
                    sectionSpacing: 15,
                    lineSpacing: 5,
                    columnSpacing: 5,
                    blockPadding: 10
                },
                layout: {
                    pageFormat: 'a4',
                    orientation: 'portrait',
                    columns: 3,
                    showHeader: true,
                    showFooter: true,
                    showLogos: true,
                    backgroundBlocks: true
                },
                branding: {
                    companyName: 'AUTODESK',
                    partnerText: 'Platinum Partner',
                    brandName: 'ARKANCE',
                    footerAddress: 'LE VAL SAINT QUENTIN - Bâtiment C - 2, rue René Caudron - CS 30764 - 78961 Voisins-le-Bretonneux Cedex',
                    footerContact: 'www.arkance-systems.fr - formation@arkance-systems.com - Tél. : 01 39 44 18 18'
                },
                header_image: null,
                footer_image: null
            };
        }
    };


    // Fonction pour récupérer une image depuis Supabase avec timeout
    const getImageFromSupabase = async (imageType, documentType, timeout = 5000) => {
        try {
            // Normaliser le type d'image
            const normalizedType = normalizeImageType(imageType);
            
            console.log(`🔍 Recherche image ${normalizedType} pour ${documentType}`);
            
            // Créer une promesse avec timeout
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout récupération image')), timeout)
            );
            
            const queryPromise = supabase
                .from('images_template')
                .select('file_url')
                .eq('type', normalizedType)
                .eq('document_type', documentType)
                .single();
            
            const { data, error } = await Promise.race([queryPromise, timeoutPromise]);
            
            if (error) {
                // Ne considérer comme erreur que si ce n'est pas un "not found" normal
                if (error.code !== 'PGRST116') {
                    console.error(`Erreur requête image ${normalizedType} pour ${documentType}:`, error);
                } else {
                    console.log(`Image ${normalizedType} non trouvée pour ${documentType}, utilisation du fallback`);
                }
                return null;
            }
            
            // Vérifier que l'URL est valide
            if (data && data.file_url) {
                try {
                    new URL(data.file_url);
                    console.log(`✅ Image ${normalizedType} trouvée: ${data.file_url}`);
                    return data.file_url;
                } catch (urlError) {
                    console.warn(`URL d'image invalide: ${data.file_url}`);
                    return null;
                }
            }
            
            return null;
        } catch (error) {
            console.error('Erreur lors de la récupération d\'image:', error);
            return null;
        }
    };

    // Fonction pour lister toutes les images d'un dossier dans Supabase Storage
    const listImagesFromStorage = async (imageType, timeout = 5000) => {
        try {
            // Normaliser le type d'image
            const normalizedType = normalizeImageType(imageType);
            const folderPath = `${normalizedType}s`; // 'headers' ou 'footers'

            console.log(`📋 Listage des images dans ${folderPath}`);

            // Créer une promesse avec timeout
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout listage images')), timeout)
            );

            // Lister les fichiers du dossier
            const listPromise = supabase.storage
                .from('template-assets')
                .list(folderPath, {
                    limit: 100,
                    offset: 0,
                    sortBy: { column: 'created_at', order: 'desc' }
                });

            const { data, error } = await Promise.race([listPromise, timeoutPromise]);

            if (error) {
                console.error(`Erreur listage images ${folderPath}:`, error);
                throw error;
            }

            // Générer les URLs publiques pour chaque image
            const imagesWithUrls = data.map(file => {
                const filePath = `${folderPath}/${file.name}`;
                const { data: publicData } = supabase.storage
                    .from('template-assets')
                    .getPublicUrl(filePath);

                return {
                    name: file.name,
                    path: filePath,
                    url: publicData.publicUrl,
                    size: file.metadata?.size || 0,
                    created_at: file.created_at,
                    updated_at: file.updated_at
                };
            });

            console.log(`✅ ${imagesWithUrls.length} images trouvées dans ${folderPath}`);
            return imagesWithUrls;

        } catch (error) {
            console.error('Erreur lors du listage des images:', error);
            throw error;
        }
    };


    // Fonction pour obtenir les sections par défaut pour un type de document
    const getDefaultSectionsForDocumentType = (documentType) => {
        const defaultSections = {
            pdc: [
                { id: 'header', name: 'En-tête', height: 22, width: 210, gapTop: 0, gapBottom: 0, paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, backgroundColor: '#FFFFFF', alignment: 'center' },
                { id: 'title', name: 'Titre/Sous-titre', height: 28, width: 210, gapTop: 0, gapBottom: 0, paddingTop: 5, paddingRight: 10, paddingBottom: 5, paddingLeft: 10, backgroundColor: '#FFFFFF', alignment: 'center' },
                { id: 'infos', name: 'Informations générales', height: 81, width: 210, gapTop: 0, gapBottom: 0, paddingTop: 10, paddingRight: 10, paddingBottom: 10, paddingLeft: 10, backgroundColor: '#FFFFFF', alignment: 'left' },
                { id: 'programme', name: 'Programme', height: 137, width: 210, gapTop: 0, gapBottom: 0, paddingTop: 10, paddingRight: 10, paddingBottom: 10, paddingLeft: 10, backgroundColor: '#FFFFFF', alignment: 'left' },
                { id: 'footer', name: 'Pied de page', height: 37, width: 210, gapTop: 0, gapBottom: 0, paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, backgroundColor: '#FFFFFF', alignment: 'center' }
            ],
            convocation: [
                { id: 'header', name: 'En-tête', height: 30, width: 210, gapTop: 0, gapBottom: 0, paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, backgroundColor: '#FFFFFF', alignment: 'center' },
                { id: 'title', name: 'Titre', height: 30, width: 210, gapTop: 5, gapBottom: 5, paddingTop: 10, paddingRight: 20, paddingBottom: 10, paddingLeft: 20, backgroundColor: '#FFFFFF', alignment: 'center' },
                { id: 'body', name: 'Corps du document', height: 190, width: 210, gapTop: 0, gapBottom: 0, paddingTop: 10, paddingRight: 20, paddingBottom: 10, paddingLeft: 20, backgroundColor: '#FFFFFF', alignment: 'left' },
                { id: 'footer', name: 'Pied de page', height: 37, width: 210, gapTop: 0, gapBottom: 0, paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, backgroundColor: '#FFFFFF', alignment: 'center' }
            ],
            convention: [
                { id: 'header', name: 'En-tête', height: 30, width: 210, gapTop: 0, gapBottom: 0, paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, backgroundColor: '#FFFFFF', alignment: 'center' },
                { id: 'title', name: 'Titre', height: 25, width: 210, gapTop: 5, gapBottom: 5, paddingTop: 10, paddingRight: 20, paddingBottom: 10, paddingLeft: 20, backgroundColor: '#FFFFFF', alignment: 'center' },
                { id: 'body', name: 'Corps du document', height: 195, width: 210, gapTop: 0, gapBottom: 0, paddingTop: 10, paddingRight: 20, paddingBottom: 10, paddingLeft: 20, backgroundColor: '#FFFFFF', alignment: 'left' },
                { id: 'footer', name: 'Pied de page', height: 37, width: 210, gapTop: 0, gapBottom: 0, paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, backgroundColor: '#FFFFFF', alignment: 'center' }
            ],
            emargement: [
                { id: 'header', name: 'En-tête', height: 30, width: 210, gapTop: 0, gapBottom: 0, paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, backgroundColor: '#FFFFFF', alignment: 'center' },
                { id: 'table', name: 'Tableau d\'émargement', height: 230, width: 210, gapTop: 5, gapBottom: 5, paddingTop: 10, paddingRight: 10, paddingBottom: 10, paddingLeft: 10, backgroundColor: '#FFFFFF', alignment: 'left' },
                { id: 'footer', name: 'Pied de page', height: 37, width: 210, gapTop: 0, gapBottom: 0, paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, backgroundColor: '#FFFFFF', alignment: 'center' }
            ],
            qualiopi: [
                { id: 'header', name: 'En-tête', height: 30, width: 210, gapTop: 0, gapBottom: 0, paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, backgroundColor: '#FFFFFF', alignment: 'center' },
                { id: 'title', name: 'Titre évaluation', height: 25, width: 210, gapTop: 5, gapBottom: 5, paddingTop: 10, paddingRight: 20, paddingBottom: 10, paddingLeft: 20, backgroundColor: '#FFFFFF', alignment: 'center' },
                { id: 'questions', name: 'Questions et réponses', height: 195, width: 210, gapTop: 0, gapBottom: 0, paddingTop: 10, paddingRight: 20, paddingBottom: 10, paddingLeft: 20, backgroundColor: '#FFFFFF', alignment: 'left' },
                { id: 'footer', name: 'Pied de page', height: 37, width: 210, gapTop: 0, gapBottom: 0, paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, backgroundColor: '#FFFFFF', alignment: 'center' }
            ],
            attestation: [
                { id: 'header', name: 'En-tête', height: 20, width: 210, gapTop: 0, gapBottom: 0, paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, backgroundColor: '#FFFFFF', alignment: 'right' },
                { id: 'titre', name: 'Titre', height: 40, width: 210, gapTop: 0, gapBottom: 0, paddingTop: 10, paddingRight: 20, paddingBottom: 10, paddingLeft: 20, backgroundColor: '#FFFFFF', alignment: 'center' },
                { id: 'certification', name: 'Certification', height: 15, width: 210, gapTop: 0, gapBottom: 0, paddingTop: 5, paddingRight: 20, paddingBottom: 5, paddingLeft: 20, backgroundColor: '#FFFFFF', alignment: 'center' },
                { id: 'stagiaire', name: 'Nom stagiaire', height: 20, width: 210, gapTop: 0, gapBottom: 0, paddingTop: 5, paddingRight: 20, paddingBottom: 5, paddingLeft: 20, backgroundColor: '#FFFFFF', alignment: 'center' },
                { id: 'texte_intro', name: 'Texte intro', height: 10, width: 210, gapTop: 0, gapBottom: 0, paddingTop: 3, paddingRight: 20, paddingBottom: 3, paddingLeft: 20, backgroundColor: '#FFFFFF', alignment: 'center' },
                { id: 'formation', name: 'Nom formation', height: 25, width: 210, gapTop: 0, gapBottom: 0, paddingTop: 5, paddingRight: 20, paddingBottom: 5, paddingLeft: 20, backgroundColor: '#FFFFFF', alignment: 'center' },
                { id: 'dates', name: 'Dates et durée', height: 15, width: 210, gapTop: 0, gapBottom: 0, paddingTop: 5, paddingRight: 20, paddingBottom: 5, paddingLeft: 20, backgroundColor: '#FFFFFF', alignment: 'center' },
                { id: 'signature', name: 'Signature', height: 35, width: 210, gapTop: 0, gapBottom: 0, paddingTop: 8, paddingRight: 20, paddingBottom: 8, paddingLeft: 20, backgroundColor: '#FFFFFF', alignment: 'center' },
                { id: 'footer', name: 'Pied de page', height: 30, width: 210, gapTop: 0, gapBottom: 0, paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, backgroundColor: '#FFFFFF', alignment: 'center' }
            ]
        };

        return defaultSections[documentType] || defaultSections.pdc;
    };

    // Charger les sections depuis Supabase
    const loadSectionsByType = async (documentType) => {
        try {
            console.log(`🔄 Chargement sections pour ${documentType} depuis Supabase`);

            const { data, error } = await supabase
                .from('template_configurations')
                .select('sections')
                .eq('document_type', documentType)
                .single();

            if (error) {
                console.error('Erreur chargement sections:', error);
                // Fallback sur sections par défaut
                return getDefaultSectionsForDocumentType(documentType);
            }

            // Si pas de sections ou tableau vide, retourner les valeurs par défaut
            if (!data || !data.sections || data.sections.length === 0) {
                console.log(`⚠️ Aucune section trouvée pour ${documentType}, utilisation des sections par défaut`);
                return getDefaultSectionsForDocumentType(documentType);
            }

            console.log(`✅ Sections chargées pour ${documentType}:`, data.sections);
            return data.sections;

        } catch (error) {
            console.error('Erreur chargement sections:', error);
            // Fallback sur sections par défaut
            return getDefaultSectionsForDocumentType(documentType);
        }
    };

    // Sauvegarder les sections dans Supabase
    const saveSectionsByType = async (documentType, sections) => {
        try {
            console.log(`💾 Sauvegarde sections pour ${documentType}:`, sections);

            const { error } = await supabase
                .from('template_configurations')
                .update({
                    sections: sections,
                    updated_at: new Date().toISOString()
                })
                .eq('document_type', documentType);

            if (error) {
                console.error('Erreur sauvegarde sections:', error);
                throw error;
            }

            console.log(`✅ Sections sauvegardées pour ${documentType}`);
            return sections;

        } catch (error) {
            console.error('Erreur sauvegarde sections:', error);
            setError(error.message);
            throw error;
        }
    };

    return {
        templates,
        loading,
        error,
        // Fonctions principales
        loadTemplateByType,
        saveTemplateByType,
        uploadImage,
        deleteImage,
        resetToDefaults,
        getDefaultTemplate,
        // Fonctions utilitaires
        getImageFromSupabase,
        listImagesFromStorage,
        // Fonctions de gestion des sections
        getDefaultSectionsForDocumentType,
        loadSectionsByType,
        saveSectionsByType
    };
}

// Export global
window.useTemplates = useTemplates;