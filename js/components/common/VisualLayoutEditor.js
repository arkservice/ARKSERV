// Fonction helper pour générer du contenu simulé selon le type de section
function renderSectionContent(section, scale) {
    const fontSize = Math.max(8, 10 * scale);
    const smallFontSize = Math.max(6, 7 * scale);

    const baseStyle = {
        pointerEvents: 'none',
        fontSize: `${fontSize}px`,
        color: '#6b7280',
        lineHeight: '1.4'
    };

    // Contenu selon le type de section (ID)
    switch (section.id) {
        case 'header':
            return React.createElement('div', {
                style: { ...baseStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', height: '100%', position: 'relative' }
            }, [
                React.createElement('div', { key: 'logo', style: { width: '30%', height: '80%', backgroundColor: '#dbeafe', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: `${fontSize * 1.2}px`, fontWeight: 'bold', color: '#3b82f6' } }, 'LOGO'),
                React.createElement('div', { key: 'company', style: { fontSize: `${fontSize * 1.5}px`, fontWeight: 'bold', color: '#133e5e' } }, 'ARKANCE'),
                React.createElement('div', { key: 'overlay-text', style: { position: 'absolute', left: '5px', top: '50%', transform: 'translateY(-50%)', fontSize: `${fontSize}px`, fontWeight: 'bold', color: '#133e5e', maxWidth: '80%', display: 'flex', flexDirection: 'column', gap: `${2 * scale}px` } }, [
                    React.createElement('div', { key: 'line1' }, 'EVALUATION DES ACQUIS ET ATTEINTE DES'),
                    React.createElement('div', { key: 'line2' }, 'OBJECTIFS PAR LE STAGIAIRE')
                ])
            ]);

        case 'title':
            return React.createElement('div', {
                style: { ...baseStyle, display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }
            }, [
                React.createElement('div', { key: 'main', style: { fontSize: `${fontSize * 1.8}px`, fontWeight: 'bold', color: '#133e5e', marginBottom: `${4 * scale}px` } }, 'TITRE DU DOCUMENT'),
                React.createElement('div', { key: 'sub', style: { fontSize: `${fontSize * 1.2}px`, color: '#6b7280' } }, 'Sous-titre ou numéro')
            ]);

        case 'stagiaire':
            return React.createElement('div', {
                style: { ...baseStyle, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: `${4 * scale}px`, height: '100%' }
            }, [
                React.createElement('div', { key: 'nom' }, [
                    React.createElement('span', { key: 'label', style: { fontWeight: 'normal' } }, 'Nom du stagiaire : '),
                    React.createElement('span', { key: 'value', style: { fontWeight: 'bold' } }, 'Dupont')
                ]),
                React.createElement('div', { key: 'societe' }, [
                    React.createElement('span', { key: 'label', style: { fontWeight: 'normal' } }, 'Société : '),
                    React.createElement('span', { key: 'value', style: { fontWeight: 'bold' } }, 'Arkance')
                ]),
                React.createElement('div', { key: 'prenom' }, [
                    React.createElement('span', { key: 'label', style: { fontWeight: 'normal' } }, 'Prénom : '),
                    React.createElement('span', { key: 'value', style: { fontWeight: 'bold' } }, 'Jean')
                ]),
                React.createElement('div', { key: 'email' }, [
                    React.createElement('span', { key: 'label', style: { fontWeight: 'normal' } }, 'Email : '),
                    React.createElement('span', { key: 'value', style: { fontWeight: 'bold' } }, 'jean.dupont@example.com')
                ])
            ]);

        case 'parties':
            return React.createElement('div', {
                style: { ...baseStyle, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: `${8 * scale}px`, height: '100%' }
            }, [
                React.createElement('div', { key: 'left', style: { borderRight: '1px solid #d1d5db', paddingRight: `${4 * scale}px` } }, [
                    React.createElement('div', { key: 'title', style: { fontWeight: 'bold', marginBottom: `${2 * scale}px` } }, 'D\'une part :'),
                    React.createElement('div', { key: 'name' }, 'ARKANCE'),
                    React.createElement('div', { key: 'addr' }, '2 Rue René Caudron')
                ]),
                React.createElement('div', { key: 'right' }, [
                    React.createElement('div', { key: 'title', style: { fontWeight: 'bold', marginBottom: `${2 * scale}px` } }, 'D\'autre part :'),
                    React.createElement('div', { key: 'name' }, 'SOCIÉTÉ CLIENT'),
                    React.createElement('div', { key: 'addr' }, 'Adresse du client')
                ])
            ]);

        case 'table':
            const rows = 5;
            return React.createElement('div', {
                style: { ...baseStyle, width: '100%', height: '100%', overflow: 'hidden' }
            }, [
                React.createElement('div', { key: 'header', style: { fontSize: `${fontSize * 1.1}px`, fontWeight: 'bold', marginBottom: `${4 * scale}px`, color: '#133e5e' } }, 'PRJ - PDC'),
                React.createElement('table', {
                    key: 'table',
                    style: { width: '100%', borderCollapse: 'collapse', fontSize: `${smallFontSize}px` }
                }, [
                    React.createElement('thead', { key: 'thead' },
                        React.createElement('tr', { style: { backgroundColor: '#e5e7eb' } }, [
                            React.createElement('th', { key: 'col1', style: { border: '1px solid #d1d5db', padding: `${2 * scale}px`, textAlign: 'left', fontSize: `${smallFontSize}px` } }, 'COMPÉTENCES'),
                            React.createElement('th', { key: 'col2', style: { border: '1px solid #d1d5db', padding: `${2 * scale}px`, fontSize: `${smallFontSize}px` } }, 'Auto-éval. entrée'),
                            React.createElement('th', { key: 'col3', style: { border: '1px solid #d1d5db', padding: `${2 * scale}px`, fontSize: `${smallFontSize}px` } }, 'Auto-éval. sortie'),
                            React.createElement('th', { key: 'col4', style: { border: '1px solid #d1d5db', padding: `${2 * scale}px`, fontSize: `${smallFontSize}px` } }, 'Éval. form.')
                        ])
                    ),
                    React.createElement('tbody', { key: 'tbody' },
                        Array.from({ length: Math.min(rows, 8) }).map((_, i) =>
                            React.createElement('tr', { key: i }, [
                                React.createElement('td', { key: 'col1', style: { border: '1px solid #d1d5db', padding: `${2 * scale}px` } }, `${i + 1} – Compétence ${i + 1}`),
                                React.createElement('td', { key: 'col2', style: { border: '1px solid #d1d5db', padding: `${2 * scale}px`, textAlign: 'center', color: '#ec4899', fontWeight: 'bold' } }, Math.floor(Math.random() * 3 + 1)),
                                React.createElement('td', { key: 'col3', style: { border: '1px solid #d1d5db', padding: `${2 * scale}px`, textAlign: 'center', color: '#3b82f6', fontWeight: 'bold' } }, Math.floor(Math.random() * 2 + 4)),
                                React.createElement('td', { key: 'col4', style: { border: '1px solid #d1d5db', padding: `${2 * scale}px`, textAlign: 'center', color: '#22c55e', fontWeight: 'bold' } }, Math.floor(Math.random() * 2 + 4))
                            ])
                        )
                    )
                ])
            ]);

        case 'radar':
            return React.createElement('div', {
                style: { ...baseStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: `${4 * scale}px` }
            }, [
                React.createElement('div', { key: 'legend', style: { display: 'flex', gap: `${8 * scale}px`, fontSize: `${smallFontSize * 0.75}px` } }, [
                    React.createElement('div', { key: 'leg1', style: { display: 'flex', alignItems: 'center', gap: `${2 * scale}px` } }, [
                        React.createElement('div', { key: 'dot1', style: { width: `${4.5 * scale}px`, height: `${4.5 * scale}px`, borderRadius: '50%', backgroundColor: '#ec4899' } }),
                        React.createElement('span', { key: 'text1' }, 'Entrée')
                    ]),
                    React.createElement('div', { key: 'leg2', style: { display: 'flex', alignItems: 'center', gap: `${2 * scale}px` } }, [
                        React.createElement('div', { key: 'dot2', style: { width: `${4.5 * scale}px`, height: `${4.5 * scale}px`, borderRadius: '50%', backgroundColor: '#3b82f6' } }),
                        React.createElement('span', { key: 'text2' }, 'Sortie')
                    ]),
                    React.createElement('div', { key: 'leg3', style: { display: 'flex', alignItems: 'center', gap: `${2 * scale}px` } }, [
                        React.createElement('div', { key: 'dot3', style: { width: `${4.5 * scale}px`, height: `${4.5 * scale}px`, borderRadius: '50%', backgroundColor: '#22c55e' } }),
                        React.createElement('span', { key: 'text3' }, 'Formateur')
                    ])
                ]),
                React.createElement('svg', {
                    key: 'radar',
                    width: `${Math.min(section.height * scale * 0.8, 120)}`,
                    height: `${Math.min(section.height * scale * 0.8, 120)}`,
                    viewBox: '0 0 100 100',
                    style: { overflow: 'visible' }
                }, [
                    // Grille radar - Cercles concentriques (plus foncés et épais)
                    React.createElement('circle', { key: 'c1', cx: 50, cy: 50, r: 40, fill: 'none', stroke: '#6b7280', strokeWidth: 1.5 }),
                    React.createElement('circle', { key: 'c2', cx: 50, cy: 50, r: 30, fill: 'none', stroke: '#6b7280', strokeWidth: 1.5 }),
                    React.createElement('circle', { key: 'c3', cx: 50, cy: 50, r: 20, fill: 'none', stroke: '#6b7280', strokeWidth: 1.5 }),
                    React.createElement('circle', { key: 'c4', cx: 50, cy: 50, r: 10, fill: 'none', stroke: '#6b7280', strokeWidth: 1.5 }),
                    // Lignes radar (plus foncées et épaisses)
                    React.createElement('line', { key: 'l1', x1: 50, y1: 50, x2: 50, y2: 10, stroke: '#6b7280', strokeWidth: 1.5 }),
                    React.createElement('line', { key: 'l2', x1: 50, y1: 50, x2: 85, y2: 30, stroke: '#6b7280', strokeWidth: 1.5 }),
                    React.createElement('line', { key: 'l3', x1: 50, y1: 50, x2: 85, y2: 70, stroke: '#6b7280', strokeWidth: 1.5 }),
                    React.createElement('line', { key: 'l4', x1: 50, y1: 50, x2: 50, y2: 90, stroke: '#6b7280', strokeWidth: 1.5 }),
                    React.createElement('line', { key: 'l5', x1: 50, y1: 50, x2: 15, y2: 70, stroke: '#6b7280', strokeWidth: 1.5 }),
                    React.createElement('line', { key: 'l6', x1: 50, y1: 50, x2: 15, y2: 30, stroke: '#6b7280', strokeWidth: 1.5 }),
                    // Données simulées
                    React.createElement('polygon', { key: 'poly', points: '50,20 70,35 75,65 50,75 25,65 30,35', fill: '#3b82f6', fillOpacity: 0.3, stroke: '#3b82f6', strokeWidth: 1.5 })
                ])
            ]);

        case 'resultats':
        case 'analyse_resultats':
            return React.createElement('div', {
                style: { ...baseStyle, height: '100%' }
            }, [
                React.createElement('div', { key: 'title', style: { fontSize: `${fontSize * 1.2}px`, fontWeight: 'bold', color: '#133e5e', marginBottom: `${4 * scale}px` } }, 'Analyse des résultats'),
                React.createElement('div', { key: 'note', style: { fontSize: `${smallFontSize}px`, fontStyle: 'italic', marginBottom: `${4 * scale}px`, color: '#9ca3af' } }, 'Arkance établit, à partir de ces notes d\'autoévaluation, une moyenne de progression...'),
                React.createElement('div', {
                    key: 'box',
                    style: { backgroundColor: '#f3f4f6', padding: `${4 * scale}px`, borderRadius: '4px', fontSize: `${smallFontSize}px` }
                }, [
                    React.createElement('div', { key: 'prog' }, '• Moyenne progression : 1.8'),
                    React.createElement('div', { key: 'form' }, '• Moyenne formateur : 4.2'),
                    React.createElement('div', { key: 'obj', style: { color: '#22c55e', fontWeight: 'bold' } }, '• Objectifs : ATTEINTS')
                ])
            ]);

        case 'articles':
            return React.createElement('div', {
                style: { ...baseStyle, height: '100%', overflow: 'hidden' }
            }, [
                React.createElement('div', { key: 'title', style: { fontSize: `${fontSize * 1.1}px`, fontWeight: 'bold', marginBottom: `${4 * scale}px` } }, 'IL A ÉTÉ CONVENU ET ARRÊTÉ CE QUI SUIT :'),
                Array.from({ length: 7 }).map((_, i) =>
                    React.createElement('div', { key: i, style: { marginBottom: `${3 * scale}px`, fontSize: `${smallFontSize}px` } }, [
                        React.createElement('span', { key: 'num', style: { fontWeight: 'bold' } }, `Article ${i + 1} : `),
                        React.createElement('span', { key: 'text' }, 'Contenu de l\'article...')
                    ])
                )
            ]);

        case 'tarifs':
            return React.createElement('div', {
                style: { ...baseStyle, height: '100%' }
            }, [
                React.createElement('div', { key: 'title', style: { fontSize: `${fontSize * 1.1}px`, fontWeight: 'bold', marginBottom: `${4 * scale}px` } }, 'COÛT DE LA FORMATION :'),
                React.createElement('div', { key: 'ht', style: { marginBottom: `${2 * scale}px` } }, 'Formation : 1 500,00 €'),
                React.createElement('div', { key: 'tva', style: { marginBottom: `${2 * scale}px` } }, 'TVA 20% : 300,00 €'),
                React.createElement('div', { key: 'ttc', style: { fontWeight: 'bold', fontSize: `${fontSize * 1.1}px` } }, 'TOTAL TTC : 1 800,00 €'),
                React.createElement('div', {
                    key: 'sig',
                    style: { marginTop: `${8 * scale}px`, display: 'grid', gridTemplateColumns: '1fr 1fr', fontSize: `${smallFontSize}px`, gap: `${8 * scale}px` }
                }, [
                    React.createElement('div', { key: 'left' }, [
                        React.createElement('div', { key: 'title' }, 'LE CENTRE DE FORMATION'),
                        React.createElement('div', { key: 'sub', style: { fontSize: `${smallFontSize * 0.9}px`, color: '#9ca3af' } }, '(Signature et cachet)')
                    ]),
                    React.createElement('div', { key: 'right' }, [
                        React.createElement('div', { key: 'title' }, 'L\'ENTREPRISE'),
                        React.createElement('div', { key: 'sub', style: { fontSize: `${smallFontSize * 0.9}px`, color: '#9ca3af' } }, '(Signature et cachet)')
                    ])
                ])
            ]);

        case 'footer':
            return React.createElement('div', {
                style: { ...baseStyle, fontSize: `${smallFontSize}px`, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', gap: `${2 * scale}px` }
            }, [
                React.createElement('div', { key: 'addr' }, 'LE VAL SAINT QUENTIN - 2, rue René Caudron - 78961 Voisins-le-Bretonneux'),
                React.createElement('div', { key: 'contact' }, 'www.arkance-systems.fr - formation@arkance-systems.com - Tél. : 01 39 44 18 18'),
                React.createElement('div', { key: 'legal', style: { fontSize: `${smallFontSize * 0.9}px`, color: '#9ca3af' } }, 'S.A.S. au capital de 1 300 000 € - N° de déclaration : 11 78 02137 8')
            ]);

        case 'content':
            // Pour émargement - grille de signatures
            return React.createElement('div', {
                style: { ...baseStyle, height: '100%', display: 'flex', flexDirection: 'column' }
            }, [
                React.createElement('div', { key: 'title', style: { fontSize: `${fontSize * 1.1}px`, fontWeight: 'bold', marginBottom: `${4 * scale}px` } }, 'FEUILLE D\'ÉMARGEMENT'),
                React.createElement('div', { key: 'info', style: { marginBottom: `${4 * scale}px`, fontSize: `${smallFontSize}px` } }, 'Société : ___ | Programme : ___ | Durée : ___'),
                React.createElement('table', {
                    key: 'grid',
                    style: { width: '100%', borderCollapse: 'collapse', fontSize: `${smallFontSize}px`, flex: 1 }
                }, [
                    React.createElement('thead', { key: 'thead' },
                        React.createElement('tr', {}, [
                            React.createElement('th', { key: 'h1', style: { border: '1px solid #d1d5db', padding: `${2 * scale}px`, backgroundColor: '#f9fafb' } }, 'Stagiaire'),
                            React.createElement('th', { key: 'h2', style: { border: '1px solid #d1d5db', padding: `${2 * scale}px`, backgroundColor: '#f9fafb' } }, 'Matin'),
                            React.createElement('th', { key: 'h3', style: { border: '1px solid #d1d5db', padding: `${2 * scale}px`, backgroundColor: '#f9fafb' } }, 'Après-midi')
                        ])
                    ),
                    React.createElement('tbody', { key: 'tbody' },
                        Array.from({ length: 3 }).map((_, i) =>
                            React.createElement('tr', { key: i }, [
                                React.createElement('td', { key: 'name', style: { border: '1px solid #d1d5db', padding: `${2 * scale}px` } }, `Stagiaire ${i + 1}`),
                                React.createElement('td', { key: 'am', style: { border: '1px solid #d1d5db', padding: `${2 * scale}px` } }),
                                React.createElement('td', { key: 'pm', style: { border: '1px solid #d1d5db', padding: `${2 * scale}px` } })
                            ])
                        )
                    )
                ])
            ]);

        default:
            // Placeholder générique pour les sections non reconnues
            return React.createElement('div', {
                style: { ...baseStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.5 }
            }, section.id);
    }
}

// Composant d'édition visuelle WYSIWYG pour la mise en page des templates PDF
function VisualLayoutEditor({ sections, selectedSectionId, onSectionsChange, onSectionSelect }) {
    const { useState, useEffect, useRef } = React;

    const [isResizing, setIsResizing] = useState(false);
    const [resizingSectionId, setResizingSectionId] = useState(null);
    const [resizeStartY, setResizeStartY] = useState(0);
    const [resizeStartHeight, setResizeStartHeight] = useState(0);
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);

    // Calculer l'échelle pour afficher la page A4 (297mm de hauteur)
    const containerRef = useRef(null);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const updateScale = () => {
            if (containerRef.current) {
                const containerHeight = containerRef.current.clientHeight;
                // Laisser 40px de marge en haut et bas
                const availableHeight = containerHeight - 80;
                // Échelle pour que 297mm = availableHeight
                setScale(availableHeight / 297);
            }
        };

        updateScale();
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }, []);

    // Handler pour démarrer le resize
    const handleResizeStart = (e, sectionId, currentHeight) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        setResizingSectionId(sectionId);
        setResizeStartY(e.clientY);
        setResizeStartHeight(currentHeight);
    };

    // Handler pour le resize en cours
    useEffect(() => {
        if (!isResizing) return;

        const handleMouseMove = (e) => {
            const deltaY = e.clientY - resizeStartY;
            const deltaMm = deltaY / scale; // Convertir pixels → mm
            const newHeight = Math.max(10, resizeStartHeight + deltaMm); // Min 10mm

            // Mettre à jour la section
            const updatedSections = sections.map(section =>
                section.id === resizingSectionId
                    ? { ...section, height: Math.round(newHeight) }
                    : section
            );
            onSectionsChange(updatedSections);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            setResizingSectionId(null);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, resizingSectionId, resizeStartY, resizeStartHeight, scale, sections]);

    // Drag & drop handlers
    const handleDragStart = (e, index) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        setDragOverIndex(index);
    };

    const handleDrop = (e, index) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const updatedSections = [...sections];
        const draggedSection = updatedSections[draggedIndex];
        updatedSections.splice(draggedIndex, 1);
        updatedSections.splice(index, 0, draggedSection);

        onSectionsChange(updatedSections);
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    // Calculer la hauteur totale
    const totalHeight = sections.reduce((sum, section) =>
        sum + section.height + section.gapTop + section.gapBottom, 0
    );

    return React.createElement('div', {
        ref: containerRef,
        className: 'w-full h-full bg-gray-100 overflow-auto p-8 flex justify-center',
        style: { cursor: isResizing ? 'ns-resize' : 'default' }
    },
        // Conteneur de la page A4
        React.createElement('div', {
            className: 'bg-white shadow-2xl relative',
            style: {
                width: `${210 * scale}px`,
                minHeight: `${297 * scale}px`,
                position: 'relative'
            }
        }, [
            // Afficher chaque section
            ...sections.map((section, index) => {
                const isSelected = section.id === selectedSectionId;
                const isDragging = draggedIndex === index;
                const isDragOver = dragOverIndex === index;

                // Calculer la position Y de la section
                let currentY = 0;
                for (let i = 0; i < index; i++) {
                    currentY += (sections[i].gapTop + sections[i].height + sections[i].gapBottom) * scale;
                }
                currentY += section.gapTop * scale;

                return React.createElement('div', {
                    key: section.id,
                    draggable: true,
                    onDragStart: (e) => handleDragStart(e, index),
                    onDragOver: (e) => handleDragOver(e, index),
                    onDrop: (e) => handleDrop(e, index),
                    onDragEnd: handleDragEnd,
                    onClick: (e) => {
                        e.stopPropagation();
                        onSectionSelect(section.id);
                    },
                    className: `absolute cursor-move transition-all ${isDragging ? 'opacity-50' : ''} ${isDragOver ? 'border-t-4 border-blue-500' : ''}`,
                    style: {
                        top: `${currentY}px`,
                        left: `${section.paddingLeft * scale}px`,
                        right: `${section.paddingRight * scale}px`,
                        width: `${(section.width - section.paddingLeft - section.paddingRight) * scale}px`,
                        height: `${section.height * scale}px`,
                        backgroundColor: section.backgroundColor,
                        border: `${isSelected ? 3 : 1}px ${isSelected ? 'solid' : 'dashed'} ${isSelected ? '#ef4444' : '#93c5fd'}`,
                        boxSizing: 'border-box',
                        paddingTop: `${section.paddingTop * scale}px`,
                        paddingRight: `${section.paddingRight * scale}px`,
                        paddingBottom: `${section.paddingBottom * scale}px`,
                        paddingLeft: `${section.paddingLeft * scale}px`
                    }
                }, [
                    // Label de la section
                    React.createElement('div', {
                        key: 'label',
                        className: 'absolute top-1 left-1 px-2 py-1 text-xs font-bold rounded',
                        style: {
                            backgroundColor: isSelected ? '#ef4444' : '#3b82f6',
                            color: 'white',
                            pointerEvents: 'none',
                            zIndex: 10
                        }
                    }, `${section.name} (${section.height}mm)`),

                    // Bordure intérieure pointillée pour visualiser la zone de contenu (après paddings)
                    (section.paddingTop > 0 || section.paddingRight > 0 || section.paddingBottom > 0 || section.paddingLeft > 0) && React.createElement('div', {
                        key: 'padding-box',
                        className: 'absolute',
                        style: {
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            border: '2px dashed rgba(59, 130, 246, 0.3)',
                            margin: `${section.paddingTop * scale}px ${section.paddingRight * scale}px ${section.paddingBottom * scale}px ${section.paddingLeft * scale}px`,
                            pointerEvents: 'none',
                            zIndex: 1
                        }
                    }),

                    // Indicateurs de padding (valeurs)
                    section.paddingTop > 0 && React.createElement('div', {
                        key: 'padding-top',
                        className: 'absolute left-1/2 transform -translate-x-1/2',
                        style: {
                            top: `${(section.paddingTop * scale) / 2 - 6}px`,
                            fontSize: '9px',
                            color: '#3b82f6',
                            fontWeight: '600',
                            pointerEvents: 'none',
                            zIndex: 10,
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            padding: '1px 4px',
                            borderRadius: '2px'
                        }
                    }, `↓ ${section.paddingTop}mm`),

                    section.paddingBottom > 0 && React.createElement('div', {
                        key: 'padding-bottom',
                        className: 'absolute left-1/2 transform -translate-x-1/2',
                        style: {
                            bottom: `${(section.paddingBottom * scale) / 2 - 6}px`,
                            fontSize: '9px',
                            color: '#3b82f6',
                            fontWeight: '600',
                            pointerEvents: 'none',
                            zIndex: 10,
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            padding: '1px 4px',
                            borderRadius: '2px'
                        }
                    }, `↑ ${section.paddingBottom}mm`),

                    section.paddingLeft > 0 && React.createElement('div', {
                        key: 'padding-left',
                        className: 'absolute top-1/2 transform -translate-y-1/2',
                        style: {
                            left: `${(section.paddingLeft * scale) / 2 - 8}px`,
                            fontSize: '9px',
                            color: '#3b82f6',
                            fontWeight: '600',
                            pointerEvents: 'none',
                            zIndex: 10,
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            padding: '1px 4px',
                            borderRadius: '2px',
                            writingMode: 'vertical-rl',
                            textOrientation: 'mixed'
                        }
                    }, `→ ${section.paddingLeft}`),

                    section.paddingRight > 0 && React.createElement('div', {
                        key: 'padding-right',
                        className: 'absolute top-1/2 transform -translate-y-1/2',
                        style: {
                            right: `${(section.paddingRight * scale) / 2 - 8}px`,
                            fontSize: '9px',
                            color: '#3b82f6',
                            fontWeight: '600',
                            pointerEvents: 'none',
                            zIndex: 10,
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            padding: '1px 4px',
                            borderRadius: '2px',
                            writingMode: 'vertical-rl',
                            textOrientation: 'mixed'
                        }
                    }, `← ${section.paddingRight}`),

                    // Contenu simulé
                    React.createElement('div', {
                        key: 'content',
                        className: 'w-full h-full',
                        style: {
                            pointerEvents: 'none',
                            position: 'relative',
                            zIndex: 2,
                            overflow: 'hidden'
                        }
                    }, renderSectionContent(section, scale)),

                    // Poignée de resize
                    React.createElement('div', {
                        key: 'resize-handle',
                        className: 'absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-blue-500 transition-colors',
                        style: {
                            backgroundColor: isResizing && resizingSectionId === section.id ? '#3b82f6' : 'transparent'
                        },
                        onMouseDown: (e) => handleResizeStart(e, section.id, section.height),
                        title: 'Glisser pour redimensionner'
                    }),

                    // Affichage du gap bas
                    section.gapBottom > 0 && React.createElement('div', {
                        key: 'gap-indicator',
                        className: 'absolute left-1/2 transform -translate-x-1/2 text-xs text-blue-600 font-semibold',
                        style: {
                            top: `${section.height * scale + 2}px`,
                            pointerEvents: 'none'
                        }
                    }, `↕ Gap: ${section.gapBottom}mm`)
                ]);
            }),

            // Indicateur de hauteur totale
            React.createElement('div', {
                key: 'total-height',
                className: 'absolute top-2 right-2 px-3 py-1 bg-gray-800 text-white text-xs rounded shadow-lg'
            }, `Total: ${totalHeight}mm / 297mm ${totalHeight > 297 ? '⚠️' : '✓'}`)
        ])
    );
}

// Export global
window.VisualLayoutEditor = VisualLayoutEditor;
