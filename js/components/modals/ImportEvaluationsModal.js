// Modal d'import d'évaluations depuis CSV
const ImportEvaluationsModal = ({ show, onClose }) => {
    const { useState, useEffect } = React;
    const supabase = window.supabaseConfig.client;

    // États
    const [step, setStep] = useState(1); // Étape actuelle (1-5)
    const [file, setFile] = useState(null);
    const [fileName, setFileName] = useState('');
    const [csvData, setCsvData] = useState([]);
    const [duplicates, setDuplicates] = useState([]);
    const [selectedDuplicates, setSelectedDuplicates] = useState({}); // {key: rowIndex}
    const [analysis, setAnalysis] = useState(null);
    const [importLimit, setImportLimit] = useState(null); // null = tout, 10, 50
    const [analyzing, setAnalyzing] = useState(false);
    const [importing, setImporting] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0, message: '' });
    const [results, setResults] = useState(null);
    const [error, setError] = useState('');
    const [allCollaborateurs, setAllCollaborateurs] = useState([]); // Liste complète des collaborateurs
    const [userMappings, setUserMappings] = useState({}); // {email: userId} mappings manuels

    // Réinitialiser lors de l'ouverture/fermeture
    useEffect(() => {
        if (show) {
            resetModal();
            loadCollaborateurs();
        }
    }, [show]);

    // Rafraîchir les icônes Lucide
    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, [step, duplicates, analysis, importing, results]);

    const resetModal = () => {
        setStep(1);
        setFile(null);
        setFileName('');
        setCsvData([]);
        setDuplicates([]);
        setSelectedDuplicates({});
        setAnalysis(null);
        setImportLimit(null);
        setAnalyzing(false);
        setImporting(false);
        setProgress({ current: 0, total: 0, message: '' });
        setResults(null);
        setError('');
        setUserMappings({});
    };

    // Charger la liste des collaborateurs
    const loadCollaborateurs = async () => {
        try {
            const { data, error } = await supabase
                .from('user_profile')
                .select('id, prenom, nom, email')
                .order('nom', { ascending: true });

            if (error) throw error;
            setAllCollaborateurs(data || []);
        } catch (err) {
            console.error('Erreur chargement collaborateurs:', err);
        }
    };

    // Étape 1: Sélection du fichier
    const handleFileSelect = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        // Vérifier l'extension
        if (!selectedFile.name.endsWith('.csv')) {
            setError('Seuls les fichiers CSV sont acceptés');
            return;
        }

        setFile(selectedFile);
        setFileName(selectedFile.name);
        setError('');

        // Lire et parser le fichier
        try {
            const content = await selectedFile.text();

            const rows = window.csvEvaluationParser.parseCSV(content);
            setCsvData(rows);

            // Détecter les doublons
            const { duplicates: foundDuplicates, uniqueRows } = window.csvEvaluationParser.detectDuplicates(rows);

            if (foundDuplicates.length > 0) {
                setDuplicates(foundDuplicates);
                setStep(2); // Aller à l'étape de résolution des doublons
            } else {
                // Pas de doublons, analyser directement
                await analyzeData(rows);
            }
        } catch (err) {
            setError(`Erreur de lecture du fichier: ${err.message}`);
        }
    };

    // Étape 2: Résolution des doublons
    const handleDuplicateSelection = (key, rowIndex) => {
        setSelectedDuplicates(prev => ({
            ...prev,
            [key]: rowIndex
        }));
    };

    const canContinueFromDuplicates = () => {
        return duplicates.every(dup => selectedDuplicates[dup.key] !== undefined);
    };

    const handleResolveDuplicates = async () => {
        setAnalyzing(true);
        try {
            // Filtrer les lignes en gardant uniquement les lignes sélectionnées
            const filteredRows = csvData.filter((row, index) => {
                const parsed = window.csvEvaluationParser.parseEvaluationRow(row);
                const key = `${parsed.prj}_${parsed.stagiaireEmail}`;

                // Si ce PRJ+email est un doublon
                const duplicate = duplicates.find(d => d.key === key);
                if (duplicate) {
                    // Garder uniquement si c'est la ligne sélectionnée
                    return selectedDuplicates[key] === (index + 2);
                }

                // Garder les non-doublons
                return true;
            });

            setCsvData(filteredRows);
            await analyzeData(filteredRows);
        } finally {
            setAnalyzing(false);
        }
    };

    // Étape 3: Analyse des données
    const analyzeData = async (rows) => {
        setError('');
        setProgress({ current: 0, total: 0, message: 'Analyse des données...' });
        setAnalyzing(true);

        try {
            const analysisResult = await window.evaluationImportService.analyzeEvaluationImport(supabase, rows);
            setAnalysis(analysisResult);
            setStep(3);
        } catch (err) {
            setError(`Erreur d'analyse: ${err.message}`);
        } finally {
            setAnalyzing(false);
        }
    };

    // Étape 4: Import
    const handleStartImport = async () => {
        setStep(4);
        setImporting(true);
        setError('');

        try {
            const onProgress = (parsed, current, total) => {
                setProgress({
                    current,
                    total,
                    message: `Import de l'évaluation PRJ${parsed.prj} - ${parsed.stagiairePrenom} ${parsed.stagiaireNom} (${current}/${total})...`
                });
            };

            const importResults = await window.evaluationImportService.importEvaluations(
                supabase,
                csvData,
                onProgress,
                importLimit,
                userMappings
            );
            setResults(importResults);
            setStep(5);
        } catch (err) {
            setError(`Erreur d'import: ${err.message}`);
        } finally {
            setImporting(false);
        }
    };

    // Rendu des étapes
    const renderStep1 = () => (
        React.createElement('div', { className: "space-y-4" }, [
            React.createElement('h3', {
                key: 'title',
                className: "text-lg font-semibold text-gray-900"
            }, "Étape 1 : Sélection du fichier"),

            React.createElement('p', {
                key: 'desc',
                className: "text-sm text-gray-600"
            }, "Sélectionnez un fichier CSV contenant les évaluations de formation à importer."),

            React.createElement('div', {
                key: 'file-input',
                className: "border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors"
            }, [
                React.createElement('input', {
                    key: 'input',
                    type: 'file',
                    accept: '.csv',
                    onChange: handleFileSelect,
                    className: "hidden",
                    id: 'csv-eval-file-input'
                }),
                React.createElement('label', {
                    key: 'label',
                    htmlFor: 'csv-eval-file-input',
                    className: "cursor-pointer"
                }, [
                    React.createElement('i', {
                        key: 'icon',
                        'data-lucide': 'upload',
                        className: "w-12 h-12 mx-auto text-gray-400 mb-3"
                    }),
                    React.createElement('p', {
                        key: 'text',
                        className: "text-sm text-gray-600"
                    }, fileName || "Cliquez pour sélectionner un fichier CSV")
                ])
            ])
        ])
    );

    const renderStep2 = () => (
        React.createElement('div', { className: "space-y-4" }, [
            React.createElement('h3', {
                key: 'title',
                className: "text-lg font-semibold text-gray-900 mb-2"
            }, "Étape 2 : Résolution des doublons"),

            React.createElement('p', {
                key: 'desc',
                className: "text-sm text-gray-600 mb-4"
            }, `${duplicates.length} doublon${duplicates.length > 1 ? 's' : ''} détecté${duplicates.length > 1 ? 's' : ''} (même stagiaire + même PRJ). Veuillez sélectionner la ligne à conserver pour chaque doublon.`),

            React.createElement('div', {
                key: 'duplicates',
                className: "space-y-4 max-h-96 overflow-y-auto"
            }, duplicates.map((dup, idx) => {
                return React.createElement('div', {
                    key: idx,
                    className: "border border-gray-300 rounded-lg p-4 bg-gray-50"
                }, [
                    React.createElement('h4', {
                        key: 'title',
                        className: "font-medium text-gray-900 mb-3"
                    }, `PRJ${dup.prj} - ${dup.stagiairePrenom} ${dup.stagiaireNom}`),

                    React.createElement('div', {
                        key: 'options',
                        className: "space-y-3"
                    }, dup.rows.map((row, rowIdx) => {
                        const isSelected = selectedDuplicates[dup.key] === row.index;
                        const parsed = window.csvEvaluationParser.parseEvaluationRow(row.data);

                        // Compter les commentaires présents
                        const commentCount = [
                            parsed.orgCommentaires,
                            parsed.moyensCommentaires,
                            parsed.pedaCommentaires,
                            parsed.satisfCommentaires
                        ].filter(c => c && c.trim().length > 0).length;

                        return React.createElement('label', {
                            key: rowIdx,
                            className: `flex gap-3 p-4 border rounded-md cursor-pointer transition-colors ${
                                isSelected
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`
                        }, [
                            React.createElement('input', {
                                key: 'radio',
                                type: 'radio',
                                name: `duplicate-${idx}`,
                                checked: isSelected,
                                onChange: () => handleDuplicateSelection(dup.key, row.index),
                                className: "text-blue-600 mt-1"
                            }),
                            React.createElement('div', {
                                key: 'content',
                                className: "flex-1"
                            }, [
                                React.createElement('div', {
                                    key: 'header',
                                    className: "font-medium text-gray-900 mb-2"
                                }, `Ligne ${row.index}`),
                                React.createElement('div', {
                                    key: 'details',
                                    className: "space-y-1 text-sm text-gray-700"
                                }, [
                                    React.createElement('div', {
                                        key: 'date',
                                        className: "flex items-center gap-2"
                                    }, [
                                        React.createElement('i', {
                                            key: 'icon',
                                            'data-lucide': 'calendar',
                                            className: "w-4 h-4 text-gray-500"
                                        }),
                                        React.createElement('span', { key: 'text' },
                                            `Date de saisie: ${parsed.dateSaisie ? parsed.dateSaisie.toLocaleDateString('fr-FR') : 'Non renseignée'}`)
                                    ]),
                                    React.createElement('div', {
                                        key: 'formateur',
                                        className: "flex items-center gap-2"
                                    }, [
                                        React.createElement('i', {
                                            key: 'icon',
                                            'data-lucide': 'user',
                                            className: "w-4 h-4 text-gray-500"
                                        }),
                                        React.createElement('span', { key: 'text' },
                                            `Formateur: ${parsed.formateurFullName || 'Non renseigné'}`)
                                    ]),
                                    React.createElement('div', {
                                        key: 'satisfaction',
                                        className: "flex items-center gap-2"
                                    }, [
                                        React.createElement('i', {
                                            key: 'icon',
                                            'data-lucide': 'star',
                                            className: "w-4 h-4 text-gray-500"
                                        }),
                                        React.createElement('span', { key: 'text' },
                                            `Satisfaction globale: ${parsed.satisfNiveauGlobal || 'N/A'}/5`)
                                    ]),
                                    React.createElement('div', {
                                        key: 'attentes',
                                        className: "flex items-center gap-2"
                                    }, [
                                        React.createElement('i', {
                                            key: 'icon',
                                            'data-lucide': 'target',
                                            className: "w-4 h-4 text-gray-500"
                                        }),
                                        React.createElement('span', { key: 'text' },
                                            `Répondu aux attentes: ${parsed.satisfReponduAttentes || 'N/A'}/5 • Atteint objectifs: ${parsed.satisfAtteintObjectifs || 'N/A'}/5`)
                                    ]),
                                    React.createElement('div', {
                                        key: 'comments',
                                        className: "flex items-center gap-2"
                                    }, [
                                        React.createElement('i', {
                                            key: 'icon',
                                            'data-lucide': 'message-circle',
                                            className: "w-4 h-4 text-gray-500"
                                        }),
                                        React.createElement('span', { key: 'text' },
                                            `Commentaires: ${commentCount > 0 ? `Oui (${commentCount} section${commentCount > 1 ? 's' : ''})` : 'Aucun'}`)
                                    ])
                                ])
                            ])
                        ]);
                    }))
                ]);
            })),

            React.createElement('div', {
                key: 'actions',
                className: "flex justify-end gap-2 mt-6"
            }, [
                React.createElement('button', {
                    key: 'cancel',
                    onClick: resetModal,
                    className: "px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                }, "Annuler"),
                React.createElement('button', {
                    key: 'continue',
                    onClick: handleResolveDuplicates,
                    disabled: !canContinueFromDuplicates() || analyzing,
                    className: `px-4 py-2 text-sm text-white rounded-lg transition-colors ${
                        !canContinueFromDuplicates() || analyzing
                            ? 'bg-blue-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                    }`
                }, analyzing ? 'Analyse...' : 'Continuer')
            ])
        ])
    );

    const renderStep3 = () => (
        React.createElement('div', { className: "space-y-4" }, [
            React.createElement('h3', {
                key: 'title',
                className: "text-lg font-semibold text-gray-900 mb-2"
            }, "Étape 3 : Prévisualisation"),

            React.createElement('p', {
                key: 'desc',
                className: "text-sm text-gray-600 mb-4"
            }, "Voici un résumé des données qui seront importées :"),

            // Résumé
            React.createElement('div', {
                key: 'summary',
                className: "grid grid-cols-2 gap-4 mb-6"
            }, [
                createSummaryCard("Évaluations valides", analysis?.validRows, "file-text", "bg-blue-50", "text-blue-900"),
                createSummaryCard("Nouveaux projets", analysis?.newProjects, "folder-plus", "bg-green-50", "text-green-900"),
                createSummaryCard("Projets existants", analysis?.existingProjects, "folder-check", "bg-gray-50", "text-gray-900"),
                createSummaryCard("Lignes invalides", analysis?.invalidRows?.length || 0, "alert-circle", "bg-red-50", "text-red-900")
            ]),

            // Entités à créer
            React.createElement('div', {
                key: 'entities',
                className: "space-y-3"
            }, [
                analysis?.newEntreprises?.length > 0 && React.createElement('div', {
                    key: 'entreprises',
                    className: "bg-yellow-50 border border-yellow-200 rounded-lg p-3"
                }, [
                    React.createElement('h4', {
                        key: 'title',
                        className: "font-medium text-yellow-900 mb-2"
                    }, `${analysis.newEntreprises.length} nouvelle${analysis.newEntreprises.length > 1 ? 's' : ''} entreprise${analysis.newEntreprises.length > 1 ? 's' : ''} seront créée${analysis.newEntreprises.length > 1 ? 's' : ''}`),
                    React.createElement('ul', {
                        key: 'list',
                        className: "text-sm text-yellow-800 list-disc list-inside"
                    }, analysis.newEntreprises.slice(0, 5).map((e, i) =>
                        React.createElement('li', { key: i }, e)
                    )),
                    analysis.newEntreprises.length > 5 && React.createElement('p', {
                        key: 'more',
                        className: "text-sm text-yellow-800 mt-1"
                    }, `... et ${analysis.newEntreprises.length - 5} autre${analysis.newEntreprises.length - 5 > 1 ? 's' : ''}`)
                ]),

                analysis?.newFormateurs?.length > 0 && React.createElement('div', {
                    key: 'formateurs',
                    className: "bg-blue-50 border border-blue-200 rounded-lg p-3"
                }, [
                    React.createElement('h4', {
                        key: 'title',
                        className: "font-medium text-blue-900 mb-3"
                    }, `${analysis.newFormateurs.length} formateur${analysis.newFormateurs.length > 1 ? 's' : ''} non reconnu${analysis.newFormateurs.length > 1 ? 's' : ''} - Sélection manuelle requise`),
                    React.createElement('div', {
                        key: 'list',
                        className: "space-y-3"
                    }, analysis.newFormateurs.map((f, i) =>
                        React.createElement('div', {
                            key: i,
                            className: "bg-white rounded p-3 border border-blue-200"
                        }, [
                            React.createElement('div', {
                                key: 'name',
                                className: "text-sm font-medium text-gray-900 mb-2"
                            }, `${f.fullName} (${f.email})`),
                            React.createElement('select', {
                                key: 'select',
                                className: "w-full px-3 py-2 border border-gray-300 rounded-md text-sm",
                                value: userMappings[f.email] || '',
                                onChange: (e) => {
                                    setUserMappings({
                                        ...userMappings,
                                        [f.email]: e.target.value || null
                                    });
                                }
                            }, [
                                React.createElement('option', {
                                    key: 'placeholder',
                                    value: ''
                                }, '-- Sélectionner un collaborateur existant --'),
                                React.createElement('option', {
                                    key: 'create',
                                    value: 'CREATE_NEW'
                                }, '✨ Créer un nouveau formateur'),
                                ...allCollaborateurs.map((collab) =>
                                    React.createElement('option', {
                                        key: collab.id,
                                        value: collab.id
                                    }, `${collab.prenom} ${collab.nom} (${collab.email})`)
                                )
                            ])
                        ])
                    ))
                ]),

                analysis?.newCommerciaux?.length > 0 && React.createElement('div', {
                    key: 'commerciaux',
                    className: "bg-blue-50 border border-blue-200 rounded-lg p-3"
                }, [
                    React.createElement('h4', {
                        key: 'title',
                        className: "font-medium text-blue-900 mb-3"
                    }, `${analysis.newCommerciaux.length} commercial${analysis.newCommerciaux.length > 1 ? 'aux' : ''} non reconnu${analysis.newCommerciaux.length > 1 ? 's' : ''} - Sélection manuelle requise`),
                    React.createElement('div', {
                        key: 'list',
                        className: "space-y-3"
                    }, analysis.newCommerciaux.map((c, i) =>
                        React.createElement('div', {
                            key: i,
                            className: "bg-white rounded p-3 border border-blue-200"
                        }, [
                            React.createElement('div', {
                                key: 'name',
                                className: "text-sm font-medium text-gray-900 mb-2"
                            }, `${c.fullName} (${c.email})`),
                            React.createElement('select', {
                                key: 'select',
                                className: "w-full px-3 py-2 border border-gray-300 rounded-md text-sm",
                                value: userMappings[c.email] || '',
                                onChange: (e) => {
                                    setUserMappings({
                                        ...userMappings,
                                        [c.email]: e.target.value || null
                                    });
                                }
                            }, [
                                React.createElement('option', {
                                    key: 'placeholder',
                                    value: ''
                                }, '-- Sélectionner un collaborateur existant --'),
                                React.createElement('option', {
                                    key: 'create',
                                    value: 'CREATE_NEW'
                                }, '✨ Créer un nouveau commercial'),
                                ...allCollaborateurs.map((collab) =>
                                    React.createElement('option', {
                                        key: collab.id,
                                        value: collab.id
                                    }, `${collab.prenom} ${collab.nom} (${collab.email})`)
                                )
                            ])
                        ])
                    ))
                ]),

                analysis?.invalidRows?.length > 0 && React.createElement('div', {
                    key: 'invalid',
                    className: "bg-red-50 border border-red-200 rounded-lg p-3"
                }, [
                    React.createElement('h4', {
                        key: 'title',
                        className: "font-medium text-red-900 mb-2"
                    }, `${analysis.invalidRows.length} ligne${analysis.invalidRows.length > 1 ? 's' : ''} invalide${analysis.invalidRows.length > 1 ? 's' : ''} (seront ignorée${analysis.invalidRows.length > 1 ? 's' : ''})`),
                    React.createElement('ul', {
                        key: 'list',
                        className: "text-sm text-red-800 list-disc list-inside"
                    }, analysis.invalidRows.slice(0, 3).map((row, i) =>
                        React.createElement('li', { key: i }, `Ligne ${row.index}: ${row.errors.join(', ')}`)
                    ))
                ])
            ]),

            // Sélection limite d'import
            React.createElement('div', {
                key: 'limit-selector',
                className: "border border-gray-300 rounded-lg p-4 bg-gray-50"
            }, [
                React.createElement('h4', {
                    key: 'title',
                    className: "font-medium text-gray-900 mb-3"
                }, "Limite d'import (pour tests)"),
                React.createElement('div', {
                    key: 'options',
                    className: "flex gap-2"
                }, [
                    React.createElement('button', {
                        key: '10',
                        onClick: () => setImportLimit(10),
                        className: `px-3 py-1.5 text-sm rounded-md ${
                            importLimit === 10
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`
                    }, "10 lignes"),
                    React.createElement('button', {
                        key: '50',
                        onClick: () => setImportLimit(50),
                        className: `px-3 py-1.5 text-sm rounded-md ${
                            importLimit === 50
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`
                    }, "50 lignes"),
                    React.createElement('button', {
                        key: 'all',
                        onClick: () => setImportLimit(null),
                        className: `px-3 py-1.5 text-sm rounded-md ${
                            importLimit === null
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`
                    }, "Toutes")
                ])
            ]),

            // Actions
            React.createElement('div', {
                key: 'actions',
                className: "flex justify-end gap-2 mt-6"
            }, [
                React.createElement('button', {
                    key: 'cancel',
                    onClick: resetModal,
                    className: "px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                }, "Annuler"),
                React.createElement('button', {
                    key: 'import',
                    onClick: handleStartImport,
                    className: "px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                }, `Importer ${importLimit ? `${importLimit} évaluation${importLimit > 1 ? 's' : ''}` : `toutes (${analysis?.validRows})`}`)
            ])
        ])
    );

    const renderStep4 = () => (
        React.createElement('div', { className: "space-y-4" }, [
            React.createElement('h3', {
                key: 'title',
                className: "text-lg font-semibold text-gray-900 mb-2"
            }, "Étape 4 : Import en cours"),

            React.createElement('p', {
                key: 'desc',
                className: "text-sm text-gray-600 mb-4"
            }, "L'import est en cours, veuillez patienter..."),

            React.createElement('div', {
                key: 'progress-container',
                className: "space-y-3"
            }, [
                // Barre de progression
                React.createElement('div', {
                    key: 'progress-bar',
                    className: "w-full bg-gray-200 rounded-full h-2"
                }, React.createElement('div', {
                    className: "bg-blue-600 h-2 rounded-full transition-all duration-300",
                    style: { width: `${(progress.current / progress.total) * 100}%` }
                })),

                // Message de progression
                React.createElement('div', {
                    key: 'progress-text',
                    className: "flex items-center gap-2 text-sm text-gray-700"
                }, [
                    React.createElement('i', {
                        key: 'icon',
                        'data-lucide': 'loader-2',
                        className: "w-4 h-4 animate-spin"
                    }),
                    React.createElement('span', {
                        key: 'text'
                    }, progress.message)
                ])
            ])
        ])
    );

    const renderStep5 = () => (
        React.createElement('div', { className: "space-y-4" }, [
            React.createElement('h3', {
                key: 'title',
                className: "text-lg font-semibold text-gray-900 mb-2"
            }, "Étape 5 : Résultats"),

            // Résumé des résultats
            React.createElement('div', {
                key: 'summary',
                className: "grid grid-cols-2 gap-4 mb-6"
            }, [
                createSummaryCard("Évaluations créées", results?.success, "check-circle", "bg-green-50", "text-green-900"),
                createSummaryCard("Erreurs", results?.errors?.length || 0, "x-circle", "bg-red-50", "text-red-900"),
                createSummaryCard("Projets créés", results?.projectsCreated?.length || 0, "folder-plus", "bg-blue-50", "text-blue-900"),
                createSummaryCard("Entreprises créées", results?.entreprisesCreated?.length || 0, "building", "bg-purple-50", "text-purple-900")
            ]),

            // Détails
            results?.evaluationsCreated?.length > 0 && React.createElement('div', {
                key: 'created',
                className: "bg-green-50 border border-green-200 rounded-lg p-4 max-h-60 overflow-y-auto"
            }, [
                React.createElement('h4', {
                    key: 'title',
                    className: "font-medium text-green-900 mb-3"
                }, `${results.evaluationsCreated.length} évaluation${results.evaluationsCreated.length > 1 ? 's' : ''} créée${results.evaluationsCreated.length > 1 ? 's' : ''}`),
                React.createElement('ul', {
                    key: 'list',
                    className: "text-sm text-green-800 space-y-1"
                }, results.evaluationsCreated.slice(0, 10).map((eval, i) =>
                    React.createElement('li', { key: i }, `PRJ${eval.prj} - ${eval.stagiaire} (${eval.email})`)
                )),
                results.evaluationsCreated.length > 10 && React.createElement('p', {
                    key: 'more',
                    className: "text-sm text-green-800 mt-2"
                }, `... et ${results.evaluationsCreated.length - 10} autre${results.evaluationsCreated.length - 10 > 1 ? 's' : ''}`)
            ]),

            results?.errors?.length > 0 && React.createElement('div', {
                key: 'errors',
                className: "bg-red-50 border border-red-200 rounded-lg p-4 max-h-60 overflow-y-auto"
            }, [
                React.createElement('h4', {
                    key: 'title',
                    className: "font-medium text-red-900 mb-3"
                }, `${results.errors.length} erreur${results.errors.length > 1 ? 's' : ''}`),
                React.createElement('ul', {
                    key: 'list',
                    className: "text-sm text-red-800 space-y-1"
                }, results.errors.map((err, i) =>
                    React.createElement('li', { key: i }, `Ligne ${err.row} (PRJ${err.prj} - ${err.stagiaire}): ${err.error}`)
                ))
            ]),

            // Actions
            React.createElement('div', {
                key: 'actions',
                className: "flex justify-end gap-2 mt-6"
            }, [
                React.createElement('button', {
                    key: 'close',
                    onClick: () => {
                        resetModal();
                        onClose();
                        // Rafraîchir la liste des évaluations
                        if (window.EventBus && window.EventBusEvents) {
                            window.EventBus.emit(window.EventBusEvents.EVALUATION_UPDATED, {});
                        }
                    },
                    className: "px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                }, "Fermer")
            ])
        ])
    );

    // Helper pour créer une carte de résumé
    function createSummaryCard(label, value, icon, bgColor, textColor) {
        return React.createElement('div', {
            key: label,
            className: `${bgColor} border border-gray-200 rounded-lg p-4`
        }, [
            React.createElement('div', {
                key: 'icon-value',
                className: "flex items-center gap-2 mb-1"
            }, [
                React.createElement('i', {
                    key: 'icon',
                    'data-lucide': icon,
                    className: `w-5 h-5 ${textColor}`
                }),
                React.createElement('span', {
                    key: 'value',
                    className: `text-2xl font-bold ${textColor}`
                }, value || 0)
            ]),
            React.createElement('p', {
                key: 'label',
                className: `text-sm ${textColor}`
            }, label)
        ]);
    }

    // Rendu de la modal
    if (!show) return null;

    return React.createElement('div', {
        className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4",
        onClick: (e) => {
            if (e.target === e.currentTarget && !importing) {
                onClose();
            }
        }
    }, React.createElement('div', {
        className: "bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto",
        onClick: (e) => e.stopPropagation()
    }, [
        // Header
        React.createElement('div', {
            key: 'header',
            className: "flex items-center justify-between p-6 border-b border-gray-200"
        }, [
            React.createElement('h2', {
                key: 'title',
                className: "text-xl font-bold text-gray-900"
            }, "Import d'évaluations depuis CSV"),
            !importing && React.createElement('button', {
                key: 'close',
                onClick: onClose,
                className: "text-gray-400 hover:text-gray-600"
            }, React.createElement('i', {
                'data-lucide': 'x',
                className: "w-6 h-6"
            }))
        ]),

        // Body
        React.createElement('div', {
            key: 'body',
            className: "p-6"
        }, [
            error && React.createElement('div', {
                key: 'error',
                className: "bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 mb-4"
            }, error),

            step === 1 && renderStep1(),
            step === 2 && renderStep2(),
            step === 3 && renderStep3(),
            step === 4 && renderStep4(),
            step === 5 && renderStep5()
        ])
    ]));
};

// Export global
window.ImportEvaluationsModal = ImportEvaluationsModal;
