// Page Rapports - Analyse complète des évaluations
function RapportsPage() {
    const { useState, useEffect, useRef } = React;
    const { evaluations, loading } = window.useEvaluation();
    const iconsInitialized = useRef(false);
    const [filters, setFilters] = useState({
        // Par défaut : 1er janvier → 31 décembre de l'année en cours
        startDate: (() => {
            const date = new Date();
            date.setMonth(0);        // Janvier
            date.setDate(1);         // 1er jour
            return date.toISOString().split('T')[0];
        })(),
        endDate: (() => {
            const date = new Date();
            date.setMonth(11);       // Décembre
            date.setDate(31);        // 31
            return date.toISOString().split('T')[0];
        })()
    });
    const [expandedSections, setExpandedSections] = useState({
        formateurs: true,
        pdc: false,
        entreprises: false,
        qualiopi: false,
        detailNotes: false
    });

    // Calculer les statistiques avec filtres
    const stats = window.useRapportsStats(evaluations, filters);

    // Créer les icônes une seule fois après le premier rendu complet
    useEffect(() => {
        if (!loading && !iconsInitialized.current) {
            // Attendre que le DOM soit complètement mis à jour
            const timer = setTimeout(() => {
                if (window.safeCreateIcons) {
                    window.safeCreateIcons();
                    iconsInitialized.current = true;
                }
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [loading]);

    // Fonction pour toggle l'expansion d'une section
    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    // Créer une section pliable
    const CollapsibleSection = ({ id, title, icon, children, defaultExpanded = false }) => {
        const isExpanded = expandedSections[id] ?? defaultExpanded;

        return React.createElement('div', {
            key: id,
            className: 'bg-white rounded-lg border border-gray-200 overflow-hidden mb-6'
        }, [
            // En-tête cliquable
            React.createElement('button', {
                key: 'header',
                onClick: () => toggleSection(id),
                className: 'w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors'
            }, [
                React.createElement('div', {
                    key: 'title-section',
                    className: 'flex items-center gap-3'
                }, [
                    React.createElement('i', {
                        key: 'icon',
                        'data-lucide': icon,
                        className: 'w-5 h-5 text-gray-700'
                    }),
                    React.createElement('h2', {
                        key: 'title',
                        className: 'text-lg font-semibold text-gray-900'
                    }, title)
                ]),
                React.createElement('i', {
                    key: 'chevron',
                    'data-lucide': isExpanded ? 'chevron-up' : 'chevron-down',
                    className: 'w-5 h-5 text-gray-600'
                })
            ]),

            // Contenu
            isExpanded && React.createElement('div', {
                key: 'content',
                className: 'p-6'
            }, children)
        ]);
    };

    if (loading) {
        return React.createElement('div', {
            className: 'flex items-center justify-center h-64'
        }, [
            React.createElement('i', {
                key: 'icon',
                'data-lucide': 'loader-2',
                className: 'w-8 h-8 text-blue-600 animate-spin'
            }),
            React.createElement('span', {
                key: 'text',
                className: 'ml-3 text-gray-600'
            }, 'Chargement des rapports...')
        ]);
    }

    return React.createElement('div', {
        className: 'space-y-6'
    }, [
        // En-tête de page
        React.createElement('div', {
            key: 'page-header',
            className: 'bg-white rounded-lg border border-gray-200 p-6'
        }, [
            React.createElement('div', {
                key: 'header-content',
                className: 'flex items-center justify-between'
            }, [
                React.createElement('div', {
                    key: 'title-section'
                }, [
                    React.createElement('h1', {
                        key: 'title',
                        className: 'text-2xl font-bold text-gray-900 mb-2'
                    }, 'Rapports & Analyses'),
                    React.createElement('p', {
                        key: 'subtitle',
                        className: 'text-gray-600'
                    }, 'Vue d\'ensemble et analyse détaillée des évaluations de formations')
                ]),
                React.createElement('div', {
                    key: 'actions',
                    className: 'flex items-center gap-3'
                }, [
                    React.createElement('button', {
                        key: 'refresh',
                        onClick: () => window.location.reload(),
                        className: 'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors'
                    }, [
                        React.createElement('i', {
                            key: 'icon',
                            'data-lucide': 'refresh-cw',
                            className: 'w-4 h-4'
                        }),
                        'Rafraîchir'
                    ])
                ])
            ])
        ]),

        // Panneau de filtres
        React.createElement(window.FiltersPanel, {
            key: 'filters',
            filters: filters,
            onFiltersChange: setFilters,
            evaluations: evaluations
        }),

        // Affichage du nombre d'évaluations filtrées
        React.createElement('div', {
            key: 'filter-info',
            className: 'bg-blue-50 border border-blue-200 rounded-lg p-4'
        }, React.createElement('p', {
            className: 'text-sm text-blue-900'
        }, `📊 ${stats.nbEvaluationsFiltrees} évaluation${stats.nbEvaluationsFiltrees > 1 ? 's' : ''} analysée${stats.nbEvaluationsFiltrees > 1 ? 's' : ''} sur ${evaluations.length} au total`)),

        // Dashboard - Cartes KPI
        React.createElement('div', {
            key: 'kpi-dashboard'
        }, [
            React.createElement('h2', {
                key: 'title',
                className: 'text-xl font-semibold text-gray-900 mb-4'
            }, 'Vue d\'ensemble'),
            React.createElement('div', {
                key: 'cards',
                className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'
            }, [
                React.createElement(window.StatCard, {
                    key: 'total',
                    title: 'Évaluations',
                    value: stats.statsGlobales.total,
                    icon: 'clipboard-check',
                    color: 'blue',
                    subtitle: `${stats.statsGlobales.traitees} traitées (${stats.statsGlobales.tauxTraitees.toFixed(0)}%)`
                }),
                React.createElement(window.StatCard, {
                    key: 'stagiaires',
                    title: 'Stagiaires formés',
                    value: stats.statsGlobales.nbStagiairesUniques,
                    icon: 'users',
                    color: 'green',
                    subtitle: 'Stagiaires uniques'
                }),
                React.createElement(window.StatCard, {
                    key: 'entreprises',
                    title: 'Entreprises clientes',
                    value: stats.statsGlobales.nbEntreprisesUniques,
                    icon: 'building-2',
                    color: 'purple',
                    subtitle: 'Entreprises différentes'
                }),
                React.createElement(window.StatCard, {
                    key: 'satisfaction',
                    title: 'Satisfaction globale',
                    value: stats.statsGlobales.moyenneGlobale,
                    unit: '/ 5',
                    icon: 'star',
                    color: stats.statsGlobales.moyenneGlobale >= 4 ? 'green' : stats.statsGlobales.moyenneGlobale >= 3 ? 'yellow' : 'orange',
                    subtitle: 'Note moyenne'
                }),
                React.createElement(window.StatCard, {
                    key: 'organisation',
                    title: 'Organisation',
                    value: stats.statsGlobales.notesMoyennes.organisation,
                    unit: '/ 5',
                    icon: 'calendar-check',
                    color: 'blue'
                }),
                React.createElement(window.StatCard, {
                    key: 'moyens',
                    title: 'Moyens',
                    value: stats.statsGlobales.notesMoyennes.moyens,
                    unit: '/ 5',
                    icon: 'monitor',
                    color: 'purple'
                }),
                React.createElement(window.StatCard, {
                    key: 'pedagogie',
                    title: 'Pédagogie',
                    value: stats.statsGlobales.notesMoyennes.pedagogie,
                    unit: '/ 5',
                    icon: 'book-open',
                    color: 'orange'
                }),
                React.createElement(window.StatCard, {
                    key: 'recommandation',
                    title: 'Recommandation',
                    value: stats.statsGlobales.tauxRecommandation,
                    unit: '%',
                    icon: 'thumbs-up',
                    color: stats.statsGlobales.tauxRecommandation >= 80 ? 'green' : 'yellow',
                    subtitle: 'Taux de recommandation'
                }),
                React.createElement(window.StatCard, {
                    key: 'jours-formation',
                    title: 'Jours de formation',
                    value: stats.statsGlobales.nbJoursFormation,
                    icon: 'calendar-days',
                    color: 'blue',
                    subtitle: 'Jours dispensés (uniques par projet)'
                }),
                React.createElement(window.StatCard, {
                    key: 'formations',
                    title: 'Formations',
                    value: stats.statsGlobales.nbFormations,
                    icon: 'briefcase',
                    color: 'indigo',
                    subtitle: 'Projets uniques (PRJ)'
                })
            ])
        ]),

        // Section Formateurs
        React.createElement(CollapsibleSection, {
            key: 'section-formateurs',
            id: 'formateurs',
            title: 'Analyse par Formateur',
            icon: 'user-check',
            defaultExpanded: true
        }, [
            React.createElement(window.FormateursTable, {
                key: 'table',
                stats: stats.statsByFormateur
            })
        ]),

        // Section PDC/Formations
        React.createElement(CollapsibleSection, {
            key: 'section-pdc',
            id: 'pdc',
            title: 'Analyse par Formation (PDC)',
            icon: 'book-open',
            defaultExpanded: false
        }, [
            React.createElement(window.PDCTable, {
                key: 'table',
                stats: stats.statsByPDC
            })
        ]),

        // Section Entreprises
        React.createElement(CollapsibleSection, {
            key: 'section-entreprises',
            id: 'entreprises',
            title: 'Analyse par Entreprise',
            icon: 'building-2',
            defaultExpanded: false
        }, [
            React.createElement(window.EntreprisesTable, {
                key: 'table',
                stats: stats.statsByEntreprise
            })
        ]),

        // Section Qualiopi
        stats.statsQualiopi && React.createElement(CollapsibleSection, {
            key: 'section-qualiopi',
            id: 'qualiopi',
            title: 'Analyse Qualiopi',
            icon: 'award',
            defaultExpanded: false
        }, [
            React.createElement('div', {
                key: 'intro',
                className: 'bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6'
            }, [
                React.createElement('p', {
                    key: 'text',
                    className: 'text-sm text-blue-900'
                }, `${stats.statsQualiopi.nbEvaluationsQualiopi} évaluation${stats.statsQualiopi.nbEvaluationsQualiopi > 1 ? 's' : ''} Qualiopi complète${stats.statsQualiopi.nbEvaluationsQualiopi > 1 ? 's' : ''}`)
            ]),

            // Progressions moyennes par thème
            React.createElement('div', {
                key: 'progressions',
                className: 'bg-white rounded-lg border border-gray-200 overflow-hidden mb-6'
            }, [
                React.createElement('div', {
                    key: 'header',
                    className: 'px-6 py-4 bg-gray-50 border-b border-gray-200'
                }, React.createElement('h3', {
                    className: 'text-lg font-semibold text-gray-900'
                }, 'Progressions moyennes par thème')),

                React.createElement('div', {
                    key: 'content',
                    className: 'p-6'
                }, React.createElement('div', {
                    className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                }, Object.keys(stats.statsQualiopi.progressionsMoyennes).map(themeKey => {
                    const theme = stats.statsQualiopi.progressionsMoyennes[themeKey];
                    const progression = theme.progressionMoyenne;
                    const progressionColor = progression > 0 ? 'text-green-600' : progression < 0 ? 'text-red-600' : 'text-gray-600';

                    return React.createElement('div', {
                        key: themeKey,
                        className: 'border border-gray-200 rounded-lg p-4'
                    }, [
                        React.createElement('h4', {
                            key: 'titre',
                            className: 'text-sm font-medium text-gray-900 mb-3'
                        }, theme.titre),

                        React.createElement('div', {
                            key: 'stats',
                            className: 'space-y-2 text-sm'
                        }, [
                            React.createElement('div', {
                                key: 'avant',
                                className: 'flex justify-between'
                            }, [
                                React.createElement('span', {
                                    key: 'label',
                                    className: 'text-gray-600'
                                }, 'Entrée'),
                                React.createElement('span', {
                                    key: 'value',
                                    className: 'font-medium text-gray-900'
                                }, `${theme.avantMoyenne.toFixed(1)} / 5`)
                            ]),

                            React.createElement('div', {
                                key: 'apres',
                                className: 'flex justify-between'
                            }, [
                                React.createElement('span', {
                                    key: 'label',
                                    className: 'text-gray-600'
                                }, 'Sortie'),
                                React.createElement('span', {
                                    key: 'value',
                                    className: 'font-medium text-gray-900'
                                }, `${theme.apresMoyenne.toFixed(1)} / 5`)
                            ]),

                            React.createElement('div', {
                                key: 'progression',
                                className: `flex justify-between pt-2 border-t border-gray-200 ${progressionColor}`
                            }, [
                                React.createElement('span', {
                                    key: 'label',
                                    className: 'font-medium'
                                }, 'Progression'),
                                React.createElement('span', {
                                    key: 'value',
                                    className: 'font-bold'
                                }, `${progression > 0 ? '+' : ''}${progression.toFixed(1)}`)
                            ])
                        ])
                    ]);
                })))
            ])
        ]),

        // Section Détail des notes
        React.createElement(CollapsibleSection, {
            key: 'section-detail',
            id: 'detailNotes',
            title: 'Détail des Notes par Question',
            icon: 'list',
            defaultExpanded: false
        }, [
            // Organisation
            React.createElement('div', {
                key: 'organisation',
                className: 'mb-6'
            }, [
                React.createElement('h3', {
                    key: 'title',
                    className: 'text-lg font-semibold text-gray-900 mb-4'
                }, 'Organisation'),
                React.createElement('div', {
                    key: 'grid',
                    className: 'grid grid-cols-1 md:grid-cols-2 gap-4'
                }, [
                    createDetailItem('Communication des objectifs', stats.detailNotes.organisation.communication_objectifs),
                    createDetailItem('Durée de la formation', stats.detailNotes.organisation.duree_formation),
                    createDetailItem('Composition du groupe', stats.detailNotes.organisation.composition_groupe),
                    createDetailItem('Respect des engagements', stats.detailNotes.organisation.respect_engagements)
                ])
            ]),

            // Moyens
            React.createElement('div', {
                key: 'moyens',
                className: 'mb-6'
            }, [
                React.createElement('h3', {
                    key: 'title',
                    className: 'text-lg font-semibold text-gray-900 mb-4'
                }, 'Moyens'),
                React.createElement('div', {
                    key: 'grid',
                    className: 'grid grid-cols-1 md:grid-cols-2 gap-4'
                }, [
                    createDetailItem('Évaluation des locaux', stats.detailNotes.moyens.evaluation_locaux),
                    createDetailItem('Matériel informatique', stats.detailNotes.moyens.materiel_informatique),
                    createDetailItem('Formation à distance', stats.detailNotes.moyens.formation_distance),
                    createDetailItem('Support de cours', stats.detailNotes.moyens.support_cours),
                    stats.detailNotes.moyens.restauration > 0 && createDetailItem('Restauration', stats.detailNotes.moyens.restauration)
                ].filter(Boolean))
            ]),

            // Pédagogie
            React.createElement('div', {
                key: 'pedagogie',
                className: 'mb-6'
            }, [
                React.createElement('h3', {
                    key: 'title',
                    className: 'text-lg font-semibold text-gray-900 mb-4'
                }, 'Pédagogie'),
                React.createElement('div', {
                    key: 'grid',
                    className: 'grid grid-cols-1 md:grid-cols-2 gap-4'
                }, [
                    createDetailItem('Niveau de difficulté', stats.detailNotes.pedagogie.niveau_difficulte),
                    createDetailItem('Rythme de progression', stats.detailNotes.pedagogie.rythme_progression),
                    createDetailItem('Qualité contenu théorique', stats.detailNotes.pedagogie.qualite_contenu_theorique),
                    createDetailItem('Qualité contenu pratique', stats.detailNotes.pedagogie.qualite_contenu_pratique),
                    createDetailItem('Connaissance formateur', stats.detailNotes.pedagogie.connaissance_formateur),
                    createDetailItem('Approche pédagogique', stats.detailNotes.pedagogie.approche_pedagogique),
                    createDetailItem('Écoute et disponibilité', stats.detailNotes.pedagogie.ecoute_disponibilite),
                    createDetailItem('Animation formateur', stats.detailNotes.pedagogie.animation_formateur)
                ])
            ]),

            // Satisfaction
            React.createElement('div', {
                key: 'satisfaction',
                className: 'mb-6'
            }, [
                React.createElement('h3', {
                    key: 'title',
                    className: 'text-lg font-semibold text-gray-900 mb-4'
                }, 'Satisfaction'),
                React.createElement('div', {
                    key: 'grid',
                    className: 'grid grid-cols-1 md:grid-cols-2 gap-4'
                }, [
                    createDetailItem('Répondu aux attentes', stats.detailNotes.satisfaction.repondu_attentes),
                    createDetailItem('Atteint les objectifs', stats.detailNotes.satisfaction.atteint_objectifs),
                    createDetailItem('Adéquation métier', stats.detailNotes.satisfaction.adequation_metier),
                    createDetailItem('Recommandation', stats.detailNotes.satisfaction.recommandation),
                    createDetailItem('Niveau global', stats.detailNotes.satisfaction.niveau_global)
                ])
            ])
        ])
    ]);
}

// Helper pour créer un item de détail
function createDetailItem(label, value) {
    const getColorClass = (val) => {
        if (val >= 4.5) return 'bg-green-100 text-green-800';
        if (val >= 4.0) return 'bg-green-50 text-green-700';
        if (val >= 3.5) return 'bg-yellow-50 text-yellow-700';
        if (val >= 3.0) return 'bg-orange-50 text-orange-700';
        return 'bg-red-50 text-red-700';
    };

    return React.createElement('div', {
        key: label,
        className: 'flex justify-between items-center p-3 bg-gray-50 rounded-lg'
    }, [
        React.createElement('span', {
            key: 'label',
            className: 'text-sm text-gray-700'
        }, label),
        React.createElement('span', {
            key: 'value',
            className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${getColorClass(value)}`
        }, `${value.toFixed(1)} / 5`)
    ]);
}

// Export global
window.RapportsPage = RapportsPage;
