// Hook personnalisé pour les types PDC - Utilise useSimpleCRUD
function useTypePdc() {
    const crudHook = window.useSimpleCRUD({
        tableName: 'type_pdc',
        dataKey: 'typesPdc',
        entityName: 'type',
        orderBy: 'nom',
        foreignKeyErrorMessage: 'Ce type ne peut pas être supprimé car il est utilisé par des plans de cours'
    });

    // Renommer les fonctions génériques pour correspondre à l'API attendue
    return {
        typesPdc: crudHook.typesPdc,
        loading: crudHook.loading,
        error: crudHook.error,
        createTypePdc: crudHook.createItem,
        updateTypePdc: crudHook.updateItem,
        deleteTypePdc: crudHook.deleteItem,
        refetch: crudHook.refetch
    };
}

// Export global
window.useTypePdc = useTypePdc;
