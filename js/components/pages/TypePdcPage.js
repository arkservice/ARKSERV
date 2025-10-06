// Page Types PDC - Utilise SimpleCRUDPage
const TypePdcPage = React.memo(function TypePdcPage({ onRowClick }) {
    // Configuration des colonnes
    const columns = [
        { key: 'nom', label: 'Nom du type', type: 'text', sortable: true },
        { key: 'code_type', label: 'Code type', type: 'text', sortable: true },
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
        useHook: window.useTypePdc,
        ModalComponent: window.TypePdcModal,
        title: "Types PDC",
        subtitle: "Gérez les types pour les plans de cours",
        columns: columns,
        searchableFields: ['nom', 'code_type'],
        dataKey: 'typesPdc',
        createFnKey: 'createTypePdc',
        updateFnKey: 'updateTypePdc',
        deleteFnKey: 'deleteTypePdc',
        entityName: 'le type',
        displayField: 'nom',
        onRowClick: onRowClick
    });
});

// Export global
window.TypePdcPage = TypePdcPage;
