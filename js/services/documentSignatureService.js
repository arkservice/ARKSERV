// Service pour la signature des documents convocation et convention
function useDocumentSignatureService() {
    const { useState, useCallback } = React;
    const supabase = window.supabaseConfig.client;
    const { completeTask, updateTaskDescription } = window.useTasks();

    // États spécifiques à la signature des documents
    const [signingConvocation, setSigningConvocation] = useState(false);
    const [signingConvention, setSigningConvention] = useState(false);
    const [showSignaturePad, setShowSignaturePad] = useState(false);
    const [currentDocument, setCurrentDocument] = useState(null); // 'convocation' ou 'convention'
    const [signatureStep, setSignatureStep] = useState('position'); // 'position', 'capture', 'preview'
    const [signaturePosition, setSignaturePosition] = useState(null);
    const [capturedSignature, setCapturedSignature] = useState(null);

    // Démarrer le processus de signature pour un document
    const startSigningProcess = useCallback((documentType) => {
        console.log(`🔧 [DocumentSignature] Début signature ${documentType}...`);
        setCurrentDocument(documentType);
        setSignatureStep('position');
        setSignaturePosition(null);
        setCapturedSignature(null);
        setShowSignaturePad(false);
        
        if (documentType === 'convocation') {
            setSigningConvocation(true);
        } else {
            setSigningConvention(true);
        }
    }, []);

    // Gérer le positionnement de la signature sur le PDF
    const handleSignaturePositioned = useCallback((position) => {
        console.log(`📍 [DocumentSignature] Position signature ${currentDocument}:`, position);
        setSignaturePosition(position);
        setSignatureStep('capture');
        setShowSignaturePad(true);
    }, [currentDocument]);

    // Gérer la capture de la signature
    const handleSignatureCaptured = useCallback((signatureDataURL) => {
        console.log(`✍️ [DocumentSignature] Signature capturée pour ${currentDocument}`);
        setCapturedSignature(signatureDataURL);
        setShowSignaturePad(false);
        setSignatureStep('preview');
    }, [currentDocument]);

    // Finaliser la signature d'un document
    const finalizeSignature = useCallback(async (tache, onNavigateToProject, setTache) => {
        if (!currentDocument || !capturedSignature || !signaturePosition) {
            console.error('❌ [DocumentSignature] Données manquantes pour finaliser');
            return;
        }

        try {
            console.log(`🔧 [DocumentSignature] Finalisation signature ${currentDocument}...`);
            
            // Déterminer l'URL source et le champ de destination
            const sourceUrl = currentDocument === 'convocation' 
                ? tache.project?.pdf_convocation 
                : tache.project?.pdf_convention;
            
            const destinationField = currentDocument === 'convocation' 
                ? 'pdf_convocation_signe' 
                : 'pdf_convention_signe';

            if (!sourceUrl) {
                throw new Error(`Document ${currentDocument} source non trouvé`);
            }

            // Valider les données avant traitement
            window.PDFSigner.validateSignatureData(capturedSignature);
            window.PDFSigner.validateSignaturePosition(signaturePosition);
            
            // Créer le PDF signé avec PDF-lib
            const signedPdfBlob = await window.PDFSigner.createSignedPDF(
                sourceUrl,
                capturedSignature,
                signaturePosition
            );
            
            console.log(`✅ [DocumentSignature] PDF ${currentDocument} signé créé`);
            
            // Nom de fichier unique pour le PDF signé
            const signedFileName = `${currentDocument}_signe_projet_${tache.project.id}.pdf`;
            const filePath = `${currentDocument}_signe/${signedFileName}`;
            
            // Upload du PDF signé vers Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('pdfs')
                .upload(filePath, signedPdfBlob, {
                    contentType: 'application/pdf',
                    cacheControl: '3600',
                    upsert: true
                });
            
            if (uploadError) {
                throw new Error(`Erreur upload ${currentDocument}: ${uploadError.message}`);
            }
            
            // Obtenir l'URL publique du PDF signé
            const { data } = supabase.storage.from('pdfs').getPublicUrl(filePath);
            const signedPdfUrl = data.publicUrl;
            
            // Mettre à jour le projet avec l'URL du document signé
            const updateData = { [destinationField]: signedPdfUrl };
            const { error: updateError } = await supabase
                .from('projects')
                .update(updateData)
                .eq('id', tache.project.id);
            
            if (updateError) {
                throw new Error(`Erreur mise à jour ${currentDocument}: ${updateError.message}`);
            }
            
            // Mettre à jour l'état local du projet
            setTache(prev => ({
                ...prev,
                project: {
                    ...prev.project,
                    [destinationField]: signedPdfUrl
                }
            }));
            
            console.log(`✅ [DocumentSignature] ${currentDocument} signé avec succès: ${signedPdfUrl}`);
            
            // Réinitialiser le workflow de signature
            setSignatureStep('position');
            setSignaturePosition(null);
            setCapturedSignature(null);
            setCurrentDocument(null);
            setSigningConvocation(false);
            setSigningConvention(false);
            
        } catch (error) {
            console.error(`❌ [DocumentSignature] Erreur signature ${currentDocument}:`, error);
            alert(`Erreur lors de la signature du ${currentDocument}: ${error.message}`);
            
            // Réinitialiser en cas d'erreur
            setSignatureStep('position');
            setSignaturePosition(null);
            setCapturedSignature(null);
            if (currentDocument === 'convocation') {
                setSigningConvocation(false);
            } else {
                setSigningConvention(false);
            }
        }
    }, [currentDocument, capturedSignature, signaturePosition]);

    // Annuler le processus de signature
    const cancelSigning = useCallback(() => {
        console.log(`❌ [DocumentSignature] Annulation signature ${currentDocument}`);
        setSignatureStep('position');
        setSignaturePosition(null);
        setCapturedSignature(null);
        setShowSignaturePad(false);
        
        if (currentDocument === 'convocation') {
            setSigningConvocation(false);
        } else {
            setSigningConvention(false);
        }
        setCurrentDocument(null);
    }, [currentDocument]);

    // Valider toutes les signatures et compléter la tâche
    const validateAllSignatures = useCallback(async (tache, onNavigateToProject, setTache) => {
        try {
            console.log('🔧 [DocumentSignature] Validation finale des signatures...');
            
            // Vérifier que les deux documents sont signés
            if (!tache.project?.pdf_convocation_signe || !tache.project?.pdf_convention_signe) {
                throw new Error('Les deux documents doivent être signés avant la validation');
            }
            
            // Marquer la tâche comme terminée
            await completeTask(tache.id);
            
            // Mettre à jour la description de la tâche
            const newDescription = "Documents de formation signés électroniquement : convocation et convention validées et prêtes pour diffusion.";
            await updateTaskDescription(tache.id, newDescription);
            
            // Mettre à jour l'état local
            setTache(prev => ({
                ...prev,
                status: 'completed',
                description: newDescription
            }));
            
            console.log('✅ [DocumentSignature] Tâche "Validation des documents" complétée');
            
            // Redirection vers la page projet avec animation
            if (onNavigateToProject) {
                setTimeout(() => {
                    onNavigateToProject(tache.project.id, tache.id);
                }, 500);
            }
            
        } catch (error) {
            console.error('❌ [DocumentSignature] Erreur validation finale:', error);
            alert('Erreur lors de la validation des signatures: ' + error.message);
        }
    }, [completeTask, updateTaskDescription]);

    // Obtenir les signatures pour le viewer (pour affichage)
    const getSignaturesForViewer = useCallback((tache, documentType) => {
        // Si on est en mode preview et que c'est le document courant
        if (signatureStep === 'preview' && currentDocument === documentType && capturedSignature && signaturePosition) {
            return [{
                x: signaturePosition.x,
                y: signaturePosition.y,
                signatureData: capturedSignature
            }];
        }
        return [];
    }, [signatureStep, currentDocument, capturedSignature, signaturePosition]);

    // Déterminer si le PDF est en lecture seule
    const isPdfReadOnly = useCallback((tache, documentType) => {
        // Si le document est déjà signé, lecture seule
        const isAlreadySigned = documentType === 'convocation' 
            ? !!tache.project?.pdf_convocation_signe
            : !!tache.project?.pdf_convention_signe;
        
        // Si on est en train de signer ce document, pas en lecture seule
        const isCurrentlySigning = currentDocument === documentType;
        
        const readOnly = isAlreadySigned && !isCurrentlySigning;
        
        console.log(`🔐 [DocumentSignature] isPdfReadOnly ${documentType}:`, { 
            isAlreadySigned, 
            isCurrentlySigning, 
            currentDocument, 
            readOnly 
        });
        
        return readOnly;
    }, [currentDocument]);

    // Fonction pour télécharger un document signé
    const downloadSignedDocument = useCallback((tache, documentType) => {
        const signedUrl = documentType === 'convocation' 
            ? tache.project?.pdf_convocation_signe
            : tache.project?.pdf_convention_signe;
        
        if (signedUrl) {
            window.open(signedUrl, '_blank');
        }
    }, []);

    return {
        // États
        signingConvocation,
        signingConvention,
        showSignaturePad,
        currentDocument,
        signatureStep,
        
        // Fonctions
        startSigningProcess,
        handleSignaturePositioned,
        handleSignatureCaptured,
        finalizeSignature,
        cancelSigning,
        validateAllSignatures,
        getSignaturesForViewer,
        isPdfReadOnly,
        downloadSignedDocument
    };
}

// Export global
window.useDocumentSignatureService = useDocumentSignatureService;
console.log('✅ [DocumentSignatureService] Service exporté avec succès vers window.useDocumentSignatureService');