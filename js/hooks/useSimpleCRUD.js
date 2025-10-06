// Hook personnalisé générique pour les opérations CRUD simples
// Factorisation de useServices, useMetierPdc, useTypePdc, etc.
function useSimpleCRUD(config) {
    const { useState, useEffect, useCallback, useRef } = React;
    const supabase = window.supabaseConfig.client;

    // Configuration avec valeurs par défaut
    const {
        tableName,           // Nom de la table Supabase (requis)
        dataKey,            // Nom de la clé pour les données (requis, ex: 'services', 'metiersPdc')
        entityName,         // Nom de l'entité pour les messages (requis, ex: 'service', 'métier')
        entityNamePlural,   // Nom pluriel pour les messages (optionnel, défaut: entityName + 's')
        orderBy = 'nom',    // Champ de tri (défaut: 'nom')
        orderAscending = true, // Ordre de tri (défaut: ascendant)
        cacheTTL = 120000,  // Durée de vie du cache en ms (défaut: 2 minutes)
        checkDuplicates = true, // Vérifier les duplicates avant insert/update (défaut: true)
        duplicateCheckField = 'nom', // Champ à vérifier pour duplicates (défaut: 'nom')
        foreignKeyErrorMessage = null // Message personnalisé pour erreur FK (optionnel)
    } = config;

    // État
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Cache pour éviter les requêtes redondantes
    const cacheRef = useRef({ data: null, timestamp: null, ttl: cacheTTL });

    // Nom pluriel de l'entité
    const pluralName = entityNamePlural || (entityName + 's');

    // Fonction de fetch avec gestion du cache
    const fetchData = useCallback(async (forceRefresh = false) => {
        try {
            // Vérifier le cache avant de faire une requête
            const now = Date.now();
            const cache = cacheRef.current;

            if (!forceRefresh && cache.data && cache.timestamp && (now - cache.timestamp) < cache.ttl) {
                // Utiliser les données du cache
                setData(cache.data);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            const { data: fetchedData, error: fetchError } = await supabase
                .from(tableName)
                .select('*')
                .order(orderBy, { ascending: orderAscending });

            if (fetchError) throw fetchError;

            // Mettre à jour le cache
            cacheRef.current = {
                data: fetchedData || [],
                timestamp: now,
                ttl: cacheTTL
            };

            setData(fetchedData || []);
        } catch (err) {
            console.error(`Erreur lors du chargement des ${pluralName}:`, err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [tableName, orderBy, orderAscending, cacheTTL, pluralName]);

    // Fonction de création
    const createItem = async (itemData) => {
        try {
            setError(null);

            // Vérifier si un élément avec ce nom existe déjà (si checkDuplicates activé)
            if (checkDuplicates && itemData[duplicateCheckField]) {
                const { data: existingItem } = await supabase
                    .from(tableName)
                    .select(duplicateCheckField)
                    .eq(duplicateCheckField, itemData[duplicateCheckField].trim())
                    .maybeSingle();

                if (existingItem) {
                    const duplicateError = new Error(`Un ${entityName} avec ${duplicateCheckField === 'nom' ? 'le nom' : 'ce ' + duplicateCheckField} "${itemData[duplicateCheckField]}" existe déjà`);
                    duplicateError.code = 'DUPLICATE_ITEM';
                    throw duplicateError;
                }
            }

            const { data: insertedData, error: insertError } = await supabase
                .from(tableName)
                .insert(itemData)
                .select()
                .single();

            if (insertError) {
                // Améliorer les messages d'erreur selon le type
                if (insertError.code === '23505') {
                    throw new Error(`Un ${entityName} avec ces informations existe déjà`);
                } else if (insertError.code === '23514') {
                    throw new Error(`Les données saisies ne sont pas valides`);
                } else {
                    throw new Error(`Erreur lors de la création du ${entityName}: ${insertError.message}`);
                }
            }

            // Invalider le cache et recharger
            cacheRef.current.timestamp = null;
            await fetchData(true);
            return insertedData;
        } catch (err) {
            console.error('Erreur lors de la création:', err);
            const userFriendlyMessage = err.code === 'DUPLICATE_ITEM' ? err.message :
                err.message || `Une erreur inattendue s'est produite lors de la création du ${entityName}`;
            setError(userFriendlyMessage);
            throw err;
        }
    };

    // Fonction de mise à jour
    const updateItem = async (id, updates) => {
        try {
            setError(null);

            // Vérifier si un autre élément avec ce nom existe déjà (si checkDuplicates activé)
            if (checkDuplicates && updates[duplicateCheckField]) {
                const { data: existingItem } = await supabase
                    .from(tableName)
                    .select(`id, ${duplicateCheckField}`)
                    .eq(duplicateCheckField, updates[duplicateCheckField].trim())
                    .neq('id', id)
                    .maybeSingle();

                if (existingItem) {
                    const duplicateError = new Error(`Un autre ${entityName} avec ${duplicateCheckField === 'nom' ? 'le nom' : 'ce ' + duplicateCheckField} "${updates[duplicateCheckField]}" existe déjà`);
                    duplicateError.code = 'DUPLICATE_ITEM';
                    throw duplicateError;
                }
            }

            const { data: updatedData, error: updateError } = await supabase
                .from(tableName)
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (updateError) {
                if (updateError.code === '23505') {
                    throw new Error(`Un ${entityName} avec ces informations existe déjà`);
                } else {
                    throw new Error(`Erreur lors de la modification: ${updateError.message}`);
                }
            }

            // Invalider le cache et recharger
            cacheRef.current.timestamp = null;
            await fetchData(true);
            return updatedData;
        } catch (err) {
            console.error('Erreur lors de la mise à jour:', err);
            const userFriendlyMessage = err.code === 'DUPLICATE_ITEM' ? err.message :
                err.message || `Une erreur inattendue s'est produite lors de la modification du ${entityName}`;
            setError(userFriendlyMessage);
            throw err;
        }
    };

    // Fonction de suppression
    const deleteItem = async (id) => {
        try {
            setError(null);

            const { error: deleteError } = await supabase
                .from(tableName)
                .delete()
                .eq('id', id);

            if (deleteError) {
                if (deleteError.code === '23503') {
                    const defaultFKMessage = `Ce ${entityName} ne peut pas être supprimé car il est utilisé`;
                    throw new Error(foreignKeyErrorMessage || defaultFKMessage);
                } else {
                    throw new Error(`Erreur lors de la suppression: ${deleteError.message}`);
                }
            }

            await fetchData();
        } catch (err) {
            console.error('Erreur lors de la suppression:', err);
            const userFriendlyMessage = err.message || `Une erreur inattendue s'est produite lors de la suppression du ${entityName}`;
            setError(userFriendlyMessage);
            throw err;
        }
    };

    // Charger les données au montage
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Retourner l'état et les fonctions
    // Format: { [dataKey]: data, loading, error, create[EntityName], update[EntityName], delete[EntityName], refetch }
    return {
        [dataKey]: data,
        loading,
        error,
        createItem,
        updateItem,
        deleteItem,
        refetch: fetchData
    };
}

// Export global
window.useSimpleCRUD = useSimpleCRUD;
