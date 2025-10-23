// Page Agences Arkance
function AgencesPage() {
    const { useState } = React;
    const { agences, loading, error, createAgence, updateAgence, deleteAgence } = window.useAgences();
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const columns = [
        {
            key: 'nom',
            label: 'Nom de l\'agence',
            type: 'text',
            sortable: true
        },
        {
            key: 'adresse',
            label: 'Adresse',
            type: 'text',
            sortable: true
        }
    ];

    const handleCreate = () => {
        setEditingItem(null);
        setShowModal(true);
    };

    const handleEdit = (agence) => {
        setEditingItem(agence);
        setShowModal(true);
    };

    const handleDelete = async (agence) => {
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'agence "${agence.nom}" ?`)) {
            try {
                await deleteAgence(agence.id);
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                alert('Erreur lors de la suppression de l\'agence');
            }
        }
    };

    const handleSave = async (formData) => {
        try {
            if (editingItem) {
                await updateAgence(editingItem.id, formData);
            } else {
                await createAgence(formData);
            }
            setShowModal(false);
            setEditingItem(null);
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            alert('Erreur lors de la sauvegarde de l\'agence');
        }
    };

    return React.createElement('div', { className: "container mx-auto p-6" }, [
        // Header
        React.createElement('div', {
            key: 'header',
            className: "flex justify-between items-center mb-6"
        }, [
            React.createElement('div', { key: 'title' }, [
                React.createElement('h1', {
                    key: 'h1',
                    className: "text-3xl font-bold text-gray-900"
                }, "Agences Arkance"),
                React.createElement('p', {
                    key: 'subtitle',
                    className: "text-gray-600 mt-1"
                }, "Gestion des locaux pour les formations")
            ]),
            React.createElement('button', {
                key: 'btn-create',
                onClick: handleCreate,
                className: "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-flex items-center"
            }, [
                React.createElement('svg', {
                    key: 'icon',
                    className: "w-4 h-4 mr-2",
                    fill: "none",
                    stroke: "currentColor",
                    viewBox: "0 0 24 24"
                }, React.createElement('path', {
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    strokeWidth: "2",
                    d: "M12 4v16m8-8H4"
                })),
                React.createElement('span', { key: 'text' }, "Nouvelle agence")
            ])
        ]),

        // Tableau
        loading
            ? React.createElement('div', {
                key: 'loading',
                className: "text-center py-8"
            }, "Chargement...")
            : error
            ? React.createElement('div', {
                key: 'error',
                className: "text-red-500 text-center py-8"
            }, `Erreur: ${error}`)
            : React.createElement(window.TableView, {
                key: 'table',
                data: agences,
                columns: columns,
                onEdit: handleEdit,
                onDelete: handleDelete,
                emptyMessage: "Aucune agence trouvée"
            }),

        // Modal
        showModal && React.createElement(AgenceModal, {
            key: 'modal',
            agence: editingItem,
            onClose: () => {
                setShowModal(false);
                setEditingItem(null);
            },
            onSave: handleSave
        })
    ]);
}

// Modal pour créer/éditer une agence
function AgenceModal({ agence, onClose, onSave }) {
    const { useState } = React;
    const [formData, setFormData] = useState({
        nom: agence?.nom || '',
        adresse: agence?.adresse || ''
    });
    const [errors, setErrors] = useState({});

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Effacer l'erreur du champ modifié
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.nom.trim()) {
            newErrors.nom = 'Le nom de l\'agence est requis';
        }
        if (!formData.adresse.trim()) {
            newErrors.adresse = 'L\'adresse est requise';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            onSave(formData);
        }
    };

    return React.createElement('div', {
        className: "fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50",
        onClick: onClose
    },
        React.createElement('div', {
            className: "relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white",
            onClick: (e) => e.stopPropagation()
        }, [
            // Header
            React.createElement('div', {
                key: 'header',
                className: "flex justify-between items-center mb-4"
            }, [
                React.createElement('h3', {
                    key: 'title',
                    className: "text-lg font-medium text-gray-900"
                }, agence ? 'Modifier l\'agence' : 'Nouvelle agence'),
                React.createElement('button', {
                    key: 'close',
                    onClick: onClose,
                    className: "text-gray-400 hover:text-gray-500"
                }, React.createElement('span', { className: "text-2xl" }, '×'))
            ]),

            // Form
            React.createElement('form', {
                key: 'form',
                onSubmit: handleSubmit
            }, [
                // Nom de l'agence
                React.createElement('div', {
                    key: 'nom-field',
                    className: "mb-4"
                }, [
                    React.createElement('label', {
                        key: 'label',
                        className: "block text-gray-700 text-sm font-bold mb-2"
                    }, [
                        React.createElement('span', { key: 'text' }, 'Nom de l\'agence'),
                        React.createElement('span', {
                            key: 'required',
                            className: "text-red-500 ml-1"
                        }, '*')
                    ]),
                    React.createElement('input', {
                        key: 'input',
                        type: 'text',
                        value: formData.nom,
                        onChange: (e) => handleChange('nom', e.target.value),
                        className: `shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.nom ? 'border-red-500' : ''}`,
                        placeholder: 'Ex: Arkance Systems Paris'
                    }),
                    errors.nom && React.createElement('p', {
                        key: 'error',
                        className: "text-red-500 text-xs italic mt-1"
                    }, errors.nom)
                ]),

                // Adresse
                React.createElement('div', {
                    key: 'adresse-field',
                    className: "mb-6"
                }, [
                    React.createElement('label', {
                        key: 'label',
                        className: "block text-gray-700 text-sm font-bold mb-2"
                    }, [
                        React.createElement('span', { key: 'text' }, 'Adresse complète'),
                        React.createElement('span', {
                            key: 'required',
                            className: "text-red-500 ml-1"
                        }, '*')
                    ]),
                    React.createElement('textarea', {
                        key: 'input',
                        value: formData.adresse,
                        onChange: (e) => handleChange('adresse', e.target.value),
                        rows: 3,
                        className: `shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.adresse ? 'border-red-500' : ''}`,
                        placeholder: 'Ex: 123 Avenue des Champs-Élysées, 75008 Paris'
                    }),
                    errors.adresse && React.createElement('p', {
                        key: 'error',
                        className: "text-red-500 text-xs italic mt-1"
                    }, errors.adresse)
                ]),

                // Boutons
                React.createElement('div', {
                    key: 'buttons',
                    className: "flex items-center justify-end space-x-2"
                }, [
                    React.createElement('button', {
                        key: 'cancel',
                        type: 'button',
                        onClick: onClose,
                        className: "bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                    }, 'Annuler'),
                    React.createElement('button', {
                        key: 'submit',
                        type: 'submit',
                        className: "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    }, agence ? 'Modifier' : 'Créer')
                ])
            ])
        ])
    );
}

// Export global
window.AgencesPage = AgencesPage;
