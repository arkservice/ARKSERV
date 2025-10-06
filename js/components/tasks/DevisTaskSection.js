// Composant spécialisé pour la tâche de devis
function DevisTaskSection({ 
    tache, 
    onNavigateToProject,
    setTache 
}) {
    const devisService = window.useDevisService();
    const { 
        uploadingFile,
        fileInputKey,
        handleFileUpload,
        handleDownloadDevis,
        getStablePdfUrl
    } = devisService;

    // Si ce n'est pas une tâche "Devis", ne rien afficher
    if (tache.title !== "Devis") {
        return null;
    }

    const stablePdfUrl = getStablePdfUrl(tache);

    return React.createElement('div', {
        key: 'devis-actions',
        className: "bg-purple-50 rounded-lg border border-gray-200 p-6"
    }, [
        React.createElement('h3', {
            key: 'actions-title',
            className: "text-lg font-semibold text-gray-900 mb-6"
        }, "Actions requises pour cette tâche"),
        
        React.createElement('div', {
            key: 'devis-container',
            className: "space-y-4"
        }, [
            // Zone d'upload
            React.createElement('div', {
                key: 'upload-section',
                className: "space-y-4"
            }, [
                // Message d'erreur si aucun devis
                !tache.project?.pdf_devis && React.createElement('div', {
                    key: 'no-devis',
                    className: "p-4 bg-orange-100 border border-orange-200 rounded-lg"
                }, [
                    React.createElement('div', {
                        key: 'warning',
                        className: "flex items-center"
                    }, [
                        React.createElement('i', {
                            key: 'warning-icon',
                            'data-lucide': 'alert-triangle',
                            className: "w-5 h-5 text-orange-600 mr-2"
                        }),
                        React.createElement('span', {
                            key: 'warning-text',
                            className: "text-orange-800"
                        }, "Aucun devis uploadé pour ce projet")
                    ])
                ]),
                
                // Zone d'upload horizontale
                React.createElement('div', {
                    key: 'upload-zone',
                    className: "flex gap-6 items-start"
                }, [
                    // Section upload à gauche
                    React.createElement('div', {
                        key: 'upload-section',
                        className: "flex-shrink-0"
                    }, [
                        React.createElement('div', {
                            key: 'upload-area',
                            className: "border-2 border-dashed border-purple-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors"
                        }, [
                            React.createElement('i', {
                                key: 'upload-icon',
                                'data-lucide': 'upload',
                                className: "w-8 h-8 text-purple-600 mx-auto mb-3"
                            }),
                            React.createElement('h5', {
                                key: 'upload-title',
                                className: "font-medium text-gray-900 mb-2"
                            }, tache.project?.pdf_devis ? "Remplacer le devis" : "Uploader le devis"),
                            React.createElement('p', {
                                key: 'upload-description',
                                className: "text-sm text-gray-600 mb-4"
                            }, "Fichier PDF uniquement, taille max : 10MB"),
                            React.createElement('input', {
                                key: `file-input-${fileInputKey}`,
                                type: 'file',
                                accept: '.pdf',
                                onChange: (event) => handleFileUpload(event, tache, onNavigateToProject, setTache),
                                disabled: uploadingFile,
                                className: "hidden",
                                id: 'devis-upload'
                            }),
                            React.createElement('label', {
                                key: 'upload-label',
                                htmlFor: 'devis-upload',
                                className: `inline-flex items-center gap-2 px-4 py-2 ${uploadingFile ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 cursor-pointer'} text-white text-base rounded-lg transition-colors`
                            }, [
                                uploadingFile && React.createElement('i', {
                                    key: 'loading-icon',
                                    'data-lucide': 'loader-2',
                                    className: "w-4 h-4 animate-spin"
                                }),
                                uploadingFile ? "Upload en cours..." : "Choisir un fichier"
                            ])
                        ])
                    ]),
                    
                    // Section aperçu PDF à droite
                    tache.project?.pdf_devis && React.createElement('div', {
                        key: 'preview-section',
                        className: "flex-shrink-0 w-[600px]"
                    }, [
                        React.createElement('div', {
                            key: 'preview-header',
                            className: "flex items-center justify-between mb-2"
                        }, [
                            React.createElement('h5', {
                                key: 'preview-title',
                                className: "font-medium text-gray-900"
                            }, "Aperçu du devis"),
                            React.createElement('button', {
                                key: 'open-new-tab',
                                onClick: () => handleDownloadDevis(tache),
                                className: "inline-flex items-center gap-1 px-2 py-1 text-sm text-purple-600 hover:text-purple-700 transition-colors"
                            }, [
                                React.createElement('i', {
                                    key: 'external-link-icon',
                                    'data-lucide': 'external-link',
                                    className: "w-4 h-4"
                                }),
                                "Ouvrir dans un nouvel onglet"
                            ])
                        ]),
                        React.createElement('div', {
                            key: 'pdf-viewer-container',
                            className: "h-[850px] overflow-auto"
                        }, [
                            React.createElement(window.PDFViewer, {
                                key: 'pdf-preview',
                                pdfUrl: stablePdfUrl,
                                readOnly: true
                            })
                        ])
                    ])
                ])
            ])
        ])
    ]);
}

// Export global
window.DevisTaskSection = DevisTaskSection;