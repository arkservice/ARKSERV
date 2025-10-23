// Composant de console d'édition de mise en page pour les templates PDF
function TemplateLayoutEditor({ documentType, sections, onSectionsChange, selectedSectionId, onSectionSelect }) {
    const { useState, useEffect, useRef } = React;
    const { saveSectionsByType } = window.useTemplates();

    const [localSections, setLocalSections] = useState(sections || []);
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [expandedSectionId, setExpandedSectionId] = useState(null);
    const [saveStatus, setSaveStatus] = useState(''); // 'saving', 'saved', 'error'

    // Synchroniser les sections locales avec les props
    useEffect(() => {
        setLocalSections(sections || []);
    }, [sections]);

    // Auto-save avec debounce
    const saveTimeoutRef = useRef(null);
    const autoSave = async (updatedSections) => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        setSaveStatus('saving');

        saveTimeoutRef.current = setTimeout(async () => {
            try {
                await saveSectionsByType(documentType, updatedSections);
                setSaveStatus('saved');
                setTimeout(() => setSaveStatus(''), 2000);
            } catch (error) {
                console.error('Erreur sauvegarde sections:', error);
                setSaveStatus('error');
            }
        }, 1000);
    };

    // Mettre à jour une section
    const updateSection = (index, field, value) => {
        const updated = [...localSections];
        updated[index] = { ...updated[index], [field]: value };
        setLocalSections(updated);
        onSectionsChange(updated);
        autoSave(updated);
    };

    // Ajouter une nouvelle section
    const addSection = () => {
        const newSection = {
            id: `section_${Date.now()}`,
            name: 'Nouvelle section',
            height: 50,
            width: 210,
            gapTop: 0,
            gapBottom: 0,
            paddingTop: 10,
            paddingRight: 10,
            paddingBottom: 10,
            paddingLeft: 10,
            backgroundColor: '#FFFFFF',
            alignment: 'left'
        };
        const updated = [...localSections, newSection];
        setLocalSections(updated);
        onSectionsChange(updated);
        autoSave(updated);
    };

    // Supprimer une section
    const deleteSection = (index) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette section ?')) {
            const updated = localSections.filter((_, i) => i !== index);
            setLocalSections(updated);
            onSectionsChange(updated);
            autoSave(updated);
        }
    };

    // Drag and drop handlers
    const handleDragStart = (e, index) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const updated = [...localSections];
        const draggedItem = updated[draggedIndex];
        updated.splice(draggedIndex, 1);
        updated.splice(index, 0, draggedItem);

        setLocalSections(updated);
        setDraggedIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        onSectionsChange(localSections);
        autoSave(localSections);
    };

    // Calculer la hauteur totale
    const totalHeight = localSections.reduce((sum, section) =>
        sum + section.height + section.gapTop + section.gapBottom, 0
    );

    // Toggle expansion d'une section
    const toggleExpand = (sectionId) => {
        setExpandedSectionId(expandedSectionId === sectionId ? null : sectionId);
    };

    return React.createElement('div', {
        className: 'h-full flex flex-col bg-gray-50 border-r border-gray-200'
    }, [
        // Header
        React.createElement('div', {
            key: 'header',
            className: 'p-4 bg-white border-b border-gray-200'
        }, [
            React.createElement('div', {
                key: 'title',
                className: 'flex items-center justify-between mb-2'
            }, [
                React.createElement('h3', {
                    key: 'heading',
                    className: 'text-lg font-semibold text-gray-800'
                }, 'Mise en page'),
                saveStatus && React.createElement('span', {
                    key: 'status',
                    className: `text-xs ${
                        saveStatus === 'saved' ? 'text-green-600' :
                        saveStatus === 'saving' ? 'text-blue-600' :
                        'text-red-600'
                    }`
                }, saveStatus === 'saved' ? '✓ Sauvegardé' :
                   saveStatus === 'saving' ? 'Sauvegarde...' :
                   '✗ Erreur')
            ]),
            React.createElement('div', {
                key: 'info',
                className: 'text-sm text-gray-600'
            }, `Hauteur totale: ${totalHeight} mm / 297 mm`)
        ]),

        // Liste des sections (scrollable)
        React.createElement('div', {
            key: 'sections',
            className: 'flex-1 overflow-y-auto p-4 space-y-2'
        }, localSections.map((section, index) => {
            const isExpanded = expandedSectionId === section.id;
            const isSelected = selectedSectionId === section.id;

            return React.createElement('div', {
                key: section.id,
                draggable: true,
                onDragStart: (e) => handleDragStart(e, index),
                onDragOver: (e) => handleDragOver(e, index),
                onDragEnd: handleDragEnd,
                className: `bg-white rounded-lg border-2 ${
                    isSelected ? 'border-red-500' : 'border-gray-200'
                } ${draggedIndex === index ? 'opacity-50' : ''} cursor-move transition-all`
            }, [
                // Section header (toujours visible)
                React.createElement('div', {
                    key: 'section-header',
                    className: 'p-3',
                    onClick: () => onSectionSelect(section.id)
                }, [
                    React.createElement('div', {
                        key: 'row1',
                        className: 'flex items-center justify-between mb-2'
                    }, [
                        React.createElement('input', {
                            key: 'name',
                            type: 'text',
                            value: section.name,
                            onChange: (e) => {
                                e.stopPropagation();
                                updateSection(index, 'name', e.target.value);
                            },
                            onClick: (e) => e.stopPropagation(),
                            className: 'text-sm font-medium text-gray-800 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-400 rounded px-1',
                            placeholder: 'Nom de la section'
                        }),
                        React.createElement('div', {
                            key: 'actions',
                            className: 'flex items-center gap-1'
                        }, [
                            React.createElement('button', {
                                key: 'expand',
                                onClick: (e) => {
                                    e.stopPropagation();
                                    toggleExpand(section.id);
                                },
                                className: 'text-gray-500 hover:text-gray-700 p-1',
                                title: isExpanded ? 'Réduire' : 'Développer'
                            }, isExpanded ? '▼' : '▶'),
                            React.createElement('button', {
                                key: 'delete',
                                onClick: (e) => {
                                    e.stopPropagation();
                                    deleteSection(index);
                                },
                                className: 'text-red-500 hover:text-red-700 p-1',
                                title: 'Supprimer'
                            }, '×')
                        ])
                    ]),
                    React.createElement('div', {
                        key: 'row2',
                        className: 'flex items-center gap-2 text-xs text-gray-600'
                    }, [
                        React.createElement('span', { key: 'height' }, `H: ${section.height}mm`),
                        (section.gapTop > 0 || section.gapBottom > 0) && React.createElement('span', {
                            key: 'gaps',
                            className: 'text-blue-600'
                        }, `Gap: ${section.gapTop}↑ ${section.gapBottom}↓`)
                    ])
                ]),

                // Section détails (expandable)
                isExpanded && React.createElement('div', {
                    key: 'section-details',
                    className: 'px-3 pb-3 space-y-3 border-t border-gray-100'
                }, [
                    // Dimensions
                    React.createElement('div', {
                        key: 'dimensions',
                        className: 'grid grid-cols-2 gap-2'
                    }, [
                        React.createElement('div', { key: 'height-group' }, [
                            React.createElement('label', {
                                key: 'label',
                                className: 'block text-xs text-gray-600 mb-1'
                            }, 'Hauteur (mm)'),
                            React.createElement('input', {
                                key: 'input',
                                type: 'number',
                                value: section.height,
                                onChange: (e) => updateSection(index, 'height', parseFloat(e.target.value) || 0),
                                className: 'w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-400',
                                min: 0,
                                step: 1
                            })
                        ]),
                        React.createElement('div', { key: 'width-group' }, [
                            React.createElement('label', {
                                key: 'label',
                                className: 'block text-xs text-gray-600 mb-1'
                            }, 'Largeur (mm)'),
                            React.createElement('input', {
                                key: 'input',
                                type: 'number',
                                value: section.width,
                                onChange: (e) => updateSection(index, 'width', parseFloat(e.target.value) || 0),
                                className: 'w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-400',
                                min: 0,
                                step: 1
                            })
                        ])
                    ]),

                    // Gaps
                    React.createElement('div', {
                        key: 'gaps',
                        className: 'grid grid-cols-2 gap-2'
                    }, [
                        React.createElement('div', { key: 'gapTop-group' }, [
                            React.createElement('label', {
                                key: 'label',
                                className: 'block text-xs text-gray-600 mb-1'
                            }, 'Gap haut (mm)'),
                            React.createElement('input', {
                                key: 'input',
                                type: 'number',
                                value: section.gapTop,
                                onChange: (e) => updateSection(index, 'gapTop', parseFloat(e.target.value) || 0),
                                className: 'w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-400',
                                min: 0,
                                step: 1
                            })
                        ]),
                        React.createElement('div', { key: 'gapBottom-group' }, [
                            React.createElement('label', {
                                key: 'label',
                                className: 'block text-xs text-gray-600 mb-1'
                            }, 'Gap bas (mm)'),
                            React.createElement('input', {
                                key: 'input',
                                type: 'number',
                                value: section.gapBottom,
                                onChange: (e) => updateSection(index, 'gapBottom', parseFloat(e.target.value) || 0),
                                className: 'w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-400',
                                min: 0,
                                step: 1
                            })
                        ])
                    ]),

                    // Padding
                    React.createElement('div', {
                        key: 'padding',
                        className: 'grid grid-cols-2 gap-2'
                    }, [
                        React.createElement('div', { key: 'paddingTop-group' }, [
                            React.createElement('label', {
                                key: 'label',
                                className: 'block text-xs text-gray-600 mb-1'
                            }, 'Padding haut'),
                            React.createElement('input', {
                                key: 'input',
                                type: 'number',
                                value: section.paddingTop,
                                onChange: (e) => updateSection(index, 'paddingTop', parseFloat(e.target.value) || 0),
                                className: 'w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-400',
                                min: 0,
                                step: 1
                            })
                        ]),
                        React.createElement('div', { key: 'paddingRight-group' }, [
                            React.createElement('label', {
                                key: 'label',
                                className: 'block text-xs text-gray-600 mb-1'
                            }, 'Padding droit'),
                            React.createElement('input', {
                                key: 'input',
                                type: 'number',
                                value: section.paddingRight,
                                onChange: (e) => updateSection(index, 'paddingRight', parseFloat(e.target.value) || 0),
                                className: 'w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-400',
                                min: 0,
                                step: 1
                            })
                        ]),
                        React.createElement('div', { key: 'paddingBottom-group' }, [
                            React.createElement('label', {
                                key: 'label',
                                className: 'block text-xs text-gray-600 mb-1'
                            }, 'Padding bas'),
                            React.createElement('input', {
                                key: 'input',
                                type: 'number',
                                value: section.paddingBottom,
                                onChange: (e) => updateSection(index, 'paddingBottom', parseFloat(e.target.value) || 0),
                                className: 'w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-400',
                                min: 0,
                                step: 1
                            })
                        ]),
                        React.createElement('div', { key: 'paddingLeft-group' }, [
                            React.createElement('label', {
                                key: 'label',
                                className: 'block text-xs text-gray-600 mb-1'
                            }, 'Padding gauche'),
                            React.createElement('input', {
                                key: 'input',
                                type: 'number',
                                value: section.paddingLeft,
                                onChange: (e) => updateSection(index, 'paddingLeft', parseFloat(e.target.value) || 0),
                                className: 'w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-400',
                                min: 0,
                                step: 1
                            })
                        ])
                    ]),

                    // Background Color & Alignment
                    React.createElement('div', {
                        key: 'style',
                        className: 'grid grid-cols-2 gap-2'
                    }, [
                        React.createElement('div', { key: 'bg-group' }, [
                            React.createElement('label', {
                                key: 'label',
                                className: 'block text-xs text-gray-600 mb-1'
                            }, 'Fond'),
                            React.createElement('input', {
                                key: 'input',
                                type: 'color',
                                value: section.backgroundColor,
                                onChange: (e) => updateSection(index, 'backgroundColor', e.target.value),
                                className: 'w-full h-8 border border-gray-300 rounded cursor-pointer'
                            })
                        ]),
                        React.createElement('div', { key: 'align-group' }, [
                            React.createElement('label', {
                                key: 'label',
                                className: 'block text-xs text-gray-600 mb-1'
                            }, 'Alignement'),
                            React.createElement('select', {
                                key: 'input',
                                value: section.alignment,
                                onChange: (e) => updateSection(index, 'alignment', e.target.value),
                                className: 'w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-400'
                            }, [
                                React.createElement('option', { key: 'left', value: 'left' }, 'Gauche'),
                                React.createElement('option', { key: 'center', value: 'center' }, 'Centre'),
                                React.createElement('option', { key: 'right', value: 'right' }, 'Droite')
                            ])
                        ])
                    ])
                ])
            ]);
        })),

        // Footer avec bouton d'ajout
        React.createElement('div', {
            key: 'footer',
            className: 'p-4 bg-white border-t border-gray-200'
        }, [
            React.createElement('button', {
                key: 'add',
                onClick: addSection,
                className: 'w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2'
            }, [
                React.createElement('span', { key: 'icon' }, '+'),
                React.createElement('span', { key: 'text' }, 'Ajouter une section')
            ]),
            totalHeight > 297 && React.createElement('div', {
                key: 'warning',
                className: 'mt-2 text-xs text-red-600 text-center'
            }, '⚠️ La hauteur totale dépasse 297mm (A4)')
        ])
    ]);
}

// Export global
window.TemplateLayoutEditor = TemplateLayoutEditor;
