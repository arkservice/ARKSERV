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

// Composant GroupedTableView pour afficher les données groupées
function GroupedTableView({ data, columns, title, subtitle, loading, onAdd, onImport, onEdit, onDelete, onRowClick, getRowClassName, groupBy = 'entreprise', expandAll, statusOptions, onGroupChange, onExpandChange, entityType = 'projet', groupingOptions, customActions, customGroupOrder, getDefaultExpandState }) {
    const { useState, useEffect, useMemo } = React;

    // Debug
    console.log('GroupedTableView - onImport reçu:', !!onImport);
    console.log('GroupedTableView - onAdd reçu:', !!onAdd);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [sortKey, setSortKey] = useState('');
    const [sortDirection, setSortDirection] = useState('asc');
    const [expandedGroups, setExpandedGroups] = useState({});
    
    // Filtrage des données
    const filteredData = useMemo(() => 
        data.filter(row =>
            Object.values(row).some(value =>
                String(value).toLowerCase().includes(searchTerm.toLowerCase())
            )
        ), [data, searchTerm]
    );
    
    // Fonction pour obtenir la clé de groupe
    const getGroupKey = (row, groupBy) => {
        switch(groupBy) {
            case 'entreprise': 
                return row.entreprise?.nom || 'Sans entreprise';
            case 'status':
                const statusOption = statusOptions?.find(s => s.value === row.status);
                return statusOption?.label || 'Sans statut';
            case 'logiciel':
                return row.logiciel?.nom || 'Sans logiciel';
            case 'service':
                return row.service?.nom || 'Sans service';
            case 'fonction':
                return row.fonction?.nom || 'Sans fonction';
            default:
                return row[groupBy]?.nom || 'Sans catégorie';
        }
    };
    
    // Groupement des données
    const groupedData = useMemo(() => {
        const groups = {};
        filteredData.forEach(row => {
            const groupKey = getGroupKey(row, groupBy);
            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }
            groups[groupKey].push(row);
        });
        
        // Tri des groupes (personnalisé si fourni, sinon alphabétique)
        const sortFunction = customGroupOrder || ((a, b) => a.localeCompare(b));
        const sortedGroups = Object.keys(groups).sort(sortFunction).reduce((acc, key) => {
            acc[key] = groups[key];
            return acc;
        }, {});

        return sortedGroups;
    }, [filteredData, groupBy, statusOptions]);
    
    // Tri des données dans chaque groupe
    const sortedGroupedData = useMemo(() => {
        const result = {};
        Object.keys(groupedData).forEach(groupKey => {
            result[groupKey] = [...groupedData[groupKey]].sort((a, b) => {
                if (!sortKey) return 0;
                
                const column = columns.find(col => col.key === sortKey);
                const actualSortKey = column?.sortKey || sortKey;
                
                const aVal = a[actualSortKey];
                const bVal = b[actualSortKey];
                if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        });
        return result;
    }, [groupedData, sortKey, sortDirection, columns]);
    
    // Initialiser les groupes expandus
    useEffect(() => {
        const initialExpanded = {};
        Object.keys(groupedData).forEach(groupKey => {
            initialExpanded[groupKey] = getDefaultExpandState
                ? getDefaultExpandState(groupKey, groupBy)
                : expandAll;
        });
        setExpandedGroups(initialExpanded);
    }, [groupedData, expandAll, groupBy, getDefaultExpandState]);
    
    const handleSort = (key) => {
        if (sortKey === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };
    
    const toggleGroup = (groupKey) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupKey]: !prev[groupKey]
        }));
    };
    
    // Fonction pour obtenir l'icône selon le type de groupement
    const getGroupIcon = (groupBy) => {
        switch(groupBy) {
            case 'entreprise': return 'building';
            case 'status': return 'circle';
            case 'logiciel': return 'layers';
            case 'service': return 'users';
            case 'fonction': return 'briefcase';
            default: return 'folder';
        }
    };
    
    const renderCell = (column, value, row) => {
        if (column.render) {
            return column.render(value, row);
        }
        
        switch (column.type) {
            case 'badge':
                const option = column.options?.find(opt => opt.value === value);
                return React.createElement('span', {
                    className: `status-badge status-${value}`
                }, option?.label || value);
            
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
    
    useEffect(() => {
        // Garde lucide.createIcons() car ce composant utilise encore d'autres icônes Lucide
        // comme l'icône "plus" du bouton ajouter et les icônes de groupement
        lucide.createIcons();
    }, [sortedGroupedData]);
    
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
    
    const totalCount = Object.values(sortedGroupedData).flat().length;
    
    return React.createElement('div', {
        className: "bg-white rounded-lg border border-gray-200 shadow-sm grouped-table-view"
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
                    // Bouton Import Excel
                    onImport && React.createElement('button', {
                        key: 'import-btn',
                        onClick: onImport,
                        className: "px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    }, "📊 Import Excel"),
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
                React.createElement('div', {
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
                }, `${Object.keys(sortedGroupedData).length} entreprise${Object.keys(sortedGroupedData).length > 1 ? 's' : ''} • ${totalCount} projet${totalCount > 1 ? 's' : ''}`)
            ])
        ]),
        
        // Unified Table with integrated group headers
        React.createElement('div', {
            key: 'table-container',
            className: "overflow-x-auto"
        }, React.createElement('table', {
            key: 'unified-table',
            className: "w-full"
        }, [
            // Single Table Header
            React.createElement('thead', {
                key: 'thead',
                className: "bg-gray-50 border-b border-gray-200"
            }, React.createElement('tr', { key: 'header-row' }, 
                columns.filter(col => col.key !== groupBy).map((column) => 
                    React.createElement('th', {
                        key: column.key,
                        className: `px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                            column.sortable ? 'cursor-pointer hover:bg-gray-50' : ''
                        }`,
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
            )),
            
            // Unified Table Body with integrated group headers
            React.createElement('tbody', {
                key: 'tbody',
                className: "bg-white divide-y divide-gray-200"
            }, Object.keys(sortedGroupedData).flatMap((groupKey, groupIndex) => {
                const groupData = sortedGroupedData[groupKey];
                const isExpanded = expandedGroups[groupKey];
                const filteredColumns = columns.filter(col => col.key !== groupBy);
                
                const rows = [];
                
                // Ajouter une ligne de séparation avant chaque groupe (sauf le premier)
                if (groupIndex > 0) {
                    rows.push(
                        React.createElement('tr', {
                            key: `group-separator-${groupKey}`,
                            className: "group-separator"
                        }, React.createElement('td', {
                            key: 'separator-cell',
                            colSpan: filteredColumns.length,
                            className: "group-separator-cell"
                        }))
                    );
                }
                
                // Group Header Row
                rows.push(
                    React.createElement('tr', {
                        key: `group-header-${groupKey}`,
                        className: "bg-gray-50 border-t border-gray-200 group-header-row"
                    }, React.createElement('td', {
                        key: 'group-header-cell',
                        colSpan: filteredColumns.length,
                        className: "px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors",
                        onClick: () => toggleGroup(groupKey)
                    }, React.createElement('div', {
                        className: "flex items-center justify-between"
                    }, [
                        React.createElement('div', {
                            key: 'group-info',
                            className: "flex items-center gap-3"
                        }, [
                            React.createElement('i', {
                                key: 'expand-icon',
                                'data-lucide': isExpanded ? 'chevron-down' : 'chevron-right',
                                className: "w-4 h-4 text-gray-400 transition-transform"
                            }),
                            React.createElement('div', {
                                key: 'group-details',
                                className: "flex items-center gap-2"
                            }, [
                                React.createElement('i', {
                                    key: 'group-icon',
                                    'data-lucide': getGroupIcon(groupBy),
                                    className: "w-4 h-4 text-blue-600"
                                }),
                                React.createElement('span', {
                                    key: 'group-name',
                                    className: "font-medium text-gray-900"
                                }, groupKey),
                                React.createElement('span', {
                                    key: 'group-count',
                                    className: "text-sm text-gray-500"
                                }, `(${groupData.length} ${entityType}${groupData.length > 1 ? 's' : ''})`)
                            ])
                        ]),
                        React.createElement('div', {
                            key: 'group-stats',
                            className: "flex items-center gap-4 text-sm text-gray-500"
                        }, [
                            React.createElement('span', {
                                key: 'active-count',
                                className: "flex items-center gap-1"
                            }, [
                                React.createElement('span', {
                                    key: 'active-dot',
                                    className: "w-2 h-2 bg-green-500 rounded-full"
                                }),
                                `${groupData.filter(p => p.status === 'active').length} actif${groupData.filter(p => p.status === 'active').length > 1 ? 's' : ''}`
                            ]),
                            React.createElement('span', {
                                key: 'completed-count',
                                className: "flex items-center gap-1"
                            }, [
                                React.createElement('span', {
                                    key: 'completed-dot',
                                    className: "w-2 h-2 bg-blue-500 rounded-full"
                                }),
                                `${groupData.filter(p => p.status === 'completed').length} terminé${groupData.filter(p => p.status === 'completed').length > 1 ? 's' : ''}`
                            ])
                        ])
                    ])))
                );
                
                // Add data rows if group is expanded
                if (isExpanded) {
                    const dataRows = groupData.map((row, index) => {
                        const baseClassName = `table-row transition-colors ${onRowClick ? 'hover:bg-gray-50 cursor-pointer' : ''}`;
                        const customClassName = getRowClassName ? getRowClassName(row) : '';
                        const finalClassName = customClassName ? `${baseClassName} ${customClassName}` : baseClassName;
                        
                        return React.createElement('tr', {
                            key: `${groupKey}-${row.id || index}`,
                            className: finalClassName,
                            onClick: onRowClick ? () => onRowClick(row) : undefined
                        }, filteredColumns.map((column) =>
                            React.createElement('td', {
                                key: column.key,
                                className: "px-6 py-4 whitespace-nowrap table-cell"
                            }, renderCell(column, row[column.key], row))
                        ));
                    });
                    
                    rows.push(...dataRows);
                }
                
                return rows;
            }))
        ])),
        
        // Footer
        totalCount === 0 && React.createElement('div', {
            key: 'empty',
            className: "text-center py-12"
        }, React.createElement('p', {
            className: "text-gray-500"
        }, "Aucun projet trouvé")),
        
        React.createElement('div', {
            key: 'footer',
            className: "px-6 py-3 border-t border-gray-200 bg-gray-50"
        }, React.createElement('p', {
            className: "text-sm text-gray-500"
        }, `${totalCount} projet${totalCount > 1 ? 's' : ''} dans ${Object.keys(sortedGroupedData).length} entreprise${Object.keys(sortedGroupedData).length > 1 ? 's' : ''}${
            searchTerm ? ` (filtré${totalCount > 1 ? 's' : ''} sur ${data.length})` : ''
        }`))
    ]);
}

// Export global
window.GroupedTableView = GroupedTableView;