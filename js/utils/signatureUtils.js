// Utilitaires pour la gestion des signatures électroniques
window.SignatureUtils = {
    
    // Validation des données de signature
    validateSignatureData: (signatureDataURL) => {
        if (!signatureDataURL) {
            throw new Error('Données de signature manquantes');
        }
        
        if (!signatureDataURL.startsWith('data:image/')) {
            throw new Error('Format de signature invalide');
        }
        
        // Vérifier que la signature n'est pas vide (juste un canvas blanc)
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        return new Promise((resolve, reject) => {
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                
                // Vérifier si au moins quelques pixels ne sont pas blancs
                let hasNonWhitePixels = false;
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    const a = data[i + 3];
                    
                    // Si le pixel n'est pas blanc ou transparent
                    if (a > 0 && (r < 255 || g < 255 || b < 255)) {
                        hasNonWhitePixels = true;
                        break;
                    }
                }
                
                if (!hasNonWhitePixels) {
                    reject(new Error('La signature ne peut pas être vide'));
                } else {
                    resolve(true);
                }
            };
            
            img.onerror = () => {
                reject(new Error('Impossible de charger les données de signature'));
            };
            
            img.src = signatureDataURL;
        });
    },
    
    // Validation de la position de signature
    validateSignaturePosition: (position) => {
        if (!position) {
            throw new Error('Position de signature manquante');
        }
        
        const requiredFields = ['x', 'y', 'width', 'height', 'page'];
        const missingFields = requiredFields.filter(field => 
            position[field] === undefined || position[field] === null
        );
        
        if (missingFields.length > 0) {
            throw new Error(`Champs de position manquants: ${missingFields.join(', ')}`);
        }
        
        // Validation des valeurs
        if (position.width <= 0 || position.height <= 0) {
            throw new Error('Les dimensions de la signature doivent être positives');
        }
        
        if (position.x < 0 || position.y < 0) {
            throw new Error('La position de la signature doit être positive');
        }
        
        if (position.page < 1) {
            throw new Error('Le numéro de page doit être positif');
        }
        
        return true;
    },
    
    // Redimensionnement de signature pour correspondre à la zone
    resizeSignatureToFit: (signatureDataURL, targetWidth, targetHeight) => {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                // Calculer le ratio pour maintenir les proportions
                const imgRatio = img.width / img.height;
                const targetRatio = targetWidth / targetHeight;
                
                let drawWidth, drawHeight;
                
                if (imgRatio > targetRatio) {
                    // L'image est plus large que la cible
                    drawWidth = targetWidth;
                    drawHeight = targetWidth / imgRatio;
                } else {
                    // L'image est plus haute que la cible
                    drawHeight = targetHeight;
                    drawWidth = targetHeight * imgRatio;
                }
                
                // Centrer dans la zone cible
                const offsetX = (targetWidth - drawWidth) / 2;
                const offsetY = (targetHeight - drawHeight) / 2;
                
                canvas.width = targetWidth;
                canvas.height = targetHeight;
                
                // Fond transparent
                ctx.clearRect(0, 0, targetWidth, targetHeight);
                
                // Dessiner la signature redimensionnée
                ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
                
                resolve(canvas.toDataURL('image/png'));
            };
            
            img.onerror = () => {
                reject(new Error('Erreur lors du redimensionnement de la signature'));
            };
            
            img.src = signatureDataURL;
        });
    },
    
    // Conversion d'une signature en format adapté pour PDF-lib
    convertSignatureForPDFLib: (signatureDataURL) => {
        return new Promise((resolve, reject) => {
            // Enlever le préfixe data:image/png;base64,
            const base64Data = signatureDataURL.replace(/^data:image\/[a-z]+;base64,/, '');
            
            try {
                // Convertir en Uint8Array pour PDF-lib
                const binaryString = atob(base64Data);
                const bytes = new Uint8Array(binaryString.length);
                
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                
                resolve(bytes);
            } catch (error) {
                reject(new Error('Erreur lors de la conversion de la signature: ' + error.message));
            }
        });
    },
    
    // Nettoyage des données de signature (enlever le bruit)
    cleanSignatureData: (signatureDataURL, threshold = 240) => {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                
                // Nettoyer les pixels proches du blanc
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    const a = data[i + 3];
                    
                    // Si le pixel est proche du blanc, le rendre transparent
                    if (r > threshold && g > threshold && b > threshold) {
                        data[i + 3] = 0; // Rendre transparent
                    }
                }
                
                ctx.putImageData(imageData, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            
            img.onerror = () => {
                reject(new Error('Erreur lors du nettoyage de la signature'));
            };
            
            img.src = signatureDataURL;
        });
    },
    
    // Génération d'un aperçu de signature avec bordure
    generateSignaturePreview: (signatureDataURL, width = 200, height = 80) => {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                canvas.width = width;
                canvas.height = height;
                
                // Fond blanc avec bordure
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, width, height);
                
                ctx.strokeStyle = '#cccccc';
                ctx.lineWidth = 1;
                ctx.strokeRect(0, 0, width, height);
                
                // Redimensionner et centrer la signature
                const imgRatio = img.width / img.height;
                const canvasRatio = width / height;
                
                let drawWidth, drawHeight, offsetX, offsetY;
                
                if (imgRatio > canvasRatio) {
                    drawWidth = width - 20; // Marges
                    drawHeight = drawWidth / imgRatio;
                    offsetX = 10;
                    offsetY = (height - drawHeight) / 2;
                } else {
                    drawHeight = height - 20; // Marges
                    drawWidth = drawHeight * imgRatio;
                    offsetX = (width - drawWidth) / 2;
                    offsetY = 10;
                }
                
                ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
                
                resolve(canvas.toDataURL('image/png'));
            };
            
            img.onerror = () => {
                reject(new Error('Erreur lors de la génération de l\'aperçu'));
            };
            
            img.src = signatureDataURL;
        });
    },
    
    // Calcul de la position optimale pour une signature sur une page PDF
    calculateOptimalSignaturePosition: (pageWidth, pageHeight, signatureWidth = 150, signatureHeight = 50) => {
        // Position par défaut en bas à droite avec des marges
        const marginX = 50;
        const marginY = 50;
        
        return {
            x: pageWidth - signatureWidth - marginX,
            y: marginY, // En bas de page (coordonnées PDF)
            width: signatureWidth,
            height: signatureHeight
        };
    },
    
    // Validation finale avant signature
    validateBeforeSignature: async (signatureDataURL, position) => {
        const errors = [];
        
        try {
            // Validation des données
            await window.SignatureUtils.validateSignatureData(signatureDataURL);
        } catch (error) {
            errors.push(`Signature: ${error.message}`);
        }
        
        try {
            // Validation de la position
            window.SignatureUtils.validateSignaturePosition(position);
        } catch (error) {
            errors.push(`Position: ${error.message}`);
        }
        
        if (errors.length > 0) {
            throw new Error(errors.join('; '));
        }
        
        return true;
    }
};

// Constantes utiles
window.SignatureUtils.DEFAULT_SIGNATURE_SIZE = {
    width: 150,
    height: 50
};

window.SignatureUtils.SIGNATURE_QUALITY = {
    LOW: { width: 200, height: 80 },
    MEDIUM: { width: 300, height: 120 },
    HIGH: { width: 400, height: 160 }
};

window.SignatureUtils.SUPPORTED_FORMATS = [
    'image/png',
    'image/jpeg',
    'image/svg+xml'
];