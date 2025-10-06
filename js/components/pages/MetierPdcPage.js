// Page Métiers PDC - Utilise SimpleCRUDPage
const MetierPdcPage = React.memo(function MetierPdcPage({ onRowClick }) {
    // Configuration des colonnes
    const columns = [
        { key: 'nom', label: 'Nom du métier', type: 'text', sortable: true },
        { key: 'code_metier', label: 'Code métier', type: 'text', sortable: true },
        {
            key: 'description',
            label: 'Description',
            type: 'text',
            render: (value) => value || '-'
        },
        {
            key: 'created_at',
            label: 'Date de création',
            type: 'text',
            render: (value) => {
                if (!value) return '-';
                return new Date(value).toLocaleDateString('fr-FR');
            }
        },
        {
            key: 'actions',
            label: 'Actions',
            type: 'actions'
        }
    ];

    // Utiliser SimpleCRUDPage avec la configuration
    return React.createElement(window.SimpleCRUDPage, {
        useHook: window.useMetierPdc,
        ModalComponent: window.MetierPdcModal,
        title: "Métiers PDC",
        subtitle: "Gérez les métiers pour les plans de cours",
        columns: columns,
        searchableFields: ['nom', 'code_metier'],
        dataKey: 'metiersPdc',
        createFnKey: 'createMetierPdc',
        updateFnKey: 'updateMetierPdc',
        deleteFnKey: 'deleteMetierPdc',
        entityName: 'le métier',
        displayField: 'nom',
        onRowClick: onRowClick
    });
});

// Export global
window.MetierPdcPage = MetierPdcPage;
