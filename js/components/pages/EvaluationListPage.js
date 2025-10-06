// Page de liste des évaluations
function EvaluationListPage() {
    const { useState, useEffect } = React;
    const { evaluations, loading, deleteEvaluation } = window.useEvaluation();

    const [selectedEval, setSelectedEval] = useState(null);

    useEffect(() => {
        lucide.createIcons();
    }, [evaluations, selectedEval]);

    const handleViewDetail = (evaluation) => {
        setSelectedEval(evaluation);
    };

    const handleCloseDetail = () => {
        setSelectedEval(null);
    };

    const handleDelete = async (id) => {
        if (confirm('Voulez-vous vraiment supprimer cette évaluation ?')) {
            try {
                await deleteEvaluation(id);
            } catch (err) {
                console.error('Erreur lors de la suppression:', err);
                alert('Erreur lors de la suppression: ' + err.message);
            }
        }
    };

    // Configuration des colonnes du tableau
    const columns = [
        {
            key: 'submitted_at',
            label: 'Date',
            sortable: true,
            render: (value) => value ? new Date(value).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }) : 'N/A'
        },
        {
            key: 'stagiaire_prenom',
            label: 'Stagiaire',
            sortable: true,
            render: (value, row) => React.createElement('div', {}, [
                React.createElement('div', {
                    key: 'name',
                    className: 'text-sm font-medium text-gray-900'
                }, `${row.stagiaire_prenom || ''} ${row.stagiaire_nom || ''}`.trim()),
                React.createElement('div', {
                    key: 'societe',
                    className: 'text-sm text-gray-600'
                }, row.stagiaire_societe || ''),
                React.createElement('div', {
                    key: 'email',
                    className: 'text-sm text-gray-500'
                }, row.stagiaire_email || '')
            ])
        },
        {
            key: 'formation',
            label: 'Formation',
            sortable: true,
            render: (value, row) => value?.pdc?.ref || 'N/A'
        },
        {
            key: 'formation',
            label: 'PRJ',
            sortable: true,
            render: (value, row) => value?.prj || 'N/A'
        },
        {
            key: 'formation',
            label: 'Formateur',
            sortable: true,
            render: (value, row) => value?.formateur ? `${value.formateur.prenom || ''} ${value.formateur.nom || ''}`.trim() : 'N/A'
        },
        {
            key: 'satisf_niveau_global',
            label: 'Satisfaction',
            sortable: true,
            render: (value) => React.createElement('div', {
                className: 'flex items-center gap-1'
            }, [
                React.createElement('span', {
                    key: 'value',
                    className: 'text-sm font-medium text-gray-900'
                }, value || '-'),
                React.createElement('span', {
                    key: 'max',
                    className: 'text-sm text-gray-500'
                }, '/ 10')
            ])
        }
    ];

    // Si vue détaillée
    if (selectedEval) {
        return createDetailView(selectedEval, handleCloseDetail);
    }

    // Vue tableau
    return React.createElement(window.TableView, {
        data: evaluations,
        columns: columns,
        title: "Évaluations",
        subtitle: `${evaluations.length} évaluation${evaluations.length > 1 ? 's' : ''} reçue${evaluations.length > 1 ? 's' : ''}`,
        loading: loading,
        onRowClick: handleViewDetail,
        onDelete: handleDelete,
        searchableFields: ['stagiaire_nom', 'stagiaire_prenom', 'stagiaire_email', 'stagiaire_societe', 'stagiaire_fonction', 'formation.prj', 'formation.pdc.ref']
    });
}

// Vue détaillée d'une évaluation
function createDetailView(evaluation, onClose) {
    return React.createElement('div', {
        className: "space-y-6"
    }, [
        // En-tête avec retour
        React.createElement('div', {
            key: 'header',
            className: "bg-white rounded-lg border border-gray-200 p-6"
        }, [
            React.createElement('button', {
                key: 'back',
                onClick: onClose,
                className: "inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
            }, [
                React.createElement('i', {
                    key: 'icon',
                    'data-lucide': 'arrow-left',
                    className: "w-4 h-4"
                }),
                "Retour à la liste"
            ]),
            React.createElement('h1', {
                key: 'title',
                className: "text-2xl font-bold text-gray-900 mb-2"
            }, `Évaluation de ${evaluation.stagiaire_prenom} ${evaluation.stagiaire_nom}`),
            React.createElement('div', {
                key: 'subtitle',
                className: "text-gray-600 space-y-1"
            }, [
                React.createElement('p', {
                    key: 'societe'
                }, `${evaluation.stagiaire_societe || 'N/A'} - ${evaluation.stagiaire_fonction || 'N/A'}`),
                React.createElement('p', {
                    key: 'date',
                    className: "text-sm"
                }, `Soumise le ${new Date(evaluation.submitted_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`)
            ])
        ]),

        // Informations formation
        React.createElement('div', {
            key: 'formation-info',
            className: "bg-white rounded-lg border border-gray-200 p-6"
        }, [
            React.createElement('h2', {
                key: 'title',
                className: "text-lg font-semibold text-gray-900 mb-4"
            }, "Informations formation"),
            React.createElement('div', {
                key: 'grid',
                className: "grid grid-cols-1 md:grid-cols-2 gap-4 text-sm"
            }, [
                createInfoItem("Formation", evaluation.formation?.pdc?.ref || 'N/A'),
                createInfoItem("PRJ", evaluation.formation?.prj || 'N/A'),
                createInfoItem("Formateur", evaluation.formation?.formateur ? `${evaluation.formation.formateur.prenom} ${evaluation.formation.formateur.nom}` : 'N/A'),
                createInfoItem("Lieu", evaluation.formation?.lieu_formation || 'N/A')
            ])
        ]),

        // Statistiques globales
        React.createElement('div', {
            key: 'stats',
            className: "grid grid-cols-1 md:grid-cols-5 gap-4"
        }, [
            createStatCard("Organisation", calculateAverage([
                evaluation.org_communication_objectifs,
                evaluation.org_duree_formation,
                evaluation.org_composition_groupe,
                evaluation.org_respect_engagements
            ])),
            createStatCard("Moyens", calculateAverage([
                evaluation.moyens_evaluation_locaux,
                evaluation.moyens_materiel_informatique,
                evaluation.moyens_formation_distance,
                evaluation.moyens_support_cours
            ])),
            createStatCard("Pédagogie", calculateAverage([
                evaluation.peda_niveau_difficulte,
                evaluation.peda_rythme_progression,
                evaluation.peda_qualite_contenu_theorique,
                evaluation.peda_qualite_contenu_pratique,
                evaluation.peda_connaissance_formateur,
                evaluation.peda_approche_pedagogique,
                evaluation.peda_ecoute_disponibilite,
                evaluation.peda_animation_formateur
            ])),
            createStatCard("Satisfaction", calculateAverage([
                evaluation.satisf_repondu_attentes,
                evaluation.satisf_atteint_objectifs,
                evaluation.satisf_adequation_metier,
                evaluation.satisf_recommandation,
                evaluation.satisf_niveau_global
            ])),
            createStatCard("Global", evaluation.satisf_niveau_global, true)
        ]),

        // Détails des sections
        React.createElement('div', {
            key: 'details',
            className: "bg-white rounded-lg border border-gray-200 p-6"
        }, [
            React.createElement('h2', {
                key: 'title',
                className: "text-lg font-semibold text-gray-900 mb-6"
            }, "Détails de l'évaluation"),

            React.createElement('div', {
                key: 'sections',
                className: "space-y-8"
            }, [
                createDetailSection("Organisation", [
                    { label: "Communication des objectifs", value: evaluation.org_communication_objectifs },
                    { label: "Durée de la formation", value: evaluation.org_duree_formation },
                    { label: "Composition du groupe", value: evaluation.org_composition_groupe },
                    { label: "Respect des engagements", value: evaluation.org_respect_engagements }
                ], evaluation.org_commentaires),

                createDetailSection("Moyens", [
                    { label: "Lieu de formation", value: evaluation.moyens_lieu_deroulement, isText: true },
                    { label: "Évaluation des locaux", value: evaluation.moyens_evaluation_locaux },
                    { label: "Matériel informatique", value: evaluation.moyens_materiel_informatique },
                    { label: "Formation à distance", value: evaluation.moyens_formation_distance },
                    { label: "Support de cours", value: evaluation.moyens_support_cours },
                    evaluation.moyens_lieu_repas && { label: "Lieu repas", value: evaluation.moyens_lieu_repas, isText: true },
                    evaluation.moyens_restauration && { label: "Restauration", value: evaluation.moyens_restauration }
                ].filter(Boolean)),

                createDetailSection("Pédagogie", [
                    { label: "Niveau de difficulté", value: evaluation.peda_niveau_difficulte },
                    { label: "Rythme de progression", value: evaluation.peda_rythme_progression },
                    { label: "Qualité contenu théorique", value: evaluation.peda_qualite_contenu_theorique },
                    { label: "Qualité contenu pratique", value: evaluation.peda_qualite_contenu_pratique },
                    { label: "Connaissance formateur", value: evaluation.peda_connaissance_formateur },
                    { label: "Approche pédagogique", value: evaluation.peda_approche_pedagogique },
                    { label: "Écoute et disponibilité", value: evaluation.peda_ecoute_disponibilite },
                    { label: "Animation", value: evaluation.peda_animation_formateur }
                ], evaluation.peda_commentaires),

                createDetailSection("Satisfaction", [
                    { label: "Répondu aux attentes", value: evaluation.satisf_repondu_attentes },
                    { label: "Atteint les objectifs", value: evaluation.satisf_atteint_objectifs },
                    { label: "Adéquation métier", value: evaluation.satisf_adequation_metier },
                    { label: "Recommandation", value: evaluation.satisf_recommandation },
                    { label: "Niveau global", value: evaluation.satisf_niveau_global }
                ], evaluation.satisf_commentaires),

                // Section Qualiopi
                createQualiopiSection(evaluation)
            ].filter(Boolean))
        ])
    ]);
}

// Helpers
function createInfoItem(label, value) {
    return React.createElement('div', {
        key: label
    }, [
        React.createElement('span', {
            key: 'label',
            className: "font-medium text-gray-700"
        }, label + ": "),
        React.createElement('span', {
            key: 'value',
            className: "text-gray-900"
        }, value)
    ]);
}

function createStatCard(title, value, isMain = false) {
    const bgColor = value >= 8 ? 'bg-green-50 border-green-200' :
                     value >= 6 ? 'bg-yellow-50 border-yellow-200' :
                     'bg-red-50 border-red-200';
    const textColor = value >= 8 ? 'text-green-900' :
                       value >= 6 ? 'text-yellow-900' :
                       'text-red-900';

    return React.createElement('div', {
        key: title,
        className: `rounded-lg border p-4 ${bgColor}`
    }, [
        React.createElement('div', {
            key: 'title',
            className: `text-sm font-medium ${textColor} mb-2`
        }, title),
        React.createElement('div', {
            key: 'value',
            className: `text-2xl font-bold ${textColor}`
        }, value ? value.toFixed(1) : '-'),
        React.createElement('div', {
            key: 'max',
            className: `text-xs ${textColor} opacity-75`
        }, "/ 10")
    ]);
}

function createDetailSection(title, items, comments) {
    return React.createElement('div', {
        key: title
    }, [
        React.createElement('h3', {
            key: 'title',
            className: "font-medium text-gray-900 mb-3"
        }, title),
        React.createElement('div', {
            key: 'items',
            className: "grid grid-cols-1 md:grid-cols-2 gap-3 mb-3"
        }, items.map(item =>
            React.createElement('div', {
                key: item.label,
                className: "flex justify-between items-center text-sm"
            }, [
                React.createElement('span', {
                    key: 'label',
                    className: "text-gray-700"
                }, item.label),
                React.createElement('span', {
                    key: 'value',
                    className: "font-medium text-gray-900"
                }, item.isText ? item.value : `${item.value || '-'} / 10`)
            ])
        )),
        comments && React.createElement('div', {
            key: 'comments',
            className: "mt-3 p-3 bg-gray-50 rounded-md"
        }, [
            React.createElement('span', {
                key: 'label',
                className: "text-xs font-medium text-gray-500 uppercase"
            }, "Commentaires"),
            React.createElement('p', {
                key: 'text',
                className: "text-sm text-gray-700 mt-1"
            }, comments)
        ])
    ]);
}

function createQualiopiSection(evaluation) {
    const themes = evaluation.qualiopi_themes || {};
    const themeKeys = Object.keys(themes);

    if (themeKeys.length === 0) return null;

    return React.createElement('div', {
        key: 'qualiopi'
    }, [
        React.createElement('h3', {
            key: 'title',
            className: "font-medium text-gray-900 mb-3"
        }, "Auto-Évaluation Qualiopi"),

        // Encadré informatif
        React.createElement('div', {
            key: 'info',
            className: "bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-sm text-blue-900"
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
                key: 'p3'
            }, "Auto-évaluation du stagiaire de ses connaissances à l'entrée et à la sortie de la formation.")
        ]),

        // Graphique radar
        React.createElement(window.RadarChart, {
            key: 'radar',
            themes: themes
        }),

        // Thèmes
        React.createElement('div', {
            key: 'themes',
            className: "grid grid-cols-1 md:grid-cols-2 gap-4"
        }, themeKeys.map(themeKey => {
            const theme = themes[themeKey];
            // Extraire le numéro du point (theme_1 -> 1, theme_12 -> 12)
            const pointNumber = themeKey.replace('theme_', '');
            const progression = (theme.apres || 0) - (theme.avant || 0);
            const progressionColor = progression > 0 ? 'text-green-600' : progression < 0 ? 'text-red-600' : 'text-gray-600';
            const progressionSign = progression > 0 ? '+' : '';

            return React.createElement('div', {
                key: themeKey,
                className: "border border-gray-200 rounded-lg p-4 bg-white"
            }, [
                React.createElement('h4', {
                    key: 'theme-title',
                    className: "text-sm font-medium text-gray-900 mb-3"
                }, `${pointNumber} - ${theme.titre || themeKey}`),

                React.createElement('div', {
                    key: 'scores',
                    className: "space-y-2 mb-2"
                }, [
                    React.createElement('div', {
                        key: 'avant',
                        className: "flex justify-between items-center text-sm"
                    }, [
                        React.createElement('span', {
                            key: 'label',
                            className: "text-gray-700"
                        }, "Entrée en formation"),
                        React.createElement('span', {
                            key: 'value',
                            className: "font-medium text-gray-900"
                        }, `${theme.avant || 0} / 5`)
                    ]),

                    React.createElement('div', {
                        key: 'apres',
                        className: "flex justify-between items-center text-sm"
                    }, [
                        React.createElement('span', {
                            key: 'label',
                            className: "text-gray-700"
                        }, "Sortie de formation"),
                        React.createElement('span', {
                            key: 'value',
                            className: "font-medium text-gray-900"
                        }, `${theme.apres || 0} / 5`)
                    ])
                ]),

                React.createElement('div', {
                    key: 'progression',
                    className: `mt-2 pt-2 border-t border-gray-200 flex justify-between items-center text-sm ${progressionColor}`
                }, [
                    React.createElement('span', {
                        key: 'label',
                        className: "font-medium"
                    }, "Progression"),
                    React.createElement('span', {
                        key: 'value',
                        className: "font-bold"
                    }, `${progressionSign}${progression}`)
                ])
            ]);
        }))
    ]);
}

function calculateAverage(values) {
    const validValues = values.filter(v => v !== null && v !== undefined);
    if (validValues.length === 0) return null;
    return validValues.reduce((sum, v) => sum + v, 0) / validValues.length;
}

// Export global
window.EvaluationListPage = EvaluationListPage;
