// Utilitaire pour signer des PDFs avec PDF-lib
window.PDFSigner = {
    // Fonction pour créer un PDF signé avec PDF-lib
    async createSignedPDF(originalPdfUrl, signatureData, signaturePosition) {
        try {
            // Vérifier que PDF-lib est disponible
            if (!window.PDFLib) {
                throw new Error('PDF-lib n\'est pas chargé');
            }
            
            const { PDFDocument, rgb } = window.PDFLib;
            
            // Télécharger le PDF original
            const response = await fetch(originalPdfUrl);
            if (!response.ok) {
                throw new Error('Impossible de télécharger le PDF original');
            }
            const pdfArrayBuffer = await response.arrayBuffer();
            
            // Charger le document PDF
            const pdfDoc = await PDFDocument.load(pdfArrayBuffer);
            
            // Convertir l'image de signature en format compatible
            const signatureImageBytes = await this.dataURLToArrayBuffer(signatureData);
            const signatureImage = await pdfDoc.embedPng(signatureImageBytes);
            
            // Obtenir les dimensions de la signature
            const signatureDims = signatureImage.scale(1);
            
            // Obtenir la page à signer (PDF-lib utilise un index 0-based)
            const pages = pdfDoc.getPages();
            const targetPage = pages[signaturePosition.page - 1];
            
            if (!targetPage) {
                throw new Error(`Page ${signaturePosition.page} non trouvée dans le PDF`);
            }
            
            // Obtenir les dimensions de la page
            const { width: pageWidth, height: pageHeight } = targetPage.getSize();
            
            // Calculer la position et la taille de la signature
            // Les coordonnées PDF-lib commencent en bas à gauche, pas en haut à gauche
            const signatureWidth = signaturePosition.width * pageWidth;
            const signatureHeight = signaturePosition.height * pageHeight;
            const x = signaturePosition.x * pageWidth;
            const y = pageHeight - (signaturePosition.y * pageHeight) - signatureHeight; // Inverser Y
            
            // Ajouter la signature à la page
            targetPage.drawImage(signatureImage, {
                x: x,
                y: y,
                width: signatureWidth,
                height: signatureHeight,
            });
            
            // Optionnel : Ajouter une bordure ou du texte
            // targetPage.drawRectangle({
            //     x: x - 2,
            //     y: y - 2,
            //     width: signatureWidth + 4,
            //     height: signatureHeight + 4,
            //     borderColor: rgb(0.5, 0.5, 0.5),
            //     borderWidth: 1,
            // });
            
            // Ajouter métadonnées de signature
            const now = new Date();
            pdfDoc.setTitle('Document signé électroniquement');
            pdfDoc.setSubject(`Signé le ${now.toLocaleDateString('fr-FR')}`);
            pdfDoc.setCreator('ARK_SERVICE - Système de signature électronique');
            pdfDoc.setModificationDate(now);
            
            // Sérialiser le PDF modifié
            const pdfBytes = await pdfDoc.save();
            
            // Convertir en Blob pour upload
            return new Blob([pdfBytes], { type: 'application/pdf' });
            
        } catch (error) {
            console.error('Erreur lors de la création du PDF signé:', error);
            throw error;
        }
    },
    
    // Fonction pour convertir un DataURL en ArrayBuffer
    async dataURLToArrayBuffer(dataURL) {
        try {
            // Supprimer le préfixe data:image/png;base64,
            const base64 = dataURL.split(',')[1];
            
            // Décoder base64
            const binaryString = window.atob(base64);
            const bytes = new Uint8Array(binaryString.length);
            
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            
            return bytes.buffer;
        } catch (error) {
            console.error('Erreur conversion DataURL vers ArrayBuffer:', error);
            throw error;
        }
    },
    
    // Fonction pour valider une position de signature
    validateSignaturePosition(position) {
        if (!position) {
            throw new Error('Position de signature manquante');
        }
        
        if (typeof position.page !== 'number' || position.page < 1) {
            throw new Error('Numéro de page invalide');
        }
        
        if (typeof position.x !== 'number' || position.x < 0 || position.x > 1) {
            throw new Error('Position X invalide (doit être entre 0 et 1)');
        }
        
        if (typeof position.y !== 'number' || position.y < 0 || position.y > 1) {
            throw new Error('Position Y invalide (doit être entre 0 et 1)');
        }
        
        if (typeof position.width !== 'number' || position.width <= 0 || position.width > 1) {
            throw new Error('Largeur invalide (doit être entre 0 et 1)');
        }
        
        if (typeof position.height !== 'number' || position.height <= 0 || position.height > 1) {
            throw new Error('Hauteur invalide (doit être entre 0 et 1)');
        }
        
        return true;
    },
    
    // Fonction pour valider les données de signature
    validateSignatureData(signatureData) {
        if (!signatureData || typeof signatureData !== 'string') {
            throw new Error('Données de signature invalides');
        }
        
        if (!signatureData.startsWith('data:image/png;base64,')) {
            throw new Error('Format de signature invalide (PNG base64 requis)');
        }
        
        return true;
    }
};