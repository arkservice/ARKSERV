// Composant GroupingDropdown style Airtable
function GroupingDropdown({ groupBy, onGroupChange, expandAll, onExpandChange, groupingOptions }) {
    const { useState, useEffect, useRef } = React;
    
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    
    // Options de groupement par défaut (pour compatibilité avec ProjectsPage)
    const defaultGroupOptions = [
        { value: null, label: 'Aucun groupement', icon: 'x' },
        { value: 'entreprise', label: 'Entreprise', icon: 'building' },
        { value: 'status', label: 'Statut', icon: 'circle' },
        { value: 'logiciel', label: 'Logiciel', icon: 'layers' }
    ];
    
    // Mapping des icônes pour les nouvelles options utilisateurs
    const getIconForOption = (value) => {
        const iconMap = {
            null: 'x',
            'entreprise': 'building',
            'status': 'circle',
            'logiciel': 'layers',
            'service': 'users',
            'fonction': 'briefcase'
        };
        return iconMap[value] || 'circle';
    };
    
    // Construire les options selon les props ou utiliser les défauts
    const groupOptions = groupingOptions ? [
        { value: null, label: 'Aucun groupement', icon: 'x' },
        ...groupingOptions.map(option => ({
            value: option,
            label: option.charAt(0).toUpperCase() + option.slice(1),
            icon: getIconForOption(option)
        }))
    ] : defaultGroupOptions;
    
    // Fermer le dropdown quand on clique ailleurs
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    // Mettre à jour les icônes après rendu
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => lucide.createIcons(), 10);
        }
    }, [isOpen]);
    
    const handleGroupSelect = (value) => {
        onGroupChange(value);
        setIsOpen(false);
    };
    
    const handleExpandToggle = () => {
        onExpandChange(!expandAll);
    };
    
    const selectedOption = groupOptions.find(opt => opt.value === groupBy);
    const hasGrouping = groupBy !== null;
    
    return React.createElement('div', {
        className: "relative",
        ref: dropdownRef
    }, [
        // Bouton principal
        React.createElement('button', {
            key: 'main-button',
            onClick: () => setIsOpen(!isOpen),
            className: `inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm ${
                hasGrouping ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white text-gray-700'
            }`
        }, [
            React.createElement('i', {
                key: 'group-icon',
                'data-lucide': 'group',
                className: "w-4 h-4"
            }),
            React.createElement('span', {
                key: 'button-text'
            }, hasGrouping ? `Groupé par ${selectedOption.label.toLowerCase()}` : 'Grouper'),
            React.createElement('i', {
                key: 'chevron',
                'data-lucide': isOpen ? 'chevron-up' : 'chevron-down',
                className: "w-4 h-4"
            })
        ]),
        
        // Dropdown
        isOpen && React.createElement('div', {
            key: 'dropdown',
            className: "absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1"
        }, [
            // Section groupement
            React.createElement('div', {
                key: 'group-section',
                className: "px-3 py-2"
            }, [
                React.createElement('div', {
                    key: 'group-header',
                    className: "text-xs font-medium text-gray-500 uppercase tracking-wider mb-2"
                }, 'Grouper par'),
                React.createElement('div', {
                    key: 'group-options',
                    className: "space-y-1"
                }, groupOptions.map(option => 
                    React.createElement('button', {
                        key: option.value || 'none',
                        onClick: () => handleGroupSelect(option.value),
                        className: `w-full flex items-center gap-3 px-2 py-2 text-sm rounded-md transition-colors ${
                            groupBy === option.value 
                                ? 'bg-blue-50 text-blue-700' 
                                : 'text-gray-700 hover:bg-gray-50'
                        }`
                    }, [
                        React.createElement('i', {
                            key: 'option-icon',
                            'data-lucide': option.icon,
                            className: "w-4 h-4"
                        }),
                        React.createElement('span', {
                            key: 'option-label'
                        }, option.label),
                        groupBy === option.value && React.createElement('i', {
                            key: 'check-icon',
                            'data-lucide': 'check',
                            className: "w-4 h-4 ml-auto text-blue-600"
                        })
                    ])
                ))
            ]),
            
            // Séparateur
            hasGrouping && React.createElement('div', {
                key: 'separator',
                className: "border-t border-gray-200 my-1"
            }),
            
            // Section contrôles (seulement si groupé)
            hasGrouping && React.createElement('div', {
                key: 'controls-section',
                className: "px-3 py-2"
            }, [
                React.createElement('div', {
                    key: 'controls-header',
                    className: "text-xs font-medium text-gray-500 uppercase tracking-wider mb-2"
                }, 'Contrôles'),
                React.createElement('div', {
                    key: 'controls-options',
                    className: "space-y-1"
                }, [
                    React.createElement('button', {
                        key: 'expand-all',
                        onClick: () => {
                            onExpandChange(true);
                            setIsOpen(false);
                        },
                        className: `w-full flex items-center gap-3 px-2 py-2 text-sm rounded-md transition-colors ${
                            expandAll 
                                ? 'bg-gray-50 text-gray-700' 
                                : 'text-gray-700 hover:bg-gray-50'
                        }`
                    }, [
                        React.createElement('i', {
                            key: 'expand-icon',
                            'data-lucide': 'chevron-down',
                            className: "w-4 h-4"
                        }),
                        React.createElement('span', {
                            key: 'expand-label'
                        }, 'Tout développer'),
                        expandAll && React.createElement('i', {
                            key: 'expand-check',
                            'data-lucide': 'check',
                            className: "w-4 h-4 ml-auto text-gray-600"
                        })
                    ]),
                    React.createElement('button', {
                        key: 'collapse-all',
                        onClick: () => {
                            onExpandChange(false);
                            setIsOpen(false);
                        },
                        className: `w-full flex items-center gap-3 px-2 py-2 text-sm rounded-md transition-colors ${
                            !expandAll 
                                ? 'bg-gray-50 text-gray-700' 
                                : 'text-gray-700 hover:bg-gray-50'
                        }`
                    }, [
                        React.createElement('i', {
                            key: 'collapse-icon',
                            'data-lucide': 'chevron-up',
                            className: "w-4 h-4"
                        }),
                        React.createElement('span', {
                            key: 'collapse-label'
                        }, 'Tout réduire'),
                        !expandAll && React.createElement('i', {
                            key: 'collapse-check',
                            'data-lucide': 'check',
                            className: "w-4 h-4 ml-auto text-gray-600"
                        })
                    ])
                ])
            ])
        ])
    ]);
}

// Export global
window.GroupingDropdown = GroupingDropdown;