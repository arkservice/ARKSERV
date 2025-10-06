// Modal Compétence Utilisateur
function UserCompetenceModal({ isOpen, item, userId, logiciels, onSubmit, onClose }) {
    const { useState, useEffect } = React;
    
    // Ne pas afficher le modal si isOpen est false
    if (!isOpen) return null;
    
    const [formData, setFormData] = useState({
        logiciel_id: item?.logiciel_id || '',
        niveau: item?.niveau || 1,
        certifie: item?.certifie || false,
        date_certification: item?.date_certification || '',
        commentaire: item?.commentaire || ''
    });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Initialiser les icônes Lucide
    useEffect(() => {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }, []);
    
    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!formData.logiciel_id) {
            setError('Veuillez sélectionner un logiciel');
            return;
        }
        
        if (!formData.niveau || formData.niveau < 1 || formData.niveau > 5) {
            setError('Veuillez sélectionner un niveau valide (1-5)');
            return;
        }
        
        setError(null);
        setLoading(true);
        
        const dataToSubmit = {
            logiciel_id: formData.logiciel_id,
            niveau: parseInt(formData.niveau),
            certifie: formData.certifie,
            date_certification: formData.certifie && formData.date_certification ? formData.date_certification : null,
            commentaire: formData.commentaire.trim() || null
        };
        
        onSubmit(dataToSubmit);
    };
    
    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (error) setError(null);
    };
    
    const getNiveauLabel = (niveau) => {
        const labels = {
            1: 'Débutant',
            2: 'Initié',
            3: 'Intermédiaire', 
            4: 'Avancé',
            5: 'Expert'
        };
        return labels[niveau] || '';
    };
    
    const getNiveauDescription = (niveau) => {
        const descriptions = {
            1: 'Connaissance de base, utilisation occasionnelle',
            2: 'Utilisation régulière des fonctions essentielles',
            3: 'Bonne maîtrise des fonctions principales',
            4: 'Maîtrise avancée, capable de former d\'autres',
            5: 'Expert reconnu, maîtrise complète du logiciel'
        };
        return descriptions[niveau] || '';
    };
    
    return React.createElement('div', {
        className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-overlay"
    }, React.createElement('div', {
        className: "bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden"
    }, [
        // Header
        React.createElement('div', {
            key: 'header',
            className: "px-6 py-4 border-b border-gray-200 flex justify-between items-center"
        }, [
            React.createElement('h2', {
                key: 'title',
                className: "text-xl font-semibold text-gray-900"
            }, item ? "Modifier la compétence" : "Ajouter une compétence"),
            React.createElement('button', {
                key: 'close',
                onClick: onClose,
                className: "text-gray-400 hover:text-gray-600"
            }, React.createElement('i', {
                'data-lucide': 'x',
                className: "w-6 h-6"
            }))
        ]),
        
        // Content
        React.createElement('div', {
            key: 'content',
            className: "px-6 py-4 overflow-y-auto"
        }, [
            // Messages d'erreur
            error && React.createElement('div', {
                key: 'error',
                className: "mb-4 p-3 bg-red-50 border border-red-200 rounded-md"
            }, React.createElement('p', {
                className: "text-sm text-red-800"
            }, error)),
            
            React.createElement('form', {
                key: 'form',
                onSubmit: handleSubmit,
                className: "space-y-6"
            }, [
                // Sélection du logiciel
                React.createElement('div', { key: 'logiciel' }, [
                    React.createElement('label', {
                        key: 'label',
                        className: "block text-sm font-medium text-gray-700 mb-2"
                    }, "Logiciel *"),
                    React.createElement('select', {
                        key: 'select',
                        value: formData.logiciel_id,
                        onChange: (e) => handleChange('logiciel_id', e.target.value),
                        className: "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                        disabled: !!item // Empêcher la modification du logiciel en édition
                    }, [
                        React.createElement('option', {
                            key: 'empty',
                            value: ''
                        }, 'Sélectionnez un logiciel'),
                        ...(logiciels || []).map(logiciel => 
                            React.createElement('option', {
                                key: logiciel.id,
                                value: logiciel.id
                            }, `${logiciel.nom}${logiciel.editeur ? ` (${logiciel.editeur})` : ''}`)
                        )
                    ]),
                    item && React.createElement('p', {
                        key: 'disabled-note',
                        className: "mt-1 text-xs text-gray-500"
                    }, "Le logiciel ne peut pas être modifié. Supprimez et recréez la compétence si nécessaire.")
                ]),
                
                // Niveau de compétence
                React.createElement('div', { key: 'niveau' }, [
                    React.createElement('label', {
                        key: 'label',
                        className: "block text-sm font-medium text-gray-700 mb-2"
                    }, "Niveau de compétence *"),
                    React.createElement('select', {
                        key: 'select',
                        value: formData.niveau,
                        onChange: (e) => handleChange('niveau', e.target.value),
                        className: "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    }, [1, 2, 3, 4, 5].map(niveau => 
                        React.createElement('option', {
                            key: niveau,
                            value: niveau
                        }, `${niveau} - ${getNiveauLabel(niveau)}`)
                    )),
                    React.createElement('p', {
                        key: 'description',
                        className: "mt-1 text-xs text-gray-600"
                    }, getNiveauDescription(formData.niveau))
                ]),
                
                // Certification
                React.createElement('div', { key: 'certification' }, [
                    React.createElement('div', {
                        key: 'checkbox-container',
                        className: "flex items-center gap-2"
                    }, [
                        React.createElement('input', {
                            key: 'checkbox',
                            type: 'checkbox',
                            id: 'certifie',
                            checked: formData.certifie,
                            onChange: (e) => handleChange('certifie', e.target.checked),
                            className: "w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        }),
                        React.createElement('label', {
                            key: 'label',
                            htmlFor: 'certifie',
                            className: "text-sm font-medium text-gray-700"
                        }, "Compétence certifiée")
                    ]),
                    React.createElement('p', {
                        key: 'description',
                        className: "mt-1 text-xs text-gray-600"
                    }, "Cochez si vous avez une certification officielle pour ce logiciel")
                ]),
                
                // Date de certification (si certifié)
                formData.certifie && React.createElement('div', { key: 'date-certification' }, [
                    React.createElement('label', {
                        key: 'label',
                        className: "block text-sm font-medium text-gray-700 mb-2"
                    }, "Date de certification"),
                    React.createElement('input', {
                        key: 'input',
                        type: 'date',
                        value: formData.date_certification,
                        onChange: (e) => handleChange('date_certification', e.target.value),
                        className: "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    })
                ]),
                
                
                // Commentaire
                React.createElement('div', { key: 'commentaire' }, [
                    React.createElement('label', {
                        key: 'label',
                        className: "block text-sm font-medium text-gray-700 mb-2"
                    }, "Commentaire (optionnel)"),
                    React.createElement('textarea', {
                        key: 'textarea',
                        value: formData.commentaire,
                        onChange: (e) => handleChange('commentaire', e.target.value),
                        rows: 3,
                        placeholder: "Détails sur l'expérience, projets réalisés, spécialités...",
                        className: "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                    })
                ])
            ])
        ]),
        
        // Footer
        React.createElement('div', {
            key: 'footer',
            className: "px-6 py-4 border-t border-gray-200 flex justify-end gap-3"
        }, [
            React.createElement('button', {
                key: 'cancel',
                type: 'button',
                onClick: onClose,
                disabled: loading,
                className: "px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
            }, "Annuler"),
            React.createElement('button', {
                key: 'submit',
                type: 'submit',
                onClick: handleSubmit,
                disabled: loading,
                className: "px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            }, [
                loading && React.createElement('i', {
                    key: 'spinner',
                    'data-lucide': 'loader-2',
                    className: "w-4 h-4 animate-spin"
                }),
                item ? "Modifier" : "Ajouter"
            ])
        ])
    ]));
}

// Export global
window.UserCompetenceModal = UserCompetenceModal;