// Modal Plan de cours
function PdcModal({ item, onSubmit, onClose }) {
    const { useState } = React;
    const [formData, setFormData] = useState({
        pdc_number: item?.pdc_number || '',
        ref: item?.ref || '',
        version_logiciel: item?.version_logiciel || '',
        duree_en_jour: item?.duree_en_jour || '',
        public_cible: item?.public_cible || '',
        prerequis: item?.prerequis || '',
        objectifs: item?.objectifs || '',
        moyens: item?.moyens || '',
        programme_point_1: item?.programme_point_1 || '',
        programme_point_1_description: item?.programme_point_1_description || '',
        programme_point_1_jour: item?.programme_point_1_jour || '',
        programme_point_2: item?.programme_point_2 || '',
        programme_point_2_description: item?.programme_point_2_description || '',
        programme_point_2_jour: item?.programme_point_2_jour || '',
        programme_point_3: item?.programme_point_3 || '',
        programme_point_3_description: item?.programme_point_3_description || '',
        programme_point_3_jour: item?.programme_point_3_jour || '',
        programme_point_4: item?.programme_point_4 || '',
        programme_point_4_description: item?.programme_point_4_description || '',
        programme_point_4_jour: item?.programme_point_4_jour || '',
        programme_point_5: item?.programme_point_5 || '',
        programme_point_5_description: item?.programme_point_5_description || '',
        programme_point_5_jour: item?.programme_point_5_jour || '',
        programme_point_6: item?.programme_point_6 || '',
        programme_point_6_description: item?.programme_point_6_description || '',
        programme_point_6_jour: item?.programme_point_6_jour || '',
        programme_point_7: item?.programme_point_7 || '',
        programme_point_7_description: item?.programme_point_7_description || '',
        programme_point_7_jour: item?.programme_point_7_jour || '',
        programme_point_8: item?.programme_point_8 || '',
        programme_point_8_description: item?.programme_point_8_description || '',
        programme_point_8_jour: item?.programme_point_8_jour || '',
        programme_point_9: item?.programme_point_9 || '',
        programme_point_9_description: item?.programme_point_9_description || '',
        programme_point_9_jour: item?.programme_point_9_jour || '',
        programme_point_10: item?.programme_point_10 || '',
        programme_point_10_description: item?.programme_point_10_description || '',
        programme_point_10_jour: item?.programme_point_10_jour || '',
        programme_point_11: item?.programme_point_11 || '',
        programme_point_11_description: item?.programme_point_11_description || '',
        programme_point_11_jour: item?.programme_point_11_jour || '',
        programme_point_12: item?.programme_point_12 || '',
        programme_point_12_description: item?.programme_point_12_description || '',
        programme_point_12_jour: item?.programme_point_12_jour || ''
    });
    
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.ref.trim()) return;
        
        onSubmit({
            pdc_number: formData.pdc_number ? parseInt(formData.pdc_number) : null,
            ref: formData.ref.trim(),
            version_logiciel: formData.version_logiciel ? parseInt(formData.version_logiciel) : null,
            duree_en_jour: formData.duree_en_jour ? parseFloat(formData.duree_en_jour) : null,
            public_cible: formData.public_cible.trim() || null,
            prerequis: formData.prerequis.trim() || null,
            objectifs: formData.objectifs.trim() || null,
            moyens: formData.moyens.trim() || null,
            programme_point_1: formData.programme_point_1.trim() || null,
            programme_point_1_description: formData.programme_point_1_description.trim() || null,
            programme_point_1_jour: formData.programme_point_1_jour ? parseInt(formData.programme_point_1_jour) : null,
            programme_point_2: formData.programme_point_2.trim() || null,
            programme_point_2_description: formData.programme_point_2_description.trim() || null,
            programme_point_2_jour: formData.programme_point_2_jour ? parseInt(formData.programme_point_2_jour) : null,
            programme_point_3: formData.programme_point_3.trim() || null,
            programme_point_3_description: formData.programme_point_3_description.trim() || null,
            programme_point_3_jour: formData.programme_point_3_jour ? parseInt(formData.programme_point_3_jour) : null,
            programme_point_4: formData.programme_point_4.trim() || null,
            programme_point_4_description: formData.programme_point_4_description.trim() || null,
            programme_point_4_jour: formData.programme_point_4_jour ? parseInt(formData.programme_point_4_jour) : null,
            programme_point_5: formData.programme_point_5.trim() || null,
            programme_point_5_description: formData.programme_point_5_description.trim() || null,
            programme_point_5_jour: formData.programme_point_5_jour ? parseInt(formData.programme_point_5_jour) : null,
            programme_point_6: formData.programme_point_6.trim() || null,
            programme_point_6_description: formData.programme_point_6_description.trim() || null,
            programme_point_6_jour: formData.programme_point_6_jour ? parseInt(formData.programme_point_6_jour) : null,
            programme_point_7: formData.programme_point_7.trim() || null,
            programme_point_7_description: formData.programme_point_7_description.trim() || null,
            programme_point_7_jour: formData.programme_point_7_jour ? parseInt(formData.programme_point_7_jour) : null,
            programme_point_8: formData.programme_point_8.trim() || null,
            programme_point_8_description: formData.programme_point_8_description.trim() || null,
            programme_point_8_jour: formData.programme_point_8_jour ? parseInt(formData.programme_point_8_jour) : null,
            programme_point_9: formData.programme_point_9.trim() || null,
            programme_point_9_description: formData.programme_point_9_description.trim() || null,
            programme_point_9_jour: formData.programme_point_9_jour ? parseInt(formData.programme_point_9_jour) : null,
            programme_point_10: formData.programme_point_10.trim() || null,
            programme_point_10_description: formData.programme_point_10_description.trim() || null,
            programme_point_10_jour: formData.programme_point_10_jour ? parseInt(formData.programme_point_10_jour) : null,
            programme_point_11: formData.programme_point_11.trim() || null,
            programme_point_11_description: formData.programme_point_11_description.trim() || null,
            programme_point_11_jour: formData.programme_point_11_jour ? parseInt(formData.programme_point_11_jour) : null,
            programme_point_12: formData.programme_point_12.trim() || null,
            programme_point_12_description: formData.programme_point_12_description.trim() || null,
            programme_point_12_jour: formData.programme_point_12_jour ? parseInt(formData.programme_point_12_jour) : null
        });
    };
    
    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Fonction pour gérer le changement de jour avec cascade chronologique
    const handleJourChange = (pointNum, newJour) => {
        const newJourInt = newJour ? parseInt(newJour) : null;

        setFormData(prev => {
            const updates = {
                [`programme_point_${pointNum}_jour`]: newJourInt
            };

            // Cascade : tous les points suivants doivent être au minimum au même jour
            if (newJourInt) {
                for (let i = pointNum + 1; i <= 12; i++) {
                    const currentJour = prev[`programme_point_${i}_jour`];
                    // Si le point suivant n'a pas de jour ou est à un jour antérieur, le déplacer
                    if (!currentJour || currentJour < newJourInt) {
                        updates[`programme_point_${i}_jour`] = newJourInt;
                    }
                }
            }

            return {
                ...prev,
                ...updates
            };
        });
    };

    // Fonction helper pour créer les options de jour
    const createJourOptions = () => {
        const maxJours = parseInt(formData.duree_en_jour) || 12;
        const options = [React.createElement('option', { key: 'empty', value: '' }, '-')];
        for (let i = 1; i <= maxJours; i++) {
            options.push(React.createElement('option', { key: i, value: i }, `Jour ${i}`));
        }
        return options;
    };

    // Fonction helper pour créer un champ de point de programme
    const createProgrammePoint = (pointNum) => {
        return React.createElement('div', { key: `point${pointNum}-field` }, [
            React.createElement('div', {
                key: 'label-container',
                className: 'flex justify-between items-center mb-1'
            }, [
                React.createElement('label', {
                    key: 'point-label',
                    className: "text-sm font-medium text-gray-700"
                }, `Point ${pointNum}`),
                React.createElement('select', {
                    key: 'jour-select',
                    value: formData[`programme_point_${pointNum}_jour`],
                    onChange: (e) => handleJourChange(pointNum, e.target.value),
                    className: "text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                }, createJourOptions())
            ]),
            React.createElement('input', {
                key: 'point-input',
                type: "text",
                value: formData[`programme_point_${pointNum}`],
                onChange: (e) => handleChange(`programme_point_${pointNum}`, e.target.value),
                className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2",
                placeholder: `Titre du point ${pointNum}`
            }),
            React.createElement('textarea', {
                key: 'point-desc',
                value: formData[`programme_point_${pointNum}_description`],
                onChange: (e) => handleChange(`programme_point_${pointNum}_description`, e.target.value),
                className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                rows: 2,
                placeholder: "Description détaillée"
            })
        ]);
    };

    return React.createElement('div', {
        className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-overlay"
    }, React.createElement('div', {
        className: "bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto"
    }, [
        React.createElement('div', {
            key: 'header',
            className: "px-6 py-4 border-b border-gray-200 flex justify-between items-center"
        }, [
            React.createElement('h2', {
                key: 'title',
                className: "text-lg font-semibold text-gray-900"
            }, item ? "Modifier le plan de cours" : "Nouveau plan de cours"),
            React.createElement('button', {
                key: 'close',
                onClick: onClose,
                className: "text-gray-400 hover:text-gray-600"
            }, React.createElement('i', {
                'data-lucide': 'x',
                className: "w-6 h-6"
            }))
        ]),
        
        React.createElement('form', {
            key: 'form',
            onSubmit: handleSubmit,
            className: "px-6 py-4"
        }, [
            React.createElement('div', {
                key: 'grid',
                className: "grid grid-cols-1 lg:grid-cols-2 gap-6"
            }, [
                // Colonne gauche
                React.createElement('div', {
                    key: 'left-column',
                    className: "space-y-4"
                }, [
                    // Référence
                    React.createElement('div', { key: 'ref-field' }, [
                        React.createElement('label', {
                            key: 'ref-label',
                            className: "block text-sm font-medium text-gray-700 mb-1"
                        }, "Référence *"),
                        React.createElement('input', {
                            key: 'ref-input',
                            type: "text",
                            value: formData.ref,
                            onChange: (e) => handleChange('ref', e.target.value),
                            className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                            required: true,
                            placeholder: "Ex: PDC-001"
                        })
                    ]),
                    
                    // Numéro PDC et Version
                    React.createElement('div', {
                        key: 'number-version',
                        className: "grid grid-cols-2 gap-4"
                    }, [
                        React.createElement('div', { key: 'pdc-number-field' }, [
                            React.createElement('label', {
                                key: 'pdc-number-label',
                                className: "block text-sm font-medium text-gray-700 mb-1"
                            }, "N° PDC"),
                            React.createElement('input', {
                                key: 'pdc-number-input',
                                type: "number",
                                value: formData.pdc_number,
                                onChange: (e) => handleChange('pdc_number', e.target.value),
                                className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                                placeholder: "1"
                            })
                        ]),
                        
                        React.createElement('div', { key: 'version-field' }, [
                            React.createElement('label', {
                                key: 'version-label',
                                className: "block text-sm font-medium text-gray-700 mb-1"
                            }, "Version logiciel"),
                            React.createElement('input', {
                                key: 'version-input',
                                type: "number",
                                value: formData.version_logiciel,
                                onChange: (e) => handleChange('version_logiciel', e.target.value),
                                className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                                placeholder: "2024"
                            })
                        ])
                    ]),
                    
                    // Durée et Public cible
                    React.createElement('div', {
                        key: 'duree-public',
                        className: "grid grid-cols-2 gap-4"
                    }, [
                        React.createElement('div', { key: 'duree-field' }, [
                            React.createElement('label', {
                                key: 'duree-label',
                                className: "block text-sm font-medium text-gray-700 mb-1"
                            }, "Durée (en jours)"),
                            React.createElement('input', {
                                key: 'duree-input',
                                type: "number",
                                step: "0.5",
                                min: "0",
                                value: formData.duree_en_jour,
                                onChange: (e) => handleChange('duree_en_jour', e.target.value),
                                className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                                placeholder: "Ex: 2"
                            })
                        ])
                    ]),
                    
                    // Public cible
                    React.createElement('div', { key: 'public-field' }, [
                        React.createElement('label', {
                            key: 'public-label',
                            className: "block text-sm font-medium text-gray-700 mb-1"
                        }, "Public cible"),
                        React.createElement('textarea', {
                            key: 'public-input',
                            value: formData.public_cible,
                            onChange: (e) => handleChange('public_cible', e.target.value),
                            className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                            rows: 2,
                            placeholder: "Décrivez le public visé par cette formation"
                        })
                    ]),
                    
                    // Objectifs
                    React.createElement('div', { key: 'objectifs-field' }, [
                        React.createElement('label', {
                            key: 'objectifs-label',
                            className: "block text-sm font-medium text-gray-700 mb-1"
                        }, "Objectifs pédagogiques"),
                        React.createElement('textarea', {
                            key: 'objectifs-input',
                            value: formData.objectifs,
                            onChange: (e) => handleChange('objectifs', e.target.value),
                            className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                            rows: 3,
                            placeholder: "Listez les objectifs d'apprentissage"
                        })
                    ]),
                    
                    // Moyens
                    React.createElement('div', { key: 'moyens-field' }, [
                        React.createElement('label', {
                            key: 'moyens-label',
                            className: "block text-sm font-medium text-gray-700 mb-1"
                        }, "Moyens pédagogiques"),
                        React.createElement('textarea', {
                            key: 'moyens-input',
                            value: formData.moyens,
                            onChange: (e) => handleChange('moyens', e.target.value),
                            className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                            rows: 4,
                            placeholder: "Moyens mis en œuvre avant, pendant et après la formation"
                        })
                    ]),
                    
                    // Prérequis
                    React.createElement('div', { key: 'prerequis-field' }, [
                        React.createElement('label', {
                            key: 'prerequis-label',
                            className: "block text-sm font-medium text-gray-700 mb-1"
                        }, "Prérequis"),
                        React.createElement('textarea', {
                            key: 'prerequis-input',
                            value: formData.prerequis,
                            onChange: (e) => handleChange('prerequis', e.target.value),
                            className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                            rows: 2,
                            placeholder: "Connaissances préalables requises"
                        })
                    ])
                ]),
                
                // Colonne droite - Points du programme
                React.createElement('div', {
                    key: 'right-column',
                    className: "space-y-4"
                }, [
                    React.createElement('h3', {
                        key: 'programme-title',
                        className: "text-lg font-medium text-gray-900 border-b pb-2"
                    }, "Programme de formation"),

                    createProgrammePoint(1),
                    createProgrammePoint(2),
                    createProgrammePoint(3),
                    createProgrammePoint(4),
                    createProgrammePoint(5),
                    createProgrammePoint(6),
                    createProgrammePoint(7),
                    createProgrammePoint(8),
                    createProgrammePoint(9),
                    createProgrammePoint(10),
                    createProgrammePoint(11),
                    createProgrammePoint(12)
                ])
            ]),
            
            React.createElement('div', {
                key: 'buttons',
                className: "flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200"
            }, [
                React.createElement('button', {
                    key: 'cancel',
                    type: "button",
                    onClick: onClose,
                    className: "px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                }, "Annuler"),
                React.createElement('button', {
                    key: 'submit',
                    type: "submit",
                    className: "px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                }, item ? "Modifier" : "Créer")
            ])
        ])
    ]));
}

// Export global
window.PdcModal = PdcModal;