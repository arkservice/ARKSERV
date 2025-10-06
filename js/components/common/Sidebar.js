// Composant Sidebar
function Sidebar({ activeSection, onSectionChange, onOpenSettings }) {
    const { useEffect } = React;
    const currentUserEntreprise = window.useCurrentUserEntreprise();
    
    const navigationSections = [
        {
            title: 'Gestion',
            items: [
                { id: 'entreprises', label: 'Entreprises', icon: 'building-2', indented: false },
                { id: 'projets', label: 'Projets', icon: 'folder-open', indented: false },
                { id: 'utilisateurs', label: 'Utilisateurs', icon: 'users', indented: false },
                { id: 'taches', label: 'Tâches', icon: 'check-square', indented: false }
            ]
        },
        {
            title: 'Arkance',
            items: [
                { id: 'collaborateurs', label: 'Collaborateurs', icon: 'users', indented: false },
                { id: 'services', label: 'Services', icon: 'layers', indented: false },
                { id: 'planning', label: 'Planning', icon: 'calendar', indented: false }
            ]
        },
        {
            title: 'Formation',
            items: [
                { id: 'pdc', label: 'Plan de cours', icon: 'book-open', indented: false },
                { id: 'logiciels', label: 'Logiciels', icon: 'monitor', indented: true },
                { id: 'metier-pdc', label: 'Métier', icon: 'briefcase', indented: true },
                { id: 'type-pdc', label: 'Type', icon: 'tag', indented: true },
                { id: 'evaluation-preparer', label: 'PRJ', icon: 'clipboard-list', indented: false },
                { id: 'evaluations', label: 'Evaluations', icon: 'list-checks', indented: false }
            ]
        },
        {
            title: 'Outils',
            items: [
                { id: 'template-builder', label: 'Template PDF', icon: 'file-text', indented: false },
                { id: 'rapports', label: 'Rapports', icon: 'bar-chart-3', indented: false }
            ]
        }
    ];
    
    useEffect(() => {
        lucide.createIcons();
    }, []);
    
    return React.createElement('div', {
        className: "w-64 bg-gray-800 h-screen flex flex-col"
    }, [
        React.createElement('div', {
            key: 'header',
            className: "p-6 border-b border-gray-700"
        }, [
            React.createElement('h1', {
                key: 'title',
                className: "text-xl font-bold text-white mb-2"
            }, "ARKSERV"),
            React.createElement(UserProfile, { key: 'user-profile-header' })
        ]),
        
        React.createElement('nav', {
            key: 'nav',
            className: "flex-1 overflow-y-auto px-4 py-6"
        }, React.createElement('div', {
            className: "space-y-6"
        }, navigationSections
            .filter(section => {
                // Filtrer les sections selon le type d'entreprise
                // Si l'utilisateur est de type 'client', masquer les sections 'Arkance', 'Formation' et 'Outils'
                if (currentUserEntreprise.isClientUser) {
                    return section.title !== 'Arkance' && section.title !== 'Formation' && section.title !== 'Outils';
                }
                // Pour tous les autres cas (interne, pas d'entreprise, erreur), afficher toutes les sections
                return true;
            })
            .map((section, sectionIndex, filteredSections) => 
            React.createElement('div', { key: section.title }, [
                // Titre de la section
                React.createElement('h3', {
                    key: 'section-title',
                    className: "text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3"
                }, section.title),
                
                // Liste des éléments de la section
                React.createElement('ul', {
                    key: 'section-items',
                    className: "space-y-2"
                }, section.items.map(item =>
                    React.createElement('li', { key: item.id },
                        React.createElement('button', {
                            onClick: () => onSectionChange(item.id),
                            className: `w-full flex items-center gap-3 ${item.indented ? 'pl-8 pr-3' : 'px-3'} py-2 rounded-lg text-left transition-colors ${
                                activeSection === item.id
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                            }`
                        }, [
                            React.createElement('i', {
                                key: 'icon',
                                'data-lucide': item.icon,
                                className: "w-5 h-5"
                            }),
                            item.label
                        ])
                    )
                )),
                
                // Ligne de séparation (sauf pour la dernière section filtrée)
                sectionIndex < filteredSections.length - 1 && React.createElement('hr', {
                    key: 'section-separator',
                    className: "border-gray-700 mt-4"
                })
            ])
        ))),
        
        React.createElement('div', {
            key: 'footer',
            className: "border-t border-gray-700 p-4"
        }, [
            React.createElement('button', {
                key: 'settings',
                onClick: onOpenSettings,
                className: "w-full flex items-center gap-3 px-3 py-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
            }, [
                React.createElement('i', {
                    key: 'icon',
                    'data-lucide': 'settings',
                    className: "w-5 h-5"
                }),
                "Paramètres"
            ]),
            React.createElement(LogoutButton, { key: 'logout-button' })
        ])
    ]);
}

// Composant UserProfile pour afficher les infos utilisateur
function UserProfile() {
    const { useState } = React;
    const auth = window.useAuth();
    const userProfile = window.useUserProfile(auth.user?.id);
    const [avatarError, setAvatarError] = useState(false);
    
    if (!auth.user) return null;
    
    const userEmail = auth.user.email || 'Utilisateur';
    const firstName = userProfile.profile?.prenom || '';
    const lastName = userProfile.profile?.nom || '';
    const avatarUrl = userProfile.profile?.avatar;
    
    // Générer les initiales basées sur le prénom/nom ou l'email
    const getInitials = () => {
        if (firstName && lastName) {
            return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
        } else if (firstName) {
            return firstName.substring(0, 2).toUpperCase();
        } else {
            return userEmail.substring(0, 2).toUpperCase();
        }
    };
    
    const initials = getInitials();
    const greetingText = firstName ? `Bonjour ${firstName}` : 'Bonjour Utilisateur';
    
    // Composant Avatar avec fallback
    const Avatar = React.createElement('div', {
        key: 'avatar',
        className: "w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium relative"
    }, [
        // Image avatar si disponible et pas d'erreur
        avatarUrl && !avatarError && React.createElement('img', {
            key: 'avatar-img',
            src: avatarUrl,
            alt: `Avatar de ${firstName || 'Utilisateur'}`,
            className: "w-8 h-8 rounded-full object-cover",
            onError: () => setAvatarError(true)
        }),
        // Fallback vers initiales si pas d'image ou erreur
        (!avatarUrl || avatarError) && React.createElement('div', {
            key: 'avatar-initials',
            className: "w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center"
        }, initials)
    ]);
    
    // Affichage du skeleton pendant le chargement
    if (userProfile.loading) {
        return React.createElement('div', {
            className: "flex items-center gap-3 px-3 py-2 text-gray-300 mb-2"
        }, [
            React.createElement('div', {
                key: 'avatar-skeleton',
                className: "w-8 h-8 bg-gray-600 rounded-full animate-pulse"
            }),
            React.createElement('div', {
                key: 'info-skeleton',
                className: "flex-1 min-w-0"
            }, [
                React.createElement('div', {
                    key: 'name-skeleton',
                    className: "h-4 bg-gray-600 rounded animate-pulse mb-1"
                }),
                React.createElement('div', {
                    key: 'email-skeleton',
                    className: "h-3 bg-gray-600 rounded animate-pulse w-3/4"
                })
            ])
        ]);
    }
    
    return React.createElement('div', {
        className: "flex items-center gap-3 px-3 py-2 text-gray-300 mb-2"
    }, [
        Avatar,
        React.createElement('div', {
            key: 'info',
            className: "flex-1 min-w-0"
        }, [
            React.createElement('p', {
                key: 'greeting',
                className: "text-sm font-medium truncate"
            }, greetingText),
            React.createElement('p', {
                key: 'email',
                className: "text-xs text-gray-400 truncate"
            }, userEmail)
        ])
    ]);
}

// Composant LogoutButton pour la déconnexion
function LogoutButton() {
    const auth = window.useAuth();
    const { useState } = React;
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    
    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await auth.signOut();
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
        } finally {
            setIsLoggingOut(false);
        }
    };
    
    return React.createElement('button', {
        onClick: handleLogout,
        disabled: isLoggingOut,
        className: "w-full flex items-center gap-3 px-3 py-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors mt-2 disabled:opacity-50"
    }, [
        React.createElement('i', {
            key: 'icon',
            'data-lucide': isLoggingOut ? 'loader-2' : 'log-out',
            className: `w-5 h-5 ${isLoggingOut ? 'animate-spin' : ''}`
        }),
        isLoggingOut ? "Déconnexion..." : "Déconnexion"
    ]);
}

// Export global
window.Sidebar = Sidebar;