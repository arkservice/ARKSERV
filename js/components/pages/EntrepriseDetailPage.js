// Page de détail d'une entreprise
function EntrepriseDetailPage({ entrepriseId, onBack, onNavigateToProject, onNavigateToUsers }) {
    const { useState, useEffect } = React;
    const supabase = window.supabaseConfig.client;
    
    const [entreprise, setEntreprise] = useState(null);
    const [employes, setEmployes] = useState([]);
    const [projets, setProjets] = useState([]);
    const [evenements, setEvenements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        if (entrepriseId) {
            fetchEntrepriseDetails();
        }
    }, [entrepriseId]);
    
    const fetchEntrepriseDetails = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Charger les détails de l'entreprise
            const { data: entrepriseData, error: entrepriseError } = await supabase
                .from('entreprise')
                .select('*')
                .eq('id', entrepriseId)
                .single();
            
            if (entrepriseError) throw entrepriseError;
            setEntreprise(entrepriseData);
            
            // Charger les employés
            const { data: employesData, error: employesError } = await supabase
                .from('user_profile')
                .select(`
                    *,
                    service:service_id(nom),
                    fonction:fonction_id(nom)
                `)
                .eq('entreprise_id', entrepriseId);
            
            if (employesError) throw employesError;
            setEmployes(employesData || []);
            
            // Charger les projets
            const { data: projetsData, error: projetsError } = await supabase
                .from('projects')
                .select('*')
                .eq('entreprise_id', entrepriseId);
            
            if (projetsError) throw projetsError;
            setProjets(projetsData || []);
            
            // Charger les événements
            const { data: evenementsData, error: evenementsError } = await supabase
                .from('evenement')
                .select('*')
                .eq('entreprise_cliente_id', entrepriseId);
            
            if (evenementsError) throw evenementsError;
            setEvenements(evenementsData || []);
            
        } catch (err) {
            console.error('Erreur lors du chargement des détails:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    if (loading) {
        return React.createElement('div', {
            className: "bg-white rounded-lg border border-gray-200 p-8"
        }, React.createElement('div', {
            className: "animate-pulse space-y-4"
        }, [
            React.createElement('div', {
                key: 'title',
                className: "h-6 bg-gray-200 rounded w-1/4"
            }),
            React.createElement('div', {
                key: 'content',
                className: "h-4 bg-gray-200 rounded w-3/4"
            }),
            React.createElement('div', {
                key: 'content2',
                className: "h-4 bg-gray-200 rounded w-1/2"
            })
        ]));
    }
    
    if (error) {
        return React.createElement('div', {
            className: "bg-red-50 border border-red-200 rounded-lg p-4"
        }, React.createElement('p', {
            className: "text-red-800"
        }, `Erreur: ${error}`));
    }
    
    if (!entreprise) {
        return React.createElement('div', {
            className: "bg-white rounded-lg border border-gray-200 p-8"
        }, React.createElement('p', {
            className: "text-gray-600"
        }, "Entreprise non trouvée"));
    }
    
    return React.createElement('div', {
        className: "space-y-6"
    }, [
        // En-tête avec navigation
        React.createElement('div', {
            key: 'header',
            className: "bg-white rounded-lg border border-gray-200 p-6"
        }, [
            window.DetailPageHeader({
                onBack: onBack,
                breadcrumbBase: "Entreprises",
                breadcrumbCurrent: entreprise.nom
            }),
            React.createElement('div', {
                key: 'title',
                className: "flex items-center gap-4"
            }, [
                React.createElement('h1', {
                    key: 'name',
                    className: "text-2xl font-bold text-gray-900"
                }, entreprise.nom),
                React.createElement('span', {
                    key: 'type',
                    className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        entreprise.type_entreprise === 'client' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                    }`
                }, entreprise.type_entreprise || 'Non défini')
            ])
        ]),
        
        // Informations générales
        React.createElement('div', {
            key: 'info',
            className: "bg-white rounded-lg border border-gray-200 p-6"
        }, [
            React.createElement('h2', {
                key: 'title',
                className: "text-lg font-semibold text-gray-900 mb-4"
            }, "Informations générales"),
            React.createElement('div', {
                key: 'grid',
                className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            }, [
                React.createElement('div', { key: 'adresse' }, [
                    React.createElement('label', {
                        key: 'label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Adresse"),
                    React.createElement('p', {
                        key: 'value',
                        className: "text-sm text-gray-900"
                    }, entreprise.adresse || '-')
                ]),
                React.createElement('div', { key: 'telephone' }, [
                    React.createElement('label', {
                        key: 'label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Téléphone"),
                    React.createElement('p', {
                        key: 'value',
                        className: "text-sm text-gray-900"
                    }, entreprise.telephone || '-')
                ]),
                React.createElement('div', { key: 'email' }, [
                    React.createElement('label', {
                        key: 'label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Email"),
                    React.createElement('p', {
                        key: 'value',
                        className: "text-sm text-gray-900"
                    }, entreprise.email || '-')
                ]),
                React.createElement('div', { key: 'secteur' }, [
                    React.createElement('label', {
                        key: 'label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Secteur d'activité"),
                    React.createElement('p', {
                        key: 'value',
                        className: "text-sm text-gray-900"
                    }, entreprise.secteur_activite || '-')
                ]),
                React.createElement('div', { key: 'employes' }, [
                    React.createElement('label', {
                        key: 'label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Employés"),
                    React.createElement('div', { 
                        key: 'value',
                        className: "flex items-center gap-3"
                    }, [
                        React.createElement('p', {
                            key: 'text',
                            className: "text-sm text-gray-900"
                        }, `${employes.length} employé(s) enregistré(s)`),
                        React.createElement('button', {
                            key: 'button',
                            onClick: () => onNavigateToUsers && onNavigateToUsers(entreprise.id),
                            className: "flex items-center gap-1 px-2 py-1 bg-gray-500 text-white rounded-md text-xs hover:bg-gray-600 transition-colors"
                        }, [
                            React.createElement('i', {
                                key: 'icon',
                                'data-lucide': 'users',
                                className: 'w-3 h-3'
                            }),
                            React.createElement('span', {
                                key: 'text'
                            }, "Gérer les utilisateurs")
                        ])
                    ])
                ])
            ])
        ]),
        
        // Tableau des projets
        React.createElement('div', {
            key: 'projets',
            className: "bg-white rounded-lg border border-gray-200"
        }, [
            React.createElement(window.TableView, {
                key: 'table',
                data: projets,
                columns: [
                    { key: 'name', label: 'Nom du projet', type: 'text', sortable: true },
                    { 
                        key: 'status', 
                        label: 'Statut', 
                        type: 'badge',
                        render: (value) => {
                            const statusOptions = [
                                { value: 'planning', label: 'Planification', color: 'bg-yellow-100 text-yellow-800' },
                                { value: 'active', label: 'Actif', color: 'bg-green-100 text-green-800' },
                                { value: 'on_hold', label: 'En pause', color: 'bg-orange-100 text-orange-800' },
                                { value: 'completed', label: 'Terminé', color: 'bg-blue-100 text-blue-800' },
                                { value: 'cancelled', label: 'Annulé', color: 'bg-red-100 text-red-800' }
                            ];
                            const option = statusOptions.find(opt => opt.value === value);
                            return React.createElement('span', {
                                className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${option?.color || 'bg-gray-100 text-gray-800'}`
                            }, option?.label || value);
                        }
                    },
                    { key: 'type', label: 'Type', type: 'text' },
                    { key: 'description', label: 'Description', type: 'text' },
                    { key: 'created_at', label: 'Date création', type: 'date', sortable: true }
                ],
                title: `Projets de l'entreprise (${projets.length})`,
                subtitle: "Liste des projets associés à cette entreprise",
                loading: false,
                onRowClick: onNavigateToProject
            })
        ]),
        
        // Événements
        React.createElement('div', {
            key: 'evenements',
            className: "bg-white rounded-lg border border-gray-200 p-6"
        }, [
            React.createElement('h2', {
                key: 'title',
                className: "text-lg font-semibold text-gray-900 mb-4"
            }, `Événements (${evenements.length})`),
            evenements.length > 0 ? React.createElement('div', {
                key: 'list',
                className: "space-y-2"
            }, evenements.slice(0, 5).map((evenement, index) => 
                React.createElement('div', {
                    key: evenement.id || index,
                    className: "p-2 bg-gray-50 rounded text-sm"
                }, evenement.titre || `Événement ${index + 1}`)
            )) : React.createElement('p', {
                key: 'empty',
                className: "text-sm text-gray-500"
            }, "Aucun événement enregistré")
        ])
    ]);
}

// Export global
window.EntrepriseDetailPage = EntrepriseDetailPage;