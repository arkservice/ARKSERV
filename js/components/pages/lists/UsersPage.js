// Page Utilisateurs
function UsersPage({ onRowClick, entrepriseId, onBack }) {
    const { useState } = React;
    const { users, loading, error, createUser, createUserWithAuth, updateUser, deleteUser } = window.useUsers();
    const currentUserEntreprise = window.useCurrentUserEntreprise();
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [groupBy, setGroupBy] = useState('entreprise'); // Par défaut groupé par entreprise
    const [expandAll, setExpandAll] = useState(true);
    
    const columns = [
        { 
            key: 'avatar', 
            label: 'Avatar', 
            type: 'text',
            render: (value, row) => {
                return React.createElement(AvatarCell, {
                    key: `avatar-${row.id}`,
                    avatarUrl: value,
                    prenom: row.prenom,
                    nom: row.nom
                });
            }
        },
        { 
            key: 'nom_complet', 
            label: 'Nom', 
            type: 'text', 
            sortable: true,
            render: (value, row) => {
                const nomComplet = `${row.prenom || ''} ${row.nom || ''}`.trim();
                return nomComplet || '-';
            }
        },
        { 
            key: 'email', 
            label: 'Email', 
            type: 'text',
            sortable: true,
            render: (value, row) => {
                if (!value) return '-';
                
                // Tronquer l'email s'il est trop long
                if (value.length > 25) {
                    return React.createElement('span', {
                        title: value,
                        className: 'truncate'
                    }, value.substring(0, 22) + '...');
                }
                
                return value;
            }
        },
        { 
            key: 'entreprise', 
            label: 'Entreprise', 
            type: 'text',
            render: (value, row) => {
                return row.entreprise?.nom || '-';
            }
        },
        { 
            key: 'telephone', 
            label: 'Téléphone', 
            type: 'text',
            render: (value, row) => {
                return row.telephone || '-';
            }
        },
        {
            key: 'actions',
            label: 'Actions',
            type: 'actions'
        }
    ];
    
    const handleAdd = () => {
        setEditingItem(null);
        setShowModal(true);
    };
    
    const handleEdit = (item) => {
        setEditingItem(item);
        setShowModal(true);
    };
    
    const handleDelete = async (item) => {
        const nomComplet = `${item.prenom || ''} ${item.nom || ''}`.trim();
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${nomComplet}" ?`)) {
            try {
                await deleteUser(item.id);
            } catch (error) {
                console.error('Erreur:', error);
            }
        }
    };
    
    const handleSubmit = async (formData) => {
        try {
            if (editingItem) {
                await updateUser(editingItem.id, formData);
            } else {
                // Utiliser createUserWithAuth pour les nouveaux utilisateurs
                await createUserWithAuth(formData);
            }
            setShowModal(false);
            setEditingItem(null);
        } catch (error) {
            console.error('Erreur:', error);
            // L'erreur sera affichée dans le modal via le hook
        }
    };
    
    if (error) {
        return React.createElement('div', {
            className: "bg-red-50 border border-red-200 rounded-lg p-4"
        }, React.createElement('p', {
            className: "text-red-800"
        }, `Erreur: ${error}`));
    }
    
    // Filtrer les utilisateurs selon le type d'utilisateur et le contexte
    const filteredUsers = (() => {
        // Si un ID d'entreprise spécifique est fourni, filtrer par cette entreprise
        if (entrepriseId) {
            return users.filter(user => user.entreprise?.id === entrepriseId);
        }
        
        // Si utilisateur client, ne montrer que les utilisateurs des entreprises clientes
        if (currentUserEntreprise.isClientUser) {
            return users.filter(user => 
                user.entreprise?.type_entreprise === 'client'
            );
        }
        
        // Si utilisateur ARKANCE, dans la page utilisateur, ne montrer que les entreprises clientes
        if (currentUserEntreprise.isArkanceUser) {
            return users.filter(user => 
                user.entreprise?.type_entreprise === 'client'
            );
        }
        
        // Cas par défaut
        return users;
    })();
    
    // Adapter l'interface selon le type d'utilisateur
    const getPageTitle = () => {
        if (currentUserEntreprise.isClientUser) {
            if (entrepriseId && filteredUsers.length > 0) {
                const entrepriseName = filteredUsers[0]?.entreprise?.nom || 'Mon Entreprise';
                return `Mon Équipe - ${entrepriseName}`;
            }
            return groupBy ? "Mon Équipe par " + (groupBy === 'entreprise' ? 'entreprise' : 'service') : "Mon Équipe";
        }
        
        // Pour les utilisateurs Arkance
        if (entrepriseId && filteredUsers.length > 0) {
            const entrepriseName = filteredUsers[0]?.entreprise?.nom || 'Entreprise';
            return `Utilisateurs - ${entrepriseName}`;
        }
        if (!groupBy) return "Utilisateurs";
        switch(groupBy) {
            case 'entreprise': return "Utilisateurs par entreprise";
            case 'service': return "Utilisateurs par service";
            default: return "Utilisateurs";
        }
    };
    
    const getPageSubtitle = () => {
        if (currentUserEntreprise.isClientUser) {
            if (entrepriseId) {
                return `${filteredUsers.length} membre(s) de votre équipe`;
            }
            return "Utilisateurs de votre entreprise";
        }
        
        // Pour les utilisateurs Arkance
        if (entrepriseId) {
            return `${filteredUsers.length} utilisateur(s) dans cette entreprise`;
        }
        if (!groupBy) return "Gérez les utilisateurs et leurs informations";
        switch(groupBy) {
            case 'entreprise': return "Gérez les utilisateurs groupés par entreprise";
            case 'service': return "Gérez les utilisateurs groupés par service";
            default: return "Gérez les utilisateurs et leurs informations";
        }
    };
    
    const canAddUser = () => {
        // Seuls les utilisateurs Arkance peuvent ajouter des utilisateurs
        return currentUserEntreprise.isArkanceUser;
    };
    
    const canEditUser = () => {
        // Utilisateurs Arkance peuvent modifier tous les profils
        // Utilisateurs clients peuvent modifier leur propre profil (géré par RLS)
        return currentUserEntreprise.isArkanceUser;
    };
    
    const canDeleteUser = () => {
        // Seuls les utilisateurs Arkance peuvent supprimer des utilisateurs
        return currentUserEntreprise.isArkanceUser;
    };

    // Titre personnalisé selon le contexte et le groupement
    const getTitle = () => getPageTitle();
    const getSubtitle = () => getPageSubtitle();
    
    return React.createElement('div', {}, [
        // Bouton retour conditionnel
        entrepriseId && onBack && React.createElement('div', {
            key: 'back-button',
            className: 'mb-4'
        }, React.createElement('button', {
            onClick: onBack,
            className: 'flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors'
        }, [
            React.createElement('i', {
                key: 'icon',
                'data-lucide': 'arrow-left',
                className: 'w-4 h-4 mr-2'
            }),
            React.createElement('span', {
                key: 'text'
            }, (() => {
                if (filteredUsers.length > 0) {
                    const entrepriseName = filteredUsers[0]?.entreprise?.nom || 'Entreprise';
                    return `Retour à ${entrepriseName}`;
                }
                return 'Retour à l\'entreprise';
            })())
        ])),
        
        // Affichage conditionnel selon le mode de groupement
        groupBy ? 
            React.createElement(window.GroupedTableView, {
                key: 'grouped-table',
                data: filteredUsers,
                columns: columns,
                title: getTitle(),
                subtitle: getSubtitle(),
                loading: loading,
                onAdd: canAddUser() ? handleAdd : null,
                onEdit: canEditUser() ? handleEdit : null,
                onDelete: canDeleteUser() ? handleDelete : null,
                onRowClick: onRowClick,
                groupBy: groupBy,
                expandAll: expandAll,
                groupingOptions: ['entreprise'],
                onGroupChange: setGroupBy,
                onExpandChange: setExpandAll,
                entityType: 'utilisateur'
            }) :
            React.createElement(window.TableView, {
                key: 'table',
                data: filteredUsers,
                columns: columns,
                title: getTitle(),
                subtitle: getSubtitle(),
                loading: loading,
                onAdd: canAddUser() ? handleAdd : null,
                onEdit: canEditUser() ? handleEdit : null,
                onDelete: canDeleteUser() ? handleDelete : null,
                onRowClick: onRowClick,
                groupBy: groupBy,
                expandAll: expandAll,
                groupingOptions: ['entreprise'],
                onGroupChange: setGroupBy,
                onExpandChange: setExpandAll
            }),
        
        showModal && React.createElement(window.UserModal, {
            key: 'modal',
            item: editingItem,
            defaultEntrepriseId: entrepriseId,
            onSubmit: handleSubmit,
            onClose: () => {
                setShowModal(false);
                setEditingItem(null);
            }
        })
    ]);
}

// Composant AvatarCell pour gérer l'affichage des avatars
function AvatarCell({ avatarUrl, prenom, nom }) {
    const { useState } = React;
    const [imageError, setImageError] = useState(false);
    
    const initials = `${prenom?.[0] || ''}${nom?.[0] || ''}`.toUpperCase();
    
    if (!avatarUrl || imageError) {
        // Fallback avec initiales
        return React.createElement('div', {
            className: 'w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-medium'
        }, initials || '?');
    }
    
    return React.createElement('img', {
        src: avatarUrl,
        alt: `Avatar de ${prenom} ${nom}`,
        className: 'w-8 h-8 rounded-full object-cover',
        onError: () => setImageError(true)
    });
}

// Composant CompetencesCell pour afficher les compétences avec logos et badges
function CompetencesCell({ competences }) {
    if (!competences || competences.length === 0) {
        return React.createElement('span', {
            className: 'text-gray-400 text-sm'
        }, '-');
    }
    
    const maxVisible = 3;
    const visibleCompetences = competences.slice(0, maxVisible);
    const remainingCount = competences.length - maxVisible;
    
    return React.createElement('div', {
        className: 'flex items-center gap-1'
    }, [
        ...visibleCompetences.map((competence, index) => {
            return React.createElement(CompetenceLogoWithBadge, {
                key: `competence-${competence.id}`,
                competence: competence
            });
        }),
        remainingCount > 0 && React.createElement('span', {
            key: 'remaining',
            className: 'text-xs text-gray-500 ml-1',
            title: `${remainingCount} autre${remainingCount > 1 ? 's' : ''} compétence${remainingCount > 1 ? 's' : ''}`
        }, `+${remainingCount}`)
    ]);
}

// Composant pour afficher un logo de logiciel avec badge de niveau
function CompetenceLogoWithBadge({ competence }) {
    const { useState } = React;
    const [imageError, setImageError] = useState(false);
    
    const logiciel = competence.logiciel;
    const niveau = competence.niveau;
    
    if (!logiciel) return null;
    
    const getBadgeColor = (niveau) => {
        const colors = {
            1: 'bg-red-500',
            2: 'bg-orange-500',
            3: 'bg-yellow-500',
            4: 'bg-blue-500',
            5: 'bg-green-500'
        };
        return colors[niveau] || 'bg-gray-500';
    };
    
    return React.createElement('div', {
        className: 'relative',
        title: `${logiciel.nom} - Niveau ${niveau}`
    }, [
        // Logo du logiciel
        logiciel.logo && !imageError ? 
            React.createElement('img', {
                key: 'logo',
                src: logiciel.logo,
                alt: `Logo ${logiciel.nom}`,
                className: 'w-6 h-6 rounded object-cover',
                onError: () => setImageError(true)
            }) :
            React.createElement('div', {
                key: 'fallback',
                className: 'w-6 h-6 bg-gray-100 rounded flex items-center justify-center'
            }, React.createElement('i', {
                'data-lucide': 'monitor',
                className: 'w-3 h-3 text-gray-400'
            })),
        
        // Badge de niveau
        React.createElement('div', {
            key: 'badge',
            className: `absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold ${getBadgeColor(niveau)}`
        }, niveau)
    ]);
}

// Export global
window.UsersPage = UsersPage;