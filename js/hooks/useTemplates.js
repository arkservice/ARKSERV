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

    // Les styles sont maintenant permanents dans le code - pas de sauvegarde nécessaire
    const saveTemplateByType = async (documentType, templateData) => {
        console.log(`💾 Template ${documentType} - styles permanents dans le code`);
        
        // Retourner immédiatement le template par défaut avec les styles permanents
        return await getDefaultTemplate(documentType);
    };

    // Upload d'image vers Supabase Storage
    const uploadImage = async (file, imageType, documentType) => {
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
            
            // Générer un nom de fichier propre
            const fileExt = file.name.split('.').pop().toLowerCase();
            const fileName = `${documentType}-${normalizedType}.${fileExt}`;
            const filePath = `${normalizedType}s/${fileName}`;
            
            // Upload vers Supabase Storage
            const { data, error: uploadError } = await supabase.storage
                .from('template-assets')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true // Remplace si existe déjà
                });
            
            if (uploadError) throw uploadError;
            
            // Obtenir l'URL publique
            const { data: publicData } = supabase.storage
                .from('template-assets')
                .getPublicUrl(filePath);
            
            // Sauvegarder/mettre à jour dans la base de données
            const { data: existingImage } = await supabase
                .from('images_template')
                .select('id')
                .eq('type', normalizedType)
                .eq('document_type', documentType)
                .single();
            
            if (existingImage) {
                // Mettre à jour l'image existante
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
                // Créer une nouvelle entrée
                const { error: insertError } = await supabase
                    .from('images_template')
                    .insert({
                        name: `${documentType.toUpperCase()} ${normalizedType.charAt(0).toUpperCase() + normalizedType.slice(1)}`,
                        type: normalizedType,
                        document_type: documentType,
                        file_url: publicData.publicUrl,
                        file_size: file.size,
                        mime_type: file.type
                    });
                
                if (insertError) throw insertError;
            }
            
            console.log(`📁 Image uploadée vers Supabase: ${publicData.publicUrl}`);
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
    const deleteImage = async (imageUrl, imageType, documentType) => {
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
                
                // Supprimer de la base de données
                const { error: dbError } = await supabase
                    .from('images_template')
                    .delete()
                    .eq('type', normalizedType)
                    .eq('document_type', documentType);
                
                if (dbError) throw dbError;
                
                console.log(`🗑️ Image supprimée: ${imageUrl}`);
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
            const validTypes = ['pdc', 'convocation', 'convention'];
            if (!validTypes.includes(documentType)) {
                console.warn(`Type de document non supporté: ${documentType}, utilisation de 'pdc'`);
                documentType = 'pdc';
            }
            
            // Récupérer les images depuis Supabase
            const headerImage = await getImageFromSupabase('header', documentType);
            const footerImage = await getImageFromSupabase('footer', documentType);
            
            // Si aucune image trouvée pour ce documentType, essayer avec 'default'
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
        getImageFromSupabase
    };
}

// Export global
window.useTemplates = useTemplates;