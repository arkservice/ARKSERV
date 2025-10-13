// Page de prévisualisation du formulaire d'évaluation (modèle neutre pour admins)
function EvaluationFormPreview() {
    const { useState, useEffect } = React;
    const supabase = window.supabaseConfig.client;
    const [logoUrl, setLogoUrl] = useState(null);

    // Données fictives de session pour la prévisualisation
    const mockSession = {
        id: 'preview-id',
        prj: 'PRJ-2025-001',
        lieu_formation: 'Dans nos locaux',
        pdc: {
            ref: 'REV-INIT',
            pdc_number: 101,
            programme_point_1: 'Introduction à l\'interface',
            programme_point_2: 'Les outils de modélisation',
            programme_point_3: 'Création de familles paramétriques'
        },
        formateur: {
            prenom: 'Jean',
            nom: 'Dupont'
        }
    };

    const [formData, setFormData] = useState({
        // Informations stagiaire
        stagiaire_nom: '',
        stagiaire_prenom: '',
        stagiaire_email: '',
        stagiaire_societe: '',
        stagiaire_fonction: '',

        // Section 01: Organisation
        org_communication_objectifs: null,
        org_duree_formation: null,
        org_composition_groupe: null,
        org_respect_engagements: null,
        org_commentaires: '',

        // Section 02: Moyens
        moyens_evaluation_locaux: null,
        moyens_materiel_informatique: null,
        moyens_formation_distance: null,
        moyens_support_cours: null,
        moyens_lieu_repas: '',
        moyens_restauration: null,

        // Section 03: Pédagogie
        peda_niveau_difficulte: null,
        peda_rythme_progression: null,
        peda_qualite_contenu_theorique: null,
        peda_qualite_contenu_pratique: null,
        peda_connaissance_formateur: null,
        peda_approche_pedagogique: null,
        peda_ecoute_disponibilite: null,
        peda_animation_formateur: null,
        peda_commentaires: '',

        // Section 04: Satisfaction
        satisf_repondu_attentes: null,
        satisf_atteint_objectifs: null,
        satisf_adequation_metier: null,
        satisf_recommandation: null,
        satisf_niveau_global: null,
        satisf_commentaires: '',
        satisf_besoin_formation_complementaire: false,
        satisf_logiciel_complementaire: '',
        satisf_besoin_accompagnement: false,
        satisf_precision_besoins: '',

        // Qualiopi - Initialiser avec les thèmes de démonstration
        qualiopi_themes: {
            theme_1: {
                titre: 'Introduction à l\'interface',
                avant: null,
                apres: null
            },
            theme_2: {
                titre: 'Les outils de modélisation',
                avant: null,
                apres: null
            },
            theme_3: {
                titre: 'Création de familles paramétriques',
                avant: null,
                apres: null
            }
        }
    });

    // Charger le logo Arkance depuis Supabase Storage
    useEffect(() => {
        const loadLogo = () => {
            try {
                const { data } = supabase.storage
                    .from('logos')
                    .getPublicUrl('logo arkance long transparent.png');

                if (data?.publicUrl) {
                    setLogoUrl(data.publicUrl);
                }
            } catch (err) {
                console.error('Erreur lors du chargement du logo:', err);
            }
        };

        loadLogo();
    }, []);

    useEffect(() => {
        lucide.createIcons();
    }, [formData]);

    const handleFieldChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleQualiopiChange = (themeKey, type, value) => {
        setFormData(prev => ({
            ...prev,
            qualiopi_themes: {
                ...prev.qualiopi_themes,
                [themeKey]: {
                    ...prev.qualiopi_themes[themeKey],
                    [type]: value
                }
            }
        }));
    };

    return React.createElement('div', {
        className: "py-8 px-4",
        style: { backgroundColor: '#133f5c' }
    }, React.createElement('div', {
        className: "max-w-4xl mx-auto space-y-6"
    }, [
        // Bandeau de prévisualisation
        React.createElement('div', {
            key: 'preview-banner',
            className: "bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6"
        }, [
            React.createElement('div', {
                key: 'content',
                className: "flex items-center gap-3"
            }, [
                React.createElement('i', {
                    key: 'icon',
                    'data-lucide': 'eye',
                    className: "w-6 h-6 text-yellow-600"
                }),
                React.createElement('div', {
                    key: 'text',
                    className: "flex-1"
                }, [
                    React.createElement('h3', {
                        key: 'title',
                        className: "text-sm font-semibold text-yellow-900"
                    }, "Mode Prévisualisation"),
                    React.createElement('p', {
                        key: 'desc',
                        className: "text-sm text-yellow-800"
                    }, "Ceci est un aperçu du formulaire d'évaluation avec des données de démonstration. Ce formulaire ne peut pas être soumis.")
                ])
            ])
        ]),

        // Logo Arkance
        logoUrl && React.createElement('div', {
            key: 'logo',
            className: "flex justify-center mb-6"
        }, React.createElement('img', {
            src: logoUrl,
            alt: 'Logo Arkance',
            className: "h-16 md:h-20",
            style: { maxWidth: '100%', objectFit: 'contain' }
        })),

        // En-tête
        React.createElement('div', {
            key: 'header',
            className: "bg-white rounded-lg border border-gray-200 p-6 text-center"
        }, [
            React.createElement('h1', {
                key: 'title',
                className: "text-2xl font-bold text-gray-900 mb-3"
            }, "QUESTIONNAIRE D'EVALUATION DE FORMATION"),
            React.createElement('p', {
                key: 'subtitle',
                className: "text-gray-600 text-sm leading-relaxed"
            }, "Nous vous remercions de consacrer quelques instants à remplir cette évaluation de stage qui nous permet de faire évoluer nos prestations en fonction de vos remarques et de vous offrir ainsi la qualité de service que vous êtes en droit d'attendre.")
        ]),

        // Informations formation (lecture seule)
        React.createElement('div', {
            key: 'info-formation',
            className: "bg-blue-50 rounded-lg border border-blue-200 p-6"
        }, [
            React.createElement('h2', {
                key: 'title',
                className: "text-2xl font-bold text-blue-900 mb-4"
            }, "Formation"),
            React.createElement('div', {
                key: 'grid',
                className: "grid grid-cols-1 md:grid-cols-2 gap-4 text-sm"
            }, [
                React.createElement('div', { key: 'ref' }, [
                    React.createElement('span', {
                        key: 'label',
                        className: "font-medium text-blue-900"
                    }, "Référence : "),
                    React.createElement('span', {
                        key: 'value',
                        className: "text-blue-800"
                    }, mockSession.pdc.ref)
                ]),
                React.createElement('div', { key: 'prj' }, [
                    React.createElement('span', {
                        key: 'label',
                        className: "font-medium text-blue-900"
                    }, "PRJ : "),
                    React.createElement('span', {
                        key: 'value',
                        className: "text-blue-800"
                    }, mockSession.prj)
                ]),
                React.createElement('div', { key: 'formateur' }, [
                    React.createElement('span', {
                        key: 'label',
                        className: "font-medium text-blue-900"
                    }, "Formateur : "),
                    React.createElement('span', {
                        key: 'value',
                        className: "text-blue-800"
                    }, `${mockSession.formateur.prenom} ${mockSession.formateur.nom}`)
                ]),
                React.createElement('div', { key: 'lieu' }, [
                    React.createElement('span', {
                        key: 'label',
                        className: "font-medium text-blue-900"
                    }, "Lieu : "),
                    React.createElement('span', {
                        key: 'value',
                        className: "text-blue-800"
                    }, mockSession.lieu_formation)
                ])
            ])
        ]),

        // Informations stagiaire
        React.createElement('div', {
            key: 'stagiaire-info',
            className: "bg-white rounded-lg border border-gray-200 p-6"
        }, [
            React.createElement('h2', {
                key: 'title',
                className: "text-2xl font-bold text-gray-900 mb-4"
            }, "Vos informations"),
            React.createElement('div', {
                key: 'grid',
                className: "space-y-4"
            }, [
                React.createElement('div', {
                    key: 'row1',
                    className: "grid grid-cols-1 md:grid-cols-3 gap-4"
                }, [
                    React.createElement('div', { key: 'nom' }, [
                        React.createElement('label', {
                            key: 'label',
                            className: "block text-sm font-medium text-gray-700 mb-1"
                        }, "Nom *"),
                        React.createElement('input', {
                            key: 'input',
                            type: 'text',
                            value: formData.stagiaire_nom,
                            onChange: (e) => handleFieldChange('stagiaire_nom', e.target.value),
                            className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        })
                    ]),
                    React.createElement('div', { key: 'prenom' }, [
                        React.createElement('label', {
                            key: 'label',
                            className: "block text-sm font-medium text-gray-700 mb-1"
                        }, "Prénom *"),
                        React.createElement('input', {
                            key: 'input',
                            type: 'text',
                            value: formData.stagiaire_prenom,
                            onChange: (e) => handleFieldChange('stagiaire_prenom', e.target.value),
                            className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        })
                    ]),
                    React.createElement('div', { key: 'email' }, [
                        React.createElement('label', {
                            key: 'label',
                            className: "block text-sm font-medium text-gray-700 mb-1"
                        }, "Email *"),
                        React.createElement('input', {
                            key: 'input',
                            type: 'email',
                            value: formData.stagiaire_email,
                            onChange: (e) => handleFieldChange('stagiaire_email', e.target.value),
                            className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        })
                    ])
                ]),
                React.createElement('div', {
                    key: 'row2',
                    className: "grid grid-cols-1 md:grid-cols-2 gap-4"
                }, [
                    React.createElement('div', { key: 'societe' }, [
                        React.createElement('label', {
                            key: 'label',
                            className: "block text-sm font-medium text-gray-700 mb-1"
                        }, "Société *"),
                        React.createElement('input', {
                            key: 'input',
                            type: 'text',
                            value: formData.stagiaire_societe,
                            onChange: (e) => handleFieldChange('stagiaire_societe', e.target.value),
                            className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        })
                    ]),
                    React.createElement('div', { key: 'fonction' }, [
                        React.createElement('label', {
                            key: 'label',
                            className: "block text-sm font-medium text-gray-700 mb-1"
                        }, "Fonction *"),
                        React.createElement('input', {
                            key: 'input',
                            type: 'text',
                            value: formData.stagiaire_fonction,
                            onChange: (e) => handleFieldChange('stagiaire_fonction', e.target.value),
                            className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        })
                    ])
                ])
            ])
        ]),

        // Section 01: Organisation
        window.createSection01(formData, handleFieldChange),

        // Section 02: Moyens
        window.createSection02(formData, handleFieldChange, mockSession),

        // Section 03: Pédagogie
        window.createSection03(formData, handleFieldChange),

        // Section 04: Satisfaction
        window.createSection04(formData, handleFieldChange),

        // Section Qualiopi
        window.createSectionQualiopi(formData, handleQualiopiChange),

        // Message d'information au lieu du bouton soumettre
        React.createElement('div', {
            key: 'info-message',
            className: "bg-gray-50 rounded-lg border border-gray-300 p-6 text-center"
        }, [
            React.createElement('i', {
                key: 'icon',
                'data-lucide': 'info',
                className: "w-12 h-12 mx-auto text-gray-400 mb-3"
            }),
            React.createElement('p', {
                key: 'text',
                className: "text-gray-600"
            }, "Ceci est un aperçu du formulaire. Dans un contexte réel, le stagiaire pourrait soumettre son évaluation ici.")
        ])
    ]));
}

// Export global
window.EvaluationFormPreview = EvaluationFormPreview;
