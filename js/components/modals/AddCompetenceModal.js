// Modal pour ajouter une compétence à un collaborateur
function AddCompetenceModal({ logicielId, onSubmit, onClose }) {
    const { useState, useEffect } = React;
    const { users, loading: loadingUsers } = window.useArkanceUsers();
    const auth = window.useAuth();

    const [formData, setFormData] = useState({
        user_id: '',
        niveau: '',
        certifie: false,
        commentaire: ''
    });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    // Initialiser les icônes Lucide
    useEffect(() => {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }, []);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.user_id) {
            newErrors.user_id = "Veuillez sélectionner un collaborateur";
        }

        if (!formData.niveau) {
            newErrors.niveau = "Veuillez sélectionner un niveau";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setSubmitting(true);

        try {
            const dataToSubmit = {
                user_id: formData.user_id,
                logiciel_id: logicielId,
                niveau: parseInt(formData.niveau),
                certifie: formData.certifie,
                commentaire: formData.commentaire.trim() || null,
                evaluateur_id: auth.user?.id || null
            };

            await onSubmit(dataToSubmit);
        } catch (error) {
            console.error('Erreur lors de la soumission:', error);
            setSubmitting(false);
        }
    };

    return React.createElement('div', {
        className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-overlay",
        onClick: (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                onClose();
            }
        }
    }, React.createElement('div', {
        className: "bg-white rounded-lg shadow-xl w-full max-w-md mx-4"
    }, [
        // Header
        React.createElement('div', {
            key: 'header',
            className: "px-6 py-4 border-b border-gray-200 flex items-center justify-between"
        }, [
            React.createElement('h2', {
                key: 'title',
                className: "text-lg font-semibold text-gray-900"
            }, "Ajouter un collaborateur compétent"),
            React.createElement('button', {
                key: 'close',
                type: 'button',
                onClick: onClose,
                className: "text-gray-400 hover:text-gray-600 transition-colors"
            }, React.createElement('i', {
                'data-lucide': 'x',
                className: "w-5 h-5"
            }))
        ]),

        // Form
        React.createElement('form', {
            key: 'form',
            onSubmit: handleSubmit,
            className: "px-6 py-4"
        }, [
            React.createElement('div', {
                key: 'fields',
                className: "space-y-4"
            }, [
                // Collaborateur
                React.createElement('div', { key: 'user-field' }, [
                    React.createElement('label', {
                        key: 'user-label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Collaborateur *"),
                    loadingUsers ?
                        React.createElement('div', {
                            key: 'user-loading',
                            className: "w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-400"
                        }, "Chargement...") :
                        React.createElement('select', {
                            key: 'user-select',
                            value: formData.user_id,
                            onChange: (e) => {
                                setFormData({ ...formData, user_id: e.target.value });
                                if (errors.user_id) {
                                    setErrors({ ...errors, user_id: null });
                                }
                            },
                            className: `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                                errors.user_id
                                    ? 'border-red-300 focus:ring-red-500'
                                    : 'border-gray-300 focus:ring-blue-500'
                            }`
                        }, [
                            React.createElement('option', {
                                key: 'empty',
                                value: ''
                            }, "Sélectionnez un collaborateur..."),
                            ...users.map(user =>
                                React.createElement('option', {
                                    key: user.id,
                                    value: user.id
                                }, `${user.prenom} ${user.nom || ''}`.trim())
                            )
                        ]),
                    errors.user_id && React.createElement('p', {
                        key: 'user-error',
                        className: "mt-1 text-sm text-red-600"
                    }, errors.user_id)
                ]),

                // Niveau
                React.createElement('div', { key: 'niveau-field' }, [
                    React.createElement('label', {
                        key: 'niveau-label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Niveau de compétence *"),
                    React.createElement('select', {
                        key: 'niveau-select',
                        value: formData.niveau,
                        onChange: (e) => {
                            setFormData({ ...formData, niveau: e.target.value });
                            if (errors.niveau) {
                                setErrors({ ...errors, niveau: null });
                            }
                        },
                        className: `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                            errors.niveau
                                ? 'border-red-300 focus:ring-red-500'
                                : 'border-gray-300 focus:ring-blue-500'
                        }`
                    }, [
                        React.createElement('option', {
                            key: 'empty',
                            value: ''
                        }, "Sélectionnez un niveau..."),
                        React.createElement('option', {
                            key: '1',
                            value: '1'
                        }, "1 - Débutant"),
                        React.createElement('option', {
                            key: '2',
                            value: '2'
                        }, "2 - Élémentaire"),
                        React.createElement('option', {
                            key: '3',
                            value: '3'
                        }, "3 - Intermédiaire"),
                        React.createElement('option', {
                            key: '4',
                            value: '4'
                        }, "4 - Avancé"),
                        React.createElement('option', {
                            key: '5',
                            value: '5'
                        }, "5 - Expert")
                    ]),
                    errors.niveau && React.createElement('p', {
                        key: 'niveau-error',
                        className: "mt-1 text-sm text-red-600"
                    }, errors.niveau)
                ]),

                // Certifié
                React.createElement('div', {
                    key: 'certifie-field',
                    className: "flex items-center gap-2"
                }, [
                    React.createElement('input', {
                        key: 'certifie-input',
                        type: 'checkbox',
                        id: 'certifie',
                        checked: formData.certifie,
                        onChange: (e) => setFormData({ ...formData, certifie: e.target.checked }),
                        className: "w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    }),
                    React.createElement('label', {
                        key: 'certifie-label',
                        htmlFor: 'certifie',
                        className: "text-sm font-medium text-gray-700 cursor-pointer"
                    }, "Compétence certifiée")
                ]),

                // Commentaire
                React.createElement('div', { key: 'commentaire-field' }, [
                    React.createElement('label', {
                        key: 'commentaire-label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Commentaire (optionnel)"),
                    React.createElement('textarea', {
                        key: 'commentaire-input',
                        value: formData.commentaire,
                        onChange: (e) => setFormData({ ...formData, commentaire: e.target.value }),
                        rows: 3,
                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                        placeholder: "Notes sur la compétence, expérience, projets réalisés..."
                    })
                ])
            ]),

            // Boutons
            React.createElement('div', {
                key: 'buttons',
                className: "flex justify-end gap-3 mt-6"
            }, [
                React.createElement('button', {
                    key: 'cancel',
                    type: "button",
                    onClick: onClose,
                    disabled: submitting,
                    className: "px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                }, "Annuler"),
                React.createElement('button', {
                    key: 'submit',
                    type: "submit",
                    disabled: submitting,
                    className: "inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                }, [
                    submitting && React.createElement('i', {
                        key: 'spinner',
                        'data-lucide': 'loader-2',
                        className: "w-4 h-4 animate-spin"
                    }),
                    submitting ? "Ajout en cours..." : "Ajouter"
                ])
            ])
        ])
    ]));
}

// Export global
window.AddCompetenceModal = AddCompetenceModal;
