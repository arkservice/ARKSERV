// Composant SignaturePad pour la signature électronique avec 3 modes
function SignaturePad({ isOpen, onClose, onSign, signing = false }) {
    const { useState, useEffect, useRef } = React;
    
    // États communs
    const [signatureMode, setSignatureMode] = useState('draw'); // 'draw', 'upload', 'text'
    const [hasSignature, setHasSignature] = useState(false);
    const [signatureData, setSignatureData] = useState(null);
    
    // États pour le mode dessin
    const canvasRef = useRef(null);
    const previewCanvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [strokeColor, setStrokeColor] = useState('#000000');
    const [strokeWidth, setStrokeWidth] = useState(2);
    const [drawingHistory, setDrawingHistory] = useState([]);
    const [historyStep, setHistoryStep] = useState(-1);
    
    // Variables pour trait dynamique
    const lastPointRef = useRef(null);
    const lastTimeRef = useRef(null);
    const velocityHistoryRef = useRef([]);
    
    // États pour le mode upload
    const fileInputRef = useRef(null);
    const uploadPreviewRef = useRef(null);
    const [uploadedImage, setUploadedImage] = useState(null);
    const [uploadError, setUploadError] = useState(null);
    
    // États pour le mode texte
    const textCanvasRef = useRef(null);
    const [userName, setUserName] = useState('');
    
    // Initialisation des icônes Lucide
    useEffect(() => {
        if (isOpen && window.lucide) {
            setTimeout(() => window.lucide.createIcons(), 100);
        }
    }, [isOpen, signatureMode]);
    
    // Réinitialisation lors de l'ouverture
    useEffect(() => {
        if (isOpen) {
            setHasSignature(false);
            setSignatureData(null);
            setUploadedImage(null);
            setUploadError(null);
            setUserName('');
            setDrawingHistory([]);
            setHistoryStep(-1);
        }
    }, [isOpen]);
    
    // ===== MODE DESSIN =====
    
    useEffect(() => {
        if (isOpen && signatureMode === 'draw' && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            
            canvas.width = 400;
            canvas.height = 213; // Ratio 1.875:1 pour correspondre à la zone PDF (15% x 8%)
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = strokeWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }, [isOpen, signatureMode]);
    
    const updateDrawPreview = () => {
        if (!canvasRef.current || !previewCanvasRef.current) return;
        
        const canvas = canvasRef.current;
        const previewCanvas = previewCanvasRef.current;
        const previewCtx = previewCanvas.getContext('2d');
        
        previewCanvas.width = 100;
        previewCanvas.height = 50;
        
        previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        previewCtx.fillStyle = '#ffffff';
        previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
        previewCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, previewCanvas.width, previewCanvas.height);
    };
    
    const saveCanvasState = () => {
        if (!canvasRef.current) return;
        
        const canvas = canvasRef.current;
        const imageData = canvas.toDataURL();
        
        const newHistory = drawingHistory.slice(0, historyStep + 1);
        newHistory.push(imageData);
        
        setDrawingHistory(newHistory);
        setHistoryStep(newHistory.length - 1);
    };
    
    // Fonction pour calculer la vélocité et ajuster l'épaisseur du trait
    const calculateDynamicWidth = (currentPoint, timestamp) => {
        const baseWidth = strokeWidth;
        
        if (!lastPointRef.current || !lastTimeRef.current) {
            lastPointRef.current = currentPoint;
            lastTimeRef.current = timestamp;
            return baseWidth;
        }
        
        // Calculer la distance et le temps écoulé
        const distance = Math.sqrt(
            Math.pow(currentPoint.x - lastPointRef.current.x, 2) + 
            Math.pow(currentPoint.y - lastPointRef.current.y, 2)
        );
        const deltaTime = Math.max(timestamp - lastTimeRef.current, 1);
        
        // Calculer la vélocité (pixels par milliseconde)
        const velocity = distance / deltaTime;
        
        // Ajouter à l'historique des vélocités (garder les 5 dernières)
        velocityHistoryRef.current.push(velocity);
        if (velocityHistoryRef.current.length > 5) {
            velocityHistoryRef.current.shift();
        }
        
        // Calculer la vélocité moyenne lissée
        const avgVelocity = velocityHistoryRef.current.reduce((sum, v) => sum + v, 0) / velocityHistoryRef.current.length;
        
        // Facteur de variation : rapide = fin, lent = épais
        // Normaliser la vélocité (0.1-2.0 pixels/ms typique pour signature)
        const normalizedVelocity = Math.min(Math.max(avgVelocity, 0.05), 2.0);
        
        // Formule : plus c'est rapide, plus c'est fin (effet manuscrit naturel)
        const velocityFactor = Math.max(0.4, Math.min(1.6, 1.2 - (normalizedVelocity - 0.1) * 0.8));
        
        const dynamicWidth = baseWidth * velocityFactor;
        
        // Mettre à jour les références
        lastPointRef.current = currentPoint;
        lastTimeRef.current = timestamp;
        
        return Math.max(0.5, Math.min(dynamicWidth, baseWidth * 2));
    };
    
    const startDrawing = (e) => {
        if (!canvasRef.current) return;
        
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext('2d');
        
        saveCanvasState();
        
        setIsDrawing(true);
        setHasSignature(true);
        
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Réinitialiser les références pour le trait dynamique
        lastPointRef.current = { x, y };
        lastTimeRef.current = Date.now();
        velocityHistoryRef.current = [];
        
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(x, y);
    };
    
    const draw = (e) => {
        if (!isDrawing || !canvasRef.current) return;
        
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext('2d');
        
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const currentPoint = { x, y };
        const timestamp = Date.now();
        
        // Calculer l'épaisseur dynamique
        const dynamicWidth = calculateDynamicWidth(currentPoint, timestamp);
        
        // Dessiner un segment avec l'épaisseur dynamique
        ctx.lineWidth = dynamicWidth;
        ctx.lineTo(x, y);
        ctx.stroke();
        
        // Commencer un nouveau segment pour la prochaine épaisseur
        ctx.beginPath();
        ctx.moveTo(x, y);
        
        updateDrawPreview();
    };
    
    const stopDrawing = () => {
        setIsDrawing(false);
        if (hasSignature) {
            updateDrawPreview();
            setSignatureData(canvasRef.current.toDataURL('image/png'));
        }
    };
    
    const clearDrawing = () => {
        if (!canvasRef.current) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
        setSignatureData(null);
        setDrawingHistory([]);
        setHistoryStep(-1);
        
        updateDrawPreview();
    };
    
    const undo = () => {
        if (historyStep <= 0) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const newStep = historyStep - 1;
        
        if (newStep === -1) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            setHasSignature(false);
            setSignatureData(null);
            updateDrawPreview();
        } else {
            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                setSignatureData(canvas.toDataURL('image/png'));
                updateDrawPreview();
            };
            img.src = drawingHistory[newStep];
        }
        
        setHistoryStep(newStep);
    };
    
    const redo = () => {
        if (historyStep >= drawingHistory.length - 1) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const newStep = historyStep + 1;
        
        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            setHasSignature(true);
            setSignatureData(canvas.toDataURL('image/png'));
            updateDrawPreview();
        };
        img.src = drawingHistory[newStep];
        
        setHistoryStep(newStep);
    };
    
    // ===== MODE UPLOAD =====
    
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Validation du fichier
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
        if (!validTypes.includes(file.type)) {
            setUploadError('Format non supporté. Utilisez PNG, JPG ou SVG.');
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) { // 5MB max
            setUploadError('Fichier trop volumineux. Maximum 5MB.');
            return;
        }
        
        setUploadError(null);
        
        const reader = new FileReader();
        reader.onload = (event) => {
            setUploadedImage(event.target.result);
            setSignatureData(event.target.result);
            setHasSignature(true);
        };
        reader.readAsDataURL(file);
    };
    
    const clearUpload = () => {
        setUploadedImage(null);
        setSignatureData(null);
        setHasSignature(false);
        setUploadError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    
    // ===== MODE TEXTE =====
    
    useEffect(() => {
        if (signatureMode === 'text' && userName.trim()) {
            generateTextSignature();
        } else if (signatureMode === 'text') {
            setHasSignature(false);
            setSignatureData(null);
        }
    }, [userName, signatureMode]);
    
    const generateTextSignature = () => {
        if (!textCanvasRef.current || !userName.trim()) return;
        
        const canvas = textCanvasRef.current;
        const ctx = canvas.getContext('2d');
        
        canvas.width = 400;
        canvas.height = 213; // Ratio 1.875:1 pour harmonie avec zone PDF
        
        // Fond blanc
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Configuration de la police Dancing Script
        ctx.font = '48px Dancing Script, cursive';
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Dessiner le nom
        ctx.fillText(userName, canvas.width / 2, canvas.height / 2);
        
        const dataURL = canvas.toDataURL('image/png');
        setSignatureData(dataURL);
        setHasSignature(true);
    };
    
    const clearText = () => {
        setUserName('');
        setSignatureData(null);
        setHasSignature(false);
    };
    
    // ===== SAUVEGARDE COMMUNE =====
    
    const saveSignature = () => {
        if (!hasSignature || !signatureData) {
            alert('Veuillez créer une signature avant de valider');
            return;
        }
        
        console.log('✅ Signature validée:', signatureMode);
        onSign(signatureData);
    };
    
    // ===== RENDU =====
    
    if (!isOpen) return null;
    
    return React.createElement('div', {
        className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50",
        onClick: (e) => {
            if (e.target === e.currentTarget) {
                onClose();
            }
        }
    }, [
        React.createElement('div', {
            key: 'modal-content',
            className: "bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
        }, [
            // Header
            React.createElement('div', {
                key: 'header',
                className: "flex items-center justify-between mb-6"
            }, [
                React.createElement('h3', {
                    key: 'title',
                    className: "text-xl font-semibold text-gray-900"
                }, "Signature électronique"),
                React.createElement('button', {
                    key: 'close-btn',
                    onClick: onClose,
                    className: "p-2 hover:bg-gray-100 rounded-lg transition-colors"
                }, [
                    React.createElement('i', {
                        key: 'close-icon',
                        'data-lucide': 'x',
                        className: "w-5 h-5 text-gray-500"
                    })
                ])
            ]),
            
            // Navigation par onglets
            React.createElement('div', {
                key: 'tabs',
                className: "flex border-b border-gray-200 mb-6"
            }, [
                React.createElement('button', {
                    key: 'tab-draw',
                    onClick: () => setSignatureMode('draw'),
                    className: `px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                        signatureMode === 'draw' 
                            ? 'border-blue-500 text-blue-600' 
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`
                }, [
                    React.createElement('i', {
                        key: 'draw-icon',
                        'data-lucide': 'pen-tool',
                        className: "w-4 h-4 mr-2 inline"
                    }),
                    "Dessiner"
                ]),
                React.createElement('button', {
                    key: 'tab-upload',
                    onClick: () => setSignatureMode('upload'),
                    className: `px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                        signatureMode === 'upload' 
                            ? 'border-blue-500 text-blue-600' 
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`
                }, [
                    React.createElement('i', {
                        key: 'upload-icon',
                        'data-lucide': 'upload',
                        className: "w-4 h-4 mr-2 inline"
                    }),
                    "Importer"
                ]),
                React.createElement('button', {
                    key: 'tab-text',
                    onClick: () => setSignatureMode('text'),
                    className: `px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                        signatureMode === 'text' 
                            ? 'border-blue-500 text-blue-600' 
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`
                }, [
                    React.createElement('i', {
                        key: 'text-icon',
                        'data-lucide': 'type',
                        className: "w-4 h-4 mr-2 inline"
                    }),
                    "Texte"
                ])
            ]),
            
            // Contenu selon le mode
            signatureMode === 'draw' && React.createElement('div', {
                key: 'draw-content'
            }, [
                // Instructions
                React.createElement('div', {
                    key: 'draw-instructions',
                    className: "mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg"
                }, [
                    React.createElement('p', {
                        key: 'instruction-text',
                        className: "text-sm text-blue-800"
                    }, "Dessinez votre signature avec votre souris ou votre doigt sur mobile.")
                ]),
                
                // Contrôles simplifiés (seulement Undo/Redo)
                React.createElement('div', {
                    key: 'draw-controls',
                    className: "mb-4 flex justify-center"
                }, [
                    // Boutons undo/redo
                    React.createElement('div', {
                        key: 'history-controls',
                        className: "flex items-center gap-2"
                    }, [
                        React.createElement('button', {
                            key: 'undo-btn',
                            onClick: undo,
                            disabled: historyStep <= 0,
                            className: "p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all",
                            title: "Annuler (Ctrl+Z)"
                        }, [
                            React.createElement('i', {
                                key: 'undo-icon',
                                'data-lucide': 'undo-2',
                                className: "w-4 h-4"
                            })
                        ]),
                        React.createElement('button', {
                            key: 'redo-btn',
                            onClick: redo,
                            disabled: historyStep >= drawingHistory.length - 1,
                            className: "p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all",
                            title: "Refaire (Ctrl+Y)"
                        }, [
                            React.createElement('i', {
                                key: 'redo-icon',
                                'data-lucide': 'redo-2',
                                className: "w-4 h-4"
                            })
                        ])
                    ])
                ]),
                
                // Aperçu miniature
                hasSignature && React.createElement('div', {
                    key: 'draw-preview',
                    className: "mb-4 flex items-center gap-3"
                }, [
                    React.createElement('span', {
                        key: 'preview-label',
                        className: "text-sm text-gray-700 font-medium"
                    }, "Aperçu :"),
                    React.createElement('div', {
                        key: 'preview-wrapper',
                        className: "border border-gray-300 rounded-md p-1 bg-white"
                    }, [
                        React.createElement('canvas', {
                            key: 'preview-canvas',
                            ref: previewCanvasRef,
                            className: "block",
                            style: { width: '100px', height: '50px' }
                        })
                    ])
                ]),
                
                // Canvas de dessin
                React.createElement('div', {
                    key: 'canvas-container',
                    className: "border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4 bg-gray-50"
                }, [
                    React.createElement('canvas', {
                        key: 'canvas',
                        ref: canvasRef,
                        className: "border border-gray-300 rounded bg-white cursor-crosshair mx-auto block",
                        style: { maxWidth: '100%', height: 'auto' },
                        onMouseDown: startDrawing,
                        onMouseMove: draw,
                        onMouseUp: stopDrawing,
                        onMouseLeave: stopDrawing
                    })
                ]),
                
                // Bouton effacer
                React.createElement('div', {
                    key: 'draw-clear',
                    className: "mb-4"
                }, [
                    React.createElement('button', {
                        key: 'clear-btn',
                        onClick: clearDrawing,
                        className: "px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    }, "Effacer tout")
                ])
            ]),
            
            // Mode Upload
            signatureMode === 'upload' && React.createElement('div', {
                key: 'upload-content'
            }, [
                // Instructions
                React.createElement('div', {
                    key: 'upload-instructions',
                    className: "mb-4 p-3 bg-green-50 border border-green-200 rounded-lg"
                }, [
                    React.createElement('p', {
                        key: 'instruction-text',
                        className: "text-sm text-green-800"
                    }, "Importez une image de votre signature (PNG, JPG, SVG - max 5MB).")
                ]),
                
                // Zone d'upload
                !uploadedImage && React.createElement('div', {
                    key: 'upload-zone',
                    className: "border-2 border-dashed border-gray-300 rounded-lg p-8 mb-4 text-center bg-gray-50 hover:bg-gray-100 transition-colors"
                }, [
                    React.createElement('i', {
                        key: 'upload-icon',
                        'data-lucide': 'upload-cloud',
                        className: "w-12 h-12 text-gray-400 mx-auto mb-4"
                    }),
                    React.createElement('p', {
                        key: 'upload-text',
                        className: "text-gray-600 mb-4"
                    }, "Glissez-déposez votre fichier ici ou cliquez pour parcourir"),
                    React.createElement('input', {
                        key: 'file-input',
                        ref: fileInputRef,
                        type: 'file',
                        accept: 'image/png,image/jpeg,image/jpg,image/svg+xml',
                        onChange: handleFileSelect,
                        className: "hidden"
                    }),
                    React.createElement('button', {
                        key: 'browse-btn',
                        onClick: () => fileInputRef.current?.click(),
                        className: "px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    }, "Parcourir les fichiers")
                ]),
                
                // Aperçu de l'image uploadée
                uploadedImage && React.createElement('div', {
                    key: 'upload-preview',
                    className: "mb-4"
                }, [
                    React.createElement('div', {
                        key: 'preview-container',
                        className: "border border-gray-300 rounded-lg p-4 bg-white"
                    }, [
                        React.createElement('img', {
                            key: 'preview-img',
                            src: uploadedImage,
                            alt: "Signature importée",
                            className: "max-w-full max-h-48 mx-auto block",
                            style: { objectFit: 'contain' }
                        })
                    ]),
                    React.createElement('div', {
                        key: 'upload-actions',
                        className: "mt-3 text-center"
                    }, [
                        React.createElement('button', {
                            key: 'clear-upload',
                            onClick: clearUpload,
                            className: "px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        }, "Changer d'image")
                    ])
                ]),
                
                // Erreur d'upload
                uploadError && React.createElement('div', {
                    key: 'upload-error',
                    className: "mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
                }, [
                    React.createElement('p', {
                        key: 'error-text',
                        className: "text-sm text-red-800"
                    }, uploadError)
                ])
            ]),
            
            // Mode Texte
            signatureMode === 'text' && React.createElement('div', {
                key: 'text-content'
            }, [
                // Instructions
                React.createElement('div', {
                    key: 'text-instructions',
                    className: "mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg"
                }, [
                    React.createElement('p', {
                        key: 'instruction-text',
                        className: "text-sm text-purple-800"
                    }, "Saisissez votre nom pour générer une signature stylisée.")
                ]),
                
                // Champ nom
                React.createElement('div', {
                    key: 'name-input',
                    className: "mb-4"
                }, [
                    React.createElement('label', {
                        key: 'name-label',
                        className: "block text-sm font-medium text-gray-700 mb-2"
                    }, "Votre nom :"),
                    React.createElement('input', {
                        key: 'name-field',
                        type: 'text',
                        value: userName,
                        onChange: (e) => setUserName(e.target.value),
                        placeholder: "Entrez votre nom complet",
                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    })
                ]),
                
                
                // Aperçu de la signature textuelle
                userName.trim() && React.createElement('div', {
                    key: 'text-preview',
                    className: "mb-4"
                }, [
                    React.createElement('label', {
                        key: 'preview-label',
                        className: "block text-sm font-medium text-gray-700 mb-2"
                    }, "Aperçu :"),
                    React.createElement('div', {
                        key: 'preview-container',
                        className: "border border-gray-300 rounded-lg p-4 bg-white text-center"
                    }, [
                        React.createElement('canvas', {
                            key: 'text-canvas',
                            ref: textCanvasRef,
                            className: "mx-auto",
                            style: { maxWidth: '100%', height: 'auto' }
                        })
                    ]),
                    React.createElement('div', {
                        key: 'text-actions',
                        className: "mt-3 text-center"
                    }, [
                        React.createElement('button', {
                            key: 'clear-text',
                            onClick: clearText,
                            className: "px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        }, "Effacer")
                    ])
                ])
            ]),
            
            // Boutons d'action communs
            React.createElement('div', {
                key: 'actions',
                className: "flex gap-3 pt-4 border-t border-gray-200"
            }, [
                React.createElement('button', {
                    key: 'cancel-btn',
                    onClick: onClose,
                    disabled: signing,
                    className: "px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                }, "Annuler"),
                React.createElement('button', {
                    key: 'sign-btn',
                    onClick: saveSignature,
                    disabled: !hasSignature || signing,
                    className: `px-6 py-2 ${
                        !hasSignature || signing 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-emerald-600 hover:bg-emerald-700'
                    } text-white rounded-lg transition-colors font-medium disabled:opacity-50`
                }, [
                    signing && React.createElement('i', {
                        key: 'loading-icon',
                        'data-lucide': 'loader-2',
                        className: "w-4 h-4 animate-spin mr-2 inline"
                    }),
                    signing ? "Signature en cours..." : "Valider signature"
                ])
            ])
        ])
    ]);
}

// Export global
window.SignaturePad = SignaturePad;