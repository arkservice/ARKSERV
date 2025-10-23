// Composant FormationSessionPicker - Sélection de sessions de formation avec calendrier
function FormationSessionPicker({
    sessions = [],
    onChange,
    label = "Périodes de formation",
    required = false,
    className = ""
}) {
    const { useState, useEffect } = React;
    const { agences } = window.useAgences();
    const [showModal, setShowModal] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const [formData, setFormData] = useState({
        dateDebut: '',
        dateFin: '',
        heureDebut: '09:00',
        heureFin: '17:00',
        heureDebutCustom: '09:00',
        heureFinCustom: '17:00',
        lieu: '',
        adresse: '',
        agence_id: ''
    });
    const [error, setError] = useState('');

    useEffect(() => {
        lucide.createIcons();
    }, [sessions, showModal]);

    const resetForm = () => {
        setFormData({
            dateDebut: '',
            dateFin: '',
            heureDebut: '09:00',
            heureFin: '17:00',
            heureDebutCustom: '09:00',
            heureFinCustom: '17:00',
            lieu: '',
            adresse: '',
            agence_id: ''
        });
        setError('');
        setEditingIndex(null);
    };

    const handleAddSession = () => {
        resetForm();
        setShowModal(true);
    };

    const handleEditSession = (index) => {
        const session = sessions[index];
        const heureD = session.heureDebut || '09:00';
        const heureF = session.heureFin || '17:00';

        // Déterminer si c'est une heure standard ou personnalisée
        const heureDebutValue = ['09:00', '13:00'].includes(heureD) ? heureD : 'personnalise';
        const heureFinValue = ['12:00', '17:00'].includes(heureF) ? heureF : 'personnalise';

        setFormData({
            dateDebut: session.dateDebut.toISOString().split('T')[0],
            dateFin: session.dateFin.toISOString().split('T')[0],
            heureDebut: heureDebutValue,
            heureFin: heureFinValue,
            heureDebutCustom: heureD,
            heureFinCustom: heureF,
            lieu: session.lieu || '',
            adresse: session.adresse || '',
            agence_id: session.agence_id || ''
        });
        setEditingIndex(index);
        setShowModal(true);
    };

    const handleRemoveSession = (index) => {
        const newSessions = sessions.filter((_, i) => i !== index);
        onChange(newSessions);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('📝 [FormationSessionPicker] handleSubmit appelé', formData);
        setError('');

        // Vérifier que SessionUtils est disponible
        if (!window.SessionUtils) {
            console.error('❌ SessionUtils n\'est pas chargé');
            setError('Erreur de chargement du système. Veuillez rafraîchir la page.');
            return;
        }

        // Vérifier que les dates sont remplies
        if (!formData.dateDebut || !formData.dateFin) {
            console.error('❌ Dates manquantes', formData);
            setError('Veuillez remplir les dates de début et fin');
            return;
        }

        // Vérifier que le lieu est rempli
        if (!formData.lieu) {
            setError('Veuillez sélectionner un lieu de formation');
            return;
        }

        // Vérifier que l'agence est sélectionnée si le lieu est "Dans nos locaux"
        if (formData.lieu === 'Dans nos locaux' && (!formData.agence_id || formData.agence_id.trim() === '')) {
            setError('Veuillez sélectionner une agence');
            return;
        }

        // Vérifier que l'adresse est remplie si le lieu est "Dans vos locaux"
        if (formData.lieu === 'Dans vos locaux' && (!formData.adresse || formData.adresse.trim() === '')) {
            setError('Veuillez saisir l\'adresse de la formation');
            return;
        }

        // Déterminer les heures finales (standard ou personnalisée)
        const heureDebutFinal = formData.heureDebut === 'personnalise' ? formData.heureDebutCustom : formData.heureDebut;
        const heureFinFinal = formData.heureFin === 'personnalise' ? formData.heureFinCustom : formData.heureFin;

        // Créer la session
        const session = {
            dateDebut: new Date(formData.dateDebut),
            dateFin: new Date(formData.dateFin),
            heureDebut: heureDebutFinal,
            heureFin: heureFinFinal,
            lieu: formData.lieu,
            adresse: formData.lieu === 'Dans nos locaux'
                ? agences.find(a => a.id === formData.agence_id)?.nom || ''
                : formData.lieu === 'Dans vos locaux'
                ? formData.adresse
                : '',
            agence_id: formData.lieu === 'Dans nos locaux' ? formData.agence_id : null
        };

        console.log('📅 Session créée:', session);

        // Valider la session
        const validation = window.SessionUtils.validateSession(session);
        console.log('✅ Validation:', validation);

        if (!validation.valid) {
            setError(validation.error);
            return;
        }

        // Ajouter ou modifier la session
        let newSessions;
        if (editingIndex !== null) {
            newSessions = [...sessions];
            newSessions[editingIndex] = session;
            console.log('✏️ Session modifiée');
        } else {
            newSessions = [...sessions, session];
            console.log('➕ Session ajoutée');
        }

        console.log('📋 Nouvelles sessions:', newSessions);
        onChange(newSessions);
        setShowModal(false);
        resetForm();
    };

    const handleFieldChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Réinitialiser l'adresse et agence_id si le lieu change
        if (field === 'lieu') {
            setFormData(prev => ({
                ...prev,
                adresse: '',
                agence_id: ''
            }));
        }
    };

    return React.createElement('div', {
        className: className
    }, [
        // Label
        React.createElement('label', {
            key: 'label',
            className: "block text-sm font-medium text-gray-700 mb-2"
        }, [
            label,
            required && React.createElement('span', {
                key: 'required',
                className: 'text-red-500 ml-1'
            }, '*')
        ]),

        // Liste des sessions sélectionnées
        sessions.length > 0 && React.createElement('div', {
            key: 'sessions-list',
            className: 'space-y-2 mb-3'
        }, sessions.map((session, index) =>
            React.createElement('div', {
                key: index,
                className: 'flex items-start justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg'
            }, [
                // Partie gauche + droite (info session)
                React.createElement('div', {
                    key: 'info',
                    className: 'flex-1 grid grid-cols-2 gap-4'
                }, [
                    // GAUCHE : Dates
                    React.createElement('div', {
                        key: 'dates',
                        className: 'flex flex-col'
                    }, [
                        React.createElement('div', {
                            key: 'label',
                            className: 'text-xs font-medium text-gray-500 mb-1'
                        }, '📅 Dates'),
                        React.createElement('div', {
                            key: 'display',
                            className: 'text-sm font-medium text-gray-900'
                        }, window.SessionUtils ? window.SessionUtils.formatSessionDisplay(session) : 'Session'),
                        React.createElement('div', {
                            key: 'details',
                            className: 'text-xs text-gray-600 mt-1'
                        }, window.SessionUtils ? window.SessionUtils.formatSessionDetailled(session) : '')
                    ]),

                    // DROITE : Lieu + Adresse
                    React.createElement('div', {
                        key: 'lieu',
                        className: 'flex flex-col'
                    }, [
                        React.createElement('div', {
                            key: 'label',
                            className: 'text-xs font-medium text-gray-500 mb-1'
                        }, '📍 Lieu'),
                        React.createElement('div', {
                            key: 'lieu-value',
                            className: 'text-sm font-medium text-gray-900'
                        }, session.lieu || 'Lieu non défini'),
                        session.lieu === 'Dans vos locaux' && session.adresse && React.createElement('div', {
                            key: 'adresse',
                            className: 'text-xs text-gray-600 mt-1'
                        }, session.adresse)
                    ])
                ]),

                // Boutons d'actions
                React.createElement('div', {
                    key: 'actions',
                    className: 'flex items-center gap-2 ml-3'
                }, [
                    // Bouton éditer
                    React.createElement('button', {
                        key: 'edit',
                        type: 'button',
                        onClick: () => handleEditSession(index),
                        className: 'p-1 text-blue-600 hover:text-blue-800 focus:outline-none',
                        title: 'Modifier'
                    }, React.createElement('i', {
                        'data-lucide': 'edit',
                        className: 'w-4 h-4'
                    })),

                    // Bouton supprimer
                    React.createElement('button', {
                        key: 'remove',
                        type: 'button',
                        onClick: () => handleRemoveSession(index),
                        className: 'p-1 text-red-600 hover:text-red-800 focus:outline-none',
                        title: 'Supprimer'
                    }, React.createElement('i', {
                        'data-lucide': 'trash-2',
                        className: 'w-4 h-4'
                    }))
                ])
            ])
        )),

        // Bouton ajouter une session
        React.createElement('button', {
            key: 'add-button',
            type: 'button',
            onClick: handleAddSession,
            className: 'w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors flex items-center justify-center gap-2'
        }, [
            React.createElement('i', {
                key: 'icon',
                'data-lucide': 'plus',
                className: 'w-4 h-4'
            }),
            React.createElement('span', {
                key: 'text'
            }, sessions.length > 0 ? 'Ajouter une autre session' : 'Ajouter une session')
        ]),

        // Modal de sélection de session
        showModal && React.createElement('div', {
            key: 'modal',
            className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
            onClick: () => {
                setShowModal(false);
                resetForm();
            }
        }, React.createElement('div', {
            className: 'bg-white rounded-lg p-6 w-full max-w-md mx-4',
            onClick: (e) => e.stopPropagation()
        }, [
            // En-tête du modal
            React.createElement('div', {
                key: 'header',
                className: 'flex justify-between items-center mb-4'
            }, [
                React.createElement('h3', {
                    key: 'title',
                    className: 'text-lg font-semibold text-gray-900'
                }, editingIndex !== null ? 'Modifier la session' : 'Ajouter une session'),
                React.createElement('button', {
                    key: 'close',
                    onClick: () => {
                        setShowModal(false);
                        resetForm();
                    },
                    className: 'text-gray-400 hover:text-gray-600'
                }, React.createElement('i', {
                    'data-lucide': 'x',
                    className: 'w-5 h-5'
                }))
            ]),

            // Formulaire
            React.createElement('form', {
                key: 'form',
                onSubmit: handleSubmit,
                className: 'space-y-4'
            }, [
                // Date de début
                React.createElement('div', {
                    key: 'date-debut'
                }, [
                    React.createElement('label', {
                        key: 'label',
                        className: 'block text-sm font-medium text-gray-700 mb-1'
                    }, 'Date de début *'),
                    React.createElement('input', {
                        key: 'input',
                        type: 'date',
                        value: formData.dateDebut,
                        onChange: (e) => handleFieldChange('dateDebut', e.target.value),
                        required: true,
                        className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    })
                ]),

                // Heure de début
                React.createElement('div', {
                    key: 'heure-debut'
                }, [
                    React.createElement('label', {
                        key: 'label',
                        className: 'block text-sm font-medium text-gray-700 mb-1'
                    }, 'Heure de début *'),
                    React.createElement('select', {
                        key: 'select',
                        value: formData.heureDebut,
                        onChange: (e) => handleFieldChange('heureDebut', e.target.value),
                        className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    }, [
                        React.createElement('option', {
                            key: '09:00',
                            value: '09:00'
                        }, '09h00'),
                        React.createElement('option', {
                            key: '13:00',
                            value: '13:00'
                        }, '13h00'),
                        React.createElement('option', {
                            key: 'personnalise',
                            value: 'personnalise'
                        }, 'Heure personnalisée')
                    ])
                ]),

                // Heure de début personnalisée
                formData.heureDebut === 'personnalise' && React.createElement('div', {
                    key: 'heure-debut-custom'
                }, [
                    React.createElement('label', {
                        key: 'label',
                        className: 'block text-sm font-medium text-gray-700 mb-1'
                    }, 'Heure de début personnalisée *'),
                    React.createElement('input', {
                        key: 'input',
                        type: 'time',
                        value: formData.heureDebutCustom || '09:00',
                        onChange: (e) => handleFieldChange('heureDebutCustom', e.target.value),
                        required: true,
                        className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    })
                ]),

                // Date de fin
                React.createElement('div', {
                    key: 'date-fin'
                }, [
                    React.createElement('label', {
                        key: 'label',
                        className: 'block text-sm font-medium text-gray-700 mb-1'
                    }, 'Date de fin *'),
                    React.createElement('input', {
                        key: 'input',
                        type: 'date',
                        value: formData.dateFin,
                        onChange: (e) => handleFieldChange('dateFin', e.target.value),
                        required: true,
                        className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    })
                ]),

                // Heure de fin
                React.createElement('div', {
                    key: 'heure-fin'
                }, [
                    React.createElement('label', {
                        key: 'label',
                        className: 'block text-sm font-medium text-gray-700 mb-1'
                    }, 'Heure de fin *'),
                    React.createElement('select', {
                        key: 'select',
                        value: formData.heureFin,
                        onChange: (e) => handleFieldChange('heureFin', e.target.value),
                        className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    }, [
                        React.createElement('option', {
                            key: '12:00',
                            value: '12:00'
                        }, '12h00'),
                        React.createElement('option', {
                            key: '17:00',
                            value: '17:00'
                        }, '17h00'),
                        React.createElement('option', {
                            key: 'personnalise',
                            value: 'personnalise'
                        }, 'Heure personnalisée')
                    ])
                ]),

                // Heure de fin personnalisée
                formData.heureFin === 'personnalise' && React.createElement('div', {
                    key: 'heure-fin-custom'
                }, [
                    React.createElement('label', {
                        key: 'label',
                        className: 'block text-sm font-medium text-gray-700 mb-1'
                    }, 'Heure de fin personnalisée *'),
                    React.createElement('input', {
                        key: 'input',
                        type: 'time',
                        value: formData.heureFinCustom || '17:00',
                        onChange: (e) => handleFieldChange('heureFinCustom', e.target.value),
                        required: true,
                        className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    })
                ]),

                // Lieu de formation
                React.createElement('div', {
                    key: 'lieu-formation'
                }, [
                    React.createElement('label', {
                        key: 'label',
                        className: 'block text-sm font-medium text-gray-700 mb-1'
                    }, 'Lieu de formation *'),
                    React.createElement('select', {
                        key: 'select',
                        value: formData.lieu,
                        onChange: (e) => handleFieldChange('lieu', e.target.value),
                        required: true,
                        className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    }, [
                        React.createElement('option', {
                            key: 'empty',
                            value: ''
                        }, "Sélectionnez le lieu de formation"),
                        React.createElement('option', {
                            key: 'vos-locaux',
                            value: 'Dans vos locaux'
                        }, "Dans vos locaux"),
                        React.createElement('option', {
                            key: 'nos-locaux',
                            value: 'Dans nos locaux'
                        }, "Dans nos locaux"),
                        React.createElement('option', {
                            key: 'distance',
                            value: 'À distance'
                        }, "À distance")
                    ])
                ]),

                // Sélection d'agence (si "Dans nos locaux")
                formData.lieu === 'Dans nos locaux' && React.createElement('div', {
                    key: 'agence-selection'
                }, [
                    React.createElement('label', {
                        key: 'label',
                        className: 'block text-sm font-medium text-gray-700 mb-1'
                    }, 'Agence *'),
                    React.createElement('select', {
                        key: 'select',
                        value: formData.agence_id,
                        onChange: (e) => handleFieldChange('agence_id', e.target.value),
                        required: true,
                        className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    }, [
                        React.createElement('option', {
                            key: 'empty',
                            value: ''
                        }, "Sélectionnez une agence"),
                        ...agences.map(agence =>
                            React.createElement('option', {
                                key: agence.id,
                                value: agence.id
                            }, agence.nom)
                        )
                    ])
                ]),

                // Adresse de la formation (si "Dans vos locaux")
                formData.lieu === 'Dans vos locaux' && React.createElement('div', {
                    key: 'adresse-formation'
                }, [
                    React.createElement('label', {
                        key: 'label',
                        className: 'block text-sm font-medium text-gray-700 mb-1'
                    }, 'Adresse de la formation *'),
                    React.createElement('input', {
                        key: 'input',
                        type: 'text',
                        value: formData.adresse,
                        onChange: (e) => handleFieldChange('adresse', e.target.value),
                        placeholder: "Ex: 123 rue de la Formation, 75001 Paris",
                        className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    })
                ]),

                // Message d'erreur
                error && React.createElement('div', {
                    key: 'error',
                    className: 'p-3 bg-red-50 border border-red-200 rounded-md'
                }, React.createElement('p', {
                    className: 'text-sm text-red-600'
                }, error)),

                // Boutons d'action
                React.createElement('div', {
                    key: 'actions',
                    className: 'flex justify-end gap-3 mt-6'
                }, [
                    React.createElement('button', {
                        key: 'cancel',
                        type: 'button',
                        onClick: () => {
                            setShowModal(false);
                            resetForm();
                        },
                        className: 'px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50'
                    }, 'Annuler'),
                    React.createElement('button', {
                        key: 'submit',
                        type: 'submit',
                        className: 'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
                    }, editingIndex !== null ? 'Modifier' : 'Ajouter')
                ])
            ])
        ]))
    ]);
}

// Export global
window.FormationSessionPicker = FormationSessionPicker;
