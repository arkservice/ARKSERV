// Page de formulaire d'évaluation (accès public via token)
function EvaluationFormPage({ token }) {
    const { useState, useEffect } = React;
    const { getSessionByToken } = window.useFormation();
    const { createEvaluation } = window.useEvaluation();
    const supabase = window.supabaseConfig.client;

    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [logoUrl, setLogoUrl] = useState(null);

    const [formData, setFormData] = useState({
        // Informations stagiaire
        stagiaire_nom: '',
        stagiaire_prenom: '',
        stagiaire_email: '',
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

        // Qualiopi
        qualiopi_themes: {}
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
        fetchSession();
    }, [token]);

    useEffect(() => {
        lucide.createIcons();
    }, [formData, session]);

    const fetchSession = async () => {
        try {
            setLoading(true);
            setError(null);
            const sessionData = await getSessionByToken(token);
            setSession(sessionData);

            // Initialiser les thèmes Qualiopi
            const themes = {};
            for (let i = 1; i <= 12; i++) {
                const themeKey = `programme_point_${i}`;
                const themeTitle = sessionData.pdc[themeKey];
                if (themeTitle) {
                    themes[`theme_${i}`] = {
                        titre: themeTitle,
                        avant: null,
                        apres: null
                    };
                }
            }
            setFormData(prev => ({
                ...prev,
                qualiopi_themes: themes
            }));

        } catch (err) {
            console.error('Erreur lors du chargement de la session:', err);
            setError('Lien d\'évaluation invalide ou expiré');
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

    const validateForm = () => {
        // Vérifier les informations stagiaire
        if (!formData.stagiaire_nom || !formData.stagiaire_prenom || !formData.stagiaire_email || !formData.stagiaire_fonction) {
            setError('Veuillez remplir toutes vos informations personnelles');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return false;
        }

        // Vérifier email valide
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.stagiaire_email)) {
            setError('Veuillez saisir une adresse email valide');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return false;
        }

        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);

            await createEvaluation({
                formation_id: session.id,
                ...formData
            });

            setIsSubmitted(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (err) {
            console.error('Erreur lors de la soumission:', err);
            setError('Erreur lors de l\'envoi de votre évaluation. Veuillez réessayer.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return React.createElement('div', {
            className: "min-h-screen flex items-center justify-center p-4",
            style: { backgroundColor: '#133f5c' }
        }, React.createElement('div', {
            className: "animate-pulse space-y-4 text-center"
        }, [
            React.createElement('div', {
                key: 'spinner',
                className: "text-white text-lg"
            }, "Chargement..."),
            React.createElement('div', {
                key: 'desc',
                className: "text-gray-300 text-sm"
            }, "Veuillez patienter")
        ]));
    }

    if (error && !session) {
        return React.createElement('div', {
            className: "min-h-screen flex items-center justify-center p-4",
            style: { backgroundColor: '#133f5c' }
        }, React.createElement('div', {
            className: "bg-white rounded-lg border border-red-200 p-8 max-w-md text-center"
        }, [
            React.createElement('div', {
                key: 'icon',
                className: "text-red-600 mb-4"
            }, React.createElement('i', {
                'data-lucide': 'alert-circle',
                className: "w-16 h-16 mx-auto"
            })),
            React.createElement('h2', {
                key: 'title',
                className: "text-xl font-bold text-gray-900 mb-2"
            }, "Lien invalide"),
            React.createElement('p', {
                key: 'message',
                className: "text-gray-600"
            }, error)
        ]));
    }

    if (isSubmitted) {
        return React.createElement('div', {
            className: "min-h-screen flex items-center justify-center p-4",
            style: { backgroundColor: '#133f5c' }
        }, React.createElement('div', {
            className: "bg-white rounded-lg border border-green-200 p-8 max-w-md text-center"
        }, [
            React.createElement('div', {
                key: 'icon',
                className: "text-green-600 mb-4"
            }, React.createElement('i', {
                'data-lucide': 'check-circle',
                className: "w-16 h-16 mx-auto"
            })),
            React.createElement('h2', {
                key: 'title',
                className: "text-2xl font-bold text-gray-900 mb-2"
            }, "Merci !"),
            React.createElement('p', {
                key: 'message',
                className: "text-gray-600"
            }, "Votre évaluation a été envoyée avec succès. Nous vous remercions pour votre participation.")
        ]));
    }

    return React.createElement('div', {
        className: "py-8 px-4",
        style: { backgroundColor: '#133f5c' }
    }, React.createElement('div', {
        className: "max-w-4xl mx-auto space-y-6"
    }, [
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
            // Titre
            React.createElement('h2', {
                key: 'title',
                className: "text-2xl font-bold text-blue-900 mb-4"
            }, `Formation ${session.pdc?.logiciel?.nom || ''} ${session.pdc?.version_logiciel || ''} - ${session.pdc?.duree_en_jour || 0} ${session.pdc?.duree_en_jour > 1 ? 'jours' : 'jour'}`.trim()),

            // Container avec 2 colonnes explicites
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
                        }, "Plan de cours : "),
                        React.createElement('span', {
                            key: 'value',
                            className: "text-blue-800"
                        }, session.pdc.pdc_number)
                    ]),
                    // Formateur
                    React.createElement('div', { key: 'formateur' }, [
                        React.createElement('span', {
                            key: 'label',
                            className: "font-medium text-blue-900"
                        }, "Formateur : "),
                        React.createElement('span', {
                            key: 'value',
                            className: "text-blue-800"
                        }, `${session.formateur.prenom} ${session.formateur.nom}`)
                    ]),
                    // Commercial
                    React.createElement('div', { key: 'commercial' }, [
                        React.createElement('span', {
                            key: 'label',
                            className: "font-medium text-blue-900"
                        }, "Commercial : "),
                        React.createElement('span', {
                            key: 'value',
                            className: "text-blue-800"
                        }, session.commercial
                            ? `${session.commercial.prenom} ${session.commercial.nom}`
                            : 'Non renseigné'
                        )
                    ]),
                    // Société
                    React.createElement('div', { key: 'societe' }, [
                        React.createElement('span', {
                            key: 'label',
                            className: "font-medium text-blue-900"
                        }, "Société : "),
                        React.createElement('span', {
                            key: 'value',
                            className: "text-blue-800"
                        }, session.entreprise?.nom || 'Non renseigné')
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
                        }, "PRJ : "),
                        React.createElement('span', {
                            key: 'value',
                            className: "text-blue-800"
                        }, session.prj)
                    ]),
                    // Lieu
                    session.sessions_evenements && session.sessions_evenements.length > 0
                        ? React.createElement('div', {
                            key: 'lieu-section',
                            className: ""
                        }, [
                            // Première ligne : Label + première session
                            React.createElement('div', {
                                key: 'first-session'
                            }, [
                                React.createElement('span', {
                                    key: 'label',
                                    className: "font-medium text-blue-900"
                                }, "Lieu : "),
                                React.createElement('span', {
                                    key: 'value',
                                    className: "text-blue-800"
                                }, session.sessions_evenements.length > 1
                                    ? `Session 1 : ${session.sessions_evenements[0].lieu}${session.sessions_evenements[0].adresse ? ` - ${session.sessions_evenements[0].adresse}` : ''}`
                                    : `${session.sessions_evenements[0].lieu}${session.sessions_evenements[0].adresse ? ` - ${session.sessions_evenements[0].adresse}` : ''}`)
                            ]),
                            // Sessions suivantes (si plusieurs)
                            ...session.sessions_evenements.slice(1).map((evt, index) =>
                                React.createElement('div', {
                                    key: `session-${index + 1}`,
                                    className: "text-blue-800"
                                }, `\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0• Session ${index + 2} : ${evt.lieu}${evt.adresse ? ` - ${evt.adresse}` : ''}`)
                            )
                        ])
                        : React.createElement('div', {
                            key: 'lieu-section',
                            className: ""
                        }, [
                            React.createElement('span', {
                                key: 'label',
                                className: "font-medium text-blue-900"
                            }, "Lieu : "),
                            React.createElement('span', {
                                key: 'value',
                                className: "text-blue-800"
                            }, session.lieu || session.lieu_projet || 'Non renseigné')
                        ])
                ])
            ])
        ]),

        // Message d'erreur
        error && React.createElement('div', {
            key: 'error',
            className: "bg-red-50 border border-red-200 rounded-lg p-4"
        }, React.createElement('p', {
            className: "text-red-800 text-sm"
        }, error)),

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
                    className: "grid grid-cols-1 gap-4"
                }, [
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
        createSection01(formData, handleFieldChange),

        // Section 02: Moyens
        createSection02(formData, handleFieldChange, session),

        // Section 03: Pédagogie
        createSection03(formData, handleFieldChange),

        // Section 04: Satisfaction
        createSection04(formData, handleFieldChange),

        // Section Qualiopi
        createSectionQualiopi(formData, handleQualiopiChange),

        // Bouton soumettre
        React.createElement('div', {
            key: 'submit',
            className: "bg-white rounded-lg border border-gray-200 p-6"
        }, React.createElement('div', {
            className: "flex justify-end"
        }, React.createElement('button', {
            onClick: handleSubmit,
            disabled: isSubmitting,
            className: `inline-flex items-center gap-2 px-8 py-3 text-base font-medium text-white rounded-lg transition-colors ${
                isSubmitting
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
            }`
        }, [
            React.createElement('i', {
                key: 'icon',
                'data-lucide': isSubmitting ? 'loader-2' : 'send',
                className: `w-5 h-5 ${isSubmitting ? 'animate-spin' : ''}`
            }),
            isSubmitting ? "Envoi en cours..." : "Envoyer mon évaluation"
        ])))
    ]));
}

// Fonction pour créer la section 01: Organisation
function createSection01(formData, handleFieldChange) {
    return React.createElement('div', {
        key: 'section-01',
        className: "bg-white rounded-lg border border-gray-200 p-6"
    }, [
        React.createElement('h2', {
            key: 'title',
            className: "text-2xl font-bold text-gray-900 mb-6"
        }, "Comment évaluez-vous l'organisation autour de votre formation ?"),

        React.createElement('div', {
            key: 'questions',
            className: "space-y-6"
        }, [
            createRatingQuestion(
                'Communication des objectifs et du programme avant la formation',
                formData.org_communication_objectifs,
                (value) => handleFieldChange('org_communication_objectifs', value)
            ),
            createRatingQuestion(
                'Durée de la formation',
                formData.org_duree_formation,
                (value) => handleFieldChange('org_duree_formation', value)
            ),
            createRatingQuestion(
                'Composition du groupe (nombre, niveaux)',
                formData.org_composition_groupe,
                (value) => handleFieldChange('org_composition_groupe', value)
            ),
            createRatingQuestion(
                'Respect des engagements',
                formData.org_respect_engagements,
                (value) => handleFieldChange('org_respect_engagements', value)
            ),
            React.createElement('div', { key: 'comments' }, [
                React.createElement('label', {
                    key: 'label',
                    className: "block text-sm font-medium text-gray-700 mb-2"
                }, "Vos commentaires concernant les moyens"),
                React.createElement('textarea', {
                    key: 'textarea',
                    value: formData.org_commentaires,
                    onChange: (e) => handleFieldChange('org_commentaires', e.target.value),
                    rows: 4,
                    className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                })
            ])
        ])
    ]);
}

// Fonction pour créer la section 02: Moyens
function createSection02(formData, handleFieldChange, session) {
    // Extraire tous les lieux différents des sessions
    let lieuxFormation = [];
    if (session?.sessions_evenements && session.sessions_evenements.length > 0) {
        lieuxFormation = session.sessions_evenements.map(evt => evt.lieu);
    } else {
        lieuxFormation = [session?.lieu || session?.lieu_projet || ''];
    }

    // Vérifier si au moins une session correspond à chaque type de lieu
    const hasNosLocaux = lieuxFormation.some(l => l === 'Dans nos locaux');
    const hasVosLocaux = lieuxFormation.some(l => l === 'Dans vos locaux');
    const hasDistance = lieuxFormation.some(l => l === 'À distance');

    // Questions à afficher selon les lieux (afficher si AU MOINS UNE session correspond)
    const showLocaux = hasNosLocaux; // Afficher si au moins une session "Dans nos locaux"
    const showMateriel = hasNosLocaux; // Afficher si au moins une session "Dans nos locaux"
    const showFormationDistance = hasDistance; // Afficher si au moins une session "À distance"
    const showRepas = hasNosLocaux; // Afficher si au moins une session "Dans nos locaux"

    const questions = [
        // Évaluation des locaux (uniquement si "Dans nos locaux")
        showLocaux && createRatingQuestion(
            'Évaluation des locaux',
            formData.moyens_evaluation_locaux,
            (value) => handleFieldChange('moyens_evaluation_locaux', value)
        ),
        // Matériel informatique (uniquement si "Dans nos locaux")
        showMateriel && createRatingQuestion(
            'Le matériel informatique',
            formData.moyens_materiel_informatique,
            (value) => handleFieldChange('moyens_materiel_informatique', value)
        ),
        // Formation à distance (uniquement si à distance)
        showFormationDistance && createRatingQuestion(
            'La formation à distance',
            formData.moyens_formation_distance,
            (value) => handleFieldChange('moyens_formation_distance', value)
        ),
        // Support de cours (toujours affiché)
        createRatingQuestion(
            'Le support de cours',
            formData.moyens_support_cours,
            (value) => handleFieldChange('moyens_support_cours', value)
        ),
        // Questions repas (uniquement si "Dans nos locaux")
        showRepas && React.createElement('div', { key: 'repas' }, [
            React.createElement('label', {
                key: 'label',
                className: "block text-lg font-medium text-gray-700 mb-2"
            }, "Où avez-vous mangé ?"),
            React.createElement('select', {
                key: 'select',
                value: formData.moyens_lieu_repas,
                onChange: (e) => handleFieldChange('moyens_lieu_repas', e.target.value),
                className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            }, [
                React.createElement('option', { key: 'empty', value: '' }, "Sélectionnez"),
                React.createElement('option', { key: '1', value: 'Restauration prise en charge par Arkance' }, "Restauration prise en charge par Arkance"),
                React.createElement('option', { key: '2', value: 'Restauration extérieure' }, "Restauration extérieure")
            ])
        ]),
        (showRepas && formData.moyens_lieu_repas === 'Restauration prise en charge par Arkance') && createRatingQuestion(
            'La restauration',
            formData.moyens_restauration,
            (value) => handleFieldChange('moyens_restauration', value)
        )
    ].filter(Boolean); // Filtrer les éléments false

    return React.createElement('div', {
        key: 'section-02',
        className: "bg-white rounded-lg border border-gray-200 p-6"
    }, [
        React.createElement('h2', {
            key: 'title',
            className: "text-2xl font-bold text-gray-900 mb-6"
        }, "Comment évaluez-vous les moyens mis en place pour cette formation"),

        React.createElement('div', {
            key: 'questions',
            className: "space-y-6"
        }, questions)
    ]);
}

// Fonction pour créer la section 03: Pédagogie
function createSection03(formData, handleFieldChange) {
    return React.createElement('div', {
        key: 'section-03',
        className: "bg-white rounded-lg border border-gray-200 p-6"
    }, [
        React.createElement('h2', {
            key: 'title',
            className: "text-2xl font-bold text-gray-900 mb-6"
        }, "La pédagogie"),

        React.createElement('div', {
            key: 'questions',
            className: "space-y-6"
        }, [
            createRatingQuestion(
                'Niveau de difficulté',
                formData.peda_niveau_difficulte,
                (value) => handleFieldChange('peda_niveau_difficulte', value)
            ),
            createRatingQuestion(
                'Rythme de la progression',
                formData.peda_rythme_progression,
                (value) => handleFieldChange('peda_rythme_progression', value)
            ),
            createRatingQuestion(
                'Qualité du contenu théorique',
                formData.peda_qualite_contenu_theorique,
                (value) => handleFieldChange('peda_qualite_contenu_theorique', value)
            ),
            createRatingQuestion(
                'Qualité du contenu pratique (exercices, cas d\'usages, etc)',
                formData.peda_qualite_contenu_pratique,
                (value) => handleFieldChange('peda_qualite_contenu_pratique', value)
            ),
            createRatingQuestion(
                'Connaissance du formateur de votre métier',
                formData.peda_connaissance_formateur,
                (value) => handleFieldChange('peda_connaissance_formateur', value)
            ),
            createRatingQuestion(
                'Qualité de l\'approche pédagogique du formateur',
                formData.peda_approche_pedagogique,
                (value) => handleFieldChange('peda_approche_pedagogique', value)
            ),
            createRatingQuestion(
                'Écoute et disponibilité du formateur',
                formData.peda_ecoute_disponibilite,
                (value) => handleFieldChange('peda_ecoute_disponibilite', value)
            ),
            createRatingQuestion(
                'Animation du formateur',
                formData.peda_animation_formateur,
                (value) => handleFieldChange('peda_animation_formateur', value)
            ),
            React.createElement('div', { key: 'comments' }, [
                React.createElement('label', {
                    key: 'label',
                    className: "block text-sm font-medium text-gray-700 mb-2"
                }, "Vos commentaires concernant la pédagogie"),
                React.createElement('textarea', {
                    key: 'textarea',
                    value: formData.peda_commentaires,
                    onChange: (e) => handleFieldChange('peda_commentaires', e.target.value),
                    rows: 4,
                    className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                })
            ])
        ])
    ]);
}

// Fonction pour créer la section 04: Satisfaction
function createSection04(formData, handleFieldChange) {
    return React.createElement('div', {
        key: 'section-04',
        className: "bg-white rounded-lg border border-gray-200 p-6"
    }, [
        React.createElement('h2', {
            key: 'title',
            className: "text-2xl font-bold text-gray-900 mb-6"
        }, "Votre satisfaction"),

        React.createElement('div', {
            key: 'questions',
            className: "space-y-6"
        }, [
            createRatingQuestion(
                'La formation a-t-elle répondu à vos attentes initiales ?',
                formData.satisf_repondu_attentes,
                (value) => handleFieldChange('satisf_repondu_attentes', value)
            ),
            createRatingQuestion(
                'Pensez-vous avoir atteint les objectifs pédagogiques prévus lors de la formation ?',
                formData.satisf_atteint_objectifs,
                (value) => handleFieldChange('satisf_atteint_objectifs', value)
            ),
            createRatingQuestion(
                'Estimez-vous que la formation était en adéquation avec le métier ?',
                formData.satisf_adequation_metier,
                (value) => handleFieldChange('satisf_adequation_metier', value)
            ),
            createRatingQuestion(
                'Recommanderiez-vous notre service à un collègue ?',
                formData.satisf_recommandation,
                (value) => handleFieldChange('satisf_recommandation', value)
            ),
            createRatingQuestion(
                'Quel est votre niveau de satisfaction globale ?',
                formData.satisf_niveau_global,
                (value) => handleFieldChange('satisf_niveau_global', value)
            ),
            React.createElement('div', { key: 'comments' }, [
                React.createElement('label', {
                    key: 'label',
                    className: "block text-sm font-medium text-gray-700 mb-2"
                }, "Vos commentaires concernant votre satisfaction :"),
                React.createElement('textarea', {
                    key: 'textarea',
                    value: formData.satisf_commentaires,
                    onChange: (e) => handleFieldChange('satisf_commentaires', e.target.value),
                    rows: 4,
                    className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                })
            ]),
            React.createElement('div', { key: 'formation-comp' }, [
                React.createElement('label', {
                    key: 'label',
                    className: "flex items-center gap-2 cursor-pointer"
                }, [
                    React.createElement('input', {
                        key: 'checkbox',
                        type: 'checkbox',
                        checked: formData.satisf_besoin_formation_complementaire,
                        onChange: (e) => handleFieldChange('satisf_besoin_formation_complementaire', e.target.checked),
                        className: "w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    }),
                    React.createElement('span', {
                        key: 'text',
                        className: "text-sm font-medium text-gray-700"
                    }, "Ressentez-vous le besoin d'une formation complémentaire")
                ])
            ]),
            React.createElement('div', {
                key: 'logiciel',
                style: { display: formData.satisf_besoin_formation_complementaire ? 'block' : 'none' }
            }, [
                React.createElement('label', {
                    key: 'label',
                    className: "block text-sm font-medium text-gray-700 mb-2"
                }, "Sur quel logiciel ?"),
                React.createElement('input', {
                    key: 'input',
                    type: 'text',
                    value: formData.satisf_logiciel_complementaire,
                    onChange: (e) => handleFieldChange('satisf_logiciel_complementaire', e.target.value),
                    className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                })
            ]),
            React.createElement('div', { key: 'accompagnement' }, [
                React.createElement('label', {
                    key: 'label',
                    className: "flex items-center gap-2 cursor-pointer"
                }, [
                    React.createElement('input', {
                        key: 'checkbox',
                        type: 'checkbox',
                        checked: formData.satisf_besoin_accompagnement,
                        onChange: (e) => handleFieldChange('satisf_besoin_accompagnement', e.target.checked),
                        className: "w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    }),
                    React.createElement('span', {
                        key: 'text',
                        className: "text-sm font-medium text-gray-700"
                    }, "Ressentez-vous le besoin d'être accompagné ?")
                ])
            ]),
            React.createElement('div', {
                key: 'besoins',
                style: { display: formData.satisf_besoin_accompagnement ? 'block' : 'none' }
            }, [
                React.createElement('label', {
                    key: 'label',
                    className: "block text-sm font-medium text-gray-700 mb-2"
                }, "Précisez vos besoins (exemple : création de familles, gabarits, etc)"),
                React.createElement('textarea', {
                    key: 'textarea',
                    value: formData.satisf_precision_besoins,
                    onChange: (e) => handleFieldChange('satisf_precision_besoins', e.target.value),
                    rows: 3,
                    className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                })
            ])
        ])
    ]);
}

// Fonction pour créer la section Qualiopi
function createSectionQualiopi(formData, handleQualiopiChange) {
    const themes = formData.qualiopi_themes;
    const themeKeys = Object.keys(themes);

    return React.createElement('div', {
        key: 'section-qualiopi',
        className: "bg-white rounded-lg border border-gray-200 p-6",
        style: { display: themeKeys.length === 0 ? 'none' : 'block' }
    }, [
        React.createElement('h2', {
            key: 'title',
            className: "text-2xl font-bold text-gray-900 mb-4"
        }, "Auto-Évaluation Qualiopi"),

        React.createElement('div', {
            key: 'info',
            className: "bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm text-blue-900"
        }, [
            React.createElement('p', {
                key: 'p1',
                className: "mb-2 font-medium"
            }, "Définition de QUALIOPI :"),
            React.createElement('p', {
                key: 'p2',
                className: "mb-2 italic"
            }, "QUALIOPI est la nouvelle marque de certification qualité des prestataires d'action de formation comme Arkance Systems. Arkance se doit, pour être en conformité avec la norme, d'évaluer l'atteinte par les publics bénéficiaires des objectifs de la prestation."),
            React.createElement('p', {
                key: 'p3',
                className: "mb-1"
            }, "Arkance réalise l'évaluation des acquis du stagiaire sur les thèmes du programme de formation avec :"),
            React.createElement('ul', {
                key: 'list',
                className: "list-disc list-inside space-y-1 ml-4"
            }, [
                React.createElement('li', { key: '1' }, "L'autoévaluation du stagiaire de ses connaissances à l'entrée en formation."),
                React.createElement('li', { key: '2' }, "L'autoévaluation du stagiaire de la progression de ses connaissances à la sortie de la formation."),
                React.createElement('li', { key: '3' }, "L'évaluation par le formateur de la progression des connaissances entre l'entrée et la sortie de la formation.")
            ])
        ]),

        React.createElement('div', {
            key: 'themes',
            className: "space-y-6"
        }, themeKeys.map(themeKey => {
            const theme = themes[themeKey];
            // Extraire le numéro du point (theme_1 -> 1, theme_12 -> 12)
            const pointNumber = themeKey.replace('theme_', '');
            return React.createElement('div', {
                key: themeKey,
                className: "border border-gray-200 rounded-lg p-4"
            }, [
                React.createElement('h3', {
                    key: 'title',
                    className: "font-medium text-gray-900 mb-4"
                }, `${pointNumber} - ${theme.titre}`),

                React.createElement('div', {
                    key: 'ratings',
                    className: "grid grid-cols-1 md:grid-cols-2 gap-4"
                }, [
                    React.createElement('div', { key: 'avant' }, [
                        React.createElement('label', {
                            key: 'label',
                            className: "block text-sm font-medium text-gray-700 mb-2"
                        }, "Auto-Évaluation entrée"),
                        React.createElement(window.QualiopiRating, {
                            value: theme.avant,
                            onChange: (value) => handleQualiopiChange(themeKey, 'avant', value),
                            size: 'sm'
                        })
                    ]),
                    React.createElement('div', { key: 'apres' }, [
                        React.createElement('label', {
                            key: 'label',
                            className: "block text-sm font-medium text-gray-700 mb-2"
                        }, "Auto-Évaluation sortie"),
                        React.createElement(window.QualiopiRating, {
                            value: theme.apres,
                            onChange: (value) => handleQualiopiChange(themeKey, 'apres', value),
                            size: 'sm'
                        })
                    ])
                ])
            ]);
        }))
    ]);
}

// Fonction helper pour créer une question avec rating
function createRatingQuestion(label, value, onChange) {
    return React.createElement('div', {
        className: "space-y-3"
    }, [
        React.createElement('label', {
            key: 'label',
            className: "block text-lg font-medium text-gray-700"
        }, label),
        React.createElement(window.StarRating, {
            key: 'rating',
            value: value,
            onChange: onChange
        })
    ]);
}

// Exports globaux
window.EvaluationFormPage = EvaluationFormPage;
window.createSection01 = createSection01;
window.createSection02 = createSection02;
window.createSection03 = createSection03;
window.createSection04 = createSection04;
window.createSectionQualiopi = createSectionQualiopi;
window.createRatingQuestion = createRatingQuestion;
