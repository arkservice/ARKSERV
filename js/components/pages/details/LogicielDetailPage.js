// Page Détail Logiciel
function LogicielDetailPage({ logicielId, onBack, onNavigateToUser }) {
    const { useState, useEffect, useRef, useCallback } = React;
    const { logiciels, loading, error, createLogiciel, updateLogiciel } = window.useLogiciels();
    const supabase = window.supabaseConfig.client;
    
    const [logiciel, setLogiciel] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        nom: '',
        editeur: '',
        code_logiciel: ''
    });
    
    // États pour l'upload de logo (pattern avatar exact)
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [logoLoading, setLogoLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const fileInputRef = useRef(null);
    
    // États pour les utilisateurs compétents
    const [usersCompetents, setUsersCompetents] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    const isEditing = !!logicielId;
    
    // Charger les données du logiciel si édition
    useEffect(() => {
        if (isEditing && logiciels.length > 0) {
            const currentLogiciel = logiciels.find(l => l.id === logicielId);
            if (currentLogiciel) {
                setLogiciel(currentLogiciel);
                setFormData({
                    nom: currentLogiciel.nom || '',
                    editeur: currentLogiciel.editeur || '',
                    code_logiciel: currentLogiciel.code_logiciel || ''
                });
            }
        }
    }, [logicielId, logiciels, isEditing]);
    
    // Fonction pour récupérer les utilisateurs compétents
    const fetchUsersCompetents = useCallback(async () => {
        if (!logicielId) return;
        
        setLoadingUsers(true);
        try {
            const { data, error } = await supabase
                .from('user_competence')
                .select(`
                    id,
                    niveau,
                    date_evaluation,
                    certifie,
                    user_profile:user_id (
                        id,
                        prenom,
                        nom,
                        avatar
                    )
                `)
                .eq('logiciel_id', logicielId)
                .order('niveau', { ascending: false });
            
            if (error) throw error;
            
            // Trier côté client par prénom
            const sortedData = (data || []).sort((a, b) => {
                const prenomA = a.user_profile?.prenom || '';
                const prenomB = b.user_profile?.prenom || '';
                return prenomA.localeCompare(prenomB);
            });
            
            setUsersCompetents(sortedData);
        } catch (error) {
            console.error('Erreur récupération utilisateurs compétents:', error);
        } finally {
            setLoadingUsers(false);
        }
    }, [logicielId, supabase]);
    
    // Initialiser les icônes Lucide
    useEffect(() => {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }, [logoPreview, message.text]);
    
    // Charger les utilisateurs compétents
    useEffect(() => {
        if (logicielId) {
            fetchUsersCompetents();
        }
    }, [logicielId, fetchUsersCompetents]);
    
    // Fonction pour afficher un message
    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    };

    // Fonction pour ajouter une compétence
    const handleAddCompetence = async (competenceData) => {
        try {
            const { data, error } = await supabase
                .from('user_competence')
                .insert([competenceData])
                .select();

            if (error) {
                // Gérer l'erreur de contrainte UNIQUE
                if (error.code === '23505') {
                    showMessage('error', 'Ce collaborateur a déjà une compétence enregistrée pour ce logiciel');
                } else {
                    throw error;
                }
                return;
            }

            showMessage('success', 'Compétence ajoutée avec succès');
            setShowAddModal(false);

            // Rafraîchir la liste des utilisateurs compétents
            await fetchUsersCompetents();
        } catch (error) {
            console.error('Erreur ajout compétence:', error);
            showMessage('error', 'Erreur lors de l\'ajout de la compétence');
        }
    };
    
    // Gestion de l'upload de logo (pattern avatar exact)
    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Vérifier le type de fichier
            if (!file.type.match(/^image\/(jpeg|jpg|png|gif)$/)) {
                showMessage('error', 'Format d\'image non supporté. Utilisez JPG, PNG ou GIF.');
                return;
            }
            
            // Vérifier la taille (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                showMessage('error', 'L\'image est trop grande. Taille maximum: 5MB.');
                return;
            }
            
            setLogoFile(file);
            
            // Créer un aperçu (pattern avatar exact)
            const reader = new FileReader();
            reader.onload = (e) => setLogoPreview(e.target.result);
            reader.readAsDataURL(file);
        }
    };
    
    // Sauvegarder le logo (pattern avatar)
    const handleLogoSave = async () => {
        if (!logoFile) return;
        
        setLogoLoading(true);
        try {
            // Générer un nom de fichier unique
            const fileExt = logoFile.name.split('.').pop().toLowerCase();
            const fileName = `${crypto.randomUUID()}.${fileExt}`;
            
            // Upload vers le bucket avatars (réutilise les politiques existantes)
            const { data, error } = await supabase.storage
                .from('avatars')
                .upload(fileName, logoFile, {
                    cacheControl: '3600',
                    upsert: false
                });
            
            if (error) throw error;
            
            // Obtenir l'URL publique
            const { data: publicData } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);
            
            // Mettre à jour le logiciel avec la nouvelle URL
            if (isEditing) {
                await updateLogiciel(logicielId, { logo: publicData.publicUrl });
                showMessage('success', 'Logo mis à jour avec succès');
                setLogoFile(null);
                setLogoPreview(null);
            } else {
                // Pour un nouveau logiciel, on stocke temporairement l'URL
                setFormData(prev => ({ ...prev, logo: publicData.publicUrl }));
                showMessage('success', 'Logo uploadé avec succès');
                setLogoFile(null);
                setLogoPreview(null);
            }
            
        } catch (error) {
            console.error('Erreur upload logo:', error);
            showMessage('error', 'Erreur lors de l\'upload du logo: ' + error.message);
        } finally {
            setLogoLoading(false);
        }
    };
    
    // Supprimer le logo
    const handleLogoDelete = async () => {
        if (isEditing) {
            try {
                await updateLogiciel(logicielId, { logo: null });
                showMessage('success', 'Logo supprimé');
            } catch (error) {
                showMessage('error', 'Erreur lors de la suppression');
            }
        } else {
            setFormData(prev => ({ ...prev, logo: null }));
            setLogoFile(null);
            setLogoPreview(null);
        }
    };
    
    // Fonctions de gestion du mode édition
    const handleEditStart = () => {
        setEditMode(true);
    };
    
    const handleEditCancel = () => {
        setEditMode(false);
        // Reset des données vers les valeurs originales
        if (logiciel) {
            setFormData({
                nom: logiciel.nom || '',
                editeur: logiciel.editeur || '',
                code_logiciel: logiciel.code_logiciel || ''
            });
        }
        // Reset du logo
        setLogoFile(null);
        setLogoPreview(null);
    };
    
    const handleEditSave = async () => {
        if (!formData.nom.trim()) {
            showMessage('error', 'Le nom du logiciel est obligatoire');
            return;
        }
        
        setSaving(true);
        try {
            let logoUrl = logiciel?.logo;
            
            // Upload du logo si un nouveau fichier est sélectionné
            if (logoFile) {
                const fileExt = logoFile.name.split('.').pop().toLowerCase();
                const fileName = `${crypto.randomUUID()}.${fileExt}`;
                
                const { data, error } = await supabase.storage
                    .from('avatars')
                    .upload(fileName, logoFile, {
                        cacheControl: '3600',
                        upsert: false
                    });
                
                if (error) throw error;
                
                const { data: publicData } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(fileName);
                
                logoUrl = publicData.publicUrl;
            }
            
            const dataToSave = {
                nom: formData.nom.trim(),
                editeur: formData.editeur.trim() || null,
                code_logiciel: formData.code_logiciel.trim() || null,
                logo: logoUrl
            };
            
            if (isEditing) {
                await updateLogiciel(logicielId, dataToSave);
                showMessage('success', 'Logiciel mis à jour avec succès');
            } else {
                await createLogiciel(dataToSave);
                showMessage('success', 'Logiciel créé avec succès');
                setFormData({ nom: '', editeur: '', code_logiciel: '' });
            }
            
            setEditMode(false);
            setLogoFile(null);
            setLogoPreview(null);
        } catch (error) {
            console.error('Erreur sauvegarde:', error);
            showMessage('error', 'Erreur lors de la sauvegarde');
        } finally {
            setSaving(false);
        }
    };
    
    // Logo actuel ou aperçu
    const currentLogo = logoPreview || logiciel?.logo || formData.logo;
    
    if (loading) {
        return React.createElement('div', {
            className: "flex items-center justify-center min-h-screen"
        }, React.createElement('div', {
            className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
        }));
    }
    
    return React.createElement('div', {
        className: "space-y-6"
    }, [
        // En-tête avec navigation
        React.createElement('div', {
            key: 'header',
            className: "bg-white rounded-lg border border-gray-200 p-6"
        }, [
            React.createElement(window.DetailPageHeader, {
                key: 'nav',
                onBack: onBack,
                breadcrumbBase: "Logiciels",
                breadcrumbCurrent: isEditing ? logiciel?.nom || "Logiciel" : "Nouveau logiciel"
            }),
            React.createElement('div', {
                key: 'title-section',
                className: "space-y-2"
            }, [
                React.createElement('h1', {
                    key: 'title',
                    className: "text-2xl font-bold text-gray-900"
                }, isEditing ? `Modifier - ${logiciel?.nom || "Logiciel"}` : "Nouveau logiciel"),
                React.createElement('p', {
                    key: 'subtitle',
                    className: "text-gray-600"
                }, isEditing ? "Modifiez les informations du logiciel" : "Ajoutez un nouveau logiciel à la base")
            ])
        ]),
        
        // Messages
        message.text && React.createElement('div', {
            key: 'message',
            className: `mb-6 p-4 rounded-lg ${
                message.type === 'success' 
                    ? 'bg-green-50 border border-green-200 text-green-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
            }`
        }, message.text),
        
        // Section informations générales
        React.createElement('div', {
            key: 'info-section',
            className: "bg-white rounded-lg border border-gray-200 p-6"
        }, [
            // Header avec bouton Modifier
            React.createElement('div', {
                key: 'header',
                className: "flex items-center justify-between mb-6"
            }, [
                React.createElement('h2', {
                    key: 'title',
                    className: "text-lg font-semibold text-gray-900"
                }, "Informations générales"),
                React.createElement('div', {
                    key: 'actions',
                    className: "flex items-center gap-2"
                }, editMode ? [
                    React.createElement('button', {
                        key: 'cancel',
                        onClick: handleEditCancel,
                        disabled: saving,
                        className: "px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                    }, "Annuler"),
                    React.createElement('button', {
                        key: 'save',
                        onClick: handleEditSave,
                        disabled: saving,
                        className: "inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    }, [
                        saving && React.createElement('i', {
                            key: 'spinner',
                            'data-lucide': 'loader-2',
                            className: "w-4 h-4 animate-spin"
                        }),
                        saving ? "Sauvegarde..." : "Sauvegarder"
                    ])
                ] : [
                    React.createElement('button', {
                        key: 'edit',
                        onClick: handleEditStart,
                        className: "inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    }, [
                        React.createElement('i', {
                            key: 'icon',
                            'data-lucide': 'edit-3',
                            className: "w-4 h-4"
                        }),
                        "Modifier"
                    ])
                ])
            ]),
            
            // Contenu - Grid avec informations en colonne + logo à droite
            React.createElement('div', {
                key: 'content',
                className: "grid grid-cols-1 md:grid-cols-2 gap-6"
            }, [
                // Colonne gauche - Informations
                React.createElement('div', {
                    key: 'info-column',
                    className: "flex flex-col gap-4"
                }, [
                    // Nom
                    React.createElement('div', { key: 'nom' }, [
                        React.createElement('label', {
                            key: 'label',
                            className: "block text-sm font-medium text-gray-700 mb-1"
                        }, "Nom du logiciel *"),
                        editMode ? React.createElement('input', {
                            key: 'input',
                            type: "text",
                            value: formData.nom,
                            onChange: (e) => setFormData({...formData, nom: e.target.value}),
                            className: "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                            placeholder: "Ex: Microsoft Excel..."
                        }) : React.createElement('p', {
                            key: 'value',
                            className: "text-sm text-gray-900"
                        }, formData.nom || '-')
                    ]),
                    
                    // Éditeur
                    React.createElement('div', { key: 'editeur' }, [
                        React.createElement('label', {
                            key: 'label',
                            className: "block text-sm font-medium text-gray-700 mb-1"
                        }, "Éditeur"),
                        editMode ? React.createElement('input', {
                            key: 'input',
                            type: "text",
                            value: formData.editeur,
                            onChange: (e) => setFormData({...formData, editeur: e.target.value}),
                            className: "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                            placeholder: "Ex: Microsoft, Adobe..."
                        }) : React.createElement('p', {
                            key: 'value',
                            className: "text-sm text-gray-900"
                        }, formData.editeur || '-')
                    ]),
                    
                    // Code logiciel
                    React.createElement('div', { key: 'code' }, [
                        React.createElement('label', {
                            key: 'label',
                            className: "block text-sm font-medium text-gray-700 mb-1"
                        }, "Code logiciel"),
                        editMode ? React.createElement('textarea', {
                            key: 'input',
                            value: formData.code_logiciel,
                            onChange: (e) => setFormData({...formData, code_logiciel: e.target.value}),
                            rows: 2,
                            className: "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                            placeholder: "Code ou référence..."
                        }) : React.createElement('p', {
                            key: 'value',
                            className: "text-sm text-gray-900"
                        }, formData.code_logiciel || '-')
                    ])
                ]),
                
                // Colonne droite - Logo
                React.createElement('div', {
                    key: 'logo',
                    className: "flex flex-col items-center justify-start"
                }, [
                    React.createElement('label', {
                        key: 'label',
                        className: "block text-sm font-medium text-gray-700 mb-2"
                    }, "Logo"),
                    React.createElement('div', {
                        key: 'logo-display',
                        className: "w-20 h-20 border-2 border-gray-200 rounded-lg flex items-center justify-center mb-2"
                    }, currentLogo 
                        ? React.createElement('img', {
                            src: currentLogo,
                            alt: "Logo",
                            className: "w-18 h-18 object-contain rounded"
                        })
                        : React.createElement('div', {
                            className: "w-18 h-18 bg-white border border-gray-300 rounded flex items-center justify-center"
                        })
                    ),
                    editMode && React.createElement('div', {
                        key: 'logo-actions',
                        className: "flex flex-col gap-1"
                    }, [
                        React.createElement('button', {
                            key: 'change',
                            type: "button",
                            onClick: () => fileInputRef.current?.click(),
                            className: "text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        }, "Changer"),
                        logoFile && React.createElement('button', {
                            key: 'remove',
                            type: "button",
                            onClick: () => {
                                setLogoFile(null);
                                setLogoPreview(null);
                            },
                            className: "text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                        }, "Annuler"),
                        React.createElement('input', {
                            key: 'file-input',
                            ref: fileInputRef,
                            type: "file",
                            accept: "image/jpeg,image/jpg,image/png,image/gif",
                            onChange: handleLogoChange,
                            className: "hidden"
                        })
                    ])
                ])
            ])
        ]),
        
        // Section utilisateurs compétents
        React.createElement('div', {
            key: 'users-section',
            className: "bg-white rounded-lg border border-gray-200 p-6"
        }, [
            // Header avec titre et bouton
            React.createElement('div', {
                key: 'header',
                className: "flex items-center justify-between mb-4"
            }, [
                React.createElement('h2', {
                    key: 'title',
                    className: "text-lg font-semibold text-gray-900"
                }, "Utilisateurs compétents"),
                isEditing && React.createElement('button', {
                    key: 'add-button',
                    onClick: () => setShowAddModal(true),
                    className: "inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                }, [
                    React.createElement('i', {
                        key: 'icon',
                        'data-lucide': 'plus',
                        className: "w-4 h-4"
                    }),
                    "Ajouter un collaborateur"
                ])
            ]),
            
            loadingUsers ? 
                React.createElement('div', {
                    key: 'loading',
                    className: "flex items-center justify-center py-8"
                }, React.createElement('div', {
                    className: "animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"
                })) :
                
            usersCompetents.length === 0 ? 
                React.createElement('div', {
                    key: 'empty',
                    className: "text-center py-8 text-gray-500"
                }, "Aucun utilisateur compétent sur ce logiciel") :
                
            // Tableau des utilisateurs compétents
            React.createElement('div', {
                key: 'table-container',
                className: "overflow-x-auto"
            }, React.createElement('table', {
                className: "w-full"
            }, [
                React.createElement('thead', {
                    key: 'thead',
                    className: "border-b border-gray-200"
                }, React.createElement('tr', {}, [
                    React.createElement('th', {
                        key: 'avatar',
                        className: "text-left py-3 px-4 text-sm font-medium text-gray-700"
                    }, ""),
                    React.createElement('th', {
                        key: 'nom',
                        className: "text-left py-3 px-4 text-sm font-medium text-gray-700"
                    }, "Nom"),
                    React.createElement('th', {
                        key: 'niveau',
                        className: "text-left py-3 px-4 text-sm font-medium text-gray-700"
                    }, "Niveau"),
                    React.createElement('th', {
                        key: 'date',
                        className: "text-left py-3 px-4 text-sm font-medium text-gray-700"
                    }, "Date d'évaluation"),
                    React.createElement('th', {
                        key: 'certifie',
                        className: "text-left py-3 px-4 text-sm font-medium text-gray-700"
                    }, "Certifié")
                ])),
                
                React.createElement('tbody', {
                    key: 'tbody',
                    className: "divide-y divide-gray-200"
                }, usersCompetents.map(competence => {
                    const user = competence.user_profile;
                    const fullName = `${user.prenom} ${user.nom || ''}`.trim();
                    const initials = user.prenom ? `${user.prenom.charAt(0)}${user.nom ? user.nom.charAt(0) : ''}` : '?';
                    
                    return React.createElement('tr', {
                        key: competence.id,
                        className: "hover:bg-gray-50 transition-colors cursor-pointer",
                        onClick: () => {
                            if (onNavigateToUser && user.id) {
                                onNavigateToUser(user.id);
                            }
                        }
                    }, [
                        // Avatar
                        React.createElement('td', {
                            key: 'avatar',
                            className: "py-3 px-4"
                        }, React.createElement('div', {
                            className: "flex-shrink-0"
                        }, user.avatar ? 
                            React.createElement('img', {
                                src: user.avatar,
                                alt: `Avatar ${fullName}`,
                                className: "w-8 h-8 rounded-full object-cover",
                                onError: (e) => {
                                    e.target.style.display = 'none';
                                    e.target.parentNode.querySelector('.avatar-fallback').style.display = 'flex';
                                }
                            }) : null,
                            React.createElement('div', {
                                className: 'avatar-fallback w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium',
                                style: { display: user.avatar ? 'none' : 'flex' }
                            }, initials)
                        )),
                        
                        // Nom
                        React.createElement('td', {
                            key: 'nom',
                            className: "py-3 px-4 text-sm font-medium text-gray-900"
                        }, fullName),
                        
                        // Niveau
                        React.createElement('td', {
                            key: 'niveau',
                            className: "py-3 px-4"
                        }, React.createElement('div', {
                            className: "flex items-center gap-2"
                        }, [
                            React.createElement('span', {
                                key: 'level',
                                className: `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    competence.niveau >= 4 ? 'bg-green-100 text-green-800' :
                                    competence.niveau >= 3 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                }`
                            }, `${competence.niveau}/5`)
                        ])),
                        
                        // Date d'évaluation
                        React.createElement('td', {
                            key: 'date',
                            className: "py-3 px-4 text-sm text-gray-900"
                        }, competence.date_evaluation ? new Date(competence.date_evaluation).toLocaleDateString('fr-FR') : '-'),
                        
                        // Certifié
                        React.createElement('td', {
                            key: 'certifie',
                            className: "py-3 px-4"
                        }, React.createElement('span', {
                            className: `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                competence.certifie ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`
                        }, competence.certifie ? 'Oui' : 'Non'))
                    ]);
                }))
            ]))
        ]),

        // Modal d'ajout de compétence
        showAddModal && React.createElement(window.AddCompetenceModal, {
            key: 'add-competence-modal',
            logicielId: logicielId,
            onSubmit: handleAddCompetence,
            onClose: () => setShowAddModal(false)
        })
    ]);
}

// Export global
window.LogicielDetailPage = LogicielDetailPage;