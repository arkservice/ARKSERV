// Composant réutilisable pour afficher les détails d'une tâche
// Section collapsible avec chevron et titre personnalisé
function CollapsibleTaskSection({ tache }) {
    const { useState } = React;
    
    // État pour gérer l'ouverture/fermeture (ouvert par défaut)
    const [isExpanded, setIsExpanded] = useState(true);
    
    // Fonction pour basculer l'état
    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };
    
    // Si pas de tâche, ne rien afficher
    if (!tache) {
        return null;
    }
    
    // Fonction utilitaire pour afficher les valeurs avec style orange si vide
    const renderValue = (value, className = "text-sm text-gray-900") => {
        if (!value || value === '-') {
            return React.createElement('span', {
                className: "text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded font-medium"
            }, "Non renseigné");
        }
        return React.createElement('span', {
            className
        }, value);
    };
    
    // Fonction pour déterminer le badge de statut avec couleurs
    const getStatusBadge = (status) => {
        if (status === 'completed') {
            return {
                text: 'Terminé',
                className: 'bg-green-100 text-green-800 border border-green-200'
            };
        } else {
            return {
                text: 'À faire',
                className: 'bg-orange-100 text-orange-800 border border-orange-200'
            };
        }
    };
    
    return React.createElement('div', {
        className: "bg-white rounded-lg border border-gray-200 p-6"
    }, [
        // En-tête avec titre, chevron et statut
        React.createElement('div', {
            key: 'header',
            className: "flex items-center justify-between cursor-pointer",
            onClick: toggleExpanded
        }, [
            // Section gauche : chevron + titre
            React.createElement('div', {
                key: 'header-left',
                className: "flex items-center"
            }, [
                // Chevron simple avec SVG inline (mêmes icônes que les autres composants collapsibles)
                React.createElement('svg', {
                    key: 'chevron',
                    className: `w-5 h-5 text-gray-600 mr-3 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`,
                    fill: 'none',
                    stroke: 'currentColor',
                    strokeWidth: '2',
                    viewBox: '0 0 24 24',
                    xmlns: 'http://www.w3.org/2000/svg'
                }, React.createElement('polyline', {
                    points: '9 18 15 12 9 6'
                })),
                // Titre avec nom de la tâche
                React.createElement('h2', {
                    key: 'title',
                    className: "text-lg font-medium text-gray-900"
                }, [
                    "Tâche : ",
                    React.createElement('span', {
                        key: 'nom',
                        className: "font-bold",
                        style: { fontSize: '1.15em' }
                    }, tache.title)
                ])
            ]),
            
            // Section droite : badge statut
            React.createElement('div', {
                key: 'header-right',
                className: "flex items-center"
            }, [
                React.createElement('span', {
                    key: 'status-badge-header',
                    className: `inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(tache.status).className}`
                }, getStatusBadge(tache.status).text)
            ])
        ]),
        
        // Contenu détaillé (affiché seulement si expanded)
        isExpanded && React.createElement('div', {
            key: 'content',
            className: "mt-4 animate-in slide-in-from-top-1 duration-200"
        }, [
            // Description de la tâche (fond gris clair)
            tache.description && React.createElement('div', {
                key: 'description',
                className: "mb-4 p-4 bg-gray-50 rounded-lg"
            }, [
                React.createElement('label', {
                    key: 'label',
                    className: "block text-sm font-medium text-gray-700 mb-2"
                }, "Description"),
                React.createElement('p', {
                    key: 'value',
                    className: "text-sm text-gray-900 leading-relaxed"
                }, tache.description)
            ]),
            
            // Grille des informations (3 colonnes)
            React.createElement('div', {
                key: 'details-grid',
                className: "grid grid-cols-1 md:grid-cols-3 gap-4"
            }, [
                // Assigné à (avec avatar, nom, email, téléphone)
                React.createElement('div', { key: 'assigned' }, [
                    React.createElement('label', {
                        key: 'label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Assigné à"),
                    tache.assigned_user ? React.createElement('div', {
                        key: 'value',
                        className: "flex items-start gap-3"
                    }, [
                        React.createElement('div', {
                            key: 'avatar',
                            className: "w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 flex-shrink-0"
                        }, tache.assigned_user.avatar ? React.createElement('img', {
                            src: tache.assigned_user.avatar,
                            alt: `${tache.assigned_user.prenom} ${tache.assigned_user.nom}`,
                            className: "w-8 h-8 rounded-full object-cover"
                        }) : `${tache.assigned_user.prenom?.[0]}${tache.assigned_user.nom?.[0]}`),
                        React.createElement('div', {
                            key: 'info',
                            className: "flex-1 min-w-0"
                        }, [
                            React.createElement('div', {
                                key: 'name',
                                className: "text-sm font-medium text-gray-900 mb-1"
                            }, `${tache.assigned_user.prenom} ${tache.assigned_user.nom}`),
                            tache.assigned_user.email && React.createElement('div', {
                                key: 'email',
                                className: "flex items-center gap-1 text-xs text-gray-600 mb-1"
                            }, [
                                React.createElement('span', { key: 'icon' }, "📧"),
                                React.createElement('span', { key: 'text' }, tache.assigned_user.email)
                            ]),
                            tache.assigned_user.telephone && React.createElement('div', {
                                key: 'phone',
                                className: "flex items-center gap-1 text-xs text-gray-600"
                            }, [
                                React.createElement('span', { key: 'icon' }, "📞"),
                                React.createElement('span', { key: 'text' }, tache.assigned_user.telephone)
                            ])
                        ])
                    ]) : renderValue(null)
                ]),
                
                // Date de création
                React.createElement('div', { key: 'created' }, [
                    React.createElement('label', {
                        key: 'label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Créé le"),
                    React.createElement('p', {
                        key: 'value',
                        className: "text-sm text-gray-900"
                    }, new Date(tache.created_at).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    }))
                ]),
                
                // Date de modification
                React.createElement('div', { key: 'updated' }, [
                    React.createElement('label', {
                        key: 'label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Modifié le"),
                    React.createElement('p', {
                        key: 'value',
                        className: "text-sm text-gray-900"
                    }, new Date(tache.updated_at).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    }))
                ])
            ])
        ])
    ]);
}

// Exporter le composant
window.CollapsibleTaskSection = CollapsibleTaskSection;