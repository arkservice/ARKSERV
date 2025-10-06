// Modal Paramètres Utilisateur
function UserSettingsModal({ onClose }) {
    const { useState, useEffect, useRef } = React;
    const auth = window.useAuth();
    const userProfile = window.useUserProfile(auth.user?.id);
    const supabase = window.supabaseConfig.client;
    
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});
    const fileInputRef = useRef(null);
    
    // États des formulaires
    const [profileData, setProfileData] = useState({
        prenom: '',
        nom: '',
        role: '',
        entreprise_id: ''
    });
    
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    
    const [options, setOptions] = useState({
        entreprises: []
    });
    
    // Charger les données initiales
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Charger les entreprises
                const { data: entreprises } = await supabase
                    .from('entreprise')
                    .select('id, nom')
                    .order('nom');
                
                setOptions({ entreprises: entreprises || [] });
                
                // Initialiser les données du profil
                if (userProfile.profile) {
                    setProfileData({
                        prenom: userProfile.profile.prenom || '',
                        nom: userProfile.profile.nom || '',
                        role: userProfile.profile.role || '',
                        entreprise_id: userProfile.profile.entreprise_id || ''
                    });
                }
            } catch (error) {
                console.error('Erreur lors du chargement des données:', error);
            }
        };
        
        fetchData();
    }, [userProfile.profile]);
    
    // Initialiser les icônes Lucide
    useEffect(() => {
        lucide.createIcons();
    }, [activeTab, message.text]);
    
    // Gestion des onglets
    const tabs = [
        { id: 'profile', label: 'Informations personnelles', icon: 'user' },
        { id: 'security', label: 'Sécurité', icon: 'shield' }
    ];
    
    // Fonction pour afficher un message
    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    };
    
    // Gestion de l'upload d'avatar
    const handleAvatarChange = (e) => {
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
            
            setAvatarFile(file);
            
            // Créer un aperçu
            const reader = new FileReader();
            reader.onload = (e) => setAvatarPreview(e.target.result);
            reader.readAsDataURL(file);
        }
    };
    
    // Sauvegarder les informations du profil
    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        
        // Validation côté client
        const prenomTrimmed = profileData.prenom.trim();
        const nomTrimmed = profileData.nom.trim();
        
        // Réinitialiser les erreurs de validation
        setValidationErrors({});
        
        if (!prenomTrimmed) {
            setValidationErrors({ prenom: 'Le prénom est obligatoire' });
            showMessage('error', 'Le prénom est obligatoire');
            return;
        }
        
        setLoading(true);
        
        try {
            // Préparer les données avec trim et validation
            const dataToUpdate = {
                prenom: prenomTrimmed,
                nom: nomTrimmed || null, // Permet nom vide mais pas chaîne vide
                role: profileData.role,
                entreprise_id: profileData.entreprise_id || null
            };
            
            // Mettre à jour le profil
            const result = await userProfile.updateProfile(dataToUpdate);
            
            if (result.success) {
                showMessage('success', 'Informations mises à jour avec succès');
                // Mettre à jour l'état local avec les données nettoyées
                setProfileData(prev => ({
                    ...prev,
                    prenom: prenomTrimmed,
                    nom: nomTrimmed
                }));
            } else {
                showMessage('error', result.error || 'Erreur lors de la mise à jour');
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour du profil:', error);
            showMessage('error', 'Erreur lors de la mise à jour du profil');
        } finally {
            setLoading(false);
        }
    };
    
    // Sauvegarder l'avatar
    const handleAvatarSave = async () => {
        if (!avatarFile) return;
        
        // Vérifier si le profil existe
        if (!userProfile.profile) {
            showMessage('error', 'Vous devez d\'abord renseigner vos informations personnelles avant d\'ajouter une photo de profil.');
            return;
        }
        
        setLoading(true);
        try {
            // Générer un nom de fichier unique
            const fileExt = avatarFile.name.split('.').pop().toLowerCase();
            const fileName = `${crypto.randomUUID()}.${fileExt}`;
            
            // Upload vers le bucket avatars
            const { data, error } = await supabase.storage
                .from('avatars')
                .upload(fileName, avatarFile, {
                    cacheControl: '3600',
                    upsert: false
                });
            
            if (error) throw error;
            
            // Obtenir l'URL publique
            const { data: publicData } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);
            
            // Mettre à jour le profil avec l'URL publique
            const result = await userProfile.updateAvatar(publicData.publicUrl);
            
            if (result.success) {
                showMessage('success', 'Photo de profil mise à jour');
                setAvatarFile(null);
                setAvatarPreview(null);
            } else {
                showMessage('error', result.error || 'Erreur lors de la mise à jour de la photo');
            }
        } catch (error) {
            console.error('Erreur avatar save:', error);
            showMessage('error', 'Erreur lors de l\'upload: ' + error.message);
        } finally {
            setLoading(false);
        }
    };
    
    // Supprimer l'avatar
    const handleAvatarDelete = async () => {
        // Vérifier si le profil existe
        if (!userProfile.profile) {
            showMessage('error', 'Aucun profil trouvé.');
            return;
        }
        
        setLoading(true);
        try {
            const result = await userProfile.updateAvatar(null);
            
            if (result.success) {
                showMessage('success', 'Photo de profil supprimée');
            } else {
                showMessage('error', result.error || 'Erreur lors de la suppression');
            }
        } catch (error) {
            console.error('Erreur avatar delete:', error);
            showMessage('error', 'Erreur lors de la suppression de la photo');
        } finally {
            setLoading(false);
        }
    };
    
    // Changer le mot de passe
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            showMessage('error', 'Les mots de passe ne correspondent pas');
            return;
        }
        
        if (passwordData.newPassword.length < 6) {
            showMessage('error', 'Le mot de passe doit contenir au moins 6 caractères');
            return;
        }
        
        setLoading(true);
        try {
            const result = await auth.updatePassword(passwordData.newPassword);
            
            if (result.success) {
                showMessage('success', 'Mot de passe modifié avec succès');
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                showMessage('error', result.error || 'Erreur lors du changement de mot de passe');
            }
        } catch (error) {
            showMessage('error', 'Erreur lors du changement de mot de passe');
        } finally {
            setLoading(false);
        }
    };
    
    // Formater la date
    const formatDate = (dateString) => {
        if (!dateString) return 'Non disponible';
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    
    // Avatar actuel ou initiales
    const currentAvatar = avatarPreview || userProfile.profile?.avatar;
    const userInitials = userProfile.profile?.prenom && userProfile.profile?.nom 
        ? `${userProfile.profile.prenom[0]}${userProfile.profile.nom[0]}`.toUpperCase()
        : auth.user?.email?.substring(0, 2).toUpperCase() || 'U';
    
    return React.createElement('div', {
        className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-overlay"
    }, React.createElement('div', {
        className: "bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden"
    }, [
        // Header
        React.createElement('div', {
            key: 'header',
            className: "px-6 py-4 border-b border-gray-200 flex justify-between items-center"
        }, [
            React.createElement('h2', {
                key: 'title',
                className: "text-xl font-semibold text-gray-900"
            }, "Mon Compte"),
            React.createElement('button', {
                key: 'close',
                onClick: onClose,
                className: "text-gray-400 hover:text-gray-600"
            }, React.createElement('i', {
                'data-lucide': 'x',
                className: "w-6 h-6"
            }))
        ]),
        
        React.createElement('p', {
            key: 'subtitle',
            className: "px-6 py-2 text-sm text-gray-600"
        }, "Gérez vos informations personnelles et votre mot de passe"),
        
        // Onglets
        React.createElement('div', {
            key: 'tabs',
            className: "px-6 border-b border-gray-200"
        }, React.createElement('nav', {
            className: "flex space-x-8"
        }, tabs.map(tab => 
            React.createElement('button', {
                key: tab.id,
                onClick: () => setActiveTab(tab.id),
                className: `py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                }`
            }, [
                React.createElement('i', {
                    key: 'icon',
                    'data-lucide': tab.icon,
                    className: "w-4 h-4 inline mr-2"
                }),
                tab.label
            ])
        ))),
        
        // Contenu
        React.createElement('div', {
            key: 'content',
            className: "flex-1 overflow-y-auto"
        }, [
            // Messages
            message.text && React.createElement('div', {
                key: 'message',
                className: `mx-6 mt-4 p-3 rounded-lg ${
                    message.type === 'success' 
                        ? 'bg-green-50 border border-green-200 text-green-800'
                        : 'bg-red-50 border border-red-200 text-red-800'
                }`
            }, message.text),
            
            // Onglet Profil
            activeTab === 'profile' && React.createElement('div', {
                key: 'profile-tab',
                className: "p-6"
            }, React.createElement('div', {
                className: "grid grid-cols-1 lg:grid-cols-2 gap-8"
            }, [
                // Informations personnelles
                React.createElement('div', {
                    key: 'personal-info',
                    className: "space-y-6"
                }, [
                    React.createElement('h3', {
                        key: 'title',
                        className: "text-lg font-medium text-gray-900"
                    }, "Informations personnelles"),
                    
                    React.createElement('form', {
                        key: 'form',
                        onSubmit: handleProfileSubmit,
                        className: "space-y-4"
                    }, [
                        // Prénom
                        React.createElement('div', { key: 'prenom' }, [
                            React.createElement('label', {
                                key: 'label',
                                className: "block text-sm font-medium text-gray-700 mb-1"
                            }, "Prénom *"),
                            React.createElement('input', {
                                key: 'input',
                                type: "text",
                                value: profileData.prenom,
                                onChange: (e) => {
                                    setProfileData({...profileData, prenom: e.target.value});
                                    // Effacer l'erreur de validation si l'utilisateur tape
                                    if (validationErrors.prenom && e.target.value.trim()) {
                                        setValidationErrors(prev => ({...prev, prenom: undefined}));
                                    }
                                },
                                className: `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                                    validationErrors.prenom 
                                        ? 'border-red-300 focus:ring-red-500' 
                                        : 'border-gray-300 focus:ring-blue-500'
                                }`,
                                required: true,
                                placeholder: "Prénom obligatoire"
                            }),
                            validationErrors.prenom && React.createElement('p', {
                                key: 'error',
                                className: "mt-1 text-sm text-red-600"
                            }, validationErrors.prenom)
                        ]),
                        
                        // Nom
                        React.createElement('div', { key: 'nom' }, [
                            React.createElement('label', {
                                key: 'label',
                                className: "block text-sm font-medium text-gray-700 mb-1"
                            }, "Nom"),
                            React.createElement('input', {
                                key: 'input',
                                type: "text",
                                value: profileData.nom,
                                onChange: (e) => setProfileData({...profileData, nom: e.target.value}),
                                className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            })
                        ]),
                        
                        // Email (lecture seule)
                        React.createElement('div', { key: 'email' }, [
                            React.createElement('label', {
                                key: 'label',
                                className: "block text-sm font-medium text-gray-700 mb-1"
                            }, "Email"),
                            React.createElement('input', {
                                key: 'input',
                                type: "email",
                                value: auth.user?.email || '',
                                readOnly: true,
                                className: "w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                            })
                        ]),
                        
                        // Rôle
                        React.createElement('div', { key: 'role' }, [
                            React.createElement('label', {
                                key: 'label',
                                className: "block text-sm font-medium text-gray-700 mb-1"
                            }, "Rôle"),
                            React.createElement('div', {
                                key: 'value',
                                className: "px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg"
                            }, React.createElement('span', {
                                className: `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    userProfile.profile?.role === 'Admin' 
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-gray-100 text-gray-800'
                                }`
                            }, userProfile.profile?.role || 'Utilisateur'))
                        ]),
                        
                        // Entreprise
                        React.createElement('div', { key: 'entreprise' }, [
                            React.createElement('label', {
                                key: 'label',
                                className: "block text-sm font-medium text-gray-700 mb-1"
                            }, "Entreprise"),
                            React.createElement('div', {
                                key: 'value',
                                className: "px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-600"
                            }, "ARKANCE"),
                            React.createElement('div', {
                                key: 'status',
                                className: "mt-1 flex items-center text-xs text-gray-500"
                            }, [
                                React.createElement('span', {
                                    key: 'badge',
                                    className: "inline-flex px-2 py-1 bg-green-100 text-green-800 rounded-full mr-2"
                                }, "interne"),
                                "L'entreprise est assignée par un administrateur"
                            ])
                        ]),
                        
                        React.createElement('button', {
                            key: 'submit',
                            type: "submit",
                            disabled: loading,
                            className: "w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        }, [
                            React.createElement('i', {
                                key: 'icon',
                                'data-lucide': 'edit',
                                className: "w-4 h-4 mr-2"
                            }),
                            "Modifier mes informations"
                        ])
                    ])
                ]),
                
                // Photo de profil et infos du compte
                React.createElement('div', {
                    key: 'avatar-section',
                    className: "space-y-6"
                }, [
                    // Photo de profil
                    React.createElement('div', {
                        key: 'avatar',
                        className: "text-center"
                    }, [
                        React.createElement('h3', {
                            key: 'title',
                            className: "text-lg font-medium text-gray-900 mb-4"
                        }, "Photo de profil"),
                        
                        React.createElement('div', {
                            key: 'avatar-display',
                            className: "flex justify-center mb-4"
                        }, currentAvatar 
                            ? React.createElement('img', {
                                src: currentAvatar,
                                alt: "Avatar",
                                className: "w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                            })
                            : React.createElement('div', {
                                className: "w-32 h-32 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold border-4 border-gray-200"
                            }, userInitials)
                        ),
                        
                        React.createElement('div', {
                            key: 'avatar-buttons',
                            className: "space-y-2"
                        }, [
                            React.createElement('button', {
                                key: 'change',
                                onClick: () => fileInputRef.current?.click(),
                                disabled: !userProfile.profile,
                                className: `w-full flex items-center justify-center px-4 py-2 text-white rounded-lg ${
                                    userProfile.profile 
                                        ? 'bg-blue-600 hover:bg-blue-700' 
                                        : 'bg-gray-400 cursor-not-allowed'
                                }`
                            }, [
                                React.createElement('i', {
                                    key: 'icon',
                                    'data-lucide': 'camera',
                                    className: "w-4 h-4 mr-2"
                                }),
                                "Changer la photo"
                            ]),
                            
                            currentAvatar && userProfile.profile && React.createElement('button', {
                                key: 'delete',
                                onClick: handleAvatarDelete,
                                className: "w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            }, [
                                React.createElement('i', {
                                    key: 'icon',
                                    'data-lucide': 'trash-2',
                                    className: "w-4 h-4 mr-2"
                                }),
                                "Supprimer la photo"
                            ]),
                            
                            avatarFile && userProfile.profile && React.createElement('button', {
                                key: 'save',
                                onClick: handleAvatarSave,
                                className: "w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            }, [
                                React.createElement('i', {
                                    key: 'icon',
                                    'data-lucide': 'save',
                                    className: "w-4 h-4 mr-2"
                                }),
                                "Sauvegarder"
                            ]),
                            
                            !userProfile.profile && React.createElement('p', {
                                key: 'info',
                                className: "text-xs text-orange-600 text-center p-2 bg-orange-50 rounded border border-orange-200"
                            }, "Renseignez d'abord vos informations personnelles pour ajouter une photo.")
                        ]),
                        
                        React.createElement('input', {
                            key: 'file-input',
                            ref: fileInputRef,
                            type: "file",
                            accept: "image/jpeg,image/jpg,image/png,image/gif",
                            onChange: handleAvatarChange,
                            className: "hidden"
                        }),
                        
                        React.createElement('p', {
                            key: 'formats',
                            className: "text-xs text-gray-500 mt-2"
                        }, "Formats acceptés : JPG, PNG, GIF"),
                        React.createElement('p', {
                            key: 'size',
                            className: "text-xs text-gray-500"
                        }, "Taille max : 5MB")
                    ]),
                    
                    // Informations du compte
                    React.createElement('div', {
                        key: 'account-info',
                        className: "bg-gray-50 rounded-lg p-4"
                    }, [
                        React.createElement('h3', {
                            key: 'title',
                            className: "text-lg font-medium text-gray-900 mb-4"
                        }, "Informations du compte"),
                        
                        React.createElement('div', {
                            key: 'info-list',
                            className: "space-y-3 text-sm"
                        }, [
                            React.createElement('div', {
                                key: 'id',
                                className: "flex items-center"
                            }, [
                                React.createElement('i', {
                                    key: 'icon',
                                    'data-lucide': 'user',
                                    className: "w-4 h-4 mr-2 text-gray-400"
                                }),
                                React.createElement('span', {
                                    key: 'label',
                                    className: "font-medium text-gray-700 mr-2"
                                }, "ID:"),
                                React.createElement('span', {
                                    key: 'value',
                                    className: "text-gray-600 font-mono text-xs"
                                }, auth.user?.id?.substring(0, 8) + '...' || 'N/A')
                            ]),
                            
                            React.createElement('div', {
                                key: 'created',
                                className: "flex items-center"
                            }, [
                                React.createElement('i', {
                                    key: 'icon',
                                    'data-lucide': 'calendar',
                                    className: "w-4 h-4 mr-2 text-gray-400"
                                }),
                                React.createElement('span', {
                                    key: 'label',
                                    className: "font-medium text-gray-700 mr-2"
                                }, "Créé le:"),
                                React.createElement('span', {
                                    key: 'value',
                                    className: "text-gray-600"
                                }, formatDate(auth.user?.created_at))
                            ]),
                            
                            React.createElement('div', {
                                key: 'updated',
                                className: "flex items-center"
                            }, [
                                React.createElement('i', {
                                    key: 'icon',
                                    'data-lucide': 'clock',
                                    className: "w-4 h-4 mr-2 text-gray-400"
                                }),
                                React.createElement('span', {
                                    key: 'label',
                                    className: "font-medium text-gray-700 mr-2"
                                }, "Dernière modif:"),
                                React.createElement('span', {
                                    key: 'value',
                                    className: "text-gray-600"
                                }, formatDate(userProfile.profile?.updated_at))
                            ])
                        ])
                    ]),
                    
                    // Informations importantes
                    React.createElement('div', {
                        key: 'important-info',
                        className: "bg-blue-50 border border-blue-200 rounded-lg p-4"
                    }, [
                        React.createElement('div', {
                            key: 'header',
                            className: "flex items-center mb-2"
                        }, [
                            React.createElement('i', {
                                key: 'icon',
                                'data-lucide': 'info',
                                className: "w-5 h-5 text-blue-600 mr-2"
                            }),
                            React.createElement('h4', {
                                key: 'title',
                                className: "font-medium text-blue-900"
                            }, "Informations importantes")
                        ]),
                        React.createElement('ul', {
                            key: 'list',
                            className: "text-sm text-blue-800 space-y-1"
                        }, [
                            React.createElement('li', {
                                key: 'email',
                                className: "flex items-start"
                            }, [
                                React.createElement('span', {
                                    key: 'bullet',
                                    className: "mr-2"
                                }, "•"),
                                "L'email ne peut pas être modifié depuis cette interface"
                            ]),
                            React.createElement('li', {
                                key: 'role',
                                className: "flex items-start"
                            }, [
                                React.createElement('span', {
                                    key: 'bullet',
                                    className: "mr-2"
                                }, "•"),
                                "Le rôle est géré par un administrateur"
                            ]),
                            React.createElement('li', {
                                key: 'entreprise',
                                className: "flex items-start"
                            }, [
                                React.createElement('span', {
                                    key: 'bullet',
                                    className: "mr-2"
                                }, "•"),
                                "L'entreprise est assignée par un administrateur"
                            ])
                        ])
                    ])
                ])
            ])),
            
            // Onglet Sécurité
            activeTab === 'security' && React.createElement('div', {
                key: 'security-tab',
                className: "p-6"
            }, React.createElement('div', {
                className: "max-w-md mx-auto"
            }, [
                React.createElement('h3', {
                    key: 'title',
                    className: "text-lg font-medium text-gray-900 mb-4"
                }, "Sécurité"),
                
                React.createElement('p', {
                    key: 'description',
                    className: "text-gray-600 mb-6"
                }, "Modifiez votre mot de passe pour sécuriser votre compte."),
                
                React.createElement('form', {
                    key: 'form',
                    onSubmit: handlePasswordSubmit,
                    className: "space-y-4"
                }, [
                    // Nouveau mot de passe
                    React.createElement('div', { key: 'new-password' }, [
                        React.createElement('label', {
                            key: 'label',
                            className: "block text-sm font-medium text-gray-700 mb-1"
                        }, "Nouveau mot de passe"),
                        React.createElement('input', {
                            key: 'input',
                            type: "password",
                            value: passwordData.newPassword,
                            onChange: (e) => setPasswordData({...passwordData, newPassword: e.target.value}),
                            className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                            required: true,
                            minLength: 6
                        })
                    ]),
                    
                    // Confirmer le mot de passe
                    React.createElement('div', { key: 'confirm-password' }, [
                        React.createElement('label', {
                            key: 'label',
                            className: "block text-sm font-medium text-gray-700 mb-1"
                        }, "Confirmer le mot de passe"),
                        React.createElement('input', {
                            key: 'input',
                            type: "password",
                            value: passwordData.confirmPassword,
                            onChange: (e) => setPasswordData({...passwordData, confirmPassword: e.target.value}),
                            className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                            required: true,
                            minLength: 6
                        })
                    ]),
                    
                    React.createElement('button', {
                        key: 'submit',
                        type: "submit",
                        disabled: loading,
                        className: "w-full flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                    }, [
                        React.createElement('i', {
                            key: 'icon',
                            'data-lucide': 'key',
                            className: "w-4 h-4 mr-2"
                        }),
                        "Changer mon mot de passe"
                    ])
                ])
            ]))
        ])
    ]));
}

// Export global
window.UserSettingsModal = UserSettingsModal;