// Composant FiltersPanel pour filtrer les rapports
function FiltersPanel({ filters, onFiltersChange, evaluations }) {
    const { useMemo } = React;

    // Extraire les options uniques depuis les évaluations
    const filterOptions = useMemo(() => {
        const formateurs = new Map();
        const entreprises = new Set();
        const pdcs = new Map();
        const logiciels = new Map();

        evaluations.forEach(eval => {
            // Formateurs
            if (eval.formation?.formateur) {
                const f = eval.formation.formateur;
                formateurs.set(f.id, { id: f.id, nom: `${f.prenom} ${f.nom}` });
            }

            // Entreprises
            if (eval.stagiaire_societe) {
                entreprises.add(eval.stagiaire_societe);
            }

            // PDCs
            if (eval.formation?.pdc) {
                const p = eval.formation.pdc;
                pdcs.set(p.id, { id: p.id, ref: p.ref });
            }

            // Logiciels
            if (eval.formation?.pdc?.logiciel) {
                const l = eval.formation.pdc.logiciel;
                logiciels.set(l.id, { id: l.id, nom: l.nom });
            }
        });

        return {
            formateurs: Array.from(formateurs.values()).sort((a, b) => a.nom.localeCompare(b.nom)),
            entreprises: Array.from(entreprises).sort(),
            pdcs: Array.from(pdcs.values()).sort((a, b) => (a.ref || '').localeCompare(b.ref || '')),
            logiciels: Array.from(logiciels.values()).sort((a, b) => a.nom.localeCompare(b.nom))
        };
    }, [evaluations]);

    // Gestion du changement de filtre
    const handleFilterChange = (key, value) => {
        onFiltersChange({ ...filters, [key]: value || null });
    };

    // Réinitialiser tous les filtres
    const handleReset = () => {
        onFiltersChange({});
    };

    // Calculer la date d'il y a 1 an
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const oneYearAgoStr = oneYearAgo.toISOString().split('T')[0];

    // Date actuelle
    const today = new Date().toISOString().split('T')[0];

    // Nombre de filtres actifs
    const activeFiltersCount = Object.values(filters).filter(v => v !== null && v !== undefined).length;

    return React.createElement('div', {
        className: 'bg-white rounded-lg border border-gray-200 p-6 mb-6'
    }, [
        // En-tête
        React.createElement('div', {
            key: 'header',
            className: 'flex items-center justify-between mb-4'
        }, [
            React.createElement('div', {
                key: 'title-section',
                className: 'flex items-center gap-2'
            }, [
                React.createElement('i', {
                    key: 'icon',
                    'data-lucide': 'filter',
                    className: 'w-5 h-5 text-gray-600'
                }),
                React.createElement('h3', {
                    key: 'title',
                    className: 'text-lg font-semibold text-gray-900'
                }, 'Filtres'),
                activeFiltersCount > 0 && React.createElement('span', {
                    key: 'badge',
                    className: 'ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'
                }, `${activeFiltersCount} actif${activeFiltersCount > 1 ? 's' : ''}`)
            ]),
            React.createElement('button', {
                key: 'reset',
                onClick: handleReset,
                disabled: activeFiltersCount === 0,
                className: 'inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            }, [
                React.createElement('i', {
                    key: 'icon',
                    'data-lucide': 'x',
                    className: 'w-4 h-4'
                }),
                'Réinitialiser'
            ])
        ]),

        // Grille de filtres
        React.createElement('div', {
            key: 'filters',
            className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4'
        }, [
            // Période - Date début
            React.createElement('div', {
                key: 'startDate',
                className: 'flex flex-col'
            }, [
                React.createElement('label', {
                    key: 'label',
                    className: 'text-sm font-medium text-gray-700 mb-1'
                }, 'Date début'),
                React.createElement('input', {
                    key: 'input',
                    type: 'date',
                    value: filters.startDate || oneYearAgoStr,
                    onChange: (e) => handleFilterChange('startDate', e.target.value),
                    className: 'px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                })
            ]),

            // Période - Date fin
            React.createElement('div', {
                key: 'endDate',
                className: 'flex flex-col'
            }, [
                React.createElement('label', {
                    key: 'label',
                    className: 'text-sm font-medium text-gray-700 mb-1'
                }, 'Date fin'),
                React.createElement('input', {
                    key: 'input',
                    type: 'date',
                    value: filters.endDate || today,
                    onChange: (e) => handleFilterChange('endDate', e.target.value),
                    className: 'px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                })
            ]),

            // Formateur
            React.createElement('div', {
                key: 'formateur',
                className: 'flex flex-col'
            }, [
                React.createElement('label', {
                    key: 'label',
                    className: 'text-sm font-medium text-gray-700 mb-1'
                }, 'Formateur'),
                React.createElement('select', {
                    key: 'select',
                    value: filters.formateurId || '',
                    onChange: (e) => handleFilterChange('formateurId', e.target.value),
                    className: 'px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                }, [
                    React.createElement('option', { key: 'all', value: '' }, 'Tous'),
                    ...filterOptions.formateurs.map(f =>
                        React.createElement('option', { key: f.id, value: f.id }, f.nom)
                    )
                ])
            ]),

            // Entreprise
            React.createElement('div', {
                key: 'entreprise',
                className: 'flex flex-col'
            }, [
                React.createElement('label', {
                    key: 'label',
                    className: 'text-sm font-medium text-gray-700 mb-1'
                }, 'Entreprise'),
                React.createElement('select', {
                    key: 'select',
                    value: filters.entrepriseId || '',
                    onChange: (e) => handleFilterChange('entrepriseId', e.target.value),
                    className: 'px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                }, [
                    React.createElement('option', { key: 'all', value: '' }, 'Toutes'),
                    ...filterOptions.entreprises.map((e, i) =>
                        React.createElement('option', { key: i, value: e }, e)
                    )
                ])
            ]),

            // PDC
            React.createElement('div', {
                key: 'pdc',
                className: 'flex flex-col'
            }, [
                React.createElement('label', {
                    key: 'label',
                    className: 'text-sm font-medium text-gray-700 mb-1'
                }, 'Formation (PDC)'),
                React.createElement('select', {
                    key: 'select',
                    value: filters.pdcId || '',
                    onChange: (e) => handleFilterChange('pdcId', e.target.value),
                    className: 'px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                }, [
                    React.createElement('option', { key: 'all', value: '' }, 'Toutes'),
                    ...filterOptions.pdcs.map(p =>
                        React.createElement('option', { key: p.id, value: p.id }, p.ref || 'N/A')
                    )
                ])
            ]),

            // Statut
            React.createElement('div', {
                key: 'statut',
                className: 'flex flex-col'
            }, [
                React.createElement('label', {
                    key: 'label',
                    className: 'text-sm font-medium text-gray-700 mb-1'
                }, 'Statut'),
                React.createElement('select', {
                    key: 'select',
                    value: filters.statut || '',
                    onChange: (e) => handleFilterChange('statut', e.target.value),
                    className: 'px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                }, [
                    React.createElement('option', { key: 'all', value: '' }, 'Tous'),
                    React.createElement('option', { key: 'traitee', value: 'Traitée' }, 'Traitée'),
                    React.createElement('option', { key: 'a-traiter', value: 'À traiter' }, 'À traiter')
                ])
            ])
        ])
    ]);
}

// Export global
window.FiltersPanel = FiltersPanel;
