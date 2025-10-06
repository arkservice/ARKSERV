// Modal Utilisateur
function UserModal({ item, defaultEntrepriseId, onSubmit, onClose }) {
    const { useState, useEffect, useRef } = React;
    const supabase = window.supabaseConfig.client;
    
    const [formData, setFormData] = useState({
        prenom: item?.prenom || '',
        nom: item?.nom || '',
        email: item?.email || '',
        password: '',
        avatar: item?.avatar || '',
        telephone: item?.telephone || '',
        role: item?.role || 'Utilisateur',
        entreprise_id: item?.entreprise?.id || defaultEntrepriseId || '',
        service_id: item?.service?.id || '',
        fonction_id: item?.fonction?.id || ''
    });
    
    const [options, setOptions] = useState({
        entreprises: [],
        services: [],
        fonctions: []
    });
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // États pour la gestion de l'avatar
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(item?.avatar || '');
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const fileInputRef = useRef(null);
    
    // Charger les options pour les sélecteurs
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                setLoading(true);
                
                // Récupérer toutes les options en parallèle
                const [entreprisesRes, servicesRes, fonctionsRes] = await Promise.all([
                    supabase.from('entreprise').select('id, nom').order('nom'),
                    supabase.from('service').select('id, nom').order('nom'),
                    supabase.from('fonction').select('id, nom').order('nom')
                ]);
                
                if (entreprisesRes.error) throw entreprisesRes.error;
                if (servicesRes.error) throw servicesRes.error;
                if (fonctionsRes.error) throw fonctionsRes.error;
                
                setOptions({
                    entreprises: entreprisesRes.data || [],
                    services: servicesRes.data || [],
                    fonctions: fonctionsRes.data || []
                });
            } catch (err) {
                console.error('Erreur lors du chargement des options:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        
        fetchOptions();
    }, []);
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.prenom.trim()) return;
        
        // Pour un nouvel utilisateur, email et mot de passe sont requis
        if (!item && (!formData.email.trim() || !formData.password.trim())) {
            setError('Email et mot de passe sont requis pour créer un nouvel utilisateur');
            return;
        }
        
        try {
            // Upload de l'avatar si un fichier est sélectionné
            let avatarUrl = formData.avatar;
            if (avatarFile) {
                avatarUrl = await uploadAvatar();
            }
            
            const dataToSubmit = {
                prenom: formData.prenom.trim(),
                nom: formData.nom.trim() || null,
                avatar: avatarUrl || null,
                telephone: formData.telephone.trim() || null,
                role: formData.role,
                entreprise_id: formData.entreprise_id || null,
                service_id: formData.service_id || null,
                fonction_id: formData.fonction_id || null
            };
            
            // Ajouter email et password pour la création
            if (!item) {
                dataToSubmit.email = formData.email.trim();
                dataToSubmit.password = formData.password;
            }
            
            onSubmit(dataToSubmit);
        } catch (error) {
            setError(`Erreur lors de l'upload de l'avatar: ${error.message}`);
        }
    };
    
    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };
    
    // Gestion de l'upload d'avatar
    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validation du fichier
            if (!file.type.match(/^image\/(jpeg|jpg|png|gif)$/)) {
                setError('Format d\'image non supporté. Utilisez JPG, PNG ou GIF.');
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) {
                setError('L\'image est trop grande. Taille maximum: 5MB.');
                return;
            }
            
            setError(null);
            setAvatarFile(file);
            
            // Créer une prévisualisation
            const reader = new FileReader();
            reader.onload = (e) => setAvatarPreview(e.target.result);
            reader.readAsDataURL(file);
        }
    };
    
    // Upload de l'avatar sur Supabase Storage
    const uploadAvatar = async () => {
        if (!avatarFile) return null;
        
        try {
            setUploadingAvatar(true);
            
            // Générer un nom de fichier unique
            const fileExt = avatarFile.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `avatars/${fileName}`;
            
            // Upload vers Supabase Storage
            const { data, error } = await supabase.storage
                .from('avatars')
                .upload(filePath, avatarFile);
            
            if (error) throw error;
            
            // Obtenir l'URL publique
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);
            
            return publicUrl;
        } catch (error) {
            console.error('Erreur lors de l\'upload d\'avatar:', error);
            throw error;
        } finally {
            setUploadingAvatar(false);
        }
    };
    
    if (loading) {
        return React.createElement('div', {
            className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-overlay"
        }, React.createElement('div', {
            className: "bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-8"
        }, React.createElement('div', {
            className: "text-center"
        }, [
            React.createElement('div', {
                key: 'spinner',
                className: "w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            }),
            React.createElement('p', {
                key: 'text',
                className: "text-gray-600"
            }, "Chargement des options...")
        ])));
    }
    
    return React.createElement('div', {
        className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-overlay"
    }, React.createElement('div', {
        className: "bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
    }, [
        React.createElement('div', {
            key: 'header',
            className: "px-6 py-4 border-b border-gray-200"
        }, React.createElement('h2', {
            className: "text-lg font-semibold text-gray-900"
        }, item ? "Modifier l'utilisateur" : "Nouvel utilisateur")),
        
        React.createElement('form', {
            key: 'form',
            onSubmit: handleSubmit,
            className: "px-6 py-4"
        }, [
            React.createElement('div', {
                key: 'fields',
                className: "space-y-4"
            }, [
                // Prénom (requis)
                React.createElement('div', { key: 'prenom-field' }, [
                    React.createElement('label', {
                        key: 'prenom-label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Prénom *"),
                    React.createElement('input', {
                        key: 'prenom-input',
                        type: "text",
                        value: formData.prenom,
                        onChange: (e) => handleChange('prenom', e.target.value),
                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                        required: true,
                        placeholder: "Prénom de l'utilisateur"
                    })
                ]),
                
                // Nom de famille
                React.createElement('div', { key: 'nom-field' }, [
                    React.createElement('label', {
                        key: 'nom-label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Nom de famille"),
                    React.createElement('input', {
                        key: 'nom-input',
                        type: "text",
                        value: formData.nom,
                        onChange: (e) => handleChange('nom', e.target.value),
                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                        placeholder: "Nom de famille"
                    })
                ]),
                
                // Email (requis pour les nouveaux utilisateurs)
                !item && React.createElement('div', { key: 'email-field' }, [
                    React.createElement('label', {
                        key: 'email-label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Email *"),
                    React.createElement('input', {
                        key: 'email-input',
                        type: "email",
                        value: formData.email,
                        onChange: (e) => handleChange('email', e.target.value),
                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                        required: true,
                        placeholder: "email@exemple.com"
                    })
                ]),
                
                // Mot de passe (requis pour les nouveaux utilisateurs)
                !item && React.createElement('div', { key: 'password-field' }, [
                    React.createElement('label', {
                        key: 'password-label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Mot de passe *"),
                    React.createElement('input', {
                        key: 'password-input',
                        type: "password",
                        value: formData.password,
                        onChange: (e) => handleChange('password', e.target.value),
                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                        required: true,
                        placeholder: "Minimum 6 caractères",
                        minLength: 6
                    })
                ]),
                
                // Avatar (Upload)
                React.createElement('div', { key: 'avatar-field' }, [
                    React.createElement('label', {
                        key: 'avatar-label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Avatar"),
                    
                    // Zone de prévisualisation
                    React.createElement('div', {
                        key: 'avatar-preview',
                        className: "mb-3 flex justify-center"
                    }, avatarPreview 
                        ? React.createElement('img', {
                            src: avatarPreview,
                            alt: "Aperçu",
                            className: "w-20 h-20 rounded-full object-cover border-2 border-gray-300"
                        })
                        : React.createElement('div', {
                            className: "w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center text-gray-500"
                        }, React.createElement('i', {
                            'data-lucide': 'user',
                            className: "w-8 h-8"
                        }))
                    ),
                    
                    // Bouton upload
                    React.createElement('button', {
                        key: 'avatar-upload',
                        type: "button",
                        onClick: () => fileInputRef.current?.click(),
                        disabled: uploadingAvatar,
                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    }, [
                        React.createElement('i', {
                            key: 'icon',
                            'data-lucide': uploadingAvatar ? 'loader-2' : 'upload',
                            className: `w-4 h-4 mr-2 ${uploadingAvatar ? 'animate-spin' : ''}`
                        }),
                        React.createElement('span', {
                            key: 'text'
                        }, uploadingAvatar ? 'Upload en cours...' : 'Choisir une image')
                    ]),
                    
                    // Input file caché
                    React.createElement('input', {
                        key: 'file-input',
                        ref: fileInputRef,
                        type: "file",
                        accept: "image/jpeg,image/jpg,image/png,image/gif",
                        onChange: handleAvatarChange,
                        className: "hidden"
                    }),
                    
                    // Informations format
                    React.createElement('p', {
                        key: 'info',
                        className: "text-xs text-gray-500 mt-1"
                    }, "JPG, PNG, GIF - Max 5MB")
                ]),
                
                // Téléphone
                React.createElement('div', { key: 'telephone-field' }, [
                    React.createElement('label', {
                        key: 'telephone-label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Téléphone"),
                    React.createElement('input', {
                        key: 'telephone-input',
                        type: "tel",
                        value: formData.telephone,
                        onChange: (e) => handleChange('telephone', e.target.value),
                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                        placeholder: "0123456789"
                    })
                ]),
                
                // Rôle
                React.createElement('div', { key: 'role-field' }, [
                    React.createElement('label', {
                        key: 'role-label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Rôle"),
                    React.createElement('select', {
                        key: 'role-select',
                        value: formData.role,
                        onChange: (e) => handleChange('role', e.target.value),
                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    }, [
                        React.createElement('option', { key: 'user', value: 'Utilisateur' }, 'Utilisateur'),
                        React.createElement('option', { key: 'manager', value: 'Manager' }, 'Manager'),
                        React.createElement('option', { key: 'admin', value: 'Admin' }, 'Admin')
                    ])
                ]),
                
                // Entreprise (masqué si defaultEntrepriseId est fourni)
                !defaultEntrepriseId && React.createElement('div', { key: 'entreprise-field' }, [
                    React.createElement('label', {
                        key: 'entreprise-label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Entreprise"),
                    React.createElement('select', {
                        key: 'entreprise-select',
                        value: formData.entreprise_id,
                        onChange: (e) => handleChange('entreprise_id', e.target.value),
                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    }, [
                        React.createElement('option', { key: 'empty', value: '' }, 'Sélectionner une entreprise'),
                        ...options.entreprises.map(entreprise =>
                            React.createElement('option', {
                                key: entreprise.id,
                                value: entreprise.id
                            }, entreprise.nom)
                        )
                    ])
                ]),
                
                // Affichage informatif de l'entreprise pré-sélectionnée
                defaultEntrepriseId && React.createElement('div', { key: 'entreprise-info' }, [
                    React.createElement('label', {
                        key: 'entreprise-info-label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Entreprise"),
                    React.createElement('div', {
                        key: 'entreprise-info-display',
                        className: "w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700"
                    }, (() => {
                        const entreprise = options.entreprises.find(e => e.id === defaultEntrepriseId);
                        return entreprise ? entreprise.nom : 'Entreprise sélectionnée';
                    })())
                ]),
                
                // Service
                React.createElement('div', { key: 'service-field' }, [
                    React.createElement('label', {
                        key: 'service-label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Service"),
                    React.createElement('select', {
                        key: 'service-select',
                        value: formData.service_id,
                        onChange: (e) => handleChange('service_id', e.target.value),
                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    }, [
                        React.createElement('option', { key: 'empty', value: '' }, 'Sélectionner un service'),
                        ...options.services.map(service =>
                            React.createElement('option', {
                                key: service.id,
                                value: service.id
                            }, service.nom)
                        )
                    ])
                ]),
                
                // Fonction
                React.createElement('div', { key: 'fonction-field' }, [
                    React.createElement('label', {
                        key: 'fonction-label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Fonction"),
                    React.createElement('select', {
                        key: 'fonction-select',
                        value: formData.fonction_id,
                        onChange: (e) => handleChange('fonction_id', e.target.value),
                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    }, [
                        React.createElement('option', { key: 'empty', value: '' }, 'Sélectionner une fonction'),
                        ...options.fonctions.map(fonction =>
                            React.createElement('option', {
                                key: fonction.id,
                                value: fonction.id
                            }, fonction.nom)
                        )
                    ])
                ]),
                
                // Message d'erreur
                error && React.createElement('div', {
                    key: 'error',
                    className: "bg-red-50 border border-red-200 rounded-lg p-3"
                }, React.createElement('p', {
                    className: "text-red-800 text-sm"
                }, error))
            ]),
            
            React.createElement('div', {
                key: 'buttons',
                className: "flex justify-end gap-3 mt-6"
            }, [
                React.createElement('button', {
                    key: 'cancel',
                    type: "button",
                    onClick: onClose,
                    className: "px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                }, "Annuler"),
                React.createElement('button', {
                    key: 'submit',
                    type: "submit",
                    className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                }, item ? "Modifier" : "Créer")
            ])
        ])
    ]));
}

// Export global
window.UserModal = UserModal;