// Composant spécialisé pour la tâche de génération de documents
function GenerationDocumentsTaskSection({ 
    tache, 
    onNavigateToProject,
    setTache 
}) {
    console.log('🔧 [GenerationDocumentsTaskSection] Composant en cours de chargement...');
    console.log('🔧 [GenerationDocumentsTaskSection] Props reçues:', { tache: tache?.title, onNavigateToProject: !!onNavigateToProject, setTache: !!setTache });
    const { useState, useEffect } = React;
    const documentService = window.useDocumentGenerationService();
    const { 
        generatingConvocation,
        generatingConvention,
        generateConvocation,
        generateConvention,
        downloadConvocation,
        downloadConvention,
        validateDocuments,
        fetchDocumentUrls
    } = documentService;
    
    // État local pour stocker les URLs des documents
    const [documentUrls, setDocumentUrls] = useState({
        pdf_convocation: null,
        pdf_convention: null
    });
    
    // État pour forcer le rechargement des PDFs (cache-busting)
    const [pdfTimestamps, setPdfTimestamps] = useState({
        convocation: Date.now(),
        convention: Date.now()
    });
    
    // Fonction helper pour ajouter un timestamp cache-busting à une URL
    const addCacheBuster = (url, timestamp) => {
        if (!url) return null;
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}t=${timestamp}`;
    };
    
    // Charger les URLs des documents au montage et quand le projet change
    useEffect(() => {
        if (tache?.project?.id) {
            fetchDocumentUrls(tache.project.id).then(urls => {
                setDocumentUrls(urls);
                
                // Mettre à jour l'état de la tâche si nécessaire
                if (urls.pdf_convocation || urls.pdf_convention) {
                    setTache(prev => ({
                        ...prev,
                        project: {
                            ...prev.project,
                            pdf_convocation: urls.pdf_convocation || prev.project?.pdf_convocation,
                            pdf_convention: urls.pdf_convention || prev.project?.pdf_convention
                        }
                    }));
                }
            });
        }
    }, [tache?.project?.id, fetchDocumentUrls, setTache]);
    
    // Wrappers pour rafraîchir les URLs après génération
    const handleGenerateConvocation = async () => {
        await generateConvocation(tache, onNavigateToProject, setTache);
        // Rafraîchir les URLs après génération
        if (tache?.project?.id) {
            const urls = await fetchDocumentUrls(tache.project.id);
            setDocumentUrls(urls);
            // Mettre à jour le timestamp pour forcer le rechargement du PDF
            setPdfTimestamps(prev => ({
                ...prev,
                convocation: Date.now()
            }));
        }
    };
    
    const handleGenerateConvention = async () => {
        await generateConvention(tache, onNavigateToProject, setTache);
        // Rafraîchir les URLs après génération
        if (tache?.project?.id) {
            const urls = await fetchDocumentUrls(tache.project.id);
            setDocumentUrls(urls);
            // Mettre à jour le timestamp pour forcer le rechargement du PDF
            setPdfTimestamps(prev => ({
                ...prev,
                convention: Date.now()
            }));
        }
    };

    // Si ce n'est pas une tâche "Génération documents", ne rien afficher
    if (tache.title !== "Génération documents") {
        return null;
    }

    return React.createElement('div', {
        key: 'generation-documents-actions',
        className: "bg-blue-50 rounded-lg border border-gray-200 p-6"
    }, [
        React.createElement('h3', {
            key: 'actions-title',
            className: "text-lg font-semibold text-gray-900 mb-6"
        }, "Actions requises pour cette tâche"),
        
        React.createElement('div', {
            key: 'documents-container',
            className: "grid grid-cols-2 gap-6"
        }, [
            // Section Convocation simplifiée
            React.createElement('div', {
                key: 'convocation-section',
                className: "space-y-4"
            }, [
                // Boutons Convocation
                React.createElement('div', {
                    key: 'convocation-actions',
                    className: "flex gap-3"
                }, [
                    React.createElement('button', {
                        key: 'generate-convocation-btn',
                        onClick: handleGenerateConvocation,
                        disabled: generatingConvocation,
                        className: `inline-flex items-center gap-2 px-4 py-2 ${
                            generatingConvocation 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-blue-600 hover:bg-blue-700'
                        } text-white rounded-lg transition-colors font-medium`
                    }, [
                        generatingConvocation && React.createElement('i', {
                            key: 'loading-icon',
                            'data-lucide': 'loader-2',
                            className: "w-4 h-4 animate-spin"
                        }),
                        !generatingConvocation && React.createElement('i', {
                            key: 'file-plus-icon',
                            'data-lucide': 'file-plus',
                            className: "w-4 h-4"
                        }),
                        generatingConvocation 
                            ? "Génération..." 
                            : (documentUrls.pdf_convocation || tache.project?.pdf_convocation) 
                                ? "Régénérer convocation" 
                                : "Générer convocation"
                    ]),
                    
                    (documentUrls.pdf_convocation || tache.project?.pdf_convocation) && React.createElement('button', {
                        key: 'open-convocation-btn',
                        onClick: () => downloadConvocation(tache),
                        className: "inline-flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                    }, [
                        React.createElement('i', {
                            key: 'external-link-icon',
                            'data-lucide': 'external-link',
                            className: "w-4 h-4"
                        }),
                        "Ouvrir"
                    ])
                ]),
                
                // Viewer PDF Convocation
                (documentUrls.pdf_convocation || tache.project?.pdf_convocation) && React.createElement('div', {
                    key: 'convocation-viewer-container',
                    className: "w-[600px] h-[848px] border border-gray-300 rounded-lg overflow-hidden bg-white mx-auto"
                }, [
                    React.createElement(window.PDFViewer, {
                        key: 'convocation-pdf-viewer',
                        pdfUrl: addCacheBuster(
                            documentUrls.pdf_convocation || tache.project?.pdf_convocation, 
                            pdfTimestamps.convocation
                        ),
                        readOnly: true,
                        hideNavigation: true
                    })
                ])
            ]),
            
            // Section Convention simplifiée
            React.createElement('div', {
                key: 'convention-section',
                className: "space-y-4"
            }, [
                // Boutons Convention
                React.createElement('div', {
                    key: 'convention-actions',
                    className: "flex gap-3"
                }, [
                    React.createElement('button', {
                        key: 'generate-convention-btn',
                        onClick: handleGenerateConvention,
                        disabled: generatingConvention,
                        className: `inline-flex items-center gap-2 px-4 py-2 ${
                            generatingConvention 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-green-600 hover:bg-green-700'
                        } text-white rounded-lg transition-colors font-medium`
                    }, [
                        generatingConvention && React.createElement('i', {
                            key: 'loading-icon',
                            'data-lucide': 'loader-2',
                            className: "w-4 h-4 animate-spin"
                        }),
                        !generatingConvention && React.createElement('i', {
                            key: 'file-plus-icon',
                            'data-lucide': 'file-plus',
                            className: "w-4 h-4"
                        }),
                        generatingConvention 
                            ? "Génération..." 
                            : (documentUrls.pdf_convention || tache.project?.pdf_convention) 
                                ? "Régénérer convention" 
                                : "Générer convention"
                    ]),
                    
                    (documentUrls.pdf_convention || tache.project?.pdf_convention) && React.createElement('button', {
                        key: 'open-convention-btn',
                        onClick: () => downloadConvention(tache),
                        className: "inline-flex items-center gap-2 px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                    }, [
                        React.createElement('i', {
                            key: 'external-link-icon',
                            'data-lucide': 'external-link',
                            className: "w-4 h-4"
                        }),
                        "Ouvrir"
                    ])
                ]),
                
                // Viewer PDF Convention
                (documentUrls.pdf_convention || tache.project?.pdf_convention) && React.createElement('div', {
                    key: 'convention-viewer-container',
                    className: "w-[600px] h-[848px] border border-gray-300 rounded-lg overflow-hidden bg-white mx-auto"
                }, [
                    React.createElement(window.PDFViewer, {
                        key: 'convention-pdf-viewer',
                        pdfUrl: addCacheBuster(
                            documentUrls.pdf_convention || tache.project?.pdf_convention, 
                            pdfTimestamps.convention
                        ),
                        readOnly: true,
                        hideNavigation: true
                    })
                ])
            ])
        ]),
        
        // Bouton de validation finale (seulement si les 2 documents sont générés)
        ((documentUrls.pdf_convocation || tache.project?.pdf_convocation) && (documentUrls.pdf_convention || tache.project?.pdf_convention)) && React.createElement('div', {
            key: 'validation-section',
            className: "mt-6 text-center"
        }, [
            React.createElement('button', {
                key: 'validate-documents-btn',
                onClick: () => validateDocuments(tache, onNavigateToProject, setTache),
                className: "inline-flex items-center gap-3 px-8 py-3 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-lg"
            }, [
                React.createElement('i', {
                    key: 'validate-icon',
                    'data-lucide': 'check-circle',
                    className: "w-5 h-5"
                }),
                "Valider les documents"
            ])
        ])
    ]);
}

// Export global
window.GenerationDocumentsTaskSection = GenerationDocumentsTaskSection;
console.log('✅ [GenerationDocumentsTaskSection] Composant exporté avec succès vers window.GenerationDocumentsTaskSection');