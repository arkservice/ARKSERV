// Modal d'import de projets depuis CSV
const ImportProjectsModal = ({ show, onClose }) => {
    const { useState, useEffect } = React;
    const supabase = window.supabaseConfig.client;

    // États
    const [step, setStep] = useState(1); // Étape actuelle (1-5)
    const [file, setFile] = useState(null);
    const [fileName, setFileName] = useState('');
    const [csvData, setCsvData] = useState([]);
    const [duplicates, setDuplicates] = useState([]);
    const [selectedDuplicates, setSelectedDuplicates] = useState({}); // {prj: rowIndex}
    const [analysis, setAnalysis] = useState(null);
    const [analyzing, setAnalyzing] = useState(false); // État d'analyse
    const [importing, setImporting] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0, message: '', createdCount: 0, updatedCount: 0 });
    const [results, setResults] = useState(null);
    const [error, setError] = useState('');

    // Réinitialiser lors de l'ouverture/fermeture
    useEffect(() => {
        if (show) {
            resetModal();
        }
    }, [show]);

    const resetModal = () => {
        setStep(1);
        setFile(null);
        setFileName('');
        setCsvData([]);
        setDuplicates([]);
        setSelectedDuplicates({});
        setAnalysis(null);
        setAnalyzing(false);
        setImporting(false);
        setProgress({ current: 0, total: 0, message: '', createdCount: 0, updatedCount: 0 });
        setResults(null);
        setError('');
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

            const rows = window.csvParser.parseCSV(content);
            setCsvData(rows);

            // Détecter les doublons
            const { duplicates: foundDuplicates, uniqueRows } = window.csvParser.detectDuplicates(rows);

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
    const handleDuplicateSelection = (prj, rowIndex) => {
        setSelectedDuplicates(prev => ({
            ...prev,
            [prj]: rowIndex
        }));
    };

    const canContinueFromDuplicates = () => {
        return duplicates.every(dup => selectedDuplicates[dup.prj] !== undefined);
    };

    const handleResolveDuplicates = async () => {
        setAnalyzing(true);
        try {
            // Filtrer les lignes en gardant uniquement les lignes sélectionnées
            const filteredRows = csvData.filter((row, index) => {
                const prjNumber = window.csvParser.extractPRJNumber(row.ID || '');

                // Si ce PRJ est un doublon
                const duplicate = duplicates.find(d => d.prj === prjNumber);
                if (duplicate) {
                    // Garder uniquement si c'est la ligne sélectionnée
                    return selectedDuplicates[prjNumber] === (index + 2);
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

        try {
            const analysisResult = await window.projectImportService.analyzeImportData(supabase, rows);
            setAnalysis(analysisResult);
            setStep(3);
        } catch (err) {
            setError(`Erreur d'analyse: ${err.message}`);
        }
    };

    // Étape 4: Import
    const handleStartImport = async () => {
        setStep(4);
        setImporting(true);
        setError('');

        try {
            const onProgress = (parsed, current, total, isUpdate) => {
                setProgress(prev => {
                    const action = isUpdate ? 'Mise à jour' : 'Création';
                    const newCreatedCount = isUpdate ? prev.createdCount : prev.createdCount + 1;
                    const newUpdatedCount = isUpdate ? prev.updatedCount + 1 : prev.updatedCount;

                    return {
                        current,
                        total,
                        message: `${action} du projet PRJ${parsed.prj} (${current}/${total})...`,
                        createdCount: newCreatedCount,
                        updatedCount: newUpdatedCount
                    };
                });
            };

            const importResults = await window.projectImportService.importProjects(supabase, csvData, onProgress);
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
            }, "Sélectionnez un fichier CSV contenant les projets à importer. Le fichier doit utiliser le point-virgule (;) comme séparateur."),

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
                    id: 'csv-file-input'
                }),
                React.createElement('label', {
                    key: 'label',
                    htmlFor: 'csv-file-input',
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
                    }, fileName || 'Cliquez pour sélectionner un fichier CSV')
                ])
            ]),

            error && React.createElement('div', {
                key: 'error',
                className: "bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800"
            }, error)
        ])
    );

    const renderStep2 = () => (
        React.createElement('div', { className: "space-y-4" }, [
            React.createElement('h3', {
                key: 'title',
                className: "text-lg font-semibold text-gray-900"
            }, "Étape 2 : Résolution des doublons"),

            React.createElement('p', {
                key: 'desc',
                className: "text-sm text-gray-600"
            }, `Des doublons ont été détectés (${duplicates.length} PRJ en double). Veuillez sélectionner quelle ligne conserver pour chaque doublon.`),

            React.createElement('div', {
                key: 'duplicates',
                className: "space-y-4 max-h-96 overflow-y-auto"
            }, duplicates.map((dup, idx) =>
                React.createElement('div', {
                    key: idx,
                    className: "border border-gray-200 rounded-lg p-4"
                }, [
                    React.createElement('h4', {
                        key: 'prj-title',
                        className: "font-semibold text-gray-900 mb-3"
                    }, `PRJ${dup.prj}`),

                    React.createElement('div', {
                        key: 'rows',
                        className: "space-y-2"
                    }, dup.rows.map((rowItem, rowIdx) =>
                        React.createElement('div', {
                            key: rowIdx,
                            className: "flex items-start gap-3 p-3 border rounded " +
                                (selectedDuplicates[dup.prj] === rowItem.index ? 'border-blue-500 bg-blue-50' : 'border-gray-200')
                        }, [
                            React.createElement('input', {
                                key: 'radio',
                                type: 'radio',
                                name: `duplicate-${dup.prj}`,
                                checked: selectedDuplicates[dup.prj] === rowItem.index,
                                onChange: () => handleDuplicateSelection(dup.prj, rowItem.index),
                                className: "mt-1"
                            }),
                            React.createElement('div', {
                                key: 'info',
                                className: "flex-1 text-sm"
                            }, [
                                React.createElement('p', {
                                    key: `${rowIdx}-line`,
                                    className: "font-medium text-gray-700"
                                }, `Ligne ${rowItem.index}`),
                                React.createElement('p', { key: `${rowIdx}-customer` }, `Client: ${rowItem.data.Customer}`),
                                React.createElement('p', { key: `${rowIdx}-pdc` }, `PDC: ${rowItem.data['Link to Documents']}`),
                                React.createElement('p', { key: `${rowIdx}-dates` }, `Dates: ${rowItem.data['Training Dates']}`),
                                React.createElement('p', { key: `${rowIdx}-formateur` }, `Formateur: ${rowItem.data['Project Resource']}`)
                            ])
                        ])
                    ))
                ])
            )),

            React.createElement('div', {
                key: 'actions',
                className: "flex justify-end gap-2"
            }, [
                React.createElement('button', {
                    key: 'cancel',
                    onClick: onClose,
                    className: "px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                }, "Annuler"),
                React.createElement('button', {
                    key: 'continue',
                    onClick: handleResolveDuplicates,
                    disabled: !canContinueFromDuplicates(),
                    className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                }, "Continuer")
            ])
        ])
    );

    const renderStep3 = () => (
        React.createElement('div', { className: "space-y-4" }, [
            React.createElement('h3', {
                key: 'title',
                className: "text-lg font-semibold text-gray-900"
            }, "Étape 3 : Aperçu avant import"),

            React.createElement('div', {
                key: 'summary',
                className: "bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2"
            }, [
                React.createElement('p', { key: 'total' },
                    React.createElement('strong', {}, `${analysis?.totalProjects || 0} projets`), ' au total'
                ),
                analysis?.newProjects > 0 && React.createElement('p', { key: 'new-projects', className: "text-green-700 ml-4" },
                    '→ ', React.createElement('strong', {}, `${analysis.newProjects} projets`), ' seront créés'
                ),
                analysis?.existingProjects > 0 && React.createElement('p', { key: 'existing-projects', className: "text-blue-700 ml-4" },
                    '→ ', React.createElement('strong', {}, `${analysis.existingProjects} projets`), ' seront mis à jour'
                ),
                React.createElement('p', { key: 'entreprises' },
                    React.createElement('strong', {}, `${analysis?.newEntreprises.length || 0} entreprises`), ' seront créées automatiquement'
                ),
                React.createElement('p', { key: 'formateurs' },
                    React.createElement('strong', {}, `${analysis?.newFormateurs.length || 0} formateurs`), ' seront créés automatiquement'
                ),
                React.createElement('p', { key: 'commerciaux' },
                    React.createElement('strong', {}, `${analysis?.newCommerciaux.length || 0} commerciaux`), ' seront créés automatiquement'
                )
            ]),

            analysis?.newEntreprises.length > 0 && React.createElement('div', {
                key: 'entreprises-list',
                className: "border border-gray-200 rounded-lg p-4"
            }, [
                React.createElement('h4', {
                    key: 'title',
                    className: "font-semibold text-gray-900 mb-2"
                }, "Nouvelles entreprises :"),
                React.createElement('ul', {
                    key: 'list',
                    className: "list-disc list-inside text-sm text-gray-700"
                }, analysis.newEntreprises.map((e, i) =>
                    React.createElement('li', { key: i }, e)
                ))
            ]),

            analysis?.newFormateurs.length > 0 && React.createElement('div', {
                key: 'formateurs-list',
                className: "border border-gray-200 rounded-lg p-4"
            }, [
                React.createElement('h4', {
                    key: 'title',
                    className: "font-semibold text-gray-900 mb-2"
                }, "Nouveaux formateurs :"),
                React.createElement('p', {
                    key: 'desc',
                    className: "text-xs text-gray-600 mb-2"
                }, "Ces utilisateurs seront créés avec email prenom.nom@arkance.world et mot de passe user1234"),
                React.createElement('ul', {
                    key: 'list',
                    className: "list-disc list-inside text-sm text-gray-700"
                }, analysis.newFormateurs.map((f, i) =>
                    React.createElement('li', { key: i }, f)
                ))
            ]),

            analysis?.newCommerciaux.length > 0 && React.createElement('div', {
                key: 'commerciaux-list',
                className: "border border-gray-200 rounded-lg p-4"
            }, [
                React.createElement('h4', {
                    key: 'title',
                    className: "font-semibold text-gray-900 mb-2"
                }, "Nouveaux commerciaux :"),
                React.createElement('p', {
                    key: 'desc',
                    className: "text-xs text-gray-600 mb-2"
                }, "Ces utilisateurs seront créés avec email prenom.nom@arkance.world et mot de passe user1234"),
                React.createElement('ul', {
                    key: 'list',
                    className: "list-disc list-inside text-sm text-gray-700"
                }, analysis.newCommerciaux.map((c, i) =>
                    React.createElement('li', { key: i }, c)
                ))
            ]),

            analysis?.missingPDC.length > 0 && React.createElement('div', {
                key: 'missing-pdc',
                className: "bg-yellow-50 border border-yellow-200 rounded-lg p-4"
            }, [
                React.createElement('h4', {
                    key: 'title',
                    className: "font-semibold text-yellow-900 mb-2"
                }, "⚠️ PDC non trouvés"),
                React.createElement('p', {
                    key: 'desc',
                    className: "text-sm text-yellow-800 mb-2"
                }, "Les PDC suivants n'ont pas été trouvés dans la base. Les projets seront créés sans PDC."),
                React.createElement('ul', {
                    key: 'list',
                    className: "list-disc list-inside text-sm text-yellow-700"
                }, analysis.missingPDC.map((pdc, i) =>
                    React.createElement('li', { key: i }, pdc)
                ))
            ]),

            React.createElement('div', {
                key: 'actions',
                className: "flex justify-end gap-2"
            }, [
                React.createElement('button', {
                    key: 'cancel',
                    onClick: onClose,
                    className: "px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                }, "Annuler"),
                React.createElement('button', {
                    key: 'import',
                    onClick: handleStartImport,
                    className: "px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                }, "Confirmer l'import")
            ])
        ])
    );

    const renderStep4 = () => (
        React.createElement('div', { className: "space-y-4" }, [
            React.createElement('h3', {
                key: 'title',
                className: "text-lg font-semibold text-gray-900"
            }, "Étape 4 : Import en cours"),

            React.createElement('div', {
                key: 'progress-bar',
                className: "w-full bg-gray-200 rounded-full h-4 overflow-hidden"
            }, React.createElement('div', {
                className: "bg-blue-600 h-full transition-all duration-300",
                style: {
                    width: progress.total > 0 ? `${(progress.current / progress.total) * 100}%` : '0%'
                }
            })),

            React.createElement('p', {
                key: 'progress-text',
                className: "text-sm text-gray-600 text-center"
            }, progress.message),

            React.createElement('div', {
                key: 'counts',
                className: "flex justify-center gap-6 text-sm"
            }, [
                React.createElement('span', {
                    key: 'created',
                    className: "text-green-700 font-medium"
                }, `✓ ${progress.createdCount} créés`),
                React.createElement('span', {
                    key: 'updated',
                    className: "text-blue-700 font-medium"
                }, `↻ ${progress.updatedCount} mis à jour`)
            ]),

            React.createElement('div', {
                key: 'spinner',
                className: "flex justify-center"
            }, React.createElement('div', {
                className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
            }))
        ])
    );

    const renderStep5 = () => (
        React.createElement('div', { className: "space-y-4" }, [
            React.createElement('h3', {
                key: 'title',
                className: "text-lg font-semibold text-gray-900"
            }, "Étape 5 : Import terminé"),

            React.createElement('div', {
                key: 'success',
                className: "bg-green-50 border border-green-200 rounded-lg p-4 space-y-2"
            }, [
                React.createElement('p', { key: 'success-total' },
                    React.createElement('strong', {}, `${results?.success || 0} projets`), ' traités avec succès'
                ),
                results?.projectsCreated.length > 0 && React.createElement('p', { key: 'created-count' },
                    React.createElement('span', { className: "text-green-700" }, '→ '),
                    React.createElement('strong', {}, `${results.projectsCreated.length} nouveaux projets`), ' créés'
                ),
                results?.projectsUpdated.length > 0 && React.createElement('p', { key: 'updated-count' },
                    React.createElement('span', { className: "text-blue-700" }, '→ '),
                    React.createElement('strong', {}, `${results.projectsUpdated.length} projets existants`), ' mis à jour'
                ),
                React.createElement('p', { key: 'sessions-count' },
                    React.createElement('strong', {}, `${results?.sessionsCreated || 0} sessions`), ' de formation créées'
                ),
                React.createElement('p', { key: 'entreprises-count' },
                    React.createElement('strong', {}, `${results?.entreprisesCreated.length || 0} entreprises`), ' créées ou trouvées'
                )
            ]),

            results?.errors.length > 0 && React.createElement('div', {
                key: 'errors',
                className: "bg-red-50 border border-red-200 rounded-lg p-4"
            }, [
                React.createElement('h4', {
                    key: 'title',
                    className: "font-semibold text-red-900 mb-2"
                }, `Erreurs (${results.errors.length}) :`),
                React.createElement('ul', {
                    key: 'list',
                    className: "list-disc list-inside text-sm text-red-700 max-h-40 overflow-y-auto"
                }, results.errors.map((err, i) =>
                    React.createElement('li', { key: i }, `Ligne ${err.row} (PRJ${err.prj}): ${err.error}`)
                ))
            ]),

            React.createElement('div', {
                key: 'actions',
                className: "flex justify-end"
            }, React.createElement('button', {
                onClick: onClose,
                className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            }, "Fermer"))
        ])
    );

    if (!show) return null;

    return React.createElement('div', {
        className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4",
        onClick: (e) => {
            if (e.target === e.currentTarget && step !== 4) {
                onClose();
            }
        }
    }, React.createElement('div', {
        className: "bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col",
        onClick: (e) => e.stopPropagation()
    }, [
        // Header
        React.createElement('div', {
            key: 'header',
            className: "px-6 py-4 border-b border-gray-200 flex items-center justify-between"
        }, [
            React.createElement('h2', {
                key: 'title',
                className: "text-xl font-semibold text-gray-900"
            }, "Import de projets depuis CSV"),
            step !== 4 && React.createElement('button', {
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
            className: "flex-1 overflow-y-auto p-6 relative"
        }, [
            // Overlay de chargement pendant l'analyse
            analyzing && React.createElement('div', {
                key: 'analyzing-overlay',
                className: "absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10"
            }, React.createElement('div', {
                className: "text-center"
            }, [
                React.createElement('div', {
                    key: 'spinner',
                    className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"
                }),
                React.createElement('p', {
                    key: 'text',
                    className: "text-gray-700 font-medium"
                }, "Analyse des données en cours..."),
                React.createElement('p', {
                    key: 'subtext',
                    className: "text-sm text-gray-500 mt-2"
                }, "Vérification des utilisateurs et des entités")
            ])),

            // Contenu des étapes
            step === 1 && renderStep1(),
            step === 2 && renderStep2(),
            step === 3 && renderStep3(),
            step === 4 && renderStep4(),
            step === 5 && renderStep5()
        ])
    ]));
};

// Rendre le composant global
window.ImportProjectsModal = ImportProjectsModal;
