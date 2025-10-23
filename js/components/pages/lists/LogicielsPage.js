// Page Logiciels
function LogicielsPage({ onNavigateToUser }) {
    const { useState, useEffect } = React;
    const { logiciels, loading, error, deleteLogiciel } = window.useLogicielsWithCompetences();
    const [currentView, setCurrentView] = useState('list'); // 'list' | 'detail'
    const [selectedLogicielId, setSelectedLogicielId] = useState(null);
    
    // Initialiser les icônes Lucide
    useEffect(() => {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }, [currentView]);
    
    const columns = [
        { 
            key: 'logiciel', 
            label: 'Logiciel', 
            type: 'text',
            sortable: true,
            sortKey: 'nom',
            render: (value, item) => {
                return React.createElement('div', {
                    className: 'flex items-center',
                    style: { gap: '30px' }
                }, [
                    // Logo
                    React.createElement('div', {
                        key: 'logo-container',
                        className: 'flex-shrink-0'
                    }, 
                        item.logo ? React.createElement('img', {
                            key: 'logo-img',
                            src: item.logo,
                            alt: `Logo ${item.nom}`,
                            className: 'w-8 h-8 object-cover rounded',
                            onError: (e) => {
                                e.target.style.display = 'none';
                                e.target.parentNode.querySelector('.logo-fallback').style.display = 'flex';
                            }
                        }) : null,
                        React.createElement('div', {
                            key: 'logo-fallback',
                            className: 'logo-fallback w-8 h-8 bg-white border border-gray-300 rounded',
                            style: { display: item.logo ? 'none' : 'flex' }
                        })
                    ),
                    // Nom
                    React.createElement('div', {
                        key: 'nom-container',
                        className: 'flex-1 min-w-0'
                    }, React.createElement('span', {
                        className: 'font-medium text-gray-900'
                    }, item.nom))
                ]);
            }
        },
        { key: 'editeur', label: 'Éditeur', type: 'text', sortable: true },
        { key: 'code_logiciel', label: 'Code logiciel', type: 'text' },
        { 
            key: 'utilisateurs_competents', 
            label: 'Utilisateurs compétents', 
            type: 'text',
            render: (value, item) => {
                const users = item.utilisateurs_competents || [];
                
                if (users.length === 0) {
                    return React.createElement('span', {
                        className: 'text-gray-400 text-sm'
                    }, 'Aucun utilisateur compétent');
                }
                
                return React.createElement('div', {
                    className: 'flex flex-wrap gap-2'
                }, users.map(competence => {
                    const user = competence.user_profile;
                    const fullName = `${user.prenom} ${user.nom || ''}`.trim();
                    const initials = user.prenom ? `${user.prenom.charAt(0)}${user.nom ? user.nom.charAt(0) : ''}` : '?';
                    
                    return React.createElement('div', {
                        key: competence.id,
                        className: 'flex items-center gap-2 bg-gray-50 rounded-lg px-2 py-1',
                        title: `${fullName} - Niveau ${competence.niveau}/5`
                    }, [
                        // Avatar
                        React.createElement('div', {
                            key: 'avatar',
                            className: 'flex-shrink-0'
                        }, user.avatar ? 
                            React.createElement('img', {
                                key: 'avatar-img',
                                src: user.avatar,
                                alt: `Avatar ${fullName}`,
                                className: 'w-6 h-6 rounded-full object-cover',
                                onError: (e) => {
                                    e.target.style.display = 'none';
                                    e.target.parentNode.querySelector('.avatar-fallback').style.display = 'flex';
                                }
                            }) : null,
                            React.createElement('div', {
                                key: 'avatar-fallback',
                                className: 'avatar-fallback w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium',
                                style: { display: user.avatar ? 'none' : 'flex' }
                            }, initials)
                        ),
                        // Nom et niveau
                        React.createElement('div', {
                            key: 'info',
                            className: 'flex items-center gap-1'
                        }, [
                            React.createElement('span', {
                                key: 'name',
                                className: 'text-sm font-medium text-gray-700'
                            }, fullName),
                            React.createElement('span', {
                                key: 'level',
                                className: 'text-xs text-gray-500'
                            }, `(${competence.niveau}/5)`)
                        ])
                    ]);
                }));
            }
        }
    ];
    
    const handleAdd = () => {
        setSelectedLogicielId(null);
        setCurrentView('detail');
    };
    
    const handleEdit = (item) => {
        setSelectedLogicielId(item.id);
        setCurrentView('detail');
    };
    
    const handleBackToList = () => {
        setCurrentView('list');
        setSelectedLogicielId(null);
    };
    
    const handleDelete = async (item) => {
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${item.nom}" ?`)) {
            try {
                await deleteLogiciel(item.id);
            } catch (error) {
                console.error('Erreur:', error);
            }
        }
    };
    
    
    if (error) {
        return React.createElement('div', {
            className: "bg-red-50 border border-red-200 rounded-lg p-4"
        }, React.createElement('p', {
            className: "text-red-800"
        }, `Erreur: ${error}`));
    }
    
    // Affichage conditionnel : liste ou page détail
    if (currentView === 'detail') {
        return React.createElement(window.LogicielDetailPage, {
            key: 'detail-page',
            logicielId: selectedLogicielId,
            onBack: handleBackToList,
            onNavigateToUser: onNavigateToUser
        });
    }
    
    // Vue liste
    return React.createElement(window.TableView, {
        data: logiciels,
        columns: columns,
        title: "Logiciels",
        subtitle: "Gérez les logiciels utilisés dans les formations",
        loading: loading,
        onAdd: handleAdd,
        onRowClick: handleEdit,
        onEdit: handleEdit,
        onDelete: handleDelete,
        searchableFields: ['nom']
    });
}


// Export global
window.LogicielsPage = LogicielsPage;