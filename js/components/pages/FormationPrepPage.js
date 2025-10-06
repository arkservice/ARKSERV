// Page de gestion des formations (PRJ)
function FormationPrepPage() {
    const { useState, useEffect } = React;
    const { sessions, loading, createSession, generateEvaluationUrl, deleteSession } = window.useFormation();
    const { pdcs } = window.usePdc();
    const { users } = window.useArkanceUsers();

    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        pdc_id: '',
        formateur_id: '',
        commercial_id: '',
        prj: '',
        lieu_formation: ''
    });

    const [generatedUrl, setGeneratedUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        lucide.createIcons();
    }, [sessions, showForm, generatedUrl]);

    const handleFieldChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        setError(null);
    };

    const validateForm = () => {
        if (!formData.pdc_id) {
            setError('Veuillez sélectionner un plan de cours');
            return false;
        }
        if (!formData.formateur_id) {
            setError('Veuillez sélectionner un formateur');
            return false;
        }
        if (!formData.commercial_id) {
            setError('Veuillez sélectionner un commercial');
            return false;
        }
        if (!formData.prj || formData.prj.trim() === '') {
            setError('Veuillez saisir le PRJ');
            return false;
        }
        if (!formData.lieu_formation) {
            setError('Veuillez sélectionner le lieu de formation');
            return false;
        }
        return true;
    };

    const handleGenerate = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            setSuccessMessage('');

            // Créer la session d'évaluation
            const session = await createSession(formData);

            // Générer l'URL
            const url = generateEvaluationUrl(session.token);
            setGeneratedUrl(url);
            setSuccessMessage('Lien d\'évaluation généré avec succès !');

            // Réinitialiser le formulaire
            setFormData({
                pdc_id: '',
                formateur_id: '',
                commercial_id: '',
                prj: '',
                lieu_formation: ''
            });

        } catch (err) {
            console.error('Erreur lors de la génération:', err);
            setError('Erreur lors de la génération du lien: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyUrl = (url) => {
        navigator.clipboard.writeText(url);
        alert('URL copiée dans le presse-papiers !');
    };

    const handleReset = () => {
        setGeneratedUrl('');
        setSuccessMessage('');
        setError(null);
        setShowForm(false);
    };

    const handleDelete = async (id) => {
        if (confirm('Voulez-vous vraiment supprimer cette formation ?')) {
            try {
                await deleteSession(id);
            } catch (err) {
                console.error('Erreur lors de la suppression:', err);
                alert('Erreur lors de la suppression: ' + err.message);
            }
        }
    };

    // Filtrer les utilisateurs formateurs et commerciaux
    const formateurs = users.filter(u => u.fonction?.nom === 'formateur');
    const commerciaux = users.filter(u => u.fonction?.nom === 'commercial');

    // Configuration des colonnes du tableau
    const columns = [
        {
            key: 'prj',
            label: 'PRJ',
            sortable: true,
            render: (value, row) => React.createElement('span', {
                className: 'font-medium text-gray-900'
            }, value || 'N/A')
        },
        {
            key: 'pdc',
            label: 'Plan de cours',
            sortable: true,
            render: (value, row) => value?.ref || value?.pdc_number || 'N/A'
        },
        {
            key: 'formateur',
            label: 'Formateur',
            sortable: true,
            render: (value, row) => value ? `${value.prenom || ''} ${value.nom || ''}`.trim() : 'N/A'
        },
        {
            key: 'commercial',
            label: 'Commercial',
            sortable: true,
            render: (value, row) => value ? `${value.prenom || ''} ${value.nom || ''}`.trim() : 'N/A'
        },
        {
            key: 'lieu_formation',
            label: 'Lieu',
            sortable: true
        },
        {
            key: 'token',
            label: 'Lien',
            render: (value, row) => {
                const url = generateEvaluationUrl(value);
                return React.createElement('button', {
                    onClick: () => handleCopyUrl(url),
                    className: 'inline-flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors'
                }, [
                    React.createElement('i', {
                        key: 'icon',
                        'data-lucide': 'copy',
                        className: 'w-4 h-4'
                    }),
                    React.createElement('span', {
                        key: 'text'
                    }, 'Copier')
                ]);
            }
        },
        {
            key: 'created_at',
            label: 'Date création',
            sortable: true,
            render: (value) => value ? new Date(value).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) : 'N/A'
        }
    ];

    // Si on affiche le formulaire
    if (showForm) {
        return React.createElement('div', {
            className: "space-y-6"
        }, [
            // Bouton retour
            React.createElement('div', {
                key: 'back',
                className: "flex items-center gap-2"
            }, React.createElement('button', {
                onClick: () => {
                    setShowForm(false);
                    setGeneratedUrl('');
                    setError(null);
                    setSuccessMessage('');
                },
                className: 'inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors'
            }, [
                React.createElement('i', {
                    key: 'icon',
                    'data-lucide': 'arrow-left',
                    className: 'w-4 h-4'
                }),
                React.createElement('span', {
                    key: 'text'
                }, 'Retour à la liste')
            ])),

            // En-tête
            React.createElement('div', {
                key: 'header',
                className: "bg-white rounded-lg border border-gray-200 p-6"
            }, [
                React.createElement('h1', {
                    key: 'title',
                    className: "text-2xl font-bold text-gray-900 mb-2"
                }, "Nouvelle formation (PRJ)"),
                React.createElement('p', {
                    key: 'subtitle',
                    className: "text-gray-600"
                }, "Préparez un formulaire d'évaluation et générez un lien à envoyer aux stagiaires")
            ]),

            // Messages
            error && React.createElement('div', {
                key: 'error',
                className: "bg-red-50 border border-red-200 rounded-lg p-4"
            }, React.createElement('p', {
                className: "text-red-800 text-sm"
            }, error)),

            successMessage && React.createElement('div', {
                key: 'success',
                className: "bg-green-50 border border-green-200 rounded-lg p-4"
            }, React.createElement('p', {
                className: "text-green-800 text-sm font-medium"
            }, successMessage)),

            // Formulaire
            !generatedUrl && React.createElement('div', {
                key: 'form',
                className: "bg-white rounded-lg border border-gray-200 p-6"
            }, [
                React.createElement('h2', {
                    key: 'form-title',
                    className: "text-lg font-semibold text-gray-900 mb-4"
                }, "Informations de la formation"),

                React.createElement('div', {
                    key: 'form-grid',
                    className: "grid grid-cols-1 md:grid-cols-2 gap-6"
                }, [
                    // Plan de cours
                    React.createElement('div', {
                        key: 'pdc'
                    }, [
                        React.createElement('label', {
                            key: 'label',
                            className: "block text-sm font-medium text-gray-700 mb-2"
                        }, "Plan de cours *"),
                        React.createElement('select', {
                            key: 'select',
                            value: formData.pdc_id,
                            onChange: (e) => handleFieldChange('pdc_id', e.target.value),
                            className: "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        }, [
                            React.createElement('option', {
                                key: 'empty',
                                value: ''
                            }, "Sélectionnez un PDC"),
                            ...pdcs.map(pdc =>
                                React.createElement('option', {
                                    key: pdc.id,
                                    value: pdc.id
                                }, pdc.ref || `PDC #${pdc.pdc_number}`)
                            )
                        ])
                    ]),

                    // Formateur
                    React.createElement('div', {
                        key: 'formateur'
                    }, [
                        React.createElement('label', {
                            key: 'label',
                            className: "block text-sm font-medium text-gray-700 mb-2"
                        }, "Formateur *"),
                        React.createElement('select', {
                            key: 'select',
                            value: formData.formateur_id,
                            onChange: (e) => handleFieldChange('formateur_id', e.target.value),
                            className: "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        }, [
                            React.createElement('option', {
                                key: 'empty',
                                value: ''
                            }, "Sélectionnez un formateur"),
                            ...formateurs.map(user =>
                                React.createElement('option', {
                                    key: user.id,
                                    value: user.id
                                }, `${user.prenom || ''} ${user.nom || ''}`.trim() || user.email)
                            )
                        ])
                    ]),

                    // Commercial
                    React.createElement('div', {
                        key: 'commercial'
                    }, [
                        React.createElement('label', {
                            key: 'label',
                            className: "block text-sm font-medium text-gray-700 mb-2"
                        }, "Commercial *"),
                        React.createElement('select', {
                            key: 'select',
                            value: formData.commercial_id,
                            onChange: (e) => handleFieldChange('commercial_id', e.target.value),
                            className: "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        }, [
                            React.createElement('option', {
                                key: 'empty',
                                value: ''
                            }, "Sélectionnez un commercial"),
                            ...commerciaux.map(user =>
                                React.createElement('option', {
                                    key: user.id,
                                    value: user.id
                                }, `${user.prenom || ''} ${user.nom || ''}`.trim() || user.email)
                            )
                        ])
                    ]),

                    // PRJ
                    React.createElement('div', {
                        key: 'prj'
                    }, [
                        React.createElement('label', {
                            key: 'label',
                            className: "block text-sm font-medium text-gray-700 mb-2"
                        }, "PRJ *"),
                        React.createElement('input', {
                            key: 'input',
                            type: 'text',
                            value: formData.prj,
                            onChange: (e) => handleFieldChange('prj', e.target.value),
                            placeholder: "Ex: PRJ-2025-001",
                            className: "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        })
                    ]),

                    // Lieu de formation
                    React.createElement('div', {
                        key: 'lieu',
                        className: "md:col-span-2"
                    }, [
                        React.createElement('label', {
                            key: 'label',
                            className: "block text-sm font-medium text-gray-700 mb-2"
                        }, "Lieu de formation *"),
                        React.createElement('select', {
                            key: 'select',
                            value: formData.lieu_formation,
                            onChange: (e) => handleFieldChange('lieu_formation', e.target.value),
                            className: "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    ])
                ]),

                // Bouton générer
                React.createElement('div', {
                    key: 'actions',
                    className: "mt-6 flex justify-end"
                }, React.createElement('button', {
                    onClick: handleGenerate,
                    disabled: isLoading,
                    className: `inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white rounded-lg transition-colors ${
                        isLoading
                            ? 'bg-blue-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                    }`
                }, [
                    React.createElement('i', {
                        key: 'icon',
                        'data-lucide': isLoading ? 'loader-2' : 'link',
                        className: `w-4 h-4 ${isLoading ? 'animate-spin' : ''}`
                    }),
                    isLoading ? "Génération..." : "Générer le lien d'évaluation"
                ]))
            ]),

            // URL générée
            generatedUrl && React.createElement('div', {
                key: 'url',
                className: "bg-white rounded-lg border border-gray-200 p-6"
            }, [
                React.createElement('h2', {
                    key: 'title',
                    className: "text-lg font-semibold text-gray-900 mb-4"
                }, "Lien d'évaluation généré"),

                React.createElement('div', {
                    key: 'url-display',
                    className: "bg-gray-50 rounded-lg p-4 mb-4"
                }, [
                    React.createElement('p', {
                        key: 'label',
                        className: "text-sm text-gray-600 mb-2"
                    }, "Copiez et envoyez ce lien aux stagiaires :"),
                    React.createElement('div', {
                        key: 'url-box',
                        className: "flex items-center gap-2"
                    }, [
                        React.createElement('input', {
                            key: 'input',
                            type: 'text',
                            value: generatedUrl,
                            readOnly: true,
                            className: "flex-1 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-mono"
                        }),
                        React.createElement('button', {
                            key: 'copy',
                            onClick: () => handleCopyUrl(generatedUrl),
                            className: "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                        }, [
                            React.createElement('i', {
                                key: 'icon',
                                'data-lucide': 'copy',
                                className: "w-4 h-4"
                            }),
                            "Copier"
                        ])
                    ])
                ]),

                React.createElement('div', {
                    key: 'actions',
                    className: "flex justify-end"
                }, React.createElement('button', {
                    onClick: handleReset,
                    className: "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                }, [
                    React.createElement('i', {
                        key: 'icon',
                        'data-lucide': 'arrow-left',
                        className: "w-4 h-4"
                    }),
                    "Retour à la liste"
                ]))
            ])
        ]);
    }

    // Vue tableau
    return React.createElement(window.TableView, {
        data: sessions,
        columns: columns,
        title: "Formations (PRJ)",
        subtitle: "Liste de toutes les formations avec liens d'évaluation",
        loading: loading,
        onAdd: () => setShowForm(true),
        onDelete: handleDelete,
        searchableFields: ['prj', 'pdc.ref', 'formateur.nom', 'formateur.prenom', 'commercial.nom', 'commercial.prenom', 'lieu_formation']
    });
}

// Export global
window.FormationPrepPage = FormationPrepPage;
