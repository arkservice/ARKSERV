// Composant spécialisé pour la validation du devis
function ValidationDevisTaskSection({ 
    tache, 
    onNavigateToProject,
    setTache 
}) {
    const { useEffect } = React;
    const devisService = window.useDevisService();
    const { 
        showSignaturePad,
        signing,
        signatureStep,
        signaturePosition,
        setSignatureStep,
        setSignaturePosition,
        handleDownloadSignedDevis,
        startSigningProcess,
        handleSignaturePositioned,
        handleSignatureCaptured,
        finalizeSignature,
        cancelSigning,
        getSignaturesForViewer,
        isPdfReadOnly
    } = devisService;

    // Initialiser le processus de signature au chargement du composant
    useEffect(() => {
        if (tache.title === "Validation du devis" && !tache.project?.pdf_devis_signe) {
            startSigningProcess();
        }
    }, [tache.title, tache.project?.pdf_devis_signe, startSigningProcess]);

    // Si ce n'est pas une tâche "Validation du devis", ne rien afficher
    if (tache.title !== "Validation du devis") {
        return null;
    }

    return React.createElement('div', {
        key: 'validation-devis-actions',
        className: "bg-white rounded-lg border border-gray-200 p-6"
    }, [
        React.createElement('h3', {
            key: 'actions-title',
            className: "text-lg font-semibold text-gray-900 mb-6"
        }, "Validation et signature du devis"),
        
        React.createElement('div', {
            key: 'validation-container',
            className: "bg-emerald-50 rounded-lg p-6"
        }, [
            React.createElement('h4', {
                key: 'section-title',
                className: "text-xl font-semibold text-center text-gray-900 mb-6"
            }, "Signature électronique du devis"),
            
            // Vérification que le devis existe
            !tache.project?.pdf_devis ? React.createElement('div', {
                key: 'no-devis-error',
                className: "p-4 bg-red-100 border border-red-200 rounded-lg mb-6"
            }, [
                React.createElement('div', {
                    key: 'error',
                    className: "flex items-center"
                }, [
                    React.createElement('i', {
                        key: 'error-icon',
                        'data-lucide': 'alert-circle',
                        className: "w-5 h-5 text-red-600 mr-2"
                    }),
                    React.createElement('span', {
                        key: 'error-text',
                        className: "text-red-800"
                    }, "Aucun devis disponible pour signature. La tâche précédente doit être complétée.")
                ])
            ]) : React.createElement('div', {
                key: 'validation-content',
                className: "space-y-6"
            }, [
                
                // Visualiseur PDF intégré avec signature
                React.createElement('div', {
                    key: 'pdf-viewer-section',
                    className: "space-y-4"
                }, [
                    React.createElement('div', {
                        key: 'viewer-header',
                        className: "flex items-center justify-between"
                    }, [
                        React.createElement('h5', {
                            key: 'viewer-title',
                            className: "font-medium text-gray-900"
                        }, tache.project?.pdf_devis_signe ? "Document signé" : "Document à signer"),
                        tache.project?.pdf_devis_signe && React.createElement('div', {
                            key: 'signed-badge',
                            className: "inline-flex items-center gap-2 px-3 py-1 bg-green-100 border border-green-300 text-green-800 rounded-lg text-sm font-medium"
                        }, [
                            React.createElement('i', {
                                key: 'check-icon',
                                'data-lucide': 'check-circle',
                                className: "w-4 h-4"
                            }),
                            "Document signé"
                        ])
                    ]),
                    React.createElement('div', {
                        key: 'pdf-viewer-container',
                        className: "h-[850px] overflow-auto"
                    }, [
                        React.createElement(window.PDFViewer, {
                            key: 'pdf-viewer-devis',
                            pdfUrl: tache.project.pdf_devis_signe || tache.project.pdf_devis,
                            onSignaturePositioned: handleSignaturePositioned,
                            signatures: getSignaturesForViewer(tache),
                            readOnly: isPdfReadOnly(tache)
                        })
                    ])
                ]),
                
                // Statut de la signature
                tache.project?.pdf_devis_signe ? React.createElement('div', {
                    key: 'signed-status',
                    className: "flex flex-col items-center space-y-4 p-6 bg-green-50 border border-green-200 rounded-lg"
                }, [
                    React.createElement('div', {
                        key: 'success-icon',
                        className: "w-16 h-16 bg-green-100 rounded-full flex items-center justify-center"
                    }, [
                        React.createElement('i', {
                            key: 'check-icon',
                            'data-lucide': 'check',
                            className: "w-8 h-8 text-green-600"
                        })
                    ]),
                    React.createElement('h5', {
                        key: 'success-title',
                        className: "text-lg font-medium text-green-900"
                    }, "Document signé avec succès !"),
                    React.createElement('p', {
                        key: 'success-description',
                        className: "text-green-700 text-center"
                    }, "Le devis a été validé et signé électroniquement. Vous pouvez télécharger le document signé."),
                    React.createElement('button', {
                        key: 'download-signed',
                        onClick: () => handleDownloadSignedDevis(tache),
                        className: "inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    }, [
                        React.createElement('i', {
                            key: 'download-icon',
                            'data-lucide': 'download',
                            className: "w-5 h-5"
                        }),
                        "Télécharger le devis signé"
                    ])
                ]) : React.createElement('div', {
                    key: 'signature-controls',
                    className: "flex flex-col items-center space-y-4"
                }, [
                    // Instructions selon l'étape
                    signatureStep === 'position' && React.createElement('div', {
                        key: 'position-instructions',
                        className: "text-center p-4 bg-blue-50 border border-blue-200 rounded-lg"
                    }, [
                        React.createElement('h6', {
                            key: 'instruction-title',
                            className: "font-medium text-blue-900 mb-2"
                        }, "Étape 1 : Positionnement de la signature"),
                        React.createElement('p', {
                            key: 'instruction-text',
                            className: "text-blue-700"
                        }, "Cliquez sur le document PDF à l'endroit où vous souhaitez placer votre signature électronique.")
                    ]),
                    
                    signatureStep === 'capture' && React.createElement('div', {
                        key: 'capture-instructions',
                        className: "text-center p-4 bg-orange-50 border border-orange-200 rounded-lg"
                    }, [
                        React.createElement('h6', {
                            key: 'instruction-title',
                            className: "font-medium text-orange-900 mb-2"
                        }, "Étape 2 : Signature"),
                        React.createElement('p', {
                            key: 'instruction-text',
                            className: "text-orange-700"
                        }, "Dessinez votre signature dans le pavé de signature ci-dessous.")
                    ]),
                    
                    signatureStep === 'preview' && React.createElement('div', {
                        key: 'preview-instructions',
                        className: "text-center p-4 bg-green-50 border border-green-200 rounded-lg"
                    }, [
                        React.createElement('h6', {
                            key: 'instruction-title',
                            className: "font-medium text-green-900 mb-2"
                        }, "Étape 3 : Validation"),
                        React.createElement('p', {
                            key: 'instruction-text',
                            className: "text-green-700"
                        }, "Votre signature apparaît sur le document. Validez pour finaliser la signature électronique.")
                    ]),
                    
                    // Boutons d'action selon l'étape
                    signatureStep === 'position' && React.createElement('div', {
                        key: 'position-help',
                        className: "text-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                    }, [
                        React.createElement('p', {
                            key: 'help-text',
                            className: "text-yellow-800 text-sm"
                        }, "👆 Cliquez directement sur le document PDF ci-dessus pour placer votre signature")
                    ]),
                    
                    signatureStep === 'preview' && React.createElement('div', {
                        key: 'preview-actions',
                        className: "flex gap-4"
                    }, [
                        React.createElement('button', {
                            key: 'cancel-signature',
                            onClick: cancelSigning,
                            className: "px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                        }, "Recommencer"),
                        React.createElement('button', {
                            key: 'finalize-signature',
                            onClick: () => finalizeSignature(tache, onNavigateToProject, setTache),
                            disabled: signing,
                            className: `px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium ${signing ? 'opacity-50 cursor-not-allowed' : ''}`
                        }, [
                            signing && React.createElement('i', {
                                key: 'loading-icon',
                                'data-lucide': 'loader-2',
                                className: "w-4 h-4 animate-spin mr-2"
                            }),
                            signing ? "Finalisation..." : "Valider la signature"
                        ])
                    ])
                ])
            ])
        ]),
        
        // Pavé de signature modal
        React.createElement(window.SignaturePad, {
            key: 'signature-pad-modal',
            isOpen: showSignaturePad,
            onClose: () => {
                cancelSigning();
                // Si l'utilisateur annule la capture, retourner à l'étape position
                if (signatureStep === 'capture') {
                    setSignatureStep('position');
                    setSignaturePosition(null);
                }
            },
            onSign: handleSignatureCaptured,
            signing: false // Le signing est géré dans finalizeSignature
        })
    ]);
}

// Export global
window.ValidationDevisTaskSection = ValidationDevisTaskSection;