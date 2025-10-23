// Hook pour la gestion commune des workflows de tâches
function useTaskWorkflow() {
    const { useState, useEffect } = React;
    const supabase = window.supabaseConfig.client;

    // États communs pour tous les workflows
    const [tache, setTache] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);

    // États pour les données de référence communes
    const [availableLogiciels, setAvailableLogiciels] = useState([]);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [availablePdcs, setAvailablePdcs] = useState([]);
    const [stagiaires, setStagiaires] = useState([]);

    // Fonction générique pour charger les détails d'une tâche
    const fetchTaskDetails = async (tacheId) => {
        try {
            setLoading(true);
            setError(null);
            
            const { data: tacheData, error: tacheError } = await supabase
                .from('tasks')
                .select(`
                    *,
                    project:project_id(
                        id, 
                        name, 
                        description, 
                        status, 
                        type,
                        created_at,
                        commercial:commercial_id(id, prenom, nom, avatar, email, telephone),
                        contact:contact_id(id, prenom, nom, avatar, email, telephone),
                        entreprise:entreprise_id(id, nom, adresse, telephone, email, secteur_activite, type_entreprise),
                        logiciel:logiciel_id(id, nom, editeur, description, logo),
                        pdc:pdc_id(id, pdc_number, duree_en_jour, objectifs, logiciel_id),
                        pdf_devis,
                        pdf_devis_signe,
                        stagiaires
                    ),
                    assigned_user:assigned_to(id, prenom, nom, avatar, email, telephone)
                `)
                .eq('id', tacheId)
                .single();
            
            if (tacheError) throw tacheError;
            setTache(tacheData);
            
            return tacheData;
            
        } catch (err) {
            console.error('Erreur lors du chargement des détails:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Fonction pour charger les données de référence communes
    const fetchReferenceData = async () => {
        try {
            // Charger les logiciels
            const { data: logicielsData } = await supabase
                .from('logiciel')
                .select('id, nom, logo')
                .order('nom');
            setAvailableLogiciels(logicielsData || []);
            
            // Charger tous les utilisateurs
            const { data: usersData } = await supabase
                .from('user_profile')
                .select(`
                    id, prenom, nom, avatar, entreprise_id,
                    entreprise(id, nom, type_entreprise),
                    fonction(id, nom),
                    service(id, nom)
                `)
                .order('prenom, nom');
            setAvailableUsers(usersData || []);
            
            // Charger les PDCs
            const { data: pdcsData } = await supabase
                .from('pdc')
                .select('id, ref, pdc_number')
                .order('ref');
            setAvailablePdcs(pdcsData || []);
            
        } catch (error) {
            console.error('Erreur lors du chargement des données de référence:', error);
        }
    };

    // Fonction pour charger les stagiaires d'un projet
    const loadProjectStagiaires = async (projectId, stagiaireIds) => {
        try {
            if (stagiaireIds && stagiaireIds.length > 0) {
                const { data: stagiairesData, error: stagiairesError } = await supabase
                    .from('user_profile')
                    .select('id, prenom, nom, avatar')
                    .in('id', stagiaireIds);
                
                if (stagiairesError) throw stagiairesError;
                setStagiaires(stagiairesData || []);
                return stagiairesData || [];
            } else {
                setStagiaires([]);
                return [];
            }
        } catch (error) {
            console.error('Erreur lors du chargement des stagiaires:', error);
            setStagiaires([]);
            return [];
        }
    };

    // Fonction utilitaire pour gérer les erreurs communes
    const handleError = (error, context = '') => {
        console.error(`Erreur ${context}:`, error);
        setError(error.message || 'Une erreur est survenue');
    };

    // Fonction pour réinitialiser les états
    const resetStates = () => {
        setTache(null);
        setLoading(true);
        setError(null);
        setShowEditModal(false);
        setAvailableLogiciels([]);
        setAvailableUsers([]);
        setAvailablePdcs([]);
        setStagiaires([]);
    };

    // Fonction pour mettre à jour le statut d'une tâche
    const updateTaskStatus = async (tacheId, newStatus) => {
        try {
            const { error } = await supabase
                .from('tasks')
                .update({ status: newStatus })
                .eq('id', tacheId);
            
            if (error) throw error;
            
            // Mettre à jour l'état local
            setTache(prev => prev ? { ...prev, status: newStatus } : null);
            
            return true;
        } catch (error) {
            handleError(error, 'lors de la mise à jour du statut');
            return false;
        }
    };

    // Hook d'effet pour charger les données de référence au montage
    useEffect(() => {
        fetchReferenceData();
    }, []);

    return {
        // États
        tache,
        loading,
        error,
        showEditModal,
        availableLogiciels,
        availableUsers,
        availablePdcs,
        stagiaires,
        
        // Actions
        setTache,
        setLoading,
        setError,
        setShowEditModal,
        setStagiaires,
        
        // Fonctions
        fetchTaskDetails,
        fetchReferenceData,
        loadProjectStagiaires,
        handleError,
        resetStates,
        updateTaskStatus
    };
}

// Export global
window.useTaskWorkflow = useTaskWorkflow;