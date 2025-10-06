// Service pour la gestion de la logique des devis (upload et signature)
function useDevisService() {
    const { useState, useCallback, useMemo } = React;
    const supabase = window.supabaseConfig.client;
    const { autoCompleteDevisTask, autoCompleteValidationTask } = window.useTasks();

    // États spécifiques aux devis
    const [uploadingFile, setUploadingFile] = useState(false);
    const [fileInputKey, setFileInputKey] = useState(0);
    const [showSignaturePad, setShowSignaturePad] = useState(false);
    const [signing, setSigning] = useState(false);
    const [signaturePosition, setSignaturePosition] = useState(null);
    const [capturedSignature, setCapturedSignature] = useState(null);
    const [signatureStep, setSignatureStep] = useState('position'); // 'position', 'capture', 'preview'

    // Fonction pour gérer l'upload du fichier de devis
    const handleFileUpload = useCallback(async (event, tache, onNavigateToProject, setTache) => {
        const file = event.target.files[0];
        if (!file) return;
        
        // Vérifier le type de fichier
        const allowedTypes = ['application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            alert('Seuls les fichiers PDF sont autorisés pour les devis.');
            setFileInputKey(prev => prev + 1);
            return;
        }
        
        try {
            setUploadingFile(true);
            
            // Nom de fichier unique
            const fileName = `devis_${tache.project.id}_${Date.now()}.pdf`;
            
            // Upload vers Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, {
                    contentType: 'application/pdf',
                    cacheControl: '3600',
                    upsert: true
                });
            
            if (uploadError) {
                throw new Error(`Erreur upload: ${uploadError.message}`);
            }
            
            // Obtenir l'URL publique
            const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
            const publicUrl = data.publicUrl;
            
            // Mettre à jour le projet avec l'URL du devis
            const { error: updateError } = await supabase
                .from('projects')
                .update({ pdf_devis: publicUrl })
                .eq('id', tache.project.id);
            
            if (updateError) {
                throw new Error(`Erreur mise à jour: ${updateError.message}`);
            }
            
            // Auto-compléter la tâche "Devis" si c'est la tâche actuelle
            let shouldComplete = false;
            let completionMessage = 'Devis uploadé avec succès !';
            
            if (tache.title === "Devis" && tache.workflow_order === 3) {
                try {
                    await autoCompleteDevisTask(tache.project.id, publicUrl);
                    console.log("✅ Tâche 'Devis' automatiquement marquée comme terminée");
                    shouldComplete = true;
                    completionMessage = 'Devis uploadé avec succès ! La tâche a été automatiquement marquée comme terminée et la tâche "Validation du devis" est maintenant accessible.';
                    
                    if (onNavigateToProject) {
                        setTimeout(() => {
                            onNavigateToProject(tache.project.id, tache.id);
                        }, 500);
                    }
                } catch (autoCompleteError) {
                    console.error('Erreur lors de l\'auto-complétion:', autoCompleteError);
                    completionMessage = 'Devis uploadé avec succès ! Cependant, la tâche n\'a pas pu être automatiquement marquée comme terminée.';
                }
            }
            
            // Mettre à jour l'état de la tâche
            setTache(prev => ({
                ...prev,
                project: {
                    ...prev.project,
                    pdf_devis: publicUrl
                },
                ...(shouldComplete && {
                    status: 'completed',
                    description: 'Devis uploadé avec succès. Document disponible en pièce jointe.'
                })
            }));
            
            setFileInputKey(prev => prev + 1);
            
        } catch (error) {
            console.error('Erreur lors de l\'upload:', error);
            alert('Erreur lors de l\'upload du devis: ' + error.message);
            setFileInputKey(prev => prev + 1);
        } finally {
            setUploadingFile(false);
        }
    }, [autoCompleteDevisTask]);

    // Fonction pour télécharger le devis existant
    const handleDownloadDevis = useCallback((tache) => {
        if (tache.project?.pdf_devis) {
            window.open(tache.project.pdf_devis, '_blank');
        }
    }, []);

    // Fonction pour télécharger le devis signé
    const handleDownloadSignedDevis = useCallback((tache) => {
        if (tache.project?.pdf_devis_signe) {
            window.open(tache.project.pdf_devis_signe, '_blank');
        }
    }, []);

    // Fonction pour démarrer le processus de signature
    const startSigningProcess = useCallback(() => {
        setSignatureStep('position');
        setSignaturePosition(null);
        setCapturedSignature(null);
    }, []);

    // Fonction appelée quand l'utilisateur clique sur le PDF pour positionner la signature
    const handleSignaturePositioned = useCallback((position) => {
        setSignaturePosition(position);
        setSignatureStep('capture');
        setShowSignaturePad(true);
    }, []);

    // Fonction pour capturer la signature depuis le SignaturePad
    const handleSignatureCaptured = useCallback((signatureDataURL) => {
        setCapturedSignature(signatureDataURL);
        setShowSignaturePad(false);
        setSignatureStep('preview');
        console.log('✅ Signature capturée et affichée instantanément sur le PDF');
    }, []);

    // Fonction pour finaliser la signature et créer le PDF signé
    const finalizeSignature = useCallback(async (tache, onNavigateToProject, setTache) => {
        if (!signaturePosition || !capturedSignature) {
            alert('Position ou signature manquante');
            return;
        }
        await handleSignDocument(capturedSignature, tache, onNavigateToProject, setTache);
    }, [signaturePosition, capturedSignature]);

    // Fonction pour annuler le processus de signature
    const cancelSigning = useCallback(() => {
        setSignatureStep('position');
        setSignaturePosition(null);
        setCapturedSignature(null);
        setShowSignaturePad(false);
    }, []);

    // Fonction pour capturer la signature et signer le PDF
    const handleSignDocument = useCallback(async (signatureDataURL, tache, onNavigateToProject, setTache) => {
        if (!tache.project?.pdf_devis || !signatureDataURL || !signaturePosition) {
            console.error('PDF du devis, signature ou position manquante');
            return;
        }

        try {
            setSigning(true);
            
            // Valider les données avant traitement
            window.PDFSigner.validateSignatureData(signatureDataURL);
            window.PDFSigner.validateSignaturePosition(signaturePosition);
            
            console.log('🔧 Création du PDF signé avec PDF-lib...');
            
            // Créer le PDF signé avec PDF-lib
            const signedPdfBlob = await window.PDFSigner.createSignedPDF(
                tache.project.pdf_devis,
                signatureDataURL,
                signaturePosition
            );
            
            console.log('✅ PDF signé créé avec succès');
            
            // Nom de fichier unique pour le PDF signé
            const signedFileName = `devis_signe_${tache.project.id}_${Date.now()}.pdf`;
            
            // Upload du PDF signé vers Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(signedFileName, signedPdfBlob, {
                    contentType: 'application/pdf',
                    cacheControl: '3600',
                    upsert: true
                });
            
            if (uploadError) {
                throw new Error(`Erreur upload: ${uploadError.message}`);
            }
            
            // Obtenir l'URL publique du PDF signé
            const { data } = supabase.storage.from('avatars').getPublicUrl(signedFileName);
            const signedPdfUrl = data.publicUrl;
            
            // Mettre à jour le projet avec l'URL du devis signé
            const { error: updateError } = await supabase
                .from('projects')
                .update({ pdf_devis_signe: signedPdfUrl })
                .eq('id', tache.project.id);
            
            if (updateError) {
                throw new Error(`Erreur mise à jour: ${updateError.message}`);
            }
            
            // Mettre à jour l'état local du projet
            setTache(prev => ({
                ...prev,
                project: {
                    ...prev.project,
                    pdf_devis_signe: signedPdfUrl
                }
            }));
            
            // Auto-compléter la tâche si c'est une validation
            if (tache.title === "Validation du devis" && tache.workflow_order === 4) {
                try {
                    await autoCompleteValidationTask(tache.project.id, signedPdfUrl);
                    
                    setTache(prev => ({
                        ...prev,
                        status: 'completed',
                        description: 'Devis validé et signé électroniquement par le client. Document signé disponible.'
                    }));
                    
                    if (onNavigateToProject) {
                        setTimeout(() => {
                            onNavigateToProject(tache.project.id, tache.id);
                        }, 2000);
                    }
                } catch (autoCompleteError) {
                    console.error('Erreur lors de l\'auto-complétion de la validation:', autoCompleteError);
                }
                
                console.log('Document signé avec succès !');
            }
            
            // Réinitialiser le workflow de signature
            setSignatureStep('position');
            setShowSignaturePad(false);
            setSignaturePosition(null);
            setCapturedSignature(null);
            console.log('✅ États de signature réinitialisés');
            
        } catch (error) {
            console.error('Erreur lors de la signature:', error);
            alert('Erreur lors de la signature du document: ' + error.message);
        } finally {
            setSigning(false);
        }
    }, [signaturePosition, autoCompleteValidationTask]);

    // Mémoriser l'URL du PDF pour éviter les re-rendus inutiles
    const getStablePdfUrl = useCallback((tache) => {
        return tache?.project?.pdf_devis;
    }, []);

    // Fonction pour obtenir les signatures à afficher sur le PDF
    const getSignaturesForViewer = useCallback((tache) => {
        if (capturedSignature && signaturePosition && !tache.project?.pdf_devis_signe) {
            return [{
                page: signaturePosition.page,
                x: signaturePosition.x,
                y: signaturePosition.y,
                width: signaturePosition.width,
                height: signaturePosition.height,
                imageData: capturedSignature
            }];
        }
        return [];
    }, [capturedSignature, signaturePosition]);

    // Fonction pour déterminer si le PDF est en lecture seule
    const isPdfReadOnly = useCallback((tache) => {
        return !!tache.project?.pdf_devis_signe;
    }, []);

    // Fonction pour réinitialiser les états des devis
    const resetDevisState = useCallback(() => {
        setUploadingFile(false);
        setFileInputKey(0);
        setShowSignaturePad(false);
        setSigning(false);
        setSignaturePosition(null);
        setCapturedSignature(null);
        setSignatureStep('position');
    }, []);

    return {
        // États
        uploadingFile,
        fileInputKey,
        showSignaturePad,
        signing,
        signaturePosition,
        capturedSignature,
        signatureStep,
        
        // Actions
        setUploadingFile,
        setFileInputKey,
        setShowSignaturePad,
        setSigning,
        setSignaturePosition,
        setCapturedSignature,
        setSignatureStep,
        
        // Fonctions
        handleFileUpload,
        handleDownloadDevis,
        handleDownloadSignedDevis,
        startSigningProcess,
        handleSignaturePositioned,
        handleSignatureCaptured,
        finalizeSignature,
        cancelSigning,
        handleSignDocument,
        getStablePdfUrl,
        getSignaturesForViewer,
        isPdfReadOnly,
        resetDevisState
    };
}

// Export global
window.useDevisService = useDevisService;