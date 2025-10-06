// Composant spécialisé pour la tâche de validation des documents (signature)
function ValidationDocumentsTaskSection({ 
    tache, 
    onNavigateToProject,
    setTache 
}) {
    console.log('🔧 [ValidationDocumentsTaskSection] Composant en cours de chargement...');
    console.log('🔧 [ValidationDocumentsTaskSection] Props reçues:', { tache: tache?.title, onNavigateToProject: !!onNavigateToProject, setTache: !!setTache });
    
    const { useState, useEffect } = React;
    const documentSignatureService = window.useDocumentSignatureService();
    const { 
        signingConvocation,
        signingConvention,
        showSignaturePad,
        currentDocument,
        signatureStep,
        startSigningProcess,
        handleSignaturePositioned,
        handleSignatureCaptured,
        finalizeSignature,
        cancelSigning,
        validateAllSignatures,
        getSignaturesForViewer,
        isPdfReadOnly,
        downloadSignedDocument
    } = documentSignatureService;
    
    // État local pour stocker les URLs des documents
    const [documentUrls, setDocumentUrls] = useState({
        pdf_convocation: null,
        pdf_convention: null,
        pdf_convocation_signe: null,
        pdf_convention_signe: null
    });
    
    // Charger les URLs des documents au montage
    useEffect(() => {
        if (tache?.project?.id) {
            setDocumentUrls({
                pdf_convocation: tache.project.pdf_convocation,
                pdf_convention: tache.project.pdf_convention,
                pdf_convocation_signe: tache.project.pdf_convocation_signe,
                pdf_convention_signe: tache.project.pdf_convention_signe
            });
        }
    }, [tache?.project]);

    // Si ce n'est pas une tâche "Validation des documents", ne rien afficher
    if (tache.title !== "Validation des documents") {
        return null;
    }

    return React.createElement('div', {
        key: 'validation-documents-actions',
        className: "bg-blue-50 rounded-lg border border-gray-200 p-6"
    }, [
        React.createElement('h3', {
            key: 'actions-title',
            className: "text-lg font-semibold text-gray-900 mb-6"
        }, "Signature électronique des documents"),
        
        React.createElement('div', {
            key: 'documents-container',
            className: "grid grid-cols-2 gap-6"
        }, [
            // Section Convocation
            React.createElement('div', {
                key: 'convocation-section',
                className: "space-y-4"
            }, [
                // En-tête et statut Convocation
                React.createElement('div', {
                    key: 'convocation-header',
                    className: "flex items-center justify-between"
                }, [
                    React.createElement('h4', {
                        key: 'convocation-title',
                        className: "text-lg font-medium text-blue-900"
                    }, "Convocation de formation"),
                    (documentUrls.pdf_convocation_signe || tache.project?.pdf_convocation_signe) && React.createElement('div', {
                        key: 'convocation-status',
                        className: "inline-flex items-center gap-2 px-3 py-1 bg-green-100 border border-green-300 text-green-800 rounded-lg font-medium"
                    }, [
                        React.createElement('i', {
                            key: 'check-icon',
                            'data-lucide': 'check-circle',
                            className: "w-4 h-4"
                        }),
                        "Signée"
                    ])
                ]),
                
                // Actions Convocation (téléchargement uniquement)
                (documentUrls.pdf_convocation_signe || tache.project?.pdf_convocation_signe) && React.createElement('div', {
                    key: 'convocation-actions',
                    className: "flex gap-3"
                }, [
                    React.createElement('button', {
                        key: 'download-convocation-btn',
                        onClick: () => downloadSignedDocument(tache, 'convocation'),
                        className: "inline-flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                    }, [
                        React.createElement('i', {
                            key: 'download-icon',
                            'data-lucide': 'download',
                            className: "w-4 h-4"
                        }),
                        "Télécharger"
                    ])
                ]),
                
                // Viewer PDF Convocation
                (documentUrls.pdf_convocation || tache.project?.pdf_convocation) && React.createElement('div', {
                    key: 'convocation-viewer-container',
                    className: "w-[600px] h-[848px] border border-gray-300 rounded-lg overflow-hidden bg-white mx-auto"
                }, [
                    React.createElement(window.PDFViewer, {
                        key: 'convocation-pdf-viewer',
                        pdfUrl: (documentUrls.pdf_convocation_signe || tache.project?.pdf_convocation_signe) 
                            ? (documentUrls.pdf_convocation_signe || tache.project?.pdf_convocation_signe)
                            : (documentUrls.pdf_convocation || tache.project?.pdf_convocation),
                        readOnly: isPdfReadOnly(tache, 'convocation'),
                        hideNavigation: true,
                        onSignaturePositioned: currentDocument === 'convocation' ? handleSignaturePositioned : undefined,
                        signatures: getSignaturesForViewer(tache, 'convocation'),
                        startSigningProcess: startSigningProcess
                    })
                ])
            ]),
            
            // Section Convention
            React.createElement('div', {
                key: 'convention-section',
                className: "space-y-4"
            }, [
                // En-tête et statut Convention
                React.createElement('div', {
                    key: 'convention-header',
                    className: "flex items-center justify-between"
                }, [
                    React.createElement('h4', {
                        key: 'convention-title',
                        className: "text-lg font-medium text-green-900"
                    }, "Convention de formation"),
                    (documentUrls.pdf_convention_signe || tache.project?.pdf_convention_signe) && React.createElement('div', {
                        key: 'convention-status',
                        className: "inline-flex items-center gap-2 px-3 py-1 bg-green-100 border border-green-300 text-green-800 rounded-lg font-medium"
                    }, [
                        React.createElement('i', {
                            key: 'check-icon',
                            'data-lucide': 'check-circle',
                            className: "w-4 h-4"
                        }),
                        "Signée"
                    ])
                ]),
                
                // Actions Convention (téléchargement uniquement)
                (documentUrls.pdf_convention_signe || tache.project?.pdf_convention_signe) && React.createElement('div', {
                    key: 'convention-actions',
                    className: "flex gap-3"
                }, [
                    React.createElement('button', {
                        key: 'download-convention-btn',
                        onClick: () => downloadSignedDocument(tache, 'convention'),
                        className: "inline-flex items-center gap-2 px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                    }, [
                        React.createElement('i', {
                            key: 'download-icon',
                            'data-lucide': 'download',
                            className: "w-4 h-4"
                        }),
                        "Télécharger"
                    ])
                ]),
                
                // Viewer PDF Convention
                (documentUrls.pdf_convention || tache.project?.pdf_convention) && React.createElement('div', {
                    key: 'convention-viewer-container',
                    className: "w-[600px] h-[848px] border border-gray-300 rounded-lg overflow-hidden bg-white mx-auto"
                }, [
                    React.createElement(window.PDFViewer, {
                        key: 'convention-pdf-viewer',
                        pdfUrl: (documentUrls.pdf_convention_signe || tache.project?.pdf_convention_signe) 
                            ? (documentUrls.pdf_convention_signe || tache.project?.pdf_convention_signe)
                            : (documentUrls.pdf_convention || tache.project?.pdf_convention),
                        readOnly: isPdfReadOnly(tache, 'convention'),
                        hideNavigation: true,
                        onSignaturePositioned: currentDocument === 'convention' ? handleSignaturePositioned : undefined,
                        signatures: getSignaturesForViewer(tache, 'convention'),
                        startSigningProcess: startSigningProcess
                    })
                ])
            ])
        ]),
        
        // Instructions selon l'étape de signature
        currentDocument && React.createElement('div', {
            key: 'signature-instructions',
            className: "mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
        }, [
            signatureStep === 'position' && React.createElement('div', {
                key: 'position-instruction',
                className: "text-center"
            }, [
                React.createElement('h5', {
                    key: 'instruction-title',
                    className: "font-medium text-yellow-900 mb-2"
                }, `Signature de la ${currentDocument}`),
                React.createElement('p', {
                    key: 'instruction-text',
                    className: "text-yellow-800"
                }, "👆 Cliquez sur le document ci-dessus à l'endroit où vous souhaitez placer votre signature.")
            ]),
            
            signatureStep === 'capture' && React.createElement('div', {
                key: 'capture-instruction',
                className: "text-center"
            }, [
                React.createElement('h5', {
                    key: 'instruction-title',
                    className: "font-medium text-yellow-900 mb-2"
                }, "Dessinez votre signature"),
                React.createElement('p', {
                    key: 'instruction-text',
                    className: "text-yellow-800"
                }, "✍️ Utilisez le pavé de signature qui s'est ouvert pour dessiner votre signature.")
            ]),
            
            signatureStep === 'preview' && React.createElement('div', {
                key: 'preview-instruction',
                className: "flex items-center justify-between"
            }, [
                React.createElement('div', {
                    key: 'preview-info'
                }, [
                    React.createElement('h5', {
                        key: 'instruction-title',
                        className: "font-medium text-yellow-900"
                    }, "Aperçu de la signature"),
                    React.createElement('p', {
                        key: 'instruction-text',
                        className: "text-yellow-800"
                    }, "Votre signature apparaît sur le document. Validez pour finaliser.")
                ]),
                React.createElement('div', {
                    key: 'preview-actions',
                    className: "flex gap-3"
                }, [
                    React.createElement('button', {
                        key: 'cancel-btn',
                        onClick: cancelSigning,
                        className: "px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    }, "Recommencer"),
                    React.createElement('button', {
                        key: 'finalize-btn',
                        onClick: () => finalizeSignature(tache, onNavigateToProject, setTache),
                        className: "px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    }, "Valider la signature")
                ])
            ])
        ]),
        
        // Bouton de validation finale (seulement si les 2 documents sont signés)
        ((documentUrls.pdf_convocation_signe || tache.project?.pdf_convocation_signe) && 
         (documentUrls.pdf_convention_signe || tache.project?.pdf_convention_signe)) && 
        React.createElement('div', {
            key: 'validation-section',
            className: "mt-8 text-center"
        }, [
            React.createElement('div', {
                key: 'validation-success',
                className: "mb-4 p-4 bg-green-50 border border-green-200 rounded-lg"
            }, [
                React.createElement('div', {
                    key: 'success-icon',
                    className: "inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3"
                }, [
                    React.createElement('i', {
                        key: 'check-icon',
                        'data-lucide': 'check-circle-2',
                        className: "w-6 h-6 text-green-600"
                    })
                ]),
                React.createElement('h4', {
                    key: 'success-title',
                    className: "text-lg font-semibold text-green-900 mb-2"
                }, "Documents signés avec succès !"),
                React.createElement('p', {
                    key: 'success-description',
                    className: "text-green-700"
                }, "La convocation et la convention ont été signées électroniquement. Vous pouvez maintenant valider cette étape.")
            ]),
            
            React.createElement('button', {
                key: 'validate-signatures-btn',
                onClick: () => validateAllSignatures(tache, onNavigateToProject, setTache),
                className: "inline-flex items-center gap-3 px-8 py-3 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-lg"
            }, [
                React.createElement('i', {
                    key: 'validate-icon',
                    'data-lucide': 'check-circle',
                    className: "w-5 h-5"
                }),
                "Valider les signatures"
            ])
        ]),
        
        // Modal de signature
        React.createElement(window.SignaturePad, {
            key: 'signature-pad-modal',
            isOpen: showSignaturePad,
            onClose: () => {
                cancelSigning();
            },
            onSign: handleSignatureCaptured,
            signing: false
        })
    ]);
}

// Export global
window.ValidationDocumentsTaskSection = ValidationDocumentsTaskSection;
console.log('✅ [ValidationDocumentsTaskSection] Composant exporté avec succès vers window.ValidationDocumentsTaskSection');