// Page de formulaire d'évaluation à froid (accès public via token)
// Rempli 30 jours après la formation initiale
function EvaluationFroidFormPage({ token }) {
    const { useState, useEffect } = React;
    const { updateEvaluation, getEvaluationByFroidToken } = window.useEvaluation();
    const supabase = window.supabaseConfig.client;

    const [evaluation, setEvaluation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [logoUrl, setLogoUrl] = useState(null);

    const [formData, setFormData] = useState({
        // Section: Mise en pratique
        froid_appliquer_connaissances: null,
        froid_mieux_apprehender: null,
        froid_faciliter_quotidien: null,
        froid_ameliorer_efficacite: null,
        froid_developper_competences: null,
        froid_autres_precisions: '',

        // Section: Bilan de la formation
        froid_repondu_attentes: null,
        froid_atteint_objectifs: null,
        froid_adequation_metier: null,

        // Section: Satisfaction globale
        froid_recommandation: null,
        froid_satisfaction_globale: null,
        froid_commentaires_satisfaction: ''
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
        fetchEvaluation();
    }, [token]);

    useEffect(() => {
        lucide.createIcons();
    }, [formData]);

    const fetchEvaluation = async () => {
        try {
            setLoading(true);
            setError(null);
            const evalData = await getEvaluationByFroidToken(token);

            if (!evalData) {
                setError("Lien d'évaluation invalide ou expiré");
                return;
            }

            // Vérifier si l'évaluation à froid n'a pas déjà été complétée
            if (evalData.froid_satisfaction_globale !== null) {
                setIsSubmitted(true);
            }

            setEvaluation(evalData);

            // Pré-remplir le formulaire si déjà complété
            if (evalData.froid_satisfaction_globale !== null) {
                setFormData({
                    froid_appliquer_connaissances: evalData.froid_appliquer_connaissances,
                    froid_mieux_apprehender: evalData.froid_mieux_apprehender,
                    froid_faciliter_quotidien: evalData.froid_faciliter_quotidien,
                    froid_ameliorer_efficacite: evalData.froid_ameliorer_efficacite,
                    froid_developper_competences: evalData.froid_developper_competences,
                    froid_autres_precisions: evalData.froid_autres_precisions || '',
                    froid_repondu_attentes: evalData.froid_repondu_attentes,
                    froid_atteint_objectifs: evalData.froid_atteint_objectifs,
                    froid_adequation_metier: evalData.froid_adequation_metier,
                    froid_recommandation: evalData.froid_recommandation,
                    froid_satisfaction_globale: evalData.froid_satisfaction_globale,
                    froid_commentaires_satisfaction: evalData.froid_commentaires_satisfaction || ''
                });
            }
        } catch (err) {
            console.error('Erreur lors du chargement de l\'évaluation:', err);
            setError('Impossible de charger l\'évaluation. Veuillez vérifier le lien.');
        } finally {
            setLoading(false);
        }
    };

    const handleFieldChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const validateForm = () => {
        const errors = [];

        // Validation des questions obligatoires (toutes sauf les champs texte libre)
        const requiredFields = [
            { field: 'froid_appliquer_connaissances', label: 'Question 1 (Appliquer les connaissances)' },
            { field: 'froid_mieux_apprehender', label: 'Question 2 (Mieux appréhender)' },
            { field: 'froid_faciliter_quotidien', label: 'Question 3 (Faciliter quotidien)' },
            { field: 'froid_ameliorer_efficacite', label: 'Question 4 (Améliorer efficacité)' },
            { field: 'froid_developper_competences', label: 'Question 5 (Développer compétences)' },
            { field: 'froid_repondu_attentes', label: 'Question 7 (Répondu aux attentes)' },
            { field: 'froid_atteint_objectifs', label: 'Question 8 (Atteint objectifs)' },
            { field: 'froid_adequation_metier', label: 'Question 9 (Adéquation métier)' },
            { field: 'froid_recommandation', label: 'Question 10 (Recommandation)' },
            { field: 'froid_satisfaction_globale', label: 'Question 11 (Satisfaction globale)' }
        ];

        requiredFields.forEach(({ field, label }) => {
            if (formData[field] === null || formData[field] === undefined) {
                errors.push(`${label} est obligatoire`);
            }
        });

        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const errors = validateForm();
        if (errors.length > 0) {
            alert('Veuillez répondre à toutes les questions obligatoires:\n\n' + errors.join('\n'));
            return;
        }

        try {
            setIsSubmitting(true);

            // Mettre à jour l'évaluation existante avec les réponses à froid
            await updateEvaluation(evaluation.id, {
                ...formData,
                evaluation_type: 'froid'
            });

            setIsSubmitted(true);
            alert('Merci d\'avoir complété cette évaluation à froid !');
        } catch (err) {
            console.error('Erreur lors de la soumission:', err);
            alert('Une erreur est survenue lors de la soumission. Veuillez réessayer.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Composant de question Oui/Non
    const YesNoQuestion = window.YesNoQuestion;

    if (loading) {
        return React.createElement('div', {
            style: { backgroundColor: '#133f5c', minHeight: '100vh' },
            className: "flex items-center justify-center"
        }, [
            React.createElement('div', {
                key: 'spinner',
                className: "text-center"
            }, [
                React.createElement('div', {
                    key: 'icon',
                    className: "inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
                }),
                React.createElement('p', {
                    key: 'text',
                    className: "mt-4 text-gray-600"
                }, 'Chargement du formulaire...')
            ])
        ]);
    }

    if (error || !evaluation) {
        return React.createElement('div', {
            style: { backgroundColor: '#133f5c', minHeight: '100vh' },
            className: "flex items-center justify-center p-4"
        }, React.createElement('div', {
            className: "bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center"
        }, [
            React.createElement('i', {
                key: 'icon',
                'data-lucide': 'alert-circle',
                className: "mx-auto h-12 w-12 text-red-600 mb-4"
            }),
            React.createElement('h2', {
                key: 'title',
                className: "text-xl font-bold text-gray-900 mb-2"
            }, 'Erreur'),
            React.createElement('p', {
                key: 'message',
                className: "text-gray-600"
            }, error || 'Une erreur est survenue')
        ]));
    }

    if (isSubmitted) {
        return React.createElement('div', {
            style: { backgroundColor: '#133f5c', minHeight: '100vh' },
            className: "flex items-center justify-center p-4"
        }, React.createElement('div', {
            className: "bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center"
        }, [
            React.createElement('div', {
                key: 'check',
                className: "mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4"
            }, React.createElement('i', {
                'data-lucide': 'check',
                className: "h-8 w-8 text-green-600"
            })),
            React.createElement('h2', {
                key: 'title',
                className: "text-2xl font-bold text-gray-900 mb-2"
            }, 'Merci !'),
            React.createElement('p', {
                key: 'message',
                className: "text-gray-600"
            }, 'Votre évaluation à froid a été enregistrée avec succès.')
        ]));
    }

    const formation = evaluation.formation || {};
    const pdc = formation.pdc || {};

    return React.createElement('div', {
        className: "py-8 px-4",
        style: { backgroundColor: '#133f5c' }
    }, React.createElement('div', {
        className: "max-w-4xl mx-auto"
    }, [
        // Header avec logo
        logoUrl && React.createElement('div', {
            key: 'header',
            className: "mb-6 text-center"
        }, React.createElement('img', {
            src: logoUrl,
            alt: 'Logo Arkance',
            className: "h-16 mx-auto"
        })),

        // Titre principal
        React.createElement('div', {
            key: 'title',
            className: "bg-white rounded-lg shadow-sm p-6 mb-6"
        }, [
            React.createElement('h1', {
                key: 'h1',
                className: "text-3xl font-bold text-gray-900 mb-2"
            }, 'Évaluation à froid'),
            React.createElement('p', {
                key: 'subtitle',
                className: "text-gray-600"
            }, 'Retour d\'expérience 30 jours après la formation')
        ]),

        // Informations de la formation (lecture seule)
        React.createElement('div', {
            key: 'info',
            className: "bg-blue-50 rounded-lg border border-blue-200 p-6 mb-6"
        }, [
            // Titre formation
            React.createElement('h2', {
                key: 'title',
                className: "text-2xl font-bold text-blue-900 mb-4"
            }, `Formation ${pdc.logiciel?.nom || ''} ${pdc.version_logiciel || ''} - ${pdc.duree_en_jour || 0} ${pdc.duree_en_jour > 1 ? 'jours' : 'jour'}`.trim()),

            // Container avec 2 colonnes
            React.createElement('div', {
                key: 'columns',
                className: "flex flex-col md:flex-row gap-8 text-sm"
            }, [
                // Colonne de gauche
                React.createElement('div', {
                    key: 'col-left',
                    className: "flex-1 space-y-4"
                }, [
                    // Plan de cours
                    React.createElement('div', { key: 'pdc' }, [
                        React.createElement('span', {
                            key: 'label',
                            className: "font-medium text-blue-900"
                        }, 'Plan de cours : '),
                        React.createElement('span', {
                            key: 'value',
                            className: "text-blue-800"
                        }, pdc.pdc_number || 'Non renseigné')
                    ]),
                    // Formateur
                    React.createElement('div', { key: 'formateur' }, [
                        React.createElement('span', {
                            key: 'label',
                            className: "font-medium text-blue-900"
                        }, 'Formateur : '),
                        React.createElement('span', {
                            key: 'value',
                            className: "text-blue-800"
                        }, formation.formateur ? `${formation.formateur.prenom} ${formation.formateur.nom}` : 'Non renseigné')
                    ]),
                    // Commercial
                    React.createElement('div', { key: 'commercial' }, [
                        React.createElement('span', {
                            key: 'label',
                            className: "font-medium text-blue-900"
                        }, 'Commercial : '),
                        React.createElement('span', {
                            key: 'value',
                            className: "text-blue-800"
                        }, formation.commercial ? `${formation.commercial.prenom} ${formation.commercial.nom}` : 'Non renseigné')
                    ]),
                    // Prénom
                    React.createElement('div', { key: 'prenom' }, [
                        React.createElement('span', {
                            key: 'label',
                            className: "font-medium text-blue-900"
                        }, 'Prénom : '),
                        React.createElement('span', {
                            key: 'value',
                            className: "text-blue-800"
                        }, evaluation.stagiaire_prenom)
                    ])
                ]),
                // Colonne de droite
                React.createElement('div', {
                    key: 'col-right',
                    className: "flex-1 space-y-4"
                }, [
                    // PRJ
                    React.createElement('div', { key: 'prj' }, [
                        React.createElement('span', {
                            key: 'label',
                            className: "font-medium text-blue-900"
                        }, 'PRJ : '),
                        React.createElement('span', {
                            key: 'value',
                            className: "text-blue-800"
                        }, formation.prj || 'Non renseigné')
                    ]),
                    // Lieu
                    React.createElement('div', { key: 'lieu' }, [
                        React.createElement('span', {
                            key: 'label',
                            className: "font-medium text-blue-900"
                        }, 'Lieu : '),
                        React.createElement('span', {
                            key: 'value',
                            className: "text-blue-800"
                        }, formation.lieu_projet || 'Non renseigné')
                    ]),
                    // Nom
                    React.createElement('div', { key: 'nom' }, [
                        React.createElement('span', {
                            key: 'label',
                            className: "font-medium text-blue-900"
                        }, 'Nom : '),
                        React.createElement('span', {
                            key: 'value',
                            className: "text-blue-800"
                        }, evaluation.stagiaire_nom)
                    ]),
                    // Email
                    React.createElement('div', { key: 'email' }, [
                        React.createElement('span', {
                            key: 'label',
                            className: "font-medium text-blue-900"
                        }, 'Email : '),
                        React.createElement('span', {
                            key: 'value',
                            className: "text-blue-800"
                        }, evaluation.stagiaire_email)
                    ]),
                    // Fonction
                    React.createElement('div', { key: 'fonction' }, [
                        React.createElement('span', {
                            key: 'label',
                            className: "font-medium text-blue-900"
                        }, 'Fonction : '),
                        React.createElement('span', {
                            key: 'value',
                            className: "text-blue-800"
                        }, evaluation.stagiaire_fonction)
                    ])
                ])
            ])
        ]),

        // Formulaire
        React.createElement('form', {
            key: 'form',
            onSubmit: handleSubmit,
            className: "space-y-6"
        }, [
            // Section 1: Mise en pratique
            React.createElement('div', {
                key: 'section1',
                className: "bg-white rounded-lg shadow-sm p-6"
            }, [
                React.createElement('h2', {
                    key: 'title',
                    className: "text-2xl font-bold text-gray-900 mb-6"
                }, 'Mise en pratique de la formation'),
                React.createElement('div', {
                    key: 'questions',
                    className: "space-y-6"
                }, [
                    React.createElement(YesNoQuestion, {
                        key: 'q1',
                        question: "1. Êtes-vous en mesure d'appliquer les connaissances acquises lors de la formation ?",
                        value: formData.froid_appliquer_connaissances,
                        onChange: (value) => handleFieldChange('froid_appliquer_connaissances', value),
                        required: true
                    }),
                    React.createElement(YesNoQuestion, {
                        key: 'q2',
                        question: "2. Êtes-vous en mesure de mieux appréhender le logiciel ou les thèmes abordés ?",
                        value: formData.froid_mieux_apprehender,
                        onChange: (value) => handleFieldChange('froid_mieux_apprehender', value),
                        required: true
                    }),
                    React.createElement(YesNoQuestion, {
                        key: 'q3',
                        question: "3. La formation a-t-elle facilité votre quotidien ?",
                        value: formData.froid_faciliter_quotidien,
                        onChange: (value) => handleFieldChange('froid_faciliter_quotidien', value),
                        required: true
                    }),
                    React.createElement(YesNoQuestion, {
                        key: 'q4',
                        question: "4. A-t-elle amélioré la qualité ou l'efficacité de votre travail ?",
                        value: formData.froid_ameliorer_efficacite,
                        onChange: (value) => handleFieldChange('froid_ameliorer_efficacite', value),
                        required: true
                    }),
                    React.createElement(YesNoQuestion, {
                        key: 'q5',
                        question: "5. Vous a-t-elle permis de développer de nouvelles compétences ?",
                        value: formData.froid_developper_competences,
                        onChange: (value) => handleFieldChange('froid_developper_competences', value),
                        required: true
                    }),
                    React.createElement('div', { key: 'q6' }, [
                        React.createElement('label', {
                            key: 'label',
                            className: "block text-sm font-medium text-gray-700 mb-2"
                        }, "6. Autres bénéfices, précisez (optionnel)"),
                        React.createElement('textarea', {
                            key: 'textarea',
                            value: formData.froid_autres_precisions,
                            onChange: (e) => handleFieldChange('froid_autres_precisions', e.target.value),
                            rows: 3,
                            className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                        })
                    ])
                ])
            ]),

            // Section 2: Bilan de la formation
            React.createElement('div', {
                key: 'section2',
                className: "bg-white rounded-lg shadow-sm p-6"
            }, [
                React.createElement('h2', {
                    key: 'title',
                    className: "text-2xl font-bold text-gray-900 mb-6"
                }, 'Bilan de la formation'),
                React.createElement('div', {
                    key: 'questions',
                    className: "space-y-6"
                }, [
                    React.createElement(YesNoQuestion, {
                        key: 'q7',
                        question: "7. La formation a-t-elle répondu à vos attentes initiales ?",
                        value: formData.froid_repondu_attentes,
                        onChange: (value) => handleFieldChange('froid_repondu_attentes', value),
                        required: true
                    }),
                    React.createElement(YesNoQuestion, {
                        key: 'q8',
                        question: "8. Pensez-vous avoir atteint les objectifs pédagogiques prévus lors de la formation ?",
                        value: formData.froid_atteint_objectifs,
                        onChange: (value) => handleFieldChange('froid_atteint_objectifs', value),
                        required: true
                    }),
                    React.createElement(YesNoQuestion, {
                        key: 'q9',
                        question: "9. Estimez-vous que la formation était en adéquation avec le métier ou les réalités du secteur ?",
                        value: formData.froid_adequation_metier,
                        onChange: (value) => handleFieldChange('froid_adequation_metier', value),
                        required: true
                    })
                ])
            ]),

            // Section 3: Satisfaction globale
            React.createElement('div', {
                key: 'section3',
                className: "bg-white rounded-lg shadow-sm p-6"
            }, [
                React.createElement('h2', {
                    key: 'title',
                    className: "text-2xl font-bold text-gray-900 mb-6"
                }, 'Satisfaction globale'),
                React.createElement('div', {
                    key: 'questions',
                    className: "space-y-6"
                }, [
                    React.createElement(YesNoQuestion, {
                        key: 'q10',
                        question: "10. Recommanderiez-vous notre service à un ami ou un collègue ?",
                        value: formData.froid_recommandation,
                        onChange: (value) => handleFieldChange('froid_recommandation', value),
                        required: true
                    }),
                    React.createElement('div', { key: 'q11' }, [
                        React.createElement('label', {
                            key: 'label',
                            className: "block text-sm font-medium text-gray-700 mb-2"
                        }, [
                            "11. Quel est votre niveau de satisfaction globale ?",
                            React.createElement('span', {
                                key: 'asterisk',
                                className: "text-red-600 ml-1"
                            }, '*')
                        ]),
                        React.createElement(window.StarRating, {
                            key: 'rating',
                            value: formData.froid_satisfaction_globale,
                            onChange: (value) => handleFieldChange('froid_satisfaction_globale', value)
                        })
                    ]),
                    React.createElement('div', { key: 'q12' }, [
                        React.createElement('label', {
                            key: 'label',
                            className: "block text-sm font-medium text-gray-700 mb-2"
                        }, "12. Vos commentaires concernant votre satisfaction (optionnel)"),
                        React.createElement('textarea', {
                            key: 'textarea',
                            value: formData.froid_commentaires_satisfaction,
                            onChange: (e) => handleFieldChange('froid_commentaires_satisfaction', e.target.value),
                            rows: 4,
                            className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                        })
                    ])
                ])
            ]),

            // Bouton de soumission
            React.createElement('div', {
                key: 'submit',
                className: "bg-white rounded-lg shadow-sm p-6"
            }, React.createElement('button', {
                type: 'submit',
                disabled: isSubmitting,
                className: `w-full py-3 px-4 rounded-md font-medium text-white ${
                    isSubmitting
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                } transition-colors`
            }, isSubmitting ? 'Envoi en cours...' : 'Envoyer l\'évaluation'))
        ])
    ]));
}

// Export du composant pour utilisation globale
if (typeof window !== 'undefined') {
    window.EvaluationFroidFormPage = EvaluationFroidFormPage;
}
