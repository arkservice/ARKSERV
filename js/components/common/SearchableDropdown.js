// Composant SearchableDropdown - Dropdown avec recherche et bouton d'ajout optionnel
function SearchableDropdown({
    value,
    onChange,
    options = [],
    placeholder = "Sélectionner...",
    label,
    onAddNew,
    addButtonLabel = "Ajouter",
    required = false,
    disabled = false,
    className = ""
}) {
    const { useState, useEffect, useRef } = React;

    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const dropdownRef = useRef(null);
    const searchInputRef = useRef(null);

    // Trouver l'option sélectionnée
    const selectedOption = options.find(opt => opt.id === value);

    // Filtrer les options en fonction de la recherche
    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Fermer le dropdown si on clique en dehors
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearchTerm('');
                setHighlightedIndex(-1);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus sur l'input quand le dropdown s'ouvre
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    // Gestion du clavier
    const handleKeyDown = (e) => {
        if (!isOpen) {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                e.preventDefault();
                setIsOpen(true);
            }
            return;
        }

        switch (e.key) {
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                setSearchTerm('');
                setHighlightedIndex(-1);
                break;

            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev < filteredOptions.length - 1 ? prev + 1 : prev
                );
                break;

            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
                break;

            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
                    handleSelect(filteredOptions[highlightedIndex]);
                }
                break;

            default:
                break;
        }
    };

    const handleSelect = (option) => {
        onChange(option.id);
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
    };

    const handleToggle = () => {
        if (!disabled) {
            setIsOpen(!isOpen);
            if (isOpen) {
                setSearchTerm('');
                setHighlightedIndex(-1);
            }
        }
    };

    const handleAddNew = (e) => {
        e.stopPropagation();
        if (onAddNew) {
            onAddNew();
        }
    };

    return React.createElement('div', {
        className: `relative ${className}`,
        ref: dropdownRef
    }, [
        // Label
        label && React.createElement('label', {
            key: 'label',
            className: "block text-sm font-medium text-gray-700 mb-2"
        }, [
            label,
            required && React.createElement('span', {
                key: 'required',
                className: 'text-red-500 ml-1'
            }, '*')
        ]),

        // Container avec bouton principal et bouton "+"
        React.createElement('div', {
            key: 'container',
            className: 'flex gap-2'
        }, [
            // Bouton principal du dropdown
            React.createElement('div', {
                key: 'dropdown-wrapper',
                className: 'flex-1 relative'
            }, [
                React.createElement('button', {
                    key: 'trigger',
                    type: 'button',
                    onClick: handleToggle,
                    onKeyDown: handleKeyDown,
                    disabled: disabled,
                    className: `w-full px-3 py-2 text-left border border-gray-300 rounded-md shadow-sm bg-white
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                        ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}
                        flex items-center justify-between`
                }, [
                    React.createElement('span', {
                        key: 'text',
                        className: selectedOption ? 'text-gray-900' : 'text-gray-400'
                    }, selectedOption ? selectedOption.label : placeholder),

                    React.createElement('i', {
                        key: 'icon',
                        'data-lucide': isOpen ? 'chevron-up' : 'chevron-down',
                        className: 'w-4 h-4 text-gray-400'
                    })
                ]),

                // Menu dropdown
                isOpen && React.createElement('div', {
                    key: 'menu',
                    className: 'absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden'
                }, [
                    // Input de recherche
                    React.createElement('div', {
                        key: 'search',
                        className: 'p-2 border-b border-gray-200'
                    }, React.createElement('input', {
                        ref: searchInputRef,
                        type: 'text',
                        value: searchTerm,
                        onChange: (e) => {
                            setSearchTerm(e.target.value);
                            setHighlightedIndex(-1);
                        },
                        onKeyDown: handleKeyDown,
                        placeholder: "Rechercher...",
                        className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    })),

                    // Liste des options
                    React.createElement('div', {
                        key: 'options',
                        className: 'max-h-48 overflow-y-auto'
                    }, filteredOptions.length > 0 ? filteredOptions.map((option, index) =>
                        React.createElement('button', {
                            key: option.id,
                            type: 'button',
                            onClick: () => handleSelect(option),
                            className: `w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors
                                ${value === option.id ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}
                                ${highlightedIndex === index ? 'bg-gray-100' : ''}`
                        }, option.label)
                    ) : React.createElement('div', {
                        key: 'no-results',
                        className: 'px-3 py-2 text-sm text-gray-500 italic'
                    }, 'Aucun résultat trouvé'))
                ])
            ]),

            // Bouton "+" pour ajouter un nouvel élément
            onAddNew && React.createElement('button', {
                key: 'add-btn',
                type: 'button',
                onClick: handleAddNew,
                title: addButtonLabel,
                className: 'px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors flex items-center justify-center'
            }, React.createElement('i', {
                'data-lucide': 'plus',
                className: 'w-5 h-5'
            }))
        ])
    ]);
}

// Export global
window.SearchableDropdown = SearchableDropdown;
