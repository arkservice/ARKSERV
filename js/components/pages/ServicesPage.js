// Page Services - Utilise SimpleCRUDPage
const ServicesPage = React.memo(function ServicesPage({ onRowClick }) {
    // Configuration des colonnes
    const columns = [
        { key: 'nom', label: 'Nom du service', type: 'text', sortable: true },
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
        useHook: window.useServices,
        ModalComponent: window.ServiceModal,
        title: "Services",
        subtitle: "Gérez les services de votre organisation",
        columns: columns,
        searchableFields: ['nom'],
        dataKey: 'services',
        createFnKey: 'createService',
        updateFnKey: 'updateService',
        deleteFnKey: 'deleteService',
        entityName: 'le service',
        displayField: 'nom',
        onRowClick: onRowClick
    });
});

// Export global
window.ServicesPage = ServicesPage;