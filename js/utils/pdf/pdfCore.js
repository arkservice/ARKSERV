// Utilitaires communs pour la génération de PDF
// Configuration, helpers et fonctions partagées
(function() {
    'use strict';

    // Configuration par défaut pour tous les générateurs PDF
    const DEFAULT_PARAMS = {
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

    // Helper pour convertir hex en RGB
    function hexToRgb(hex) {
        if (typeof hex !== 'string' || !hex.startsWith('#')) {
            return null;
        }

        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (result) {
            const rgb = [
                parseInt(result[1], 16),
                parseInt(result[2], 16),
                parseInt(result[3], 16)
            ];
            return rgb;
        } else {
            return null;
        }
    }

    // Charger une image depuis une URL (Supabase Storage)
    async function loadImageFromUrl(url) {
        if (!url) {
            console.warn('⚠️ [DEBUG] URL image vide ou nulle');
            return null;
        }

        try {
            // Validation de l'URL
            try {
                new URL(url);
            } catch (urlError) {
                console.error('❌ URL invalide:', url);
                return null;
            }

            // Chargement depuis Supabase Storage
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
                console.error('❌ Le contenu récupéré n\'est pas une image:', blob.type);
                return null;
            }

            // Convertir en base64 pour jsPDF
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    resolve(reader.result);
                };
                reader.onerror = () => {
                    console.error('❌ Erreur conversion base64');
                    reject(new Error('Erreur conversion base64'));
                };
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
                console.error('❌ Timeout lors du chargement image:', url);
            } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                console.error('❌ Erreur réseau lors du chargement image:', url);
            } else {
                console.error('❌ Erreur chargement image:', error.message);
            }
            return null;
        }
    }

    // Helper pour ajouter une image au PDF avec gestion d'erreur améliorée
    async function addImageToPdf(doc, imageUrl, x, y, width, height, fallbackText = null) {
        if (!imageUrl) {
            if (fallbackText) {
                return false;
            }
            return true;
        }

        try {

            // Tentative de chargement avec timeout
            const imageData = await Promise.race([
                loadImageFromUrl(imageUrl),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout chargement image')), 10000)
                )
            ]);

            if (!imageData) {
                return false;
            }

            // Validation du format de données
            if (!imageData.startsWith('data:image/')) {
                console.error('❌ Format de données image invalide');
                return false;
            }

            // Déterminer le format de l'image
            let format = 'JPEG';
            if (imageData.includes('data:image/png')) format = 'PNG';
            else if (imageData.includes('data:image/gif')) format = 'GIF';
            else if (imageData.includes('data:image/svg')) format = 'SVG';
            else if (imageData.includes('data:image/webp')) format = 'WEBP';

            // Tentative d'ajout de l'image
            try {
                doc.addImage(imageData, format, x, y, width, height);
                return true;
            } catch (addImageError) {
                console.error('❌ Erreur jsPDF addImage:', addImageError);
                // Essayer avec un format par défaut
                if (format !== 'JPEG') {
                    try {
                        doc.addImage(imageData, 'JPEG', x, y, width, height);
                        return true;
                    } catch (fallbackError) {
                        console.error('❌ Erreur même avec format JPEG:', fallbackError);
                    }
                }
                return false;
            }
        } catch (error) {
            if (error.message === 'Timeout chargement image') {
                console.error('❌ Timeout lors du chargement image:', imageUrl);
            } else {
                console.error('❌ Erreur générale ajout image:', error);
            }
            return false;
        }
    }

    // Exposer les utilitaires via window.pdfCore
    window.pdfCore = {
        DEFAULT_PARAMS,
        hexToRgb,
        loadImageFromUrl,
        addImageToPdf
    };

    console.log('✅ [pdfCore] Module chargé et exposé via window.pdfCore');
})();
