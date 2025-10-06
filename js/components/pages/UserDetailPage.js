// Page de détail d'un utilisateur
function UserDetailPage({ userId, onBack, onNavigateToLogiciel }) {
    const { useState, useEffect } = React;
    const { users, updateUser, deleteUser } = window.useUsers();
    const { competences, loading: competencesLoading, createCompetence, updateCompetence, deleteCompetence, getNiveauLabel, getNiveauColor } = window.useUserCompetences(userId);
    const { logiciels } = window.useLogiciels();
    const { evenements, loading: planningLoading, addEvenement, updateEvenement, deleteEvenement } = window.useUserPlanning(userId);
    const supabase = window.supabaseConfig.client;
    
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [showCompetenceModal, setShowCompetenceModal] = useState(false);
    const [editingCompetence, setEditingCompetence] = useState(null);
    const [showPlanningModal, setShowPlanningModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [options, setOptions] = useState({
        entreprises: [],
        services: [],
        fonctions: []
    });
    
    useEffect(() => {
        if (userId) {
            fetchUserDetails();
            fetchOptions();
        }
    }, [userId]);
    
    useEffect(() => {
        lucide.createIcons();
    }, [user, competences]);
    
    const fetchUserDetails = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const { data, error: fetchError } = await supabase
                .from('user_profile')
                .select(`
                    *,
                    entreprise:entreprise_id(id, nom),
                    service:service_id(id, nom),
                    fonction:fonction_id(id, nom)
                `)
                .eq('id', userId)
                .single();
            
            if (fetchError) throw fetchError;
            setUser(data);
        } catch (err) {
            console.error('Erreur lors du chargement des détails utilisateur:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    const fetchOptions = async () => {
        try {
            const [entreprisesRes, servicesRes, fonctionsRes] = await Promise.all([
                supabase.from('entreprise').select('id, nom').order('nom'),
                supabase.from('service').select('id, nom').order('nom'),
                supabase.from('fonction').select('id, nom').order('nom')
            ]);
            
            setOptions({
                entreprises: entreprisesRes.data || [],
                services: servicesRes.data || [],
                fonctions: fonctionsRes.data || []
            });
        } catch (err) {
            console.error('Erreur lors du chargement des options:', err);
        }
    };
    
    const handleEdit = () => {
        if (!user) return;
        setEditData({ 
            ...user,
            entreprise_id: user.entreprise_id || '',
            service_id: user.service_id || '',
            fonction_id: user.fonction_id || ''
        });
        setIsEditing(true);
    };
    
    const handleSave = async () => {
        if (!editData) return;
        
        try {
            setIsSaving(true);
            
            const { entreprise, service, fonction, email, ...rawData } = editData;
            
            // Nettoyer les données en convertissant les chaînes vides en null pour les UUID
            const dataToSave = {
                ...rawData,
                entreprise_id: rawData.entreprise_id === '' ? null : rawData.entreprise_id,
                service_id: rawData.service_id === '' ? null : rawData.service_id,
                fonction_id: rawData.fonction_id === '' ? null : rawData.fonction_id
            };
            
            await updateUser(user.id, dataToSave);
            
            // Recharger les données complètes après la sauvegarde
            await fetchUserDetails();
            
            setIsEditing(false);
            setEditData(null);
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            alert('Erreur lors de la sauvegarde de l\'utilisateur');
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleCancel = () => {
        setEditData(null);
        setIsEditing(false);
    };
    
    const handleFieldChange = (field, value) => {
        setEditData(prev => ({
            ...prev,
            [field]: value
        }));
    };
    
    const handleDelete = async () => {
        if (!user) return;
        
        const userName = `${user.prenom || ''} ${user.nom || ''}`.trim() || user.email;
        const confirmDelete = window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement l'utilisateur "${userName}" ?\n\nCette action supprimera également :\n• Toutes ses compétences logiciels\n• Tous ses événements de planning\n• Sa présence dans les listes de stagiaires des projets\n• Sa présence dans les événements de formation\n• Son rôle de contact dans les projets (remplacé par vide)\n• Son rôle de commercial dans les projets (remplacé par vide)\n• Son rôle d'évaluateur dans les compétences (remplacé par vide)\n• Son assignation dans les tâches (remplacé par vide)\n• Son rôle de créateur dans les tâches (remplacé par vide)\n\nCette action est irréversible.`);
        if (!confirmDelete) return;
        
        try {
            console.log(`🗑️ Début de la suppression de l'utilisateur: ${userName}`);
            await deleteUser(user.id);
            alert(`Utilisateur "${userName}" supprimé avec succès !\n\nToutes les données associées ont été supprimées.`);
            onBack(); // Retourner à la liste
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            
            // Messages d'erreur plus spécifiques selon le type d'erreur
            let errorMessage = 'Erreur lors de la suppression de l\'utilisateur.';
            
            if (error.message) {
                if (error.message.includes('compétences')) {
                    errorMessage = 'Erreur lors de la suppression des compétences de l\'utilisateur.\n\nVeuillez réessayer ou contacter l\'administrateur.';
                } else if (error.message.includes('événements')) {
                    errorMessage = 'Erreur lors de la suppression des événements de planning.\n\nVeuillez réessayer ou contacter l\'administrateur.';
                } else if (error.message.includes('projet') && error.message.includes('stagiaires')) {
                    errorMessage = 'Erreur lors de la mise à jour des listes de stagiaires des projets.\n\nVeuillez réessayer ou contacter l\'administrateur.';
                } else if (error.message.includes('projet') && error.message.includes('contact')) {
                    errorMessage = 'Erreur lors de la mise à jour des projets (rôle contact).\n\nVeuillez réessayer ou contacter l\'administrateur.';
                } else if (error.message.includes('projet') && error.message.includes('commercial')) {
                    errorMessage = 'Erreur lors de la mise à jour des projets (rôle commercial).\n\nVeuillez réessayer ou contacter l\'administrateur.';
                } else if (error.message.includes('évaluateur')) {
                    errorMessage = 'Erreur lors de la mise à jour des compétences (rôle évaluateur).\n\nVeuillez réessayer ou contacter l\'administrateur.';
                } else if (error.message.includes('tâches') && error.message.includes('assigné')) {
                    errorMessage = 'Erreur lors de la mise à jour des tâches (assignation).\n\nVeuillez réessayer ou contacter l\'administrateur.';
                } else if (error.message.includes('tâches') && error.message.includes('créateur')) {
                    errorMessage = 'Erreur lors de la mise à jour des tâches (créateur).\n\nVeuillez réessayer ou contacter l\'administrateur.';
                } else if (error.message.includes('profil')) {
                    errorMessage = 'Erreur lors de la suppression du profil utilisateur.\n\nLes données liées ont été mises à jour mais le profil principal n\'a pas pu être supprimé.';
                } else if (error.message.includes('permission')) {
                    errorMessage = 'Vous n\'avez pas les permissions nécessaires pour supprimer cet utilisateur.';
                } else if (error.message.includes('foreign key constraint')) {
                    errorMessage = 'Impossible de supprimer cet utilisateur car il est encore référencé dans d\'autres données.\n\nVeuillez contacter l\'administrateur.';
                } else {
                    errorMessage = `Erreur: ${error.message}`;
                }
            }
            
            alert(errorMessage);
        }
    };
    
    const handleAddCompetence = () => {
        setEditingCompetence(null);
        setShowCompetenceModal(true);
    };
    
    const handleEditCompetence = (competence) => {
        setEditingCompetence(competence);
        setShowCompetenceModal(true);
    };
    
    const handleDeleteCompetence = async (competence) => {
        const logicielNom = competence.logiciel?.nom || 'Logiciel inconnu';
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer la compétence "${logicielNom}" ?`)) {
            try {
                await deleteCompetence(competence.id);
            } catch (error) {
                console.error('Erreur:', error);
                alert('Erreur lors de la suppression de la compétence');
            }
        }
    };
    
    const handleCompetenceSubmit = async (formData) => {
        try {
            if (editingCompetence) {
                await updateCompetence(editingCompetence.id, formData);
            } else {
                await createCompetence(formData);
            }
            setShowCompetenceModal(false);
            setEditingCompetence(null);
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors de la sauvegarde de la compétence');
        }
    };
    
    const handleAddEvent = () => {
        setEditingEvent(null);
        setShowPlanningModal(true);
    };
    
    const handleEditEvent = (event) => {
        setEditingEvent(event);
        setShowPlanningModal(true);
    };
    
    const handleDeleteEvent = async (event) => {
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'événement "${event.titre}" ?`)) {
            try {
                await deleteEvenement(event.id);
            } catch (error) {
                console.error('Erreur:', error);
                alert('Erreur lors de la suppression de l\'événement');
            }
        }
    };
    
    const handleEventSubmit = async (formData) => {
        try {
            if (editingEvent) {
                await updateEvenement(editingEvent.id, formData);
            } else {
                await addEvenement(formData);
            }
            setShowPlanningModal(false);
            setEditingEvent(null);
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors de la sauvegarde de l\'événement');
        }
    };
    
    // Fonction pour créer une section d'information avec support édition
    const createInfoSection = (label, value, fieldName, inputType = 'text') => {
        const key = `info-${label.replace(/\s+/g, '-').toLowerCase()}`;
        
        return React.createElement('div', { key }, [
            React.createElement('label', {
                key: 'label',
                className: "block text-sm font-medium text-gray-700 mb-1"
            }, label),
            isEditing ? (
                inputType === 'select' ? 
                React.createElement('select', {
                    key: 'select',
                    value: editData[fieldName] || '',
                    onChange: (e) => handleFieldChange(fieldName, e.target.value),
                    className: "w-full px-3 py-2 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                }, [
                    React.createElement('option', { key: 'empty', value: '' }, `Sélectionnez ${label.toLowerCase()}`),
                    ...(fieldName === 'entreprise_id' ? options.entreprises : 
                        fieldName === 'service_id' ? options.services : 
                        fieldName === 'fonction_id' ? options.fonctions : 
                        []).map(option => 
                        React.createElement('option', {
                            key: option.id,
                            value: option.id
                        }, option.nom)
                    )
                ]) :
                React.createElement('input', {
                    key: 'input',
                    type: inputType,
                    value: editData[fieldName] || '',
                    onChange: (e) => handleFieldChange(fieldName, e.target.value),
                    className: "w-full px-3 py-2 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm",
                    placeholder: `Entrez ${label.toLowerCase()}`
                })
            ) : (
                React.createElement('p', {
                    key: 'value',
                    className: "text-sm text-gray-900"
                }, value || '-')
            )
        ]);
    };
    
    if (loading) {
        return React.createElement('div', {
            className: "bg-white rounded-lg border border-gray-200 p-8"
        }, React.createElement('div', {
            className: "animate-pulse space-y-4"
        }, [
            React.createElement('div', {
                key: 'title',
                className: "h-6 bg-gray-200 rounded w-1/3"
            }),
            React.createElement('div', {
                key: 'content',
                className: "h-4 bg-gray-200 rounded w-3/4"
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
    
    if (!user) {
        return React.createElement('div', {
            className: "bg-white rounded-lg border border-gray-200 p-8"
        }, React.createElement('p', {
            className: "text-gray-600"
        }, "Utilisateur non trouvé"));
    }
    
    const userName = `${user.prenom || ''} ${user.nom || ''}`.trim() || user.email;
    const userInitials = `${user.prenom?.[0] || ''}${user.nom?.[0] || ''}`.toUpperCase() || user.email?.substring(0, 2).toUpperCase();
    
    // Configuration des colonnes pour le tableau des compétences
    const competencesColumns = [
        {
            key: 'logiciel.logo',
            label: 'Logo',
            type: 'text',
            render: (value, competence) => {
                const logo = competence.logiciel?.logo;
                if (!logo) {
                    return React.createElement('div', {
                        className: 'w-8 h-8 bg-gray-100 rounded flex items-center justify-center'
                    }, React.createElement('i', {
                        'data-lucide': 'monitor',
                        className: 'w-4 h-4 text-gray-400'
                    }));
                }
                return React.createElement('img', {
                    src: logo,
                    alt: `Logo ${competence.logiciel?.nom}`,
                    className: 'w-8 h-8 object-cover rounded',
                    onError: (e) => {
                        e.target.style.display = 'none';
                        const fallback = e.target.parentNode.querySelector('.logo-fallback');
                        if (fallback) fallback.style.display = 'flex';
                    }
                });
            }
        },
        {
            key: 'logiciel.nom',
            label: 'Logiciel',
            type: 'text',
            sortable: true,
            render: (value, competence) => {
                return React.createElement('div', {}, [
                    React.createElement('div', {
                        key: 'nom',
                        className: 'font-medium text-gray-900'
                    }, competence.logiciel?.nom || 'Logiciel inconnu'),
                    competence.logiciel?.editeur && React.createElement('div', {
                        key: 'editeur', 
                        className: 'text-xs text-gray-500'
                    }, competence.logiciel.editeur)
                ]);
            }
        },
        {
            key: 'niveau',
            label: 'Niveau',
            type: 'text',
            sortable: true,
            render: (value, competence) => {
                return React.createElement('div', {
                    className: 'flex items-center gap-2'
                }, [
                    React.createElement('span', {
                        key: 'badge',
                        className: `inline-block px-2 py-1 text-xs font-medium rounded-full ${getNiveauColor(competence.niveau)}`
                    }, `${competence.niveau} - ${getNiveauLabel(competence.niveau)}`),
                    competence.certifie && React.createElement('span', {
                        key: 'certified',
                        className: 'inline-flex items-center gap-1 text-xs text-green-600',
                        title: 'Certifié'
                    }, React.createElement('i', {
                        'data-lucide': 'award',
                        className: 'w-3 h-3'
                    }))
                ]);
            }
        },
        {
            key: 'evaluateur',
            label: 'Évaluateur',
            type: 'text',
            render: (value, competence) => {
                if (!competence.evaluateur) return '-';
                const evaluateurName = `${competence.evaluateur.prenom || ''} ${competence.evaluateur.nom || ''}`.trim();
                return evaluateurName || 'Utilisateur inconnu';
            }
        },
        {
            key: 'commentaire',
            label: 'Commentaire', 
            type: 'text',
            render: (value, competence) => {
                const commentaire = competence.commentaire;
                if (!commentaire) return '-';
                
                // Tronquer si trop long
                if (commentaire.length > 50) {
                    return React.createElement('span', {
                        title: commentaire,
                        className: 'cursor-help'
                    }, commentaire.substring(0, 47) + '...');
                }
                return commentaire;
            }
        },
        {
            key: 'actions',
            label: 'Actions',
            type: 'actions',
            width: '100px'
        }
    ];
    
    return React.createElement('div', {
        className: "space-y-6"
    }, [
        // En-tête avec navigation et actions
        React.createElement('div', {
            key: 'header',
            className: "bg-white rounded-lg border border-gray-200 p-6"
        }, [
            window.DetailPageHeader({
                onBack: onBack,
                breadcrumbBase: "Utilisateurs",
                breadcrumbCurrent: userName
            }),
            React.createElement('div', {
                key: 'title-section',
                className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            }, [
                React.createElement('div', { key: 'title-info' }, [
                    React.createElement('div', {
                        key: 'user-header',
                        className: "flex items-center gap-4"
                    }, [
                        // Avatar
                        user.avatar ?
                            React.createElement('img', {
                                key: 'avatar',
                                src: user.avatar,
                                alt: `Avatar de ${userName}`,
                                className: "w-16 h-16 rounded-full object-cover border-4 border-gray-200"
                            }) :
                            React.createElement('div', {
                                key: 'avatar-fallback',
                                className: "w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-medium border-4 border-gray-200"
                            }, userInitials),
                        
                        React.createElement('div', { key: 'user-info' }, [
                            React.createElement('h1', {
                                key: 'title',
                                className: "text-2xl font-bold text-gray-900"
                            }, userName),
                            React.createElement('p', {
                                key: 'subtitle',
                                className: "text-gray-600 mt-1"
                            }, user.email),
                            user.entreprise && React.createElement('p', {
                                key: 'entreprise',
                                className: "text-sm text-gray-500 mt-1"
                            }, user.entreprise.nom)
                        ])
                    ])
                ]),
                React.createElement('div', {
                    key: 'actions',
                    className: "flex flex-wrap gap-2"
                }, isEditing ? [
                    // Boutons en mode édition
                    React.createElement('button', {
                        key: 'save',
                        onClick: handleSave,
                        disabled: isSaving,
                        className: `inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                            isSaving 
                                ? 'bg-blue-400 cursor-not-allowed' 
                                : 'bg-blue-600 hover:bg-blue-700'
                        }`
                    }, [
                        React.createElement('i', {
                            key: 'icon',
                            'data-lucide': isSaving ? 'loader-2' : 'save',
                            className: `w-4 h-4 ${isSaving ? 'animate-spin' : ''}`
                        }),
                        isSaving ? "Sauvegarde..." : "Sauvegarder"
                    ]),
                    React.createElement('button', {
                        key: 'cancel',
                        onClick: handleCancel,
                        disabled: isSaving,
                        className: `inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                            isSaving 
                                ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                                : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                        }`
                    }, [
                        React.createElement('i', {
                            key: 'icon',
                            'data-lucide': 'x',
                            className: "w-4 h-4"
                        }),
                        "Annuler"
                    ])
                ] : [
                    // Boutons en mode lecture
                    React.createElement('button', {
                        key: 'edit',
                        onClick: handleEdit,
                        className: "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    }, [
                        React.createElement('i', {
                            key: 'icon',
                            'data-lucide': 'edit',
                            className: "w-4 h-4"
                        }),
                        "Modifier"
                    ]),
                    React.createElement('button', {
                        key: 'delete',
                        onClick: handleDelete,
                        className: "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                    }, [
                        React.createElement('i', {
                            key: 'icon',
                            'data-lucide': 'trash-2',
                            className: "w-4 h-4"
                        }),
                        "Supprimer"
                    ])
                ])
            ])
        ]),
        
        // Informations générales
        React.createElement('div', {
            key: 'general-info',
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
                createInfoSection("Prénom", isEditing ? editData.prenom : user.prenom, 'prenom'),
                createInfoSection("Nom", isEditing ? editData.nom : user.nom, 'nom'),
                // Email en lecture seule (provient de auth.users, non modifiable via user_profile)
                React.createElement('div', { key: 'email-readonly' }, [
                    React.createElement('label', {
                        key: 'label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Email"),
                    React.createElement('p', {
                        key: 'value',
                        className: "text-sm text-gray-900"
                    }, user.email || '-'),
                    isEditing && React.createElement('p', {
                        key: 'note',
                        className: "text-xs text-gray-500 mt-1"
                    }, "L'email ne peut pas être modifié (identifiant de connexion)")
                ]),
                createInfoSection("Rôle", isEditing ? editData.role : user.role, 'role'),
                createInfoSection("Entreprise", user.entreprise?.nom, 'entreprise_id', 'select'),
                createInfoSection("Service", user.service?.nom, 'service_id', 'select'),
                createInfoSection("Fonction", user.fonction?.nom, 'fonction_id', 'select'),
                createInfoSection("Téléphone", isEditing ? editData.telephone : user.telephone, 'telephone', 'tel'),
                React.createElement('div', { key: 'created' }, [
                    React.createElement('label', {
                        key: 'label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Date de création"),
                    React.createElement('p', {
                        key: 'value',
                        className: "text-sm text-gray-900"
                    }, user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '-')
                ])
            ])
        ]),
        
        // Compétences logiciels
        React.createElement('div', {
            key: 'competences',
            className: "bg-white rounded-lg border border-gray-200 p-6"
        }, [
            React.createElement('div', {
                key: 'competences-header',
                className: "flex justify-between items-center mb-4"
            }, [
                React.createElement('h2', {
                    key: 'title',
                    className: "text-lg font-semibold text-gray-900"
                }, "Compétences logiciels"),
                React.createElement('button', {
                    key: 'add-competence',
                    onClick: handleAddCompetence,
                    className: "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                }, [
                    React.createElement('i', {
                        key: 'icon',
                        'data-lucide': 'plus',
                        className: "w-4 h-4"
                    }),
                    "Ajouter une compétence"
                ])
            ]),
            
            React.createElement(window.TableView, {
                key: 'competences-table',
                data: competences,
                columns: competencesColumns,
                loading: competencesLoading,
                onEdit: handleEditCompetence,
                onDelete: handleDeleteCompetence,
                onRowClick: (competence) => {
                    if (onNavigateToLogiciel && competence.logiciel?.id) {
                        onNavigateToLogiciel(competence.logiciel.id);
                    }
                },
                emptyMessage: "Aucune compétence logiciel renseignée",
                emptyDescription: "Ajoutez des compétences pour suivre le niveau de maîtrise des logiciels",
                showSearch: false,
                showPagination: false
            })
        ]),
        
        // Planning
        React.createElement('div', {
            key: 'planning',
            className: "bg-white rounded-lg border border-gray-200 p-6"
        }, [
            React.createElement('div', {
                key: 'planning-header',
                className: "flex justify-between items-center mb-4"
            }, [
                React.createElement('h2', {
                    key: 'title',
                    className: "text-lg font-semibold text-gray-900"
                }, "Planning"),
                React.createElement('button', {
                    key: 'add-event',
                    onClick: handleAddEvent,
                    className: "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                }, [
                    React.createElement('i', {
                        key: 'icon',
                        'data-lucide': 'plus',
                        className: "w-4 h-4"
                    }),
                    "Ajouter un événement"
                ])
            ]),
            
            planningLoading ? 
                React.createElement('div', {
                    key: 'loading',
                    className: "text-center py-8"
                }, React.createElement('div', {
                    className: "animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"
                })) :
                React.createElement(window.SimpleCalendar, {
                    key: 'calendar',
                    events: evenements,
                    onEventClick: handleEditEvent,
                    onDateClick: (date) => {
                        setEditingEvent(null);
                        setShowPlanningModal(true);
                    }
                })
        ]),
        
        // Modal compétence
        React.createElement(window.UserCompetenceModal, {
            key: 'competence-modal',
            isOpen: showCompetenceModal,
            item: editingCompetence,
            userId: userId,
            logiciels: logiciels,
            onSubmit: handleCompetenceSubmit,
            onClose: () => {
                setShowCompetenceModal(false);
                setEditingCompetence(null);
            }
        }),
        
        // Modal planning
        showPlanningModal && React.createElement(window.UserPlanningModal, {
            key: 'planning-modal',
            isOpen: showPlanningModal,
            editingItem: editingEvent,
            availableUsers: user ? [user] : [],
            defaultUserId: userId,
            onSubmit: handleEventSubmit,
            onClose: () => {
                setShowPlanningModal(false);
                setEditingEvent(null);
            }
        })
    ]);
}

// Export global
window.UserDetailPage = UserDetailPage;