// Composant EntreprisesTable pour afficher les statistiques par entreprise
function EntreprisesTable({ stats }) {
    const { useState } = React;
    const [sortKey, setSortKey] = useState('nbFormations');
    const [sortOrder, setSortOrder] = useState('desc');

    if (!stats || stats.length === 0) {
        return React.createElement('div', {
            className: 'bg-white rounded-lg border border-gray-200 p-8 text-center'
        }, [
            React.createElement('i', {
                key: 'icon',
                'data-lucide': 'building-2',
                className: 'w-12 h-12 text-gray-400 mx-auto mb-3'
            }),
            React.createElement('p', {
                key: 'text',
                className: 'text-gray-600'
            }, 'Aucune donnée entreprise disponible')
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

        if (sortKey === 'entreprise') {
            aVal = a.entreprise || '';
            bVal = b.entreprise || '';
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
            }, 'Statistiques par Entreprise'),
            React.createElement('p', {
                key: 'subtitle',
                className: 'text-sm text-gray-600 mt-1'
            }, `${stats.length} entreprise${stats.length > 1 ? 's' : ''} cliente${stats.length > 1 ? 's' : ''}`)
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
                SortableHeader('Entreprise', 'entreprise'),
                SortableHeader('Formations', 'nbFormations'),
                SortableHeader('Évaluations', 'nbEvaluations'),
                SortableHeader('Stagiaires', 'nbStagiaires'),
                SortableHeader('Note Moyenne', 'moyenneGlobale')
            ])),

            // Corps du tableau
            React.createElement('tbody', {
                key: 'tbody',
                className: 'bg-white divide-y divide-gray-200'
            }, sortedStats.map((stat, index) =>
                React.createElement('tr', {
                    key: index,
                    className: index % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100',
                    style: { cursor: 'pointer' }
                }, [
                    // Entreprise
                    React.createElement('td', {
                        key: 'entreprise',
                        className: 'px-4 py-4'
                    }, React.createElement('div', {
                        className: 'flex items-center gap-3'
                    }, [
                        React.createElement('div', {
                            key: 'icon-wrapper',
                            className: 'flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center'
                        }, React.createElement('i', {
                            'data-lucide': 'building-2',
                            className: 'w-5 h-5 text-blue-600'
                        })),
                        React.createElement('div', {
                            key: 'name',
                            className: 'text-sm font-medium text-gray-900'
                        }, stat.entreprise || 'N/A')
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

                    // Note moyenne
                    React.createElement('td', {
                        key: 'note',
                        className: 'px-4 py-4 whitespace-nowrap text-center'
                    }, stat.moyenneGlobale > 0
                        ? React.createElement('span', {
                            className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${getNoteColorClass(stat.moyenneGlobale)}`
                        }, `${stat.moyenneGlobale.toFixed(1)} / 5`)
                        : React.createElement('span', {
                            className: 'text-sm text-gray-500'
                        }, 'N/A')
                    )
                ])
            ))
        ]))
    ]);
}

// Export global
window.EntreprisesTable = EntreprisesTable;
