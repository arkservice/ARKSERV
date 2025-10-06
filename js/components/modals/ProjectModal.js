// Modal Projet
function ProjectModal({ item, entreprises, logiciels, users, statusOptions, onSubmit, onClose }) {
    const { useState } = React;
    const { user } = window.useAuth();
    const { profile } = window.useUserProfile(user?.id);
    const [formData, setFormData] = useState({
        type: item?.type || 'formation',
        logiciel_id: item?.logiciel_id || '',
        name: item?.name || '',
        commercial_id: item?.commercial_id || '',
        contact_id: item?.contact_id || '',
        nombre_stagiaire: item?.nombre_stagiaire || '',
        lieu_projet: item?.lieu_projet || '',
        periode_souhaitee: item?.periode_souhaitee || '',
        description: item?.description || '',
        entreprise_id: item?.entreprise_id || '',
        status: item?.status || 'active'
    });
    
    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Validation conditionnelle
        if (formData.type === 'formation' && !formData.logiciel_id) {
            alert('Le logiciel est obligatoire pour une formation');
            return;
        }
        if (formData.type === 'prestation' && !formData.name.trim()) {
            alert('Le titre est obligatoire pour une prestation');
            return;
        }
        if (!formData.contact_id) {
            alert('Le contact client est obligatoire');
            return;
        }
        
        const submitData = {
            type: formData.type,
            logiciel_id: formData.logiciel_id || null,
            name: formData.type === 'prestation' 
                ? formData.name.trim() 
                : `Formation - ${logiciels.find(l => l.id === formData.logiciel_id)?.nom || 'Logiciel'}`,
            commercial_id: formData.commercial_id || null,
            contact_id: formData.contact_id,
            nombre_stagiaire: formData.type === 'formation' ? parseInt(formData.nombre_stagiaire) || null : null,
            lieu_projet: formData.type === 'formation' ? formData.lieu_projet.trim() || null : null,
            periode_souhaitee: formData.periode_souhaitee.trim() || null,
            description: formData.description.trim() || null,
            entreprise_id: formData.entreprise_id || null,
            status: formData.status,
            created_by: profile?.id || null
        };
        
        onSubmit(submitData);
    };
    
    return React.createElement('div', {
        className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-overlay"
    }, React.createElement('div', {
        className: "bg-white rounded-lg shadow-xl w-full max-w-lg mx-4"
    }, [
        React.createElement('div', {
            key: 'header',
            className: "px-6 py-4 border-b border-gray-200"
        }, React.createElement('h2', {
            className: "text-lg font-semibold text-gray-900"
        }, item ? "Modifier le projet" : "Nouveau projet")),
        
        React.createElement('form', {
            key: 'form',
            onSubmit: handleSubmit,
            className: "px-6 py-4"
        }, [
            React.createElement('div', {
                key: 'fields',
                className: "space-y-4"
            }, [
                // 1. Type de projet (obligatoire)
                React.createElement('div', { key: 'type-field' }, [
                    React.createElement('label', {
                        key: 'type-label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Type de projet *"),
                    React.createElement('select', {
                        key: 'type-select',
                        value: formData.type,
                        onChange: (e) => setFormData({ ...formData, type: e.target.value, logiciel_id: '', name: '' }),
                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                        required: true
                    }, [
                        React.createElement('option', { key: 'formation', value: 'formation' }, "Formation"),
                        React.createElement('option', { key: 'prestation', value: 'prestation' }, "Prestation")
                    ])
                ]),
                
                // 2. Logiciel (obligatoire si formation)
                formData.type === 'formation' ? React.createElement('div', { key: 'logiciel-field' }, [
                    React.createElement('label', {
                        key: 'logiciel-label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Logiciel *"),
                    React.createElement('select', {
                        key: 'logiciel-select',
                        value: formData.logiciel_id,
                        onChange: (e) => setFormData({ ...formData, logiciel_id: e.target.value }),
                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                        required: true
                    }, [
                        React.createElement('option', { key: 'empty', value: "" }, "Sélectionner un logiciel"),
                        ...logiciels.map(logiciel =>
                            React.createElement('option', {
                                key: logiciel.id,
                                value: logiciel.id
                            }, logiciel.nom)
                        )
                    ])
                ]) : null,
                
                // 3. Titre (uniquement si prestation)
                formData.type === 'prestation' ? React.createElement('div', { key: 'name-field' }, [
                    React.createElement('label', {
                        key: 'name-label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Titre *"),
                    React.createElement('input', {
                        key: 'name-input',
                        type: "text",
                        value: formData.name,
                        onChange: (e) => setFormData({ ...formData, name: e.target.value }),
                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                        required: true
                    })
                ]) : null,
                
                // 4. Commercial
                React.createElement('div', { key: 'commercial-field' }, [
                    React.createElement('label', {
                        key: 'commercial-label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Commercial"),
                    React.createElement('select', {
                        key: 'commercial-select',
                        value: formData.commercial_id,
                        onChange: (e) => setFormData({ ...formData, commercial_id: e.target.value }),
                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    }, [
                        React.createElement('option', { key: 'empty', value: "" }, "Sélectionner"),
                        ...users.filter(user => user.fonction?.nom === 'commercial').map(user =>
                            React.createElement('option', {
                                key: user.id,
                                value: user.id
                            }, `${user.prenom} ${user.nom}`)
                        )
                    ])
                ]),
                
                // 5. Entreprise
                React.createElement('div', { key: 'entreprise-field' }, [
                    React.createElement('label', {
                        key: 'entreprise-label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Entreprise"),
                    React.createElement('select', {
                        key: 'entreprise-select',
                        value: formData.entreprise_id,
                        onChange: (e) => setFormData({ ...formData, entreprise_id: e.target.value, contact_id: '' }),
                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    }, [
                        React.createElement('option', { key: 'empty', value: "" }, "Sélectionner"),
                        ...entreprises.map(entreprise =>
                            React.createElement('option', {
                                key: entreprise.id,
                                value: entreprise.id
                            }, entreprise.nom)
                        )
                    ])
                ]),
                
                // 6. Contact client
                React.createElement('div', { key: 'contact-field' }, [
                    React.createElement('label', {
                        key: 'contact-label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Contact client *"),
                    React.createElement('select', {
                        key: 'contact-select',
                        value: formData.contact_id,
                        onChange: (e) => setFormData({ ...formData, contact_id: e.target.value }),
                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                        required: true
                    }, [
                        React.createElement('option', { key: 'empty', value: "" }, "Sélectionner"),
                        ...users.filter(user => user.entreprise_id === formData.entreprise_id && user.entreprise_id).map(user =>
                            React.createElement('option', {
                                key: user.id,
                                value: user.id
                            }, `${user.prenom} ${user.nom}`)
                        )
                    ])
                ]),
                
                // 7. Nombre de stagiaires (si formation)
                formData.type === 'formation' ? React.createElement('div', { key: 'stagiaires-field' }, [
                    React.createElement('label', {
                        key: 'stagiaires-label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Nombre de stagiaires"),
                    React.createElement('input', {
                        key: 'stagiaires-input',
                        type: "number",
                        min: "1",
                        value: formData.nombre_stagiaire,
                        onChange: (e) => setFormData({ ...formData, nombre_stagiaire: e.target.value }),
                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    })
                ]) : null,
                
                // 8. Lieu du projet (si formation)
                formData.type === 'formation' ? React.createElement('div', { key: 'lieu-field' }, [
                    React.createElement('label', {
                        key: 'lieu-label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Lieu du projet"),
                    React.createElement('input', {
                        key: 'lieu-input',
                        type: "text",
                        value: formData.lieu_projet,
                        onChange: (e) => setFormData({ ...formData, lieu_projet: e.target.value }),
                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    })
                ]) : null,
                
                // 9. Période souhaitée
                React.createElement('div', { key: 'periode-field' }, [
                    React.createElement('label', {
                        key: 'periode-label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Période souhaitée"),
                    React.createElement('input', {
                        key: 'periode-input',
                        type: "text",
                        value: formData.periode_souhaitee,
                        onChange: (e) => setFormData({ ...formData, periode_souhaitee: e.target.value }),
                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                        placeholder: "Ex: Q1 2024, Mars 2024, etc."
                    })
                ]),
                
                // 10. Description
                React.createElement('div', { key: 'description-field' }, [
                    React.createElement('label', {
                        key: 'description-label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Description"),
                    React.createElement('textarea', {
                        key: 'description-input',
                        value: formData.description,
                        onChange: (e) => setFormData({ ...formData, description: e.target.value }),
                        rows: 3,
                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    })
                ]),
                
                // 11. Statut
                React.createElement('div', { key: 'status-field' }, [
                    React.createElement('label', {
                        key: 'status-label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Statut"),
                    React.createElement('select', {
                        key: 'status-select',
                        value: formData.status,
                        onChange: (e) => setFormData({ ...formData, status: e.target.value }),
                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    }, statusOptions.map(option =>
                        React.createElement('option', {
                            key: option.value,
                            value: option.value
                        }, option.label)
                    ))
                ])
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
window.ProjectModal = ProjectModal;