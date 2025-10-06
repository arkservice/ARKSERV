// Composant d'autocomplétion d'adresses réutilisable
function AddressAutocomplete({
    value = '',
    onChange,
    placeholder = 'Entrez une adresse...',
    className = '',
    disabled = false
}) {
    const [query, setQuery] = React.useState(value);
    const [suggestions, setSuggestions] = React.useState([]);
    const [isOpen, setIsOpen] = React.useState(false);
    const [selectedIndex, setSelectedIndex] = React.useState(-1);
    const [isLoading, setIsLoading] = React.useState(false);
    
    const inputRef = React.useRef(null);
    const containerRef = React.useRef(null);
    const suggestionRefs = React.useRef([]);

    // Synchroniser la valeur avec le parent
    React.useEffect(() => {
        if (value !== query) {
            setQuery(value);
        }
    }, [value]);

    // Recherche d'adresses
    const handleSearch = React.useCallback((searchQuery) => {
        if (!searchQuery || searchQuery.trim().length < 3) {
            setSuggestions([]);
            setIsOpen(false);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        window.addressAutocompleteService.searchAddresses(
            searchQuery,
            (results) => {
                setSuggestions(results);
                setIsOpen(results.length > 0);
                setSelectedIndex(-1);
                setIsLoading(false);
            }
        );
    }, []);

    // Gestion des changements dans l'input
    const handleInputChange = (e) => {
        const newValue = e.target.value;
        setQuery(newValue);
        onChange && onChange(newValue);
        handleSearch(newValue);
    };

    // Sélection d'une suggestion
    const selectSuggestion = (suggestion) => {
        setQuery(suggestion.label);
        onChange && onChange(suggestion.label);
        setSuggestions([]);
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
    };

    // Gestion du clavier
    const handleKeyDown = (e) => {
        if (!isOpen || suggestions.length === 0) {
            if (e.key === 'ArrowDown' && suggestions.length === 0) {
                handleSearch(query);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => 
                    prev < suggestions.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => 
                    prev > 0 ? prev - 1 : suggestions.length - 1
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
                    selectSuggestion(suggestions[selectedIndex]);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                setSuggestions([]);
                setSelectedIndex(-1);
                inputRef.current?.blur();
                break;
        }
    };

    // Fermer les suggestions au clic extérieur
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
                setSelectedIndex(-1);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Scroll automatique vers l'élément sélectionné
    React.useEffect(() => {
        if (selectedIndex >= 0 && suggestionRefs.current[selectedIndex]) {
            suggestionRefs.current[selectedIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
            });
        }
    }, [selectedIndex]);

    // Mise en surbrillance des termes recherchés
    const highlightMatch = (text, query) => {
        if (!query || query.length < 2) return text;
        
        const words = query.toLowerCase().split(' ').filter(word => word.length > 1);
        let highlighted = text;
        
        words.forEach(word => {
            const regex = new RegExp(`(${word})`, 'gi');
            highlighted = highlighted.replace(regex, '<mark class="bg-yellow-200 px-0.5 rounded">$1</mark>');
        });
        
        return highlighted;
    };

    // Classes CSS par défaut
    const defaultInputClasses = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";
    const inputClasses = className || defaultInputClasses;

    return React.createElement('div', {
        ref: containerRef,
        className: "relative"
    }, [
        // Input principal
        React.createElement('div', {
            key: 'input-container',
            className: "relative"
        }, [
            React.createElement('input', {
                key: 'address-input',
                ref: inputRef,
                type: 'text',
                value: query,
                onChange: handleInputChange,
                onKeyDown: handleKeyDown,
                onFocus: () => {
                    if (suggestions.length > 0) {
                        setIsOpen(true);
                    }
                },
                placeholder,
                disabled,
                className: inputClasses,
                autoComplete: 'off',
                'aria-expanded': isOpen,
                'aria-haspopup': 'listbox',
                role: 'combobox'
            }),
            
            // Indicateur de chargement
            isLoading && React.createElement('div', {
                key: 'loading-indicator',
                className: "absolute right-3 top-1/2 transform -translate-y-1/2"
            }, React.createElement('div', {
                className: "animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"
            }))
        ]),
        
        // Liste des suggestions
        isOpen && suggestions.length > 0 && React.createElement('div', {
            key: 'suggestions-container',
            className: "absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
        }, suggestions.map((suggestion, index) => 
            React.createElement('div', {
                key: `suggestion-${suggestion.id}`,
                ref: (el) => suggestionRefs.current[index] = el,
                className: `px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                    index === selectedIndex 
                        ? 'bg-blue-50 border-blue-200' 
                        : 'hover:bg-gray-50'
                }`,
                onClick: () => selectSuggestion(suggestion),
                role: 'option',
                'aria-selected': index === selectedIndex
            }, [
                React.createElement('div', {
                    key: 'suggestion-label',
                    className: "font-medium text-gray-900 text-sm",
                    dangerouslySetInnerHTML: {
                        __html: highlightMatch(suggestion.label, query)
                    }
                }),
                suggestion.context && React.createElement('div', {
                    key: 'suggestion-context',
                    className: "text-xs text-gray-500 mt-1"
                }, suggestion.context)
            ])
        ))
    ]);
}

// Export global
window.AddressAutocomplete = AddressAutocomplete;