// Composant StagiairePicker - Multi-sélection de stagiaires avec badges et avatars
function StagiairePicker({
    selectedIds = [],
    onChange,
    entrepriseId,
    label = "Stagiaires",
    required = false,
    className = "",
    onAddNew = null
}) {
    const { useState, useEffect, useRef } = React;
    const { contacts, loading } = window.useContacts();

    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);
    const searchInputRef = useRef(null);

    // Filtrer les stagiaires par entreprise
    const availableStagiaires = entrepriseId
        ? contacts.filter(c => c.entreprise_id === entrepriseId)
        : [];

    // Stagiaires déjà sélectionnés
    const selectedStagiaires = availableStagiaires.filter(s =>
        selectedIds.includes(s.id)
    );

    // Stagiaires non sélectionnés (pour le dropdown)
    const unselectedStagiaires = availableStagiaires.filter(s =>
        !selectedIds.includes(s.id) &&
        `${s.prenom || ''} ${s.nom || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Fermer le dropdown si on clique en dehors
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearchTerm('');
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

    const handleAddStagiaire = (stagiaireId) => {
        onChange([...selectedIds, stagiaireId]);
        setSearchTerm('');
    };

    const handleRemoveStagiaire = (stagiaireId) => {
        onChange(selectedIds.filter(id => id !== stagiaireId));
    };

    const getInitials = (prenom, nom) => {
        const p = (prenom || '').trim();
        const n = (nom || '').trim();
        return `${p.charAt(0)}${n.charAt(0)}`.toUpperCase() || '?';
    };

    // Couleurs pour les avatars (rotation basée sur l'index)
    const avatarColors = [
        'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
        'bg-indigo-500', 'bg-yellow-500', 'bg-red-500', 'bg-teal-500'
    ];

    return React.createElement('div', {
        className: className
    }, [
        // Label
        React.createElement('label', {
            key: 'label',
            className: "block text-sm font-medium text-gray-700 mb-2"
        }, [
            label,
            required && React.createElement('span', {
                key: 'required',
                className: 'text-red-500 ml-1'
            }, '*')
        ]),

        // Zone d'affichage des badges sélectionnés
        selectedStagiaires.length > 0 && React.createElement('div', {
            key: 'badges',
            className: 'flex flex-wrap gap-2 mb-3'
        }, selectedStagiaires.map((stagiaire, index) =>
            React.createElement('div', {
                key: stagiaire.id,
                className: 'inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full'
            }, [
                // Avatar avec initiales
                React.createElement('div', {
                    key: 'avatar',
                    className: `w-6 h-6 rounded-full ${avatarColors[index % avatarColors.length]} flex items-center justify-center text-white text-xs font-semibold`
                }, getInitials(stagiaire.prenom, stagiaire.nom)),

                // Nom du stagiaire
                React.createElement('span', {
                    key: 'name',
                    className: 'text-sm text-gray-700'
                }, `${stagiaire.prenom || ''} ${stagiaire.nom || ''}`.trim()),

                // Bouton de suppression
                React.createElement('button', {
                    key: 'remove',
                    type: 'button',
                    onClick: () => handleRemoveStagiaire(stagiaire.id),
                    className: 'ml-1 text-blue-600 hover:text-blue-800 focus:outline-none',
                    title: 'Retirer'
                }, React.createElement('i', {
                    'data-lucide': 'x',
                    className: 'w-4 h-4'
                }))
            ])
        )),

        // Dropdown pour ajouter des stagiaires
        React.createElement('div', {
            key: 'dropdown-container',
            ref: dropdownRef,
            className: 'relative'
        }, [
            // Bouton pour ouvrir le dropdown
            React.createElement('button', {
                key: 'trigger',
                type: 'button',
                onClick: () => !entrepriseId ? null : setIsOpen(!isOpen),
                disabled: !entrepriseId,
                className: `w-full px-3 py-2 text-left border border-gray-300 rounded-md shadow-sm bg-white
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    ${!entrepriseId ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}
                    flex items-center justify-between`
            }, [
                React.createElement('span', {
                    key: 'text',
                    className: 'text-gray-500 flex items-center gap-2'
                }, [
                    React.createElement('i', {
                        key: 'icon',
                        'data-lucide': 'user-plus',
                        className: 'w-4 h-4'
                    }),
                    React.createElement('span', {
                        key: 'label'
                    }, entrepriseId ? 'Ajouter un stagiaire' : "Sélectionnez d'abord une entreprise")
                ]),

                React.createElement('i', {
                    key: 'chevron',
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
                    onChange: (e) => setSearchTerm(e.target.value),
                    placeholder: "Rechercher un stagiaire...",
                    className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                })),

                // Bouton pour créer un nouveau stagiaire
                onAddNew && React.createElement('div', {
                    key: 'add-new',
                    className: 'p-2 border-b border-gray-200'
                }, React.createElement('button', {
                    type: 'button',
                    onClick: () => {
                        onAddNew();
                        setIsOpen(false);
                    },
                    className: 'w-full px-3 py-2 text-left text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors flex items-center gap-2'
                }, [
                    React.createElement('i', {
                        key: 'icon',
                        'data-lucide': 'user-plus',
                        className: 'w-4 h-4'
                    }),
                    React.createElement('span', {
                        key: 'text'
                    }, 'Créer un nouveau stagiaire')
                ])),

                // Liste des stagiaires disponibles
                React.createElement('div', {
                    key: 'options',
                    className: 'max-h-48 overflow-y-auto'
                }, unselectedStagiaires.length > 0 ? unselectedStagiaires.map((stagiaire, index) =>
                    React.createElement('button', {
                        key: stagiaire.id,
                        type: 'button',
                        onClick: () => handleAddStagiaire(stagiaire.id),
                        className: 'w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors flex items-center gap-3'
                    }, [
                        // Avatar
                        React.createElement('div', {
                            key: 'avatar',
                            className: `w-8 h-8 rounded-full ${avatarColors[index % avatarColors.length]} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`
                        }, getInitials(stagiaire.prenom, stagiaire.nom)),

                        // Informations du stagiaire
                        React.createElement('div', {
                            key: 'info',
                            className: 'flex-1'
                        }, [
                            React.createElement('div', {
                                key: 'name',
                                className: 'text-sm font-medium text-gray-900'
                            }, `${stagiaire.prenom || ''} ${stagiaire.nom || ''}`.trim()),
                            stagiaire.email && React.createElement('div', {
                                key: 'email',
                                className: 'text-xs text-gray-500'
                            }, stagiaire.email)
                        ])
                    ])
                ) : React.createElement('div', {
                    key: 'no-results',
                    className: 'px-3 py-2 text-sm text-gray-500 italic'
                }, selectedStagiaires.length === availableStagiaires.length
                    ? 'Tous les stagiaires ont été ajoutés'
                    : 'Aucun stagiaire trouvé'
                ))
            ])
        ])
    ]);
}

// Export global
window.StagiairePicker = StagiairePicker;
