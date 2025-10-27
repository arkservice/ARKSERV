// Composant FormateursTable pour afficher les statistiques par formateur
function FormateursTable({ stats }) {
    const { useState } = React;
    const [sortKey, setSortKey] = useState('moyenneGlobale');
    const [sortOrder, setSortOrder] = useState('desc');

    if (!stats || stats.length === 0) {
        return React.createElement('div', {
            className: 'bg-white rounded-lg border border-gray-200 p-8 text-center'
        }, [
            React.createElement('i', {
                key: 'icon',
                'data-lucide': 'users',
                className: 'w-12 h-12 text-gray-400 mx-auto mb-3'
            }),
            React.createElement('p', {
                key: 'text',
                className: 'text-gray-600'
            }, 'Aucune donnée formateur disponible')
        ]);
    }

    // Fonction de tri
    const handleSort = (key) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder('desc');
        }
    };

    // Trier les données
    const sortedStats = [...stats].sort((a, b) => {
        let aVal, bVal;

        if (sortKey.startsWith('notesMoyennes.')) {
            const noteKey = sortKey.split('.')[1];
            aVal = a.notesMoyennes[noteKey];
            bVal = b.notesMoyennes[noteKey];
        } else {
            aVal = a[sortKey];
            bVal = b[sortKey];
        }

        if (typeof aVal === 'string') {
            return sortOrder === 'asc'
                ? aVal.localeCompare(bVal)
                : bVal.localeCompare(aVal);
        }

        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    // Créer un en-tête de colonne triable
    const SortableHeader = (label, key) => {
        const isActive = sortKey === key;
        return React.createElement('th', {
            key: key,
            className: 'px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors',
            onClick: () => handleSort(key)
        }, [
            React.createElement('div', {
                key: 'content',
                className: 'flex items-center gap-2'
            }, [
                React.createElement('span', { key: 'label' }, label),
                React.createElement('i', {
                    key: 'icon',
                    'data-lucide': isActive
                        ? (sortOrder === 'asc' ? 'arrow-up' : 'arrow-down')
                        : 'arrow-up-down',
                    className: `w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`
                })
            ])
        ]);
    };

    // Fonction pour obtenir la couleur de fond selon la note
    const getNoteColorClass = (note) => {
        if (note >= 4.5) return 'bg-green-100 text-green-800 font-semibold';
        if (note >= 4.0) return 'bg-green-50 text-green-700';
        if (note >= 3.5) return 'bg-yellow-50 text-yellow-700';
        if (note >= 3.0) return 'bg-orange-50 text-orange-700';
        return 'bg-red-50 text-red-700';
    };

    return React.createElement('div', {
        className: 'bg-white rounded-lg border border-gray-200 overflow-hidden'
    }, [
        // En-tête
        React.createElement('div', {
            key: 'header',
            className: 'px-6 py-4 border-b border-gray-200 bg-gray-50'
        }, [
            React.createElement('h3', {
                key: 'title',
                className: 'text-lg font-semibold text-gray-900'
            }, 'Statistiques par Formateur'),
            React.createElement('p', {
                key: 'subtitle',
                className: 'text-sm text-gray-600 mt-1'
            }, `${stats.length} formateur${stats.length > 1 ? 's' : ''} analysé${stats.length > 1 ? 's' : ''}`)
        ]),

        // Tableau
        React.createElement('div', {
            key: 'table-container',
            className: 'overflow-x-auto'
        }, React.createElement('table', {
            className: 'min-w-full divide-y divide-gray-200'
        }, [
            // En-tête du tableau
            React.createElement('thead', {
                key: 'thead',
                className: 'bg-gray-50'
            }, React.createElement('tr', {}, [
                React.createElement('th', {
                    key: 'formateur',
                    className: 'px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider sticky left-0 bg-gray-50'
                }, 'Formateur'),
                SortableHeader('Formations', 'nbFormations'),
                SortableHeader('Évaluations', 'nbEvaluations'),
                SortableHeader('Stagiaires', 'nbStagiaires'),
                SortableHeader('Global', 'moyenneGlobale'),
                SortableHeader('Organisation', 'notesMoyennes.organisation'),
                SortableHeader('Moyens', 'notesMoyennes.moyens'),
                SortableHeader('Pédagogie', 'notesMoyennes.pedagogie'),
                SortableHeader('Satisfaction', 'notesMoyennes.satisfaction'),
                SortableHeader('Recommandation', 'tauxRecommandation'),
                SortableHeader('Qualiopi', 'tauxQualiopiCompletes')
            ])),

            // Corps du tableau
            React.createElement('tbody', {
                key: 'tbody',
                className: 'bg-white divide-y divide-gray-200'
            }, sortedStats.map((stat, index) =>
                React.createElement('tr', {
                    key: stat.formateur.id,
                    className: index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                }, [
                    // Formateur
                    React.createElement('td', {
                        key: 'formateur',
                        className: 'px-4 py-4 whitespace-nowrap sticky left-0 bg-inherit'
                    }, React.createElement('div', {
                        className: 'flex items-center gap-3'
                    }, [
                        stat.formateur.avatar
                            ? React.createElement('img', {
                                key: 'avatar',
                                src: stat.formateur.avatar,
                                alt: `${stat.formateur.prenom} ${stat.formateur.nom}`,
                                className: 'w-8 h-8 rounded-full object-cover'
                            })
                            : React.createElement('div', {
                                key: 'avatar-fallback',
                                className: 'w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium'
                            }, `${stat.formateur.prenom?.[0] || ''}${stat.formateur.nom?.[0] || ''}`),
                        React.createElement('div', {
                            key: 'info'
                        }, [
                            React.createElement('div', {
                                key: 'name',
                                className: 'text-sm font-medium text-gray-900'
                            }, `${stat.formateur.prenom || ''} ${stat.formateur.nom || ''}`),
                            React.createElement('div', {
                                key: 'email',
                                className: 'text-xs text-gray-500'
                            }, stat.formateur.email || '')
                        ])
                    ])),

                    // Formations
                    React.createElement('td', {
                        key: 'formations',
                        className: 'px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-center'
                    }, stat.nbFormations),

                    // Évaluations
                    React.createElement('td', {
                        key: 'evaluations',
                        className: 'px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-center'
                    }, stat.nbEvaluations),

                    // Stagiaires
                    React.createElement('td', {
                        key: 'stagiaires',
                        className: 'px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-center'
                    }, stat.nbStagiaires),

                    // Global
                    React.createElement('td', {
                        key: 'global',
                        className: 'px-4 py-4 whitespace-nowrap text-center'
                    }, React.createElement('span', {
                        className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${getNoteColorClass(stat.moyenneGlobale)}`
                    }, `${stat.moyenneGlobale.toFixed(1)} / 5`)),

                    // Organisation
                    React.createElement('td', {
                        key: 'organisation',
                        className: 'px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-center'
                    }, stat.notesMoyennes.organisation.toFixed(1)),

                    // Moyens
                    React.createElement('td', {
                        key: 'moyens',
                        className: 'px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-center'
                    }, stat.notesMoyennes.moyens.toFixed(1)),

                    // Pédagogie
                    React.createElement('td', {
                        key: 'pedagogie',
                        className: 'px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-center'
                    }, stat.notesMoyennes.pedagogie.toFixed(1)),

                    // Satisfaction
                    React.createElement('td', {
                        key: 'satisfaction',
                        className: 'px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-center'
                    }, stat.notesMoyennes.satisfaction.toFixed(1)),

                    // Recommandation
                    React.createElement('td', {
                        key: 'recommandation',
                        className: 'px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-center'
                    }, `${stat.tauxRecommandation.toFixed(0)}%`),

                    // Qualiopi
                    React.createElement('td', {
                        key: 'qualiopi',
                        className: 'px-4 py-4 whitespace-nowrap text-center'
                    }, React.createElement('span', {
                        className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            stat.tauxQualiopiCompletes >= 80 ? 'bg-green-100 text-green-800' :
                            stat.tauxQualiopiCompletes >= 50 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                        }`
                    }, `${stat.tauxQualiopiCompletes.toFixed(0)}%`))
                ])
            ))
        ]))
    ]);
}

// Export global
window.FormateursTable = FormateursTable;
