// Composant PDFViewer avec signature intégrée
function PDFViewer({ pdfUrl, onSignaturePositioned, signatures = [], readOnly = false, hideNavigation = false, startSigningProcess = null }) {
    const { useState, useEffect, useRef, useCallback } = React;
    
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [pdfDoc, setPdfDoc] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [numPages, setNumPages] = useState(0);
    const [scale, setScale] = useState(0.8);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [placingSignature, setPlacingSignature] = useState(false);
    const [isRendering, setIsRendering] = useState(false);
    const [canvasImageData, setCanvasImageData] = useState(null);
    
    // Position fixe du bouton de signature
    const signButtonPosition = { x: 0.7, y: 0.8, width: 0.15, height: 0.08 };
    
    // Le bouton est visible si le PDF n'est pas en lecture seule et qu'il n'y a pas encore de signatures
    const shouldShowSignButton = !readOnly && signatures.length === 0;
    
    useEffect(() => {
        if (pdfUrl && window.pdfjsLib) {
            loadPDF();
        }
    }, [pdfUrl]);
    
    useEffect(() => {
        if (pdfDoc && !isRendering) {
            renderPage();
        }
    }, [pdfDoc, currentPage, scale]); // Signatures retirées des dépendances pour éviter les boucles
    
    // useEffect séparé pour les signatures pour éviter les boucles infinies
    useEffect(() => {
        if (pdfDoc && signatures && signatures.length > 0) {
            // Délai minimal pour éviter les conflits de rendu
            setTimeout(() => {
                drawSignatures();
            }, 10);
        }
    }, [signatures]);
    
    // useEffect pour dessiner le bouton de signature
    useEffect(() => {
        console.log('🔄 [PDFViewer] useEffect bouton déclenché:', { shouldShowSignButton, hasCanvas: !!canvasRef.current, readOnly, signaturesCount: signatures.length });
        if (shouldShowSignButton && canvasRef.current && pdfDoc) {
            // Attendre que le PDF soit rendu avant de dessiner le bouton
            setTimeout(() => {
                console.log('🎨 [PDFViewer] Appel drawSignButton...');
                drawSignButton();
            }, 100);
        }
    }, [shouldShowSignButton, pdfDoc, currentPage]);
    
    const loadPDF = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Configuration de PDF.js
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            
            // Chargement du PDF
            const loadingTask = window.pdfjsLib.getDocument(pdfUrl);
            const pdf = await loadingTask.promise;
            
            setPdfDoc(pdf);
            setNumPages(pdf.numPages);
            setCurrentPage(1);
            
            console.log('✅ PDF chargé avec succès:', pdfUrl);
            
        } catch (err) {
            console.error('Erreur lors du chargement du PDF:', err);
            setError('Impossible de charger le document PDF');
        } finally {
            setLoading(false);
        }
    };
    
    const renderPage = async () => {
        if (!pdfDoc || !canvasRef.current || isRendering) return;
        
        try {
            // Verrouiller le rendu pour éviter les conflits
            setIsRendering(true);
            
            const page = await pdfDoc.getPage(currentPage);
            
            // Double vérification du canvas avant utilisation
            if (!canvasRef.current) {
                console.warn('Canvas non disponible après getPage, abandon du rendu');
                return;
            }
            
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            
            // Vérification que le contexte est valide
            if (!context) {
                console.warn('Contexte canvas non disponible, abandon du rendu');
                return;
            }
            
            // Calculer le scale optimal pour que la page entière soit visible
            const originalViewport = page.getViewport({ scale: 1 });
            const pageWidth = originalViewport.width;
            const pageHeight = originalViewport.height;
            
            // Dimensions A4 standard pour affichage à 100%
            // Format A4 : 210 × 297mm = 595 × 841px à 72 DPI
            const availableWidth = 595;
            const availableHeight = 841;
            
            // Calculer le scale optimal pour que tout le contenu soit visible
            const scaleX = availableWidth / pageWidth;
            const scaleY = availableHeight / pageHeight;
            let optimalScale = Math.min(scaleX, scaleY);
            
            // Forcer le scale à 1.0 (100%) pour les PDF en mode lecture seule
            if (readOnly) {
                optimalScale = 1.0;
            }
            
            console.log(`📏 Page ${currentPage}: ${pageWidth}x${pageHeight} -> Scale optimal: ${optimalScale.toFixed(3)}`);
            
            const viewport = page.getViewport({ scale: optimalScale });
            
            // Vérification finale avant modification du canvas
            if (!canvasRef.current) {
                console.warn('Canvas perdu pendant viewport, abandon du rendu');
                return;
            }
            
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            
            // Rendu du PDF avec gestion des erreurs spécifiques
            await page.render(renderContext).promise;
            
            // Vérification finale avant dessin des signatures
            if (!canvasRef.current) {
                console.warn('Canvas perdu après rendu PDF, signatures non dessinées');
                return;
            }
            
            // Dessiner les signatures après le rendu de la page
            drawSignatures();
            
            // Sauvegarder l'état du canvas après rendu
            if (context && canvas.width && canvas.height) {
                setCanvasImageData(context.getImageData(0, 0, canvas.width, canvas.height));
                
                // Dessiner le bouton "Signer" si nécessaire
                if (shouldShowSignButton) {
                    setTimeout(() => {
                        console.log('🎨 [PDFViewer] Dessin bouton après rendu page');
                        drawSignButton();
                    }, 50);
                }
            }
            
            // Dessiner la prévisualisation de signature si active
            if (placingSignature && showSignaturePreview) {
                drawSignaturePreview();
            }
            
        } catch (err) {
            console.error('Erreur lors du rendu de la page:', err);
            setError('Erreur lors de l\'affichage de la page');
        } finally {
            // Libérer le verrou de rendu
            setIsRendering(false);
        }
    };
    
    const drawSignatures = () => {
        if (!canvasRef.current || !signatures.length || isRendering) return;
        
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        // Vérifier que le canvas est prêt
        if (!canvas.width || !canvas.height) {
            console.warn('Canvas non initialisé, report du rendu des signatures');
            return;
        }
        
        // Compteur pour optimiser le rendu
        let signaturesRendered = 0;
        const totalSignatures = signatures.filter(sig => sig.page === currentPage).length;
        
        if (totalSignatures === 0) return;
        
        signatures.forEach((signature, index) => {
            if (signature.page === currentPage) {
                const img = new Image();
                img.onload = () => {
                    // Vérifier que le canvas est toujours disponible
                    if (!canvasRef.current || isRendering) return;
                    
                    // Convertir les coordonnées relatives en coordonnées canvas
                    const x = signature.x * canvas.width;
                    const y = signature.y * canvas.height;
                    const width = signature.width * canvas.width;
                    const height = signature.height * canvas.height;
                    
                    // Sauvegarder l'état du contexte pour éviter les conflits
                    context.save();
                    
                    try {
                        // Dessiner la signature avec une légère ombre pour améliorer la visibilité
                        context.shadowColor = 'rgba(0, 0, 0, 0.1)';
                        context.shadowBlur = 2;
                        context.shadowOffsetX = 1;
                        context.shadowOffsetY = 1;
                        context.drawImage(img, x, y, width, height);
                        
                        // Réinitialiser l'ombre
                        context.shadowColor = 'transparent';
                        context.shadowBlur = 0;
                        context.shadowOffsetX = 0;
                        context.shadowOffsetY = 0;
                        
                        // Ajouter une bordure légère pour indiquer la signature
                        context.strokeStyle = 'rgba(34, 197, 94, 0.8)'; // Vert emerald
                        context.lineWidth = 2;
                        context.setLineDash([5, 5]); // Bordure en pointillés
                        context.strokeRect(x - 2, y - 2, width + 4, height + 4);
                        context.setLineDash([]); // Reset dash
                        
                        // Ajouter un petit badge "Signé" avec une meilleure visibilité
                        const badgeX = x + width - 40;
                        const badgeY = y - 15;
                        
                        // Badge background avec bordure
                        context.fillStyle = 'rgba(34, 197, 94, 0.95)';
                        context.fillRect(badgeX, badgeY, 35, 12);
                        context.strokeStyle = 'rgba(34, 197, 94, 1)';
                        context.lineWidth = 1;
                        context.strokeRect(badgeX, badgeY, 35, 12);
                        
                        // Badge text
                        context.fillStyle = 'white';
                        context.font = 'bold 8px Arial';
                        context.textAlign = 'center';
                        context.fillText('Signé', badgeX + 17.5, badgeY + 8);
                        
                        signaturesRendered++;
                        console.log(`✅ Signature ${index + 1} rendue sur page ${currentPage} (${signaturesRendered}/${totalSignatures})`);
                        
                        // Notification finale quand toutes les signatures sont rendues
                        if (signaturesRendered === totalSignatures) {
                            console.log(`🎨 Toutes les signatures (${totalSignatures}) affichées sur la page ${currentPage}`);
                        }
                    } catch (drawError) {
                        console.error('Erreur lors du dessin de la signature:', drawError);
                    } finally {
                        // Restaurer l'état du contexte
                        context.restore();
                    }
                };
                img.onerror = () => {
                    console.error('Erreur lors du chargement de l\'image de signature');
                };
                img.src = signature.imageData;
            }
        });
    };
    
    const handleCanvasClick = (event) => {
        if (readOnly) return;
        
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        
        // Calculer les coordonnées relatives (0-1)
        const clickX = (event.clientX - rect.left) / canvas.width;
        const clickY = (event.clientY - rect.top) / canvas.height;
        
        console.log('🔍 [PDFViewer] Canvas click:', { clickX: clickX.toFixed(3), clickY: clickY.toFixed(3), shouldShowSignButton });
        
        // Vérifier si on clique sur le bouton "Signer"
        if (shouldShowSignButton && isClickInSignButton(clickX, clickY)) {
            console.log('✨ [PDFViewer] Clic sur bouton Signer détecté');
            handleSignButtonClick();
            return;
        }
        
        console.log('📍 [PDFViewer] Clic en dehors du bouton');
    };
    
    // Fonction simplifiée pour gérer le survol (optionnel)
    const handleMouseMove = useCallback((event) => {
        // Plus besoin de logique complexe de drag/resize
        // Garde juste pour compatibilité si nécessaire
    }, []);
    
    const handleMouseEnter = () => {
        if (placingSignature) {
            setShowSignaturePreview(true);
        }
    };
    
    const handleMouseLeave = () => {
        // Plus besoin de gérer la prévisualisation complexe
    };
    
    // Vérifier si le clic est dans la zone du bouton "Signer"
    const isClickInSignButton = (clickX, clickY) => {
        return clickX >= signButtonPosition.x && 
               clickX <= signButtonPosition.x + signButtonPosition.width &&
               clickY >= signButtonPosition.y && 
               clickY <= signButtonPosition.y + signButtonPosition.height;
    };
    
    // Détecter le type de document depuis l'URL
    const detectDocumentType = () => {
        if (!pdfUrl) return null;
        if (pdfUrl.includes('convocation')) return 'convocation';
        if (pdfUrl.includes('convention')) return 'convention';
        return null;
    };
    
    // Gérer le clic sur le bouton "Signer"
    const handleSignButtonClick = () => {
        console.log('✨ [PDFViewer] Clic sur bouton Signer - démarrage processus complet');
        
        const documentType = detectDocumentType();
        console.log('📋 [PDFViewer] Type de document détecté:', documentType);
        
        // Démarrer le processus de signature si on a la fonction
        if (startSigningProcess && documentType) {
            console.log('🚀 [PDFViewer] Démarrage du processus de signature pour:', documentType);
            startSigningProcess(documentType);
        } else {
            console.warn('⚠️ [PDFViewer] startSigningProcess non disponible ou type document non détecté:', { 
                hasFunction: !!startSigningProcess, 
                documentType,
                pdfUrl 
            });
        }
        
        // Notifier le composant parent avec la position fixe
        if (onSignaturePositioned) {
            onSignaturePositioned({
                page: currentPage,
                x: signButtonPosition.x,
                y: signButtonPosition.y,
                width: signButtonPosition.width,
                height: signButtonPosition.height
            });
        }
    };
    
    // Dessiner le bouton "Signer" fixe
    const drawSignButton = () => {
        const canvas = canvasRef.current;
        if (!canvas) {
            console.error('❌ [PDFViewer] Canvas non disponible pour dessiner le bouton');
            return;
        }
        
        const context = canvas.getContext('2d');
        if (!context) {
            console.error('❌ [PDFViewer] Contexte canvas non disponible');
            return;
        }
        
        console.log('🎨 [PDFViewer] Début dessin bouton...', {
            canvasSize: { width: canvas.width, height: canvas.height },
            buttonPosition: signButtonPosition
        });
        
        // Sauvegarder l'état du canvas si pas déjà fait
        if (!canvasImageData && canvas.width > 0 && canvas.height > 0) {
            try {
                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                setCanvasImageData(imageData);
                console.log('💾 [PDFViewer] Canvas sauvegardé');
            } catch (error) {
                console.warn('⚠️ [PDFViewer] Impossible de sauvegarder le canvas:', error);
            }
        }
        
        // Calculer les positions en pixels
        const buttonX = signButtonPosition.x * canvas.width;
        const buttonY = signButtonPosition.y * canvas.height;
        const buttonWidth = signButtonPosition.width * canvas.width;
        const buttonHeight = signButtonPosition.height * canvas.height;
        
        console.log('📏 [PDFViewer] Positions calculées:', {
            buttonX: buttonX.toFixed(1),
            buttonY: buttonY.toFixed(1),
            buttonWidth: buttonWidth.toFixed(1),
            buttonHeight: buttonHeight.toFixed(1)
        });
        
        context.save();
        
        try {
            // Dessiner le fond transparent du bouton
            context.fillStyle = 'rgba(16, 185, 129, 0.1)'; // Fond très léger
            context.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
            
            // Dessiner la bordure verte bien visible
            context.strokeStyle = '#10B981';
            context.lineWidth = 3;
            context.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
            
            // Dessiner le texte "Signer" avec contour pour meilleure visibilité
            const centerX = buttonX + buttonWidth / 2;
            const centerY = buttonY + buttonHeight / 2;
            
            context.font = 'bold 16px Arial';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            
            // Contour blanc pour le texte
            context.strokeStyle = '#FFFFFF';
            context.lineWidth = 3;
            context.strokeText('Signer', centerX, centerY);
            
            // Texte vert par-dessus
            context.fillStyle = '#10B981';
            context.fillText('Signer', centerX, centerY);
            
            console.log('✨ [PDFViewer] Bouton "Signer" dessiné avec succès');
            
        } catch (error) {
            console.error('❌ [PDFViewer] Erreur lors du dessin du bouton:', error);
        } finally {
            context.restore();
        }
    };
    
    // Le bouton est maintenant permanent, pas besoin de fonction d'annulation
    
    
    
    const goToPreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };
    
    const goToNextPage = () => {
        if (currentPage < numPages) {
            setCurrentPage(currentPage + 1);
        }
    };
    
    const zoomIn = () => {
        setScale(Math.min(scale * 1.2, 3));
    };
    
    const zoomOut = () => {
        setScale(Math.max(scale / 1.2, 0.5));
    };
    
    if (loading) {
        return React.createElement('div', {
            className: "flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300"
        }, [
            React.createElement('div', {
                key: 'loading',
                className: "text-center"
            }, [
                React.createElement('i', {
                    key: 'icon',
                    'data-lucide': 'loader-2',
                    className: "w-8 h-8 animate-spin text-gray-400 mx-auto mb-2"
                }),
                React.createElement('p', {
                    key: 'text',
                    className: "text-gray-600"
                }, "Chargement du PDF...")
            ])
        ]);
    }
    
    if (error) {
        return React.createElement('div', {
            className: "flex items-center justify-center h-96 bg-red-50 rounded-lg border-2 border-red-200"
        }, [
            React.createElement('div', {
                key: 'error',
                className: "text-center"
            }, [
                React.createElement('i', {
                    key: 'icon',
                    'data-lucide': 'alert-triangle',
                    className: "w-8 h-8 text-red-500 mx-auto mb-2"
                }),
                React.createElement('p', {
                    key: 'text',
                    className: "text-red-600"
                }, error)
            ])
        ]);
    }
    
    return React.createElement('div', {
        key: 'pdf-viewer',
        ref: containerRef,
        className: "w-full h-full"
    }, [
        // Contrôles du visualiseur (masqués si hideNavigation = true)
        !hideNavigation && React.createElement('div', {
            key: 'controls',
            className: "flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg"
        }, [
            React.createElement('div', {
                key: 'page-controls',
                className: "flex items-center gap-2"
            }, [
                React.createElement('button', {
                    key: 'prev-btn',
                    onClick: goToPreviousPage,
                    disabled: currentPage <= 1,
                    className: "p-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                }, [
                    React.createElement('svg', {
                        key: 'prev-icon',
                        width: "16",
                        height: "16",
                        viewBox: "0 0 24 24",
                        fill: "none",
                        stroke: "currentColor",
                        strokeWidth: "2",
                        className: "w-4 h-4"
                    }, [
                        React.createElement('polyline', {
                            key: 'chevron-left-path',
                            points: "15,18 9,12 15,6"
                        })
                    ])
                ]),
                React.createElement('span', {
                    key: 'page-info',
                    className: "px-3 py-1 bg-white rounded border text-sm"
                }, `${currentPage} / ${numPages}`),
                React.createElement('button', {
                    key: 'next-btn',
                    onClick: goToNextPage,
                    disabled: currentPage >= numPages,
                    className: "p-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                }, [
                    React.createElement('svg', {
                        key: 'next-icon',
                        width: "16",
                        height: "16",
                        viewBox: "0 0 24 24",
                        fill: "none",
                        stroke: "currentColor",
                        strokeWidth: "2",
                        className: "w-4 h-4"
                    }, [
                        React.createElement('polyline', {
                            key: 'chevron-right-path',
                            points: "9,18 15,12 9,6"
                        })
                    ])
                ])
            ]),
            // Plus besoin du bouton "Placer signature" - le bouton est toujours visible sur le PDF
            shouldShowSignButton && React.createElement('div', {
                key: 'sign-status',
                className: "px-3 py-1 bg-emerald-100 text-emerald-700 rounded text-sm font-medium"
            }, [
                React.createElement('i', {
                    key: 'pen-icon',
                    'data-lucide': 'pen-tool',
                    className: "w-4 h-4 mr-1 inline"
                }),
                "Prêt pour signature"
            ])
        ]),
        
        // Canvas pour le PDF
        React.createElement('div', {
            key: 'canvas-container',
            className: `overflow-hidden flex-1 flex items-center justify-center ${
                placingSignature ? 'cursor-crosshair' : 'cursor-default'
            }`
        }, [
            React.createElement('canvas', {
                key: 'pdf-canvas',
                ref: canvasRef,
                onMouseDown: handleCanvasClick,
                className: "block mx-auto cursor-pointer"
            })
        ]),
        
        // Instructions pour la signature (simplifiées)
        shouldShowSignButton && React.createElement('div', {
            key: 'sign-button-info',
            className: "mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg"
        }, [
            React.createElement('div', {
                key: 'info-text',
                className: "flex items-center text-sm text-emerald-700"
            }, [
                React.createElement('i', {
                    key: 'info-icon',
                    'data-lucide': 'info',
                    className: "w-4 h-4 mr-2"
                }),
                "Cliquez sur le bouton \"Signer\" vert dans le document pour ouvrir la signature."
            ])
        ]),
        
        // Plus besoin d'indication de placement
        false && React.createElement('div', {
            key: 'signature-hint',
            className: "mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg"
        }, [
            React.createElement('div', {
                key: 'hint',
                className: "flex items-center"
            }, [
                React.createElement('i', {
                    key: 'info-icon',
                    'data-lucide': 'info',
                    className: "w-5 h-5 text-emerald-600 mr-2"
                }),
                React.createElement('span', {
                    key: 'hint-text',
                    className: "text-emerald-800 text-sm"
                }, "Cliquez à l'endroit où vous souhaitez placer votre signature sur le document")
            ])
        ])
    ]);
}

// Export global
window.PDFViewer = PDFViewer;