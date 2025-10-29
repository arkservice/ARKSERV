// Composants SVG pour les icônes d'action
function EditIcon({ className = "w-4 h-4" }) {
    return React.createElement('svg', {
        className: className,
        fill: 'none',
        stroke: 'currentColor',
        viewBox: '0 0 24 24',
        xmlns: 'http://www.w3.org/2000/svg'
    }, React.createElement('path', {
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        strokeWidth: 2,
        d: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
    }));
}

function DeleteIcon({ className = "w-4 h-4" }) {
    return React.createElement('svg', {
        className: className,
        fill: 'none',
        stroke: 'currentColor',
        viewBox: '0 0 24 24',
        xmlns: 'http://www.w3.org/2000/svg'
    }, React.createElement('path', {
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        strokeWidth: 2,
        d: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
    }));
}

// Composant TableView générique style Airtable - Optimized with debounce
function TableView({ data, columns, title, subtitle, loading, onAdd, onImport, onEdit, onDelete, onRowClick, getRowClassName, groupBy, expandAll, onGroupChange, onExpandChange, groupingOptions, customActions, onCellEdit, searchableFields, columnFilters, itemLabel = 'projet', itemLabelPlural }) {
    const { useState, useEffect, useMemo, useRef } = React;

    // Debug
    console.log('TableView - onImport reçu:', !!onImport);

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [sortKey, setSortKey] = useState('');
    const [sortDirection, setSortDirection] = useState('asc');
    const [openDropdown, setOpenDropdown] = useState(null); // {rowId, columnKey, position} ou null

    // États pour les filtres par colonne
    const [columnFilterValues, setColumnFilterValues] = useState({});
    const [debouncedColumnFilters, setDebouncedColumnFilters] = useState({});
    
    // Debounce pour la recherche
    const debounceTimer = useRef(null);
    const columnFilterTimers = useRef({});

    useEffect(() => {
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300); // Délai de 300ms

        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, [searchTerm]);

    // Debounce pour les filtres par colonne
    useEffect(() => {
        Object.keys(columnFilterValues).forEach(columnKey => {
            if (columnFilterTimers.current[columnKey]) {
                clearTimeout(columnFilterTimers.current[columnKey]);
            }

            columnFilterTimers.current[columnKey] = setTimeout(() => {
                setDebouncedColumnFilters(prev => ({
                    ...prev,
                    [columnKey]: columnFilterValues[columnKey]
                }));
            }, 300);
        });

        return () => {
            Object.values(columnFilterTimers.current).forEach(timer => clearTimeout(timer));
        };
    }, [columnFilterValues]);
    
    // Fermer le dropdown lors d'un clic à l'extérieur
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (openDropdown) {
                setOpenDropdown(null);
            }
        };
        
        const handleEscapeKey = (event) => {
            if (event.key === 'Escape' && openDropdown) {
                setOpenDropdown(null);
            }
        };
        
        if (openDropdown) {
            document.addEventListener('click', handleClickOutside);
            document.addEventListener('keydown', handleEscapeKey);
        }
        
        return () => {
            document.removeEventListener('click', handleClickOutside);
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [openDropdown]);
    
    const filteredData = useMemo(() => {
        let result = data;

        // Appliquer d'abord la recherche globale
        if (debouncedSearchTerm) {
            // Si searchableFields est défini, chercher uniquement dans ces champs
            if (searchableFields && searchableFields.length > 0) {
                result = result.filter(row => {
                    return searchableFields.some(fieldPath => {
                        // Supporter les chemins imbriqués comme 'logiciel.nom'
                        const fieldValue = fieldPath.split('.').reduce((obj, key) => {
                            return obj?.[key];
                        }, row);

                        if (fieldValue === null || fieldValue === undefined) {
                            return false;
                        }

                        return String(fieldValue).toLowerCase().includes(debouncedSearchTerm.toLowerCase());
                    });
                });
            } else {
                // Sinon, comportement par défaut : chercher dans tous les champs récursivement
                const extractSearchableValues = (obj, depth = 0, maxDepth = 2) => {
                    if (depth > maxDepth || obj === null || obj === undefined) {
                        return [];
                    }

                    const values = [];

                    for (const value of Object.values(obj)) {
                        if (value === null || value === undefined) {
                            continue;
                        }

                        // Si c'est un objet, explorer récursivement
                        if (typeof value === 'object' && !Array.isArray(value)) {
                            values.push(...extractSearchableValues(value, depth + 1, maxDepth));
                        }
                        // Si c'est une valeur primitive (string, number, boolean)
                        else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                            values.push(String(value));
                        }
                    }

                    return values;
                };

                result = result.filter(row => {
                    const searchableValues = extractSearchableValues(row);
                    return searchableValues.some(value =>
                        value.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
                    );
                });
            }
        }

        // Appliquer ensuite les filtres par colonne
        if (columnFilters && Object.keys(debouncedColumnFilters).length > 0) {
            result = result.filter(row => {
                return Object.entries(debouncedColumnFilters).every(([columnKey, filterValue]) => {
                    if (!filterValue || filterValue.trim() === '') {
                        return true; // Pas de filtre pour cette colonne
                    }

                    // Trouver la colonne correspondante pour gérer les cas spéciaux
                    const column = columns.find(col => col.key === columnKey);
                    let fieldValue;

                    // Vérifier si le columnKey contient un point (chemin imbriqué)
                    if (columnKey.includes('.')) {
                        // Supporter les chemins imbriqués comme 'metier_pdc.nom'
                        fieldValue = columnKey.split('.').reduce((obj, key) => {
                            return obj?.[key];
                        }, row);
                    } else if (column && column.render) {
                        // Si la colonne a un render custom, extraire la valeur du render
                        fieldValue = row[columnKey];

                        // Cas spécial pour les objets imbriqués (comme logiciel.nom)
                        if (fieldValue && typeof fieldValue === 'object') {
                            // Si c'est un objet, chercher dans la propriété 'nom' par défaut
                            fieldValue = fieldValue.nom || fieldValue;
                        }
                    } else {
                        // Cas simple : accès direct
                        fieldValue = row[columnKey];
                    }

                    if (fieldValue === null || fieldValue === undefined) {
                        return false;
                    }

                    // Convertir en string et comparer (case-insensitive pour le texte)
                    const fieldValueStr = String(fieldValue).toLowerCase();
                    const filterValueLower = filterValue.toLowerCase();

                    return fieldValueStr.includes(filterValueLower);
                });
            });
        }

        return result;
    }, [data, debouncedSearchTerm, searchableFields, debouncedColumnFilters, columnFilters]);
    
    const sortedData = useMemo(() => 
        [...filteredData].sort((a, b) => {
            if (!sortKey) return 0;
            
            // Trouver la colonne pour obtenir le sortKey personnalisé
            const column = columns.find(col => col.key === sortKey);
            const actualSortKey = column?.sortKey || sortKey;
            
            const aVal = a[actualSortKey];
            const bVal = b[actualSortKey];
            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        }), [filteredData, sortKey, sortDirection, columns]
    );
    
    const handleSort = (key) => {
        if (sortKey === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };
    
    // Fonction pour déterminer le préfixe CSS selon la colonne
    const getBadgePrefix = (columnKey) => {
        return columnKey === 'priority' ? 'priority' : 'status';
    };
    
    // Fonction pour calculer la position optimale du dropdown
    const calculateDropdownPosition = (triggerElement) => {
        const rect = triggerElement.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const dropdownHeight = 200; // hauteur estimée du dropdown
        const dropdownWidth = 200; // largeur estimée du dropdown
        
        let top = rect.bottom + 4; // Position par défaut en dessous
        let left = rect.left;
        
        // Si le dropdown sortirait en bas de l'écran, le placer au-dessus
        if (top + dropdownHeight > viewportHeight) {
            top = rect.top - dropdownHeight - 4;
        }
        
        // Si le dropdown sortirait à droite de l'écran, l'ajuster à gauche
        if (left + dropdownWidth > viewportWidth) {
            left = viewportWidth - dropdownWidth - 10;
        }
        
        // S'assurer que la position ne soit pas négative
        top = Math.max(4, top);
        left = Math.max(4, left);
        
        return { top, left };
    };
    
    const renderCell = (column, value, row) => {
        if (column.render) {
            return column.render(value, row);
        }
        
        switch (column.type) {
            case 'badge':
                const option = column.options?.find(opt => opt.value === value);
                const badgePrefix = getBadgePrefix(column.key);
                return React.createElement('span', {
                    className: `status-badge ${badgePrefix}-${value}`
                }, option?.label || value);
            
            case 'editable-badge':
                const currentOption = column.options?.find(opt => opt.value === value);
                const dropdownKey = `${row.id}-${column.key}`;
                const isOpen = openDropdown?.rowId === row.id && openDropdown?.columnKey === column.key;
                const editableBadgePrefix = getBadgePrefix(column.key);
                
                return React.createElement('div', {
                    className: "relative",
                    onClick: (e) => e.stopPropagation() // Empêcher le clic de ligne
                }, [
                    // Badge cliquable
                    React.createElement('button', {
                        key: 'trigger',
                        className: `status-badge ${editableBadgePrefix}-${value} cursor-pointer hover:opacity-80 flex items-center gap-1`,
                        onClick: (e) => {
                            if (isOpen) {
                                setOpenDropdown(null);
                            } else {
                                const position = calculateDropdownPosition(e.currentTarget);
                                setOpenDropdown({ rowId: row.id, columnKey: column.key, position });
                            }
                        }
                    }, [
                        currentOption?.label || value,
                        React.createElement('svg', {
                            key: 'chevron',
                            className: `w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`,
                            fill: 'none',
                            stroke: 'currentColor',
                            viewBox: '0 0 24 24'
                        }, React.createElement('path', {
                            strokeLinecap: 'round',
                            strokeLinejoin: 'round',
                            strokeWidth: 2,
                            d: 'M19 9l-7 7-7-7'
                        }))
                    ]),
                    
                    // Dropdown menu
                    isOpen && React.createElement('div', {
                        key: 'dropdown',
                        className: "fixed min-w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-[9999]",
                        style: {
                            top: `${openDropdown.position.top}px`,
                            left: `${openDropdown.position.left}px`
                        },
                        onClick: (e) => e.stopPropagation()
                    }, column.options?.map(opt => 
                        React.createElement('button', {
                            key: opt.value,
                            className: `w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${opt.value === value ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`,
                            onClick: async () => {
                                if (opt.value !== value && onCellEdit) {
                                    try {
                                        await onCellEdit(row, column.key, opt.value);
                                    } catch (error) {
                                        console.error('Erreur lors de la mise à jour:', error);
                                    }
                                }
                                setOpenDropdown(null);
                            }
                        }, [
                            React.createElement('span', {
                                key: 'badge',
                                className: `status-badge ${editableBadgePrefix}-${opt.value} text-xs`
                            }, opt.label),
                            opt.value === value && React.createElement('svg', {
                                key: 'check',
                                className: 'w-4 h-4 text-blue-600 ml-auto',
                                fill: 'none',
                                stroke: 'currentColor',
                                viewBox: '0 0 24 24'
                            }, React.createElement('path', {
                                strokeLinecap: 'round',
                                strokeLinejoin: 'round',
                                strokeWidth: 2,
                                d: 'M5 13l4 4L19 7'
                            }))
                        ])
                    ))
                ]);
            
            case 'user-assignment':
                const assignedUser = value ? row.assigned_user : null;
                const userDropdownKey = `${row.id}-${column.key}`;
                const isUserDropdownOpen = openDropdown?.rowId === row.id && openDropdown?.columnKey === column.key;
                
                return React.createElement('div', {
                    className: "relative",
                    onClick: (e) => e.stopPropagation() // Empêcher le clic de ligne
                }, [
                    // Affichage de l'utilisateur assigné ou bouton d'assignation
                    React.createElement('div', {
                        key: 'user-display',
                        className: "flex items-center gap-2"
                    }, [
                        // Avatar ou bouton +
                        assignedUser ? [
                            React.createElement('div', {
                                key: 'avatar',
                                className: "w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600"
                            }, assignedUser.avatar ? React.createElement('img', {
                                src: assignedUser.avatar,
                                alt: `${assignedUser.prenom} ${assignedUser.nom}`,
                                className: "w-6 h-6 rounded-full object-cover"
                            }) : `${assignedUser.prenom?.[0]}${assignedUser.nom?.[0]}`),
                            React.createElement('span', {
                                key: 'name',
                                className: "text-sm text-gray-900"
                            }, `${assignedUser.prenom} ${assignedUser.nom}`)
                        ] : React.createElement('button', {
                            key: 'add-button',
                            className: "w-6 h-6 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center text-blue-600 font-bold text-sm cursor-pointer transition-colors",
                            onClick: (e) => {
                                if (isUserDropdownOpen) {
                                    setOpenDropdown(null);
                                } else {
                                    const position = calculateDropdownPosition(e.currentTarget);
                                    setOpenDropdown({ rowId: row.id, columnKey: column.key, position });
                                }
                            },
                            title: "Assigner à un collaborateur"
                        }, '+'),
                        
                        // Bouton d'édition si utilisateur assigné
                        assignedUser && React.createElement('button', {
                            key: 'edit-button',
                            className: "w-4 h-4 text-gray-400 hover:text-blue-600 cursor-pointer ml-1",
                            onClick: (e) => {
                                if (isUserDropdownOpen) {
                                    setOpenDropdown(null);
                                } else {
                                    const position = calculateDropdownPosition(e.currentTarget);
                                    setOpenDropdown({ rowId: row.id, columnKey: column.key, position });
                                }
                            },
                            title: "Modifier l'assignation"
                        }, React.createElement('svg', {
                            fill: 'none',
                            stroke: 'currentColor',
                            viewBox: '0 0 24 24',
                            className: 'w-4 h-4'
                        }, React.createElement('path', {
                            strokeLinecap: 'round',
                            strokeLinejoin: 'round',
                            strokeWidth: 2,
                            d: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z'
                        })))
                    ]),
                    
                    // Dropdown menu des utilisateurs
                    isUserDropdownOpen && React.createElement('div', {
                        key: 'user-dropdown',
                        className: "fixed min-w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-[9999] max-h-64 overflow-y-auto",
                        style: {
                            top: `${openDropdown.position.top}px`,
                            left: `${openDropdown.position.left}px`
                        },
                        onClick: (e) => e.stopPropagation()
                    }, [
                        // Option pour désassigner
                        assignedUser && React.createElement('button', {
                            key: 'unassign',
                            className: "w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600 border-b border-gray-100",
                            onClick: async () => {
                                if (onCellEdit) {
                                    try {
                                        await onCellEdit(row, column.key, null);
                                    } catch (error) {
                                        console.error('Erreur lors de la désassignation:', error);
                                    }
                                }
                                setOpenDropdown(null);
                            }
                        }, [
                            React.createElement('svg', {
                                key: 'unassign-icon',
                                className: 'w-4 h-4',
                                fill: 'none',
                                stroke: 'currentColor',
                                viewBox: '0 0 24 24'
                            }, React.createElement('path', {
                                strokeLinecap: 'round',
                                strokeLinejoin: 'round',
                                strokeWidth: 2,
                                d: 'M6 18L18 6M6 6l12 12'
                            })),
                            'Désassigner'
                        ]),
                        
                        // Liste des utilisateurs disponibles
                        ...(column.options?.map(user => 
                            React.createElement('button', {
                                key: user.id,
                                className: `w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${user.id === assignedUser?.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`,
                                onClick: async () => {
                                    if (user.id !== assignedUser?.id && onCellEdit) {
                                        try {
                                            await onCellEdit(row, column.key, user.id);
                                        } catch (error) {
                                            console.error('Erreur lors de l\'assignation:', error);
                                        }
                                    }
                                    setOpenDropdown(null);
                                }
                            }, [
                                React.createElement('div', {
                                    key: 'user-avatar',
                                    className: "w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600"
                                }, user.avatar ? React.createElement('img', {
                                    src: user.avatar,
                                    alt: `${user.prenom} ${user.nom}`,
                                    className: "w-6 h-6 rounded-full object-cover"
                                }) : `${user.prenom?.[0]}${user.nom?.[0]}`),
                                React.createElement('span', {
                                    key: 'user-name'
                                }, `${user.prenom} ${user.nom}`),
                                user.id === assignedUser?.id && React.createElement('svg', {
                                    key: 'check',
                                    className: 'w-4 h-4 text-blue-600 ml-auto',
                                    fill: 'none',
                                    stroke: 'currentColor',
                                    viewBox: '0 0 24 24'
                                }, React.createElement('path', {
                                    strokeLinecap: 'round',
                                    strokeLinejoin: 'round',
                                    strokeWidth: 2,
                                    d: 'M5 13l4 4L19 7'
                                }))
                            ])
                        ) || [])
                    ])
                ]);
            
            case 'date':
                return value ? (window.DateUtils && window.DateUtils.formatDateLocaleSafe 
                    ? window.DateUtils.formatDateLocaleSafe(value)
                    : new Date(value).toLocaleDateString('fr-FR')) : '-';
            
            case 'user':
                return value ? React.createElement('div', {
                    className: "flex items-center gap-2"
                }, [
                    React.createElement('div', {
                        key: 'avatar',
                        className: "w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs"
                    }, `${value.prenom?.[0] || ''}${value.nom?.[0] || ''}`),
                    React.createElement('span', {
                        key: 'name',
                        className: "text-sm"
                    }, `${value.prenom} ${value.nom}`)
                ]) : '-';
            
            case 'actions':
                return React.createElement('div', {
                    className: "flex items-center gap-2"
                }, [
                    onEdit && React.createElement('button', {
                        key: 'edit',
                        onClick: (e) => {
                            e.stopPropagation();
                            onEdit(row);
                        },
                        className: "p-1 text-gray-400 hover:text-blue-600 transition-colors",
                        title: "Modifier"
                    }, React.createElement(EditIcon, {
                        className: "w-4 h-4"
                    })),
                    onDelete && React.createElement('button', {
                        key: 'delete',
                        onClick: (e) => {
                            e.stopPropagation();
                            onDelete(row);
                        },
                        className: "p-1 text-gray-400 hover:text-red-600 transition-colors",
                        title: "Supprimer"
                    }, React.createElement(DeleteIcon, {
                        className: "w-4 h-4"
                    }))
                ]);
            
            default:
                return React.createElement('span', {
                    className: "text-sm text-gray-900"
                }, value || '-');
        }
    };
    
    // Suppression de l'appel lucide.createIcons() car nous utilisons maintenant des SVG
    
    if (loading) {
        return React.createElement('div', {
            className: "bg-white rounded-lg border border-gray-200 p-8"
        }, React.createElement('div', {
            className: "animate-pulse"
        }, [
            React.createElement('div', {
                key: 'title',
                className: "h-4 bg-gray-200 rounded w-1/4 mb-6"
            }),
            React.createElement('div', {
                key: 'content',
                className: "space-y-3"
            }, Array.from({ length: 5 }).map((_, i) => 
                React.createElement('div', {
                    key: i,
                    className: "h-4 bg-gray-200 rounded"
                })
            ))
        ]));
    }
    
    return React.createElement('div', {
        className: "bg-white rounded-lg border border-gray-200 shadow-sm table-view"
    }, [
        // Header
        React.createElement('div', {
            key: 'header',
            className: "px-6 py-4 border-b border-gray-200"
        }, [
            React.createElement('div', {
                key: 'title-bar',
                className: "flex items-center justify-between"
            }, [
                React.createElement('div', { key: 'title-section' }, [
                    React.createElement('h1', {
                        key: 'title',
                        className: "text-xl font-semibold text-gray-900"
                    }, title),
                    subtitle && React.createElement('p', {
                        key: 'subtitle',
                        className: "text-sm text-gray-500 mt-1"
                    }, subtitle)
                ]),
                React.createElement('div', {
                    key: 'actions-container',
                    className: "flex items-center gap-2"
                }, [
                    // Boutons d'actions personnalisées
                    ...(customActions || []).map((action, index) => {
                        const buttonClass = action.variant === 'secondary' 
                            ? "inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                            : "inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors";
                        
                        return React.createElement('button', {
                            key: `custom-action-${index}`,
                            onClick: action.onClick,
                            className: buttonClass,
                            title: action.label
                        }, [
                            action.icon && React.createElement('i', {
                                key: 'icon',
                                'data-lucide': action.icon,
                                className: "w-4 h-4"
                            }),
                            action.label
                        ]);
                    }),
                    // Bouton Import CSV
                    onImport && React.createElement('button', {
                        key: 'import-btn',
                        onClick: onImport,
                        className: "px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    }, "📊 Import CSV"),
                    // Bouton Ajouter existant
                    onAdd && React.createElement('button', {
                        key: 'add-btn',
                        onClick: onAdd,
                        className: "inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    }, [
                        React.createElement('i', {
                            key: 'icon',
                            'data-lucide': 'plus',
                            className: "w-4 h-4"
                        }),
                        "Ajouter"
                    ])
                ])
            ]),
            // Toolbar
            React.createElement('div', {
                key: 'toolbar',
                className: "flex items-center gap-4 mt-4"
            }, [
                // Barre de recherche globale (uniquement si searchableFields est défini)
                searchableFields && searchableFields.length > 0 && React.createElement('div', {
                    key: 'search-container',
                    className: "flex-1 max-w-md relative"
                }, [
                    React.createElement('i', {
                        key: 'search-icon',
                        'data-lucide': 'search',
                        className: "w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    }),
                    React.createElement('input', {
                        key: 'search-input',
                        type: "text",
                        placeholder: "Rechercher...",
                        value: searchTerm,
                        onChange: (e) => setSearchTerm(e.target.value),
                        className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    })
                ]),
                
                // Dropdown de groupement
                onGroupChange && React.createElement(window.GroupingDropdown, {
                    key: 'grouping-dropdown',
                    groupBy: groupBy,
                    onGroupChange: onGroupChange,
                    expandAll: expandAll,
                    onExpandChange: onExpandChange,
                    ...(groupingOptions && { groupingOptions: groupingOptions })
                }),
                
                React.createElement('div', {
                    key: 'stats',
                    className: "text-sm text-gray-500"
                }, [
                    React.createElement('span', {
                        key: 'count',
                        className: "font-bold"
                    }, sortedData.length),
                    ` ${sortedData.length > 1 ? (itemLabelPlural || itemLabel + 's') : itemLabel}`
                ])
            ])
        ]),
        
        // Table
        React.createElement('div', {
            key: 'table-container',
            className: "overflow-x-auto"
        }, [
            React.createElement('table', {
                key: 'table',
                className: "w-full"
            }, [
                React.createElement('thead', {
                    key: 'thead',
                    className: "bg-gray-50 border-b border-gray-200"
                }, [
                    React.createElement('tr', { key: 'header-row' },
                        columns.map((column) =>
                            React.createElement('th', {
                                key: column.key,
                                className: `px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                                    column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                                }`,
                                style: column.width ? { width: column.width } : {},
                                onClick: column.sortable ? () => handleSort(column.key) : undefined
                            }, React.createElement('div', {
                                className: "flex items-center gap-2"
                            }, [
                                column.label,
                                column.sortable && React.createElement('i', {
                                    key: 'sort-icon',
                                    'data-lucide': 'chevron-down',
                                    className: `w-4 h-4 transition-transform ${
                                        sortKey === column.key && sortDirection === 'desc'
                                            ? 'transform rotate-180'
                                            : ''
                                    }`
                                })
                            ]))
                        )
                    ),
                    // Ligne de filtres par colonne
                    columnFilters && Object.keys(columnFilters).length > 0 && React.createElement('tr', { key: 'filter-row' },
                        columns.map((column) => {
                            const filterConfig = columnFilters[column.key];
                            const hasFilter = !!filterConfig;

                            if (!hasFilter) {
                                return React.createElement('th', {
                                    key: `filter-${column.key}`,
                                    className: "px-6 py-2 bg-gray-50"
                                });
                            }

                            // Si c'est un objet de configuration (dropdown)
                            if (typeof filterConfig === 'object' && filterConfig.type === 'dropdown') {
                                return React.createElement('th', {
                                    key: `filter-${column.key}`,
                                    className: "px-6 py-2 bg-gray-50"
                                }, React.createElement('select', {
                                    value: columnFilterValues[column.key] || '',
                                    onChange: (e) => {
                                        setColumnFilterValues(prev => ({
                                            ...prev,
                                            [column.key]: e.target.value
                                        }));
                                    },
                                    onClick: (e) => e.stopPropagation(),
                                    className: "w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white"
                                }, [
                                    React.createElement('option', {
                                        key: 'all',
                                        value: ''
                                    }, 'Tous'),
                                    ...(filterConfig.options || []).map(opt =>
                                        React.createElement('option', {
                                            key: opt.value,
                                            value: opt.value
                                        }, opt.label)
                                    )
                                ]));
                            }

                            // Sinon, c'est un input texte simple
                            return React.createElement('th', {
                                key: `filter-${column.key}`,
                                className: "px-6 py-2 bg-gray-50"
                            }, React.createElement('input', {
                                type: 'text',
                                placeholder: `Rechercher...`,
                                value: columnFilterValues[column.key] || '',
                                onChange: (e) => {
                                    setColumnFilterValues(prev => ({
                                        ...prev,
                                        [column.key]: e.target.value
                                    }));
                                },
                                onClick: (e) => e.stopPropagation(),
                                className: "w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            }));
                        })
                    )
                ]),
                React.createElement('tbody', {
                    key: 'tbody',
                    className: "bg-white divide-y divide-gray-200"
                }, sortedData.map((row, index) => {
                    const baseClassName = `table-row transition-colors ${onRowClick ? 'hover:bg-gray-50 cursor-pointer' : ''}`;
                    const customClassName = getRowClassName ? getRowClassName(row) : '';
                    const finalClassName = customClassName ? `${baseClassName} ${customClassName}` : baseClassName;
                    
                    return React.createElement('tr', {
                        key: row.id || index,
                        className: finalClassName,
                        onClick: onRowClick ? () => onRowClick(row) : undefined
                    }, columns.map((column) => {
                        // Classes CSS adaptées selon le type de colonne
                        let cellClasses = "px-6 py-4 table-cell";
                        
                        // Pour les colonnes de texte avec une largeur fixe, permettre la troncature
                        if (column.width && column.type === 'text') {
                            cellClasses += " overflow-hidden whitespace-nowrap";
                        } else {
                            cellClasses += " whitespace-nowrap";
                        }
                        
                        // Style pour la cellule
                        let cellStyle = {};
                        if (column.width) {
                            cellStyle.width = column.width;
                            cellStyle.maxWidth = column.width;
                            if (column.type === 'text') {
                                cellStyle.textOverflow = 'ellipsis';
                            }
                        }
                        
                        return React.createElement('td', {
                            key: column.key,
                            className: cellClasses,
                            style: cellStyle,
                            title: column.width && column.type === 'text' ? (row[column.key] || '') : undefined
                        }, renderCell(column, row[column.key], row));
                    }));
                }))
            ]),
            
            sortedData.length === 0 && React.createElement('div', {
                key: 'empty',
                className: "text-center py-12"
            }, React.createElement('p', {
                className: "text-gray-500"
            }, "Aucun élément trouvé"))
        ]),
        
        // Footer
        React.createElement('div', {
            key: 'footer',
            className: "px-6 py-3 border-t border-gray-200 bg-gray-50"
        }, React.createElement('p', {
            className: "text-sm text-gray-500"
        }, `${sortedData.length} élément${sortedData.length > 1 ? 's' : ''}${
            searchTerm ? ` (filtré${sortedData.length > 1 ? 's' : ''} sur ${data.length})` : ''
        }`))
    ]);
}

// Export global
window.TableView = TableView;