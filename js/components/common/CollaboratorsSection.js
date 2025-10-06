function CollaboratorsSection({ 
    users = [], 
    selectedUserIds = [], 
    onSelectionChange,
    groupBy = 'service', // 'service', 'fonction', 'none'
    getUserDisplayName,
    getUserInitials
}) {
    const { useState } = React;
    const [expandedGroups, setExpandedGroups] = useState({});
    const [selectedGroups, setSelectedGroups] = useState({});
    
    // Grouper les utilisateurs selon le critère choisi
    const groupUsers = () => {
        if (groupBy === 'none') {
            return { 'Tous les collaborateurs': users };
        }
        
        const groups = {};
        users.forEach(user => {
            let groupKey;
            if (groupBy === 'service') {
                groupKey = user.service?.nom || 'Sans service';
            } else if (groupBy === 'fonction') {
                groupKey = user.fonction?.nom || 'Sans fonction';
            } else {
                groupKey = 'Tous les collaborateurs';
            }
            
            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }
            groups[groupKey].push(user);
        });
        
        return groups;
    };
    
    const groupedUsers = groupUsers();
    const groupNames = Object.keys(groupedUsers);
    
    // Initialiser les groupes expanded par défaut
    React.useEffect(() => {
        const initialExpanded = {};
        groupNames.forEach(groupName => {
            initialExpanded[groupName] = true;
        });
        setExpandedGroups(initialExpanded);
    }, [groupBy, users.length]);
    
    // Gérer la sélection d'un groupe entier
    const handleGroupSelection = (groupName, isChecked) => {
        const groupUserIds = groupedUsers[groupName].map(user => user.id);
        
        if (isChecked) {
            // Ajouter tous les utilisateurs du groupe
            const newSelectedIds = [...new Set([...selectedUserIds, ...groupUserIds])];
            onSelectionChange(newSelectedIds);
            setSelectedGroups(prev => ({ ...prev, [groupName]: true }));
        } else {
            // Retirer tous les utilisateurs du groupe
            const newSelectedIds = selectedUserIds.filter(id => !groupUserIds.includes(id));
            onSelectionChange(newSelectedIds);
            setSelectedGroups(prev => ({ ...prev, [groupName]: false }));
        }
    };
    
    // Gérer la sélection d'un utilisateur individuel
    const handleUserSelection = (userId, isChecked) => {
        if (isChecked) {
            onSelectionChange([...selectedUserIds, userId]);
        } else {
            onSelectionChange(selectedUserIds.filter(id => id !== userId));
        }
        
        // Mettre à jour l'état des groupes
        updateGroupStates();
    };
    
    // Mettre à jour l'état de sélection des groupes
    const updateGroupStates = () => {
        const newGroupStates = {};
        groupNames.forEach(groupName => {
            const groupUserIds = groupedUsers[groupName].map(user => user.id);
            const selectedInGroup = groupUserIds.filter(id => selectedUserIds.includes(id));
            
            if (selectedInGroup.length === groupUserIds.length) {
                newGroupStates[groupName] = true;
            } else if (selectedInGroup.length > 0) {
                newGroupStates[groupName] = 'indeterminate';
            } else {
                newGroupStates[groupName] = false;
            }
        });
        setSelectedGroups(newGroupStates);
    };
    
    // Mettre à jour les états des groupes quand la sélection change
    React.useEffect(() => {
        updateGroupStates();
    }, [selectedUserIds, groupBy]);
    
    // Basculer l'expansion d'un groupe
    const toggleGroupExpansion = (groupName) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupName]: !prev[groupName]
        }));
    };
    
    // Créer une checkbox utilisateur
    const createUserCheckbox = (user) => {
        const isSelected = selectedUserIds.includes(user.id);
        
        return React.createElement('label', {
            key: user.id,
            className: "flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer ml-6"
        }, [
            React.createElement('input', {
                key: 'checkbox',
                type: 'checkbox',
                checked: isSelected,
                onChange: (e) => handleUserSelection(user.id, e.target.checked),
                className: "h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            }),
            React.createElement('div', {
                key: 'user-info',
                className: "flex items-center space-x-2"
            }, [
                React.createElement('div', {
                    key: 'avatar',
                    className: "h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium"
                }, getUserInitials(user)),
                React.createElement('div', {
                    key: 'details',
                    className: "flex flex-col"
                }, [
                    React.createElement('span', {
                        key: 'name',
                        className: "text-sm font-medium text-gray-900"
                    }, getUserDisplayName(user)),
                    user.fonction && React.createElement('span', {
                        key: 'function',
                        className: "text-xs text-gray-500"
                    }, user.fonction.nom)
                ])
            ])
        ]);
    };
    
    // Créer un groupe avec en-tête et utilisateurs
    const createGroupSection = (groupName, users) => {
        const isExpanded = expandedGroups[groupName];
        const groupState = selectedGroups[groupName];
        const isChecked = groupState === true;
        const isIndeterminate = groupState === 'indeterminate';
        
        return React.createElement('div', {
            key: groupName,
            className: "mb-4"
        }, [
            // En-tête du groupe
            React.createElement('div', {
                key: 'group-header',
                className: "flex items-center space-x-2 p-2 bg-gray-50 rounded-lg mb-2"
            }, [
                // Checkbox du groupe
                React.createElement('input', {
                    key: 'group-checkbox',
                    type: 'checkbox',
                    checked: isChecked,
                    ref: (el) => {
                        if (el) el.indeterminate = isIndeterminate;
                    },
                    onChange: (e) => handleGroupSelection(groupName, e.target.checked),
                    className: "h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                }),
                
                // Bouton d'expansion/réduction
                React.createElement('button', {
                    key: 'expand-button',
                    onClick: () => toggleGroupExpansion(groupName),
                    className: "p-1 hover:bg-gray-200 rounded"
                }, React.createElement('svg', {
                    className: `w-4 h-4 text-gray-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`,
                    fill: 'none',
                    stroke: 'currentColor',
                    viewBox: '0 0 24 24'
                }, React.createElement('path', {
                    strokeLinecap: 'round',
                    strokeLinejoin: 'round',
                    strokeWidth: 2,
                    d: 'm9 18 6-6-6-6'
                }))),
                
                // Nom du groupe et compteur
                React.createElement('div', {
                    key: 'group-info',
                    className: "flex-1"
                }, [
                    React.createElement('span', {
                        key: 'name',
                        className: "font-medium text-gray-900"
                    }, groupName),
                    React.createElement('span', {
                        key: 'count',
                        className: "ml-2 text-sm text-gray-500"
                    }, `(${users.length})`)
                ])
            ]),
            
            // Liste des utilisateurs (si expanded)
            isExpanded && React.createElement('div', {
                key: 'users-list',
                className: "space-y-1"
            }, users.map(user => createUserCheckbox(user)))
        ]);
    };
    
    return React.createElement('div', {
        className: "space-y-2"
    }, [
        // Statistiques
        React.createElement('p', {
            key: 'stats',
            className: "text-sm text-gray-500 mb-4"
        }, `${selectedUserIds.length}/${users.length} collaborateurs sélectionnés`),
        
        // Boutons de sélection globale
        React.createElement('div', {
            key: 'global-buttons',
            className: "flex space-x-2 mb-4"
        }, [
            React.createElement('button', {
                key: 'select-all',
                onClick: () => onSelectionChange(users.map(u => u.id)),
                className: "px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            }, "Tout sélectionner"),
            React.createElement('button', {
                key: 'deselect-all',
                onClick: () => onSelectionChange([]),
                className: "px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
            }, "Tout désélectionner")
        ]),
        
        // Groupes de collaborateurs
        React.createElement('div', {
            key: 'groups',
            className: "space-y-2"
        }, groupNames.map(groupName => 
            createGroupSection(groupName, groupedUsers[groupName])
        ))
    ]);
}

window.CollaboratorsSection = CollaboratorsSection;