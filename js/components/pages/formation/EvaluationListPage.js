// Page de liste des évaluations
function EvaluationListPage() {
    const { useState, useEffect } = React;
    const { evaluations, loading, deleteEvaluation, updateFormateurQualiopi, getEvaluationById } = window.useEvaluation();
    const { loadTemplateByType, loadSectionsByType } = window.useTemplates();
    const auth = window.useAuth();

    const [selectedEval, setSelectedEval] = useState(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

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

    const handleExportQualiopi = async (evaluation) => {
        if (!evaluation || !window.generateQualiopiPDF) {
            alert('Générateur PDF Qualiopi non disponible');
            return;
        }

        try {
            setIsGeneratingPdf(true);

            // Charger le template Qualiopi
            const template = await loadTemplateByType('qualiopi');

            // Charger les sections configurées
            const sections = await loadSectionsByType('qualiopi');

            // Convertir le template en paramètres
            const pdfParams = template ? convertTemplateToParams(template, sections) : {};

            // Générer le PDF Qualiopi
            const pdfBlob = await window.generateQualiopiPDF(evaluation, pdfParams);

            // Créer un nom de fichier descriptif
            const fileName = `Qualiopi_${evaluation.stagiaire_nom}_${evaluation.stagiaire_prenom}_${evaluation.formation?.prj || 'Formation'}.pdf`;

            // Télécharger le fichier
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

        } catch (err) {
            console.error('Erreur lors de la génération du PDF Qualiopi:', err);
            alert('Erreur lors de la génération du PDF Qualiopi: ' + err.message);
        } finally {
            setIsGeneratingPdf(false);
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
            key: 'formation_pdc',
            label: 'Formation',
            sortable: true,
            render: (value, row) => row.formation?.pdc?.ref || (row.formation ? 'N/A' : 'Formation supprimée')
        },
        {
            key: 'formation_prj',
            label: 'PRJ',
            sortable: true,
            render: (value, row) => row.formation?.prj || (row.formation ? 'N/A' : '-')
        },
        {
            key: 'formation_formateur',
            label: 'Formateur',
            sortable: true,
            render: (value, row) => row.formation?.formateur ? `${row.formation.formateur.prenom || ''} ${row.formation.formateur.nom || ''}`.trim() : (row.formation ? 'N/A' : '-')
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
                }, '/ 5')
            ])
        },
        {
            key: 'statut',
            label: 'Statut',
            sortable: true,
            render: (value) => {
                const isTraitee = value === 'Traitée';
                return React.createElement('span', {
                    className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isTraitee
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                    }`
                }, value || 'À traiter');
            }
        }
    ];

    // Fonction pour rafraîchir l'évaluation sélectionnée
    const handleRefreshEvaluation = async (evaluationId) => {
        try {
            const refreshedEval = await getEvaluationById(evaluationId);
            setSelectedEval(refreshedEval);
        } catch (err) {
            console.error('Erreur lors du rafraîchissement:', err);
        }
    };

    // Si vue détaillée
    if (selectedEval) {
        return createDetailView(selectedEval, handleCloseDetail, auth, updateFormateurQualiopi, handleRefreshEvaluation, handleExportQualiopi, isGeneratingPdf, loadTemplateByType, loadSectionsByType);
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
function createDetailView(evaluation, onClose, auth, updateFormateurQualiopi, onRefresh, onExportQualiopi, isGeneratingPdf, loadTemplateByType, loadSectionsByType) {
    return React.createElement('div', {
        className: "space-y-6"
    }, [
        // En-tête avec retour
        React.createElement('div', {
            key: 'header',
            className: "bg-white rounded-lg border border-gray-200 p-6"
        }, [
            React.createElement('div', {
                key: 'top-row',
                className: "flex items-center justify-between mb-4"
            }, [
                React.createElement('button', {
                    key: 'back',
                    onClick: onClose,
                    className: "inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                }, [
                    React.createElement('i', {
                        key: 'icon',
                        'data-lucide': 'arrow-left',
                        className: "w-4 h-4"
                    }),
                    "Retour à la liste"
                ]),
                // Boutons d'action
                React.createElement('div', {
                    key: 'actions',
                    className: "flex items-center gap-2"
                }, [
                    // Bouton d'export
                    React.createElement('button', {
                        key: 'export-qualiopi',
                        onClick: () => onExportQualiopi(evaluation),
                        disabled: isGeneratingPdf,
                        className: `inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                            isGeneratingPdf
                                ? 'bg-green-400 text-white cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-700'
                        }`
                    }, [
                        React.createElement('i', {
                            key: 'icon',
                            'data-lucide': isGeneratingPdf ? 'loader-2' : 'award',
                            className: `w-4 h-4 ${isGeneratingPdf ? 'animate-spin' : ''}`
                        }),
                        isGeneratingPdf ? 'Génération...' : 'PDF Qualiopi'
                    ])
                ].filter(Boolean))
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
        evaluation.formation && React.createElement('div', {
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
                createInfoItem("Lieu", evaluation.formation?.lieu_projet || 'N/A')
            ])
        ]),

        // Message si formation supprimée
        !evaluation.formation && React.createElement('div', {
            key: 'formation-deleted',
            className: "bg-yellow-50 rounded-lg border border-yellow-200 p-6"
        }, [
            React.createElement('div', {
                key: 'icon-title',
                className: "flex items-center gap-2 mb-2"
            }, [
                React.createElement('i', {
                    key: 'icon',
                    'data-lucide': 'alert-triangle',
                    className: "w-5 h-5 text-yellow-600"
                }),
                React.createElement('h2', {
                    key: 'title',
                    className: "text-lg font-semibold text-yellow-900"
                }, "Formation supprimée")
            ]),
            React.createElement('p', {
                key: 'message',
                className: "text-sm text-yellow-800"
            }, "La formation associée à cette évaluation a été supprimée du système.")
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
                React.createElement(QualiopiSection, {
                    key: 'qualiopi',
                    evaluation: evaluation,
                    auth: auth,
                    updateFormateurQualiopi: updateFormateurQualiopi,
                    onRefresh: onRefresh,
                    loadTemplateByType: loadTemplateByType,
                    loadSectionsByType: loadSectionsByType
                })
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
    const bgColor = value >= 4 ? 'bg-green-50 border-green-200' :
                     value >= 3 ? 'bg-yellow-50 border-yellow-200' :
                     'bg-red-50 border-red-200';
    const textColor = value >= 4 ? 'text-green-900' :
                       value >= 3 ? 'text-yellow-900' :
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
        }, "/ 5")
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
                }, item.isText ? item.value : `${item.value || '-'} / 5`)
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

// Composant React pour la section Qualiopi
function QualiopiSection({ evaluation, auth, updateFormateurQualiopi, onRefresh, loadTemplateByType, loadSectionsByType }) {
    const { useState } = React;
    const supabase = window.supabaseConfig.client;
    const themes = evaluation.qualiopi_themes || {};
    const themeKeys = Object.keys(themes);

    if (themeKeys.length === 0) return null;

    // Vérifier si l'utilisateur connecté est le formateur de cette formation
    const isFormateur = evaluation.formation && auth.user?.id === evaluation.formation?.formateur?.id;
    const isTraitee = evaluation.statut === 'Traitée';

    // État pour les notes du formateur (initialisé avec les valeurs existantes ou vide)
    const [formateurThemes, setFormateurThemes] = useState(() => {
        if (evaluation.qualiopi_formateur_themes) {
            return evaluation.qualiopi_formateur_themes;
        }
        // Initialiser avec la structure des thèmes stagiaire
        const initThemes = {};
        themeKeys.forEach(key => {
            initThemes[key] = {
                titre: themes[key].titre,
                note: null
            };
        });
        return initThemes;
    });
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);

    const handleFormateurNoteChange = (themeKey, note) => {
        setFormateurThemes(prev => ({
            ...prev,
            [themeKey]: {
                ...prev[themeKey],
                note: note
            }
        }));
    };

    const handleSaveFormateurEvaluation = async () => {
        try {
            setIsSaving(true);
            setSaveError(null);

            // Vérifier que toutes les notes sont remplies
            const allFilled = themeKeys.every(key => formateurThemes[key]?.note !== null);
            if (!allFilled) {
                setSaveError('Veuillez remplir toutes les évaluations avant de sauvegarder');
                return;
            }

            // Vérifier que la formation existe avant de sauvegarder
            if (!evaluation.formation?.formateur?.id) {
                throw new Error('Formation supprimée - impossible de sauvegarder l\'évaluation formateur');
            }

            // 1. Sauvegarder l'évaluation formateur (statut passe à "Traitée")
            await updateFormateurQualiopi(
                evaluation.id,
                formateurThemes,
                auth.user.id,
                evaluation.formation.formateur.id
            );

            console.log('✅ Évaluation formateur sauvegardée');

            // 2. Rafraîchir l'évaluation pour avoir les données complètes
            if (onRefresh) {
                await onRefresh(evaluation.id);
            }

            // 3. Générer automatiquement le PDF Qualiopi
            if (!window.generateQualiopiPDF) {
                throw new Error('Générateur PDF non disponible');
            }

            console.log('📄 Génération automatique du PDF Qualiopi...');

            // Charger le template
            const template = await loadTemplateByType('qualiopi');
            const sections = await loadSectionsByType('qualiopi');
            const pdfParams = template ? convertTemplateToParams(template, sections) : {};

            // Générer le PDF avec les données mises à jour (incluant l'évaluation formateur)
            const updatedEval = { ...evaluation, qualiopi_formateur_themes: formateurThemes, statut: 'Traitée' };
            const pdfBlob = await window.generateQualiopiPDF(updatedEval, pdfParams);

            console.log('✅ PDF généré');

            // 4. Uploader le PDF vers Supabase Storage
            const fileName = `qualiopi_${evaluation.stagiaire_nom}_${evaluation.stagiaire_prenom}_${evaluation.formation.prj}_${Date.now()}.pdf`;
            const filePath = `qualiopi/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('pdfs')
                .upload(filePath, pdfBlob, {
                    contentType: 'application/pdf',
                    upsert: false
                });

            if (uploadError) {
                throw new Error(`Erreur upload PDF: ${uploadError.message}`);
            }

            // 5. Récupérer l'URL publique
            const { data: urlData } = supabase.storage
                .from('pdfs')
                .getPublicUrl(filePath);

            console.log('✅ PDF uploadé:', urlData.publicUrl);

            // 6. Mettre à jour l'évaluation avec l'URL du PDF
            const { error: updateError } = await supabase
                .from('evaluation')
                .update({ pdf_qualiopi_url: urlData.publicUrl })
                .eq('id', evaluation.id);

            if (updateError) {
                throw new Error(`Erreur mise à jour PDF: ${updateError.message}`);
            }

            console.log('✅ PDF enregistré');

            // 7. Appeler l'Edge Function pour envoyer l'email (comme send-formation-email)
            const { data: emailData, error: emailError } = await supabase.functions.invoke(
                'send-evaluation-email',
                { body: { evaluationId: evaluation.id } }
            );

            if (emailError) {
                console.warn('⚠️ Erreur envoi email:', emailError);
                throw new Error(`Erreur envoi email: ${emailError.message}`);
            }

            console.log('✅ Email envoyé:', emailData);

            alert('Évaluation formateur enregistrée avec succès ! Un email a été envoyé au stagiaire avec le PDF Qualiopi.');
        } catch (err) {
            console.error('Erreur lors de la sauvegarde:', err);
            setSaveError(err.message || 'Erreur lors de la sauvegarde');
        } finally {
            setIsSaving(false);
        }
    };

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

        // Graphique radar (avec 3 lignes si formateur a complété)
        React.createElement(window.RadarChart, {
            key: 'radar',
            themes: themes,
            formateurThemes: evaluation.qualiopi_formateur_themes
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
                ]),

                // Section formateur éditable (si formateur ET non traitée)
                isFormateur && !isTraitee && React.createElement('div', {
                    key: 'formateur-input',
                    className: "mt-3 pt-3 border-t border-blue-200"
                }, [
                    React.createElement('label', {
                        key: 'label',
                        className: "block text-sm font-medium text-blue-900 mb-2"
                    }, "Évaluation formateur"),
                    React.createElement(window.QualiopiRating, {
                        key: 'rating',
                        value: formateurThemes[themeKey]?.note,
                        onChange: (value) => handleFormateurNoteChange(themeKey, value),
                        size: 'sm'
                    })
                ]),

                // Section formateur lecture seule (si traitée)
                isTraitee && evaluation.qualiopi_formateur_themes?.[themeKey] && React.createElement('div', {
                    key: 'formateur-readonly',
                    className: "mt-2 pt-2 border-t border-gray-200 flex justify-between items-center text-sm"
                }, [
                    React.createElement('span', {
                        key: 'label',
                        className: "text-gray-700"
                    }, "Évaluation formateur"),
                    React.createElement('span', {
                        key: 'value',
                        className: "font-medium text-green-700"
                    }, `${evaluation.qualiopi_formateur_themes[themeKey]?.note || 0} / 5`)
                ])
            ]);
        })),

        // Message d'erreur global (si formateur en mode édition)
        isFormateur && !isTraitee && saveError && React.createElement('div', {
            key: 'error-global',
            className: "mt-4 bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800"
        }, saveError),

        // Bouton sauvegarder global (si formateur en mode édition)
        isFormateur && !isTraitee && React.createElement('div', {
            key: 'save-button',
            className: "mt-6 flex justify-end"
        }, React.createElement('button', {
            onClick: handleSaveFormateurEvaluation,
            disabled: isSaving,
            className: `inline-flex items-center gap-2 px-8 py-3 text-base font-medium text-white rounded-lg transition-colors ${
                isSaving
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
            }`
        }, [
            React.createElement('i', {
                key: 'icon',
                'data-lucide': isSaving ? 'loader-2' : 'save',
                className: `w-5 h-5 ${isSaving ? 'animate-spin' : ''}`
            }),
            isSaving ? "Enregistrement..." : "Enregistrer l'évaluation formateur"
        ])),

        // Message si pas formateur
        !isFormateur && !isTraitee && React.createElement('div', {
            key: 'not-formateur-message',
            className: "mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4 text-center"
        }, React.createElement('p', {
            className: "text-sm text-gray-600"
        }, "Seul le formateur de cette formation peut compléter l'évaluation Qualiopi."))
    ]);
}

function calculateAverage(values) {
    const validValues = values.filter(v => v !== null && v !== undefined);
    if (validValues.length === 0) return null;
    return validValues.reduce((sum, v) => sum + v, 0) / validValues.length;
}

// Convertir le template en paramètres pour le générateur PDF
function convertTemplateToParams(template, layoutSections = null) {
    if (!template) return {};

    return {
        titleSize: template.styles?.titleSize || 28,
        subtitleSize: template.styles?.subtitleSize || 16,
        textSize: template.styles?.textSize || 8,
        labelSize: template.styles?.labelSize || 8,
        descriptionSize: template.styles?.descriptionSize || 7,
        headerSize: template.styles?.headerSize || 24,
        footerSize: template.styles?.footerSize || 9,
        articleSize: template.styles?.articleSize || 11,
        primaryColor: template.colors?.primary || '#133e5e',
        secondaryColor: template.colors?.secondary || '#2563eb',
        grayColor: template.colors?.text || '#374151',
        lightGrayColor: template.colors?.lightText || '#6b7280',
        headerTextColor: template.colors?.headerText || '#1f2937',
        backgroundColor: template.colors?.background || '#f9fafb',
        borderColor: template.colors?.border || '#e5e7eb',
        infoBackground: template.colors?.infoBackground || '#f3f4f6',
        tableHeader: template.colors?.tableHeader || '#f3f4f6',
        marginTop: template.spacing?.marginTop || 20,
        marginSide: template.spacing?.marginSide || 20,
        marginBottom: template.spacing?.marginBottom || 30,
        headerHeight: template.spacing?.headerHeight || 35,
        footerHeight: template.spacing?.footerHeight || 40,
        sectionSpacing: template.spacing?.sectionSpacing || 15,
        lineSpacing: template.spacing?.lineSpacing || 5,
        columnSpacing: template.spacing?.columnSpacing || 5,
        blockPadding: template.spacing?.blockPadding || 10,
        tableSpacing: template.spacing?.tableSpacing || 6,
        pageFormat: template.layout?.pageFormat || 'a4',
        orientation: template.layout?.orientation || 'portrait',
        columns: template.layout?.columns || 3,
        showHeader: template.layout?.showHeader !== false,
        showFooter: template.layout?.showFooter !== false,
        showLogos: template.layout?.showLogos !== false,
        backgroundBlocks: template.layout?.backgroundBlocks !== false,
        companyName: template.branding?.companyName || 'AUTODESK',
        partnerText: template.branding?.partnerText || 'Platinum Partner',
        brandName: template.branding?.brandName || 'ARKANCE',
        footerAddress: template.branding?.footerAddress || 'LE VAL SAINT QUENTIN - Bâtiment C - 2, rue René Caudron - CS 30764 - 78961 Voisins-le-Bretonneux Cedex',
        footerContact: template.branding?.footerContact || 'www.arkance-systems.fr - formation@arkance-systems.com - Tél. : 01 39 44 18 18',
        sections: layoutSections || [],
        headerLogoLeft: template.header_image,
        headerLogoRight: null,
        footerLogoLeft: template.footer_image,
        footerLogoRight: null
    };
}

// Export global
window.EvaluationListPage = EvaluationListPage;
