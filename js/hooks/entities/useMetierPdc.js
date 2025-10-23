// Hook personnalisé pour les métiers PDC - Utilise useSimpleCRUD
function useMetierPdc() {
    const crudHook = window.useSimpleCRUD({
        tableName: 'metier_pdc',
        dataKey: 'metiersPdc',
        entityName: 'métier',
        orderBy: 'nom',
        foreignKeyErrorMessage: 'Ce métier ne peut pas être supprimé car il est utilisé par des plans de cours'
    });

    // Renommer les fonctions génériques pour correspondre à l'API attendue
    return {
        metiersPdc: crudHook.metiersPdc,
        loading: crudHook.loading,
        error: crudHook.error,
        createMetierPdc: crudHook.createItem,
        updateMetierPdc: crudHook.updateItem,
        deleteMetierPdc: crudHook.deleteItem,
        refetch: crudHook.refetch
    };
}

// Export global
window.useMetierPdc = useMetierPdc;
