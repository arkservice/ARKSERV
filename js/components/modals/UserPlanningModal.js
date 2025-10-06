function UserPlanningModal({ isOpen, onClose, onSubmit, onDelete = null, editingItem = null, availableUsers = [], defaultUserId = null }) {
    // Fonctions utilitaires pour gérer les dates en heure locale française
    // Utilise les utilitaires centralisés pour éviter les problèmes de fuseau horaire
    const formatDateForInput = (date) => {
        if (!date) return '';
        
        try {
            // Utiliser new Date() pour la conversion automatique UTC → heure locale
            // Cela assure la cohérence avec les tooltips et l'affichage
            let dateObj = new Date(date);
            
            if (isNaN(dateObj.getTime())) {
                console.warn('⚠️ [formatDateForInput] Date invalide:', date);
                return '';
            }
            
            // Formater pour input datetime-local (YYYY-MM-DDTHH:MM)
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            const hour = String(dateObj.getHours()).padStart(2, '0');
            const minute = String(dateObj.getMinutes()).padStart(2, '0');
            
            const formatted = `${year}-${month}-${day}T${hour}:${minute}`;
            console.log(`📅 [formatDateForInput] ${date} → ${formatted}`);
            return formatted;
            
        } catch (error) {
            console.error('❌ [formatDateForInput] Erreur:', error, 'pour date:', date);
            return '';
        }
    };
    
    const parseDateFromInput = (dateString) => {
        if (!dateString) return null;
        
        try {
            // Extraire les composants de la chaîne datetime-local (YYYY-MM-DDTHH:MM)
            const [datePart, timePart] = dateString.split('T');
            const [year, month, day] = datePart.split('-').map(num => parseInt(num, 10));
            const [hour, minute] = (timePart || '00:00').split(':').map(num => parseInt(num, 10));
            
            // Créer en heure locale sans conversion UTC automatique
            const localDate = new Date(year, month - 1, day, hour, minute);
            
            if (isNaN(localDate.getTime())) {
                console.warn('⚠️ [parseDateFromInput] Date invalide:', dateString);
                return null;
            }
            
            console.log(`📅 [parseDateFromInput] ${dateString} → ${localDate.toISOString()}`);
            return localDate;
            
        } catch (error) {
            console.error('❌ [parseDateFromInput] Erreur:', error, 'pour dateString:', dateString);
            return null;
        }
    };
    
    const [formData, setFormData] = React.useState({
        titre: '',
        description: '',
        date_debut: '',
        date_fin: '',
        user_id: '',
        type_evenement: 'formation',
        statut: 'planifie',
        priorite: 'normale',
        lieu: '',
        lien_visio: ''
    });
    
    const [errors, setErrors] = React.useState({});
    const [loading, setLoading] = React.useState(false);
    
    const typeOptions = [
        { value: 'formation', label: 'Formation' },
        { value: 'reunion', label: 'Réunion' },
        { value: 'conge', label: 'Congé' },
        { value: 'maintenance', label: 'Maintenance' },
        { value: 'deplacement', label: 'Déplacement' },
        { value: 'rendez_vous', label: 'Rendez-vous' },
        { value: 'autre', label: 'Autre' }
    ];
    
    const statutOptions = [
        { value: 'planifie', label: 'Planifié' },
        { value: 'confirme', label: 'Confirmé' },
        { value: 'en_cours', label: 'En cours' },
        { value: 'termine', label: 'Terminé' },
        { value: 'annule', label: 'Annulé' }
    ];
    
    const prioriteOptions = [
        { value: 'haute', label: 'Haute' },
        { value: 'normale', label: 'Normale' },
        { value: 'basse', label: 'Basse' }
    ];
    
    React.useEffect(() => {
        if (editingItem) {
            setFormData({
                titre: editingItem.titre || '',
                description: editingItem.description || '',
                date_debut: formatDateForInput(editingItem.date_debut),
                date_fin: formatDateForInput(editingItem.date_fin),
                user_id: editingItem.user_id || defaultUserId || '',
                type_evenement: editingItem.type_evenement || 'formation',
                statut: editingItem.statut || 'planifie',
                priorite: editingItem.priorite || 'normale',
                lieu: editingItem.lieu || '',
                lien_visio: editingItem.lien_visio || ''
            });
        } else {
            setFormData({
                titre: '',
                description: '',
                date_debut: '',
                date_fin: '',
                user_id: defaultUserId || '',
                type_evenement: 'formation',
                statut: 'planifie',
                priorite: 'normale',
                lieu: '',
                lien_visio: ''
            });
        }
        setErrors({});
    }, [editingItem, isOpen, defaultUserId]);
    
    const handleChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };
    
    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.titre.trim()) {
            newErrors.titre = 'Le titre est requis';
        }
        
        if (!formData.user_id) {
            newErrors.user_id = 'L\'utilisateur est requis';
        }
        
        if (!formData.date_debut) {
            newErrors.date_debut = 'La date de début est requise';
        }
        
        if (!formData.date_fin) {
            newErrors.date_fin = 'La date de fin est requise';
        }
        
        if (formData.date_debut && formData.date_fin) {
            const startDate = new Date(formData.date_debut);
            const endDate = new Date(formData.date_fin);
            
            if (startDate >= endDate) {
                newErrors.date_fin = 'La date de fin doit être postérieure à la date de début';
            }
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;
        
        setLoading(true);
        
        try {
            // Créer les dates en utilisant les fonctions sécurisées
            const dateDebut = parseDateFromInput(formData.date_debut);
            const dateFin = parseDateFromInput(formData.date_fin);
            
            if (!dateDebut || !dateFin) {
                setErrors({ submit: 'Erreur lors de la conversion des dates' });
                return;
            }
            
            const submitData = {
                ...formData,
                date_debut: dateDebut.toISOString(),
                date_fin: dateFin.toISOString()
            };
            
            await onSubmit(submitData);
            onClose();
        } catch (err) {
            console.error('Erreur lors de la soumission:', err);
            setErrors({ submit: err.message });
        } finally {
            setLoading(false);
        }
    };
    
    const createFormField = (label, field, type = 'text', options = null) => {
        return React.createElement('div', {
            key: field,
            className: 'space-y-1'
        }, [
            React.createElement('label', {
                key: 'label',
                className: 'block text-sm font-medium text-gray-700'
            }, label),
            options ? 
                React.createElement('select', {
                    key: 'select',
                    value: formData[field],
                    onChange: (e) => handleChange(field, e.target.value),
                    className: `w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors[field] ? 'border-red-500' : ''}`
                }, options.map(option => 
                    React.createElement('option', {
                        key: option.value,
                        value: option.value
                    }, option.label)
                )) :
                React.createElement(type === 'textarea' ? 'textarea' : 'input', {
                    key: 'input',
                    type: type,
                    value: formData[field],
                    onChange: (e) => handleChange(field, e.target.value),
                    className: `w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors[field] ? 'border-red-500' : ''}`,
                    rows: type === 'textarea' ? 3 : undefined
                }),
            errors[field] && React.createElement('p', {
                key: 'error',
                className: 'text-sm text-red-600'
            }, errors[field])
        ]);
    };
    
    const createUserSelector = () => {
        const getUserDisplayName = (user) => {
            const fullName = `${user.prenom || ''} ${user.nom || ''}`.trim();
            return fullName || 'Sans nom';
        };
        
        const getUserInitials = (user) => {
            if (user.prenom && user.nom) {
                return `${user.prenom.charAt(0)}${user.nom.charAt(0)}`.toUpperCase();
            } else if (user.prenom) {
                return user.prenom.substring(0, 2).toUpperCase();
            }
            return 'U';
        };
        
        return React.createElement('div', {
            key: 'user-selector',
            className: 'space-y-1'
        }, [
            React.createElement('label', {
                key: 'label',
                className: 'block text-sm font-medium text-gray-700'
            }, 'Attribué à *'),
            React.createElement('select', {
                key: 'select',
                value: formData.user_id,
                onChange: (e) => handleChange('user_id', e.target.value),
                className: `w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.user_id ? 'border-red-500' : ''}`
            }, [
                React.createElement('option', {
                    key: 'empty',
                    value: ''
                }, 'Sélectionner un utilisateur'),
                ...availableUsers.map(user => 
                    React.createElement('option', {
                        key: user.id,
                        value: user.id
                    }, `${getUserDisplayName(user)} - ${user.fonction?.nom || 'Fonction inconnue'}`)
                )
            ]),
            errors.user_id && React.createElement('p', {
                key: 'error',
                className: 'text-sm text-red-600'
            }, errors.user_id)
        ]);
    };
    
    if (!isOpen) return null;
    
    return React.createElement('div', {
        className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
        onClick: onClose
    }, 
        React.createElement('div', {
            className: 'bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto',
            onClick: (e) => e.stopPropagation()
        }, [
            React.createElement('div', {
                key: 'header',
                className: 'flex justify-between items-center mb-4'
            }, [
                React.createElement('h2', {
                    key: 'title',
                    className: 'text-xl font-semibold text-gray-900'
                }, editingItem ? 'Modifier l\'événement' : 'Ajouter un événement'),
                React.createElement('button', {
                    key: 'close',
                    onClick: onClose,
                    className: 'text-gray-400 hover:text-gray-600'
                }, React.createElement('i', {
                    'data-lucide': 'x',
                    className: 'w-6 h-6'
                }))
            ]),
            
            React.createElement('form', {
                key: 'form',
                onSubmit: handleSubmit,
                className: 'space-y-4'
            }, [
                createFormField('Titre *', 'titre'),
                availableUsers.length > 0 && createUserSelector(),
                createFormField('Description', 'description', 'textarea'),
                
                React.createElement('div', {
                    key: 'date-row',
                    className: 'grid grid-cols-2 gap-4'
                }, [
                    createFormField('Date de début *', 'date_debut', 'datetime-local'),
                    createFormField('Date de fin *', 'date_fin', 'datetime-local')
                ]),
                
                React.createElement('div', {
                    key: 'type-row',
                    className: 'grid grid-cols-3 gap-4'
                }, [
                    createFormField('Type', 'type_evenement', 'select', typeOptions),
                    createFormField('Statut', 'statut', 'select', statutOptions),
                    createFormField('Priorité', 'priorite', 'select', prioriteOptions)
                ]),
                
                React.createElement('div', {
                    key: 'location-row',
                    className: 'grid grid-cols-2 gap-4'
                }, [
                    createFormField('Lieu', 'lieu'),
                    createFormField('Lien visio', 'lien_visio', 'url')
                ]),
                
                errors.submit && React.createElement('div', {
                    key: 'error',
                    className: 'p-3 bg-red-50 border border-red-200 rounded-md'
                }, React.createElement('p', {
                    className: 'text-sm text-red-600'
                }, errors.submit)),
                
                React.createElement('div', {
                    key: 'actions',
                    className: 'flex justify-between items-center pt-4'
                }, [
                    // Bouton supprimer à gauche (seulement en mode édition)
                    React.createElement('div', {
                        key: 'delete-section'
                    }, editingItem && onDelete ? React.createElement('button', {
                        key: 'delete',
                        type: 'button',
                        onClick: () => {
                            if (confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
                                onDelete();
                            }
                        },
                        className: 'px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700'
                    }, 'Supprimer') : null),
                    
                    // Boutons principaux à droite
                    React.createElement('div', {
                        key: 'main-actions',
                        className: 'flex space-x-3'
                    }, [
                        React.createElement('button', {
                            key: 'cancel',
                            type: 'button',
                            onClick: onClose,
                            className: 'px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200'
                        }, 'Annuler'),
                        React.createElement('button', {
                            key: 'submit',
                            type: 'submit',
                            disabled: loading,
                            className: 'px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50'
                        }, loading ? 'Enregistrement...' : (editingItem ? 'Modifier' : 'Ajouter'))
                    ])
                ])
            ])
        ])
    );
}

window.UserPlanningModal = UserPlanningModal;