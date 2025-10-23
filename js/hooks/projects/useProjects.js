// Hook personnalisé pour les projets avec cache intelligent - Optimized
function useProjects() {
    const { useState, useEffect, useCallback, useRef, useMemo } = React;
    const supabase = window.supabaseConfig.client;
    
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Cache avec timestamp pour éviter les requêtes redondantes - amélioration du TTL
    const cacheRef = useRef({ data: null, timestamp: null, ttl: 60000 }); // Cache 60 secondes (amélioré)
    
    const fetchProjects = useCallback(async (forceRefresh = false) => {
        try {
            // Vérifier le cache avant de faire une requête
            const now = Date.now();
            const cache = cacheRef.current;
            
            if (!forceRefresh && cache.data && cache.timestamp && (now - cache.timestamp) < cache.ttl) {
                // Utiliser les données du cache
                setProjects(cache.data);
                setLoading(false);
                return;
            }
            
            setLoading(true);
            setError(null);
            
            const { data, error: fetchError } = await supabase
                .from('projects')
                .select(`
                    *,
                    entreprise:entreprise_id(id, nom, adresse),
                    logiciel:logiciel_id(id, nom, description),
                    commercial:commercial_id(id, prenom, nom, email),
                    contact:contact_id(id, prenom, nom, email),
                    pdc:pdc_id(id, ref, pdc_number, duree_en_jour, public_cible, objectifs, pdf_file_url)
                `)
                .order('created_at', { ascending: false });
            
            if (fetchError) throw fetchError;
            
            // Mettre à jour le cache avec TTL amélioré
            cacheRef.current = {
                data: data || [],
                timestamp: now,
                ttl: 60000
            };
            
            setProjects(data || []);
        } catch (err) {
            console.error('Erreur lors du chargement des projets:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);
    
    const createProject = async (project) => {
        try {
            setError(null);
            const { data, error: insertError } = await supabase
                .from('projects')
                .insert(project)
                .select(`
                    *,
                    entreprise:entreprise_id(id, nom, adresse),
                    logiciel:logiciel_id(id, nom, description),
                    commercial:commercial_id(id, prenom, nom, email),
                    contact:contact_id(id, prenom, nom, email)
                `)
                .single();
            
            if (insertError) throw insertError;
            // Invalider le cache et recharger
            cacheRef.current.timestamp = null;
            await fetchProjects(true);
            return data;
        } catch (err) {
            console.error('Erreur lors de la création:', err);
            setError(err.message);
            throw err;
        }
    };
    
    const updateProject = async (id, updates) => {
        try {
            setError(null);
            const { data, error: updateError } = await supabase
                .from('projects')
                .update(updates)
                .eq('id', id)
                .select(`
                    *,
                    entreprise:entreprise_id(id, nom, adresse),
                    logiciel:logiciel_id(id, nom, description),
                    commercial:commercial_id(id, prenom, nom, email),
                    contact:contact_id(id, prenom, nom, email)
                `)
                .single();
            
            if (updateError) throw updateError;
            // Invalider le cache et recharger
            cacheRef.current.timestamp = null;
            await fetchProjects(true);
            return data;
        } catch (err) {
            console.error('Erreur lors de la mise à jour:', err);
            setError(err.message);
            throw err;
        }
    };
    
    const deleteProject = async (id) => {
        try {
            setError(null);
            console.log(`🗑️ [deleteProject] Début de la suppression en cascade pour le projet ${id}`);
            
            // 1. Supprimer tous les événements de formation liés au projet
            console.log(`🔄 [deleteProject] Suppression des événements de formation pour le projet ${id}`);
            const { error: deleteEventsError } = await supabase
                .from('evenement')
                .delete()
                .eq('projet_id', id)
                .eq('type_evenement', 'formation');
            
            if (deleteEventsError) {
                console.error('❌ [deleteProject] Erreur suppression événements:', deleteEventsError);
                throw deleteEventsError;
            }
            console.log(`✅ [deleteProject] Événements de formation supprimés pour le projet ${id}`);
            
            // 2. Supprimer les tâches liées au projet (si la table existe)
            console.log(`🔄 [deleteProject] Suppression des tâches pour le projet ${id}`);
            const { error: deleteTasksError } = await supabase
                .from('tasks')
                .delete()
                .eq('project_id', id);
            
            if (deleteTasksError && !deleteTasksError.message.includes("relation \"tasks\" does not exist")) {
                console.error('❌ [deleteProject] Erreur suppression tâches:', deleteTasksError);
                throw deleteTasksError;
            }
            console.log(`✅ [deleteProject] Tâches supprimées pour le projet ${id}`);
            
            // 3. Supprimer le projet lui-même
            console.log(`🔄 [deleteProject] Suppression du projet ${id}`);
            const { error: deleteProjectError } = await supabase
                .from('projects')
                .delete()
                .eq('id', id);
            
            if (deleteProjectError) {
                console.error('❌ [deleteProject] Erreur suppression projet:', deleteProjectError);
                throw deleteProjectError;
            }
            
            console.log(`✅ [deleteProject] Projet ${id} et toutes ses dépendances supprimés avec succès`);
            
            // Invalider le cache et recharger
            cacheRef.current.timestamp = null;
            await fetchProjects(true);
        } catch (err) {
            console.error('❌ [deleteProject] Erreur lors de la suppression en cascade:', err);
            setError(err.message);
            throw err;
        }
    };
    
    const updateProjectPdc = async (projectId, pdcId) => {
        try {
            setError(null);
            const { data, error: updateError } = await supabase
                .from('projects')
                .update({ pdc_id: pdcId })
                .eq('id', projectId)
                .select(`
                    *,
                    entreprise:entreprise_id(id, nom, adresse),
                    logiciel:logiciel_id(id, nom, description),
                    commercial:commercial_id(id, prenom, nom, email),
                    contact:contact_id(id, prenom, nom, email)
                `)
                .single();
            
            if (updateError) throw updateError;
            // Invalider le cache et recharger
            cacheRef.current.timestamp = null;
            await fetchProjects(true);
            return data;
        } catch (err) {
            console.error('Erreur lors de la mise à jour du PDC:', err);
            setError(err.message);
            throw err;
        }
    };
    
    const resetProjectPdc = async (projectId) => {
        try {
            setError(null);
            console.log(`🔄 [resetProjectPdc] Réinitialisation du PDC pour le projet ${projectId}`);
            
            const { data, error: updateError } = await supabase
                .from('projects')
                .update({ pdc_id: null })
                .eq('id', projectId)
                .select(`
                    *,
                    entreprise:entreprise_id(id, nom, adresse),
                    logiciel:logiciel_id(id, nom, description),
                    commercial:commercial_id(id, prenom, nom, email),
                    contact:contact_id(id, prenom, nom, email)
                `)
                .single();
            
            if (updateError) throw updateError;
            
            console.log(`✅ [resetProjectPdc] PDC réinitialisé avec succès pour le projet ${projectId}`);
            
            // Invalider le cache et recharger
            cacheRef.current.timestamp = null;
            await fetchProjects(true);
            return data;
        } catch (err) {
            console.error('Erreur lors de la réinitialisation du PDC:', err);
            setError(err.message);
            throw err;
        }
    };
    
    // NOUVELLE FONCTION: Synchroniser le lieu du projet avec ses événements de formation
    const synchronizeProjectLieu = useCallback(async (projectId) => {
        try {
            console.log(`🔄 [useProjects.synchronizeProjectLieu] Synchronisation lieu pour projet ${projectId}`);
            setError(null);
            
            // Utiliser la fonction utilitaire si disponible
            if (window.projectUtils && window.projectUtils.synchronizeProjectLieu) {
                const success = await window.projectUtils.synchronizeProjectLieu(projectId, null, supabase);
                if (success) {
                    // Invalider le cache et recharger les projets
                    cacheRef.current.timestamp = null;
                    await fetchProjects(true);
                }
                return success;
            } else {
                console.warn('⚠️ [useProjects.synchronizeProjectLieu] projectUtils non disponible');
                return false;
            }
        } catch (err) {
            console.error('❌ [useProjects.synchronizeProjectLieu] Erreur:', err);
            setError(err.message);
            return false;
        }
    }, [supabase, fetchProjects]);
    
    // NOUVELLE FONCTION: Mettre à jour le lieu du projet basé sur des sessions
    const updateProjectLieu = useCallback(async (projectId, sessions) => {
        try {
            console.log(`🏢 [useProjects.updateProjectLieu] Mise à jour lieu pour projet ${projectId}`);
            setError(null);
            
            // Formater le lieu basé sur les sessions
            const lieuFormatté = window.projectUtils ? 
                window.projectUtils.formatLieuProjet(sessions) : 
                (sessions.length === 1 ? sessions[0].lieu : 'Plusieurs lieux');
            
            if (!lieuFormatté || lieuFormatté === '') {
                console.warn('⚠️ [useProjects.updateProjectLieu] Aucun lieu formaté généré');
                return null;
            }
            
            // Mettre à jour le projet
            const { data, error: updateError } = await supabase
                .from('projects')
                .update({ lieu_projet: lieuFormatté })
                .eq('id', projectId)
                .select(`
                    *,
                    entreprise:entreprise_id(id, nom, adresse),
                    logiciel:logiciel_id(id, nom, description),
                    commercial:commercial_id(id, prenom, nom, email),
                    contact:contact_id(id, prenom, nom, email)
                `)
                .single();
            
            if (updateError) {
                console.error('❌ [useProjects.updateProjectLieu] Erreur mise à jour:', updateError);
                throw updateError;
            }
            
            console.log(`✅ [useProjects.updateProjectLieu] Projet ${projectId} mis à jour avec lieu: "${lieuFormatté}"`);
            
            // Invalider le cache et recharger
            cacheRef.current.timestamp = null;
            await fetchProjects(true);
            
            return data;
        } catch (err) {
            console.error('❌ [useProjects.updateProjectLieu] Erreur:', err);
            setError(err.message);
            throw err;
        }
    }, [supabase, fetchProjects]);
    
    // NOUVELLE FONCTION: Synchroniser la période du projet avec ses événements de formation
    const synchronizeProjectPeriode = useCallback(async (projectId) => {
        try {
            console.log(`🔄 [useProjects.synchronizeProjectPeriode] Synchronisation période pour projet ${projectId}`);
            setError(null);
            
            // Utiliser la fonction utilitaire si disponible
            if (window.projectUtils && window.projectUtils.synchronizeProjectPeriode) {
                const success = await window.projectUtils.synchronizeProjectPeriode(projectId, null, supabase);
                if (success) {
                    // Invalider le cache et recharger les projets
                    cacheRef.current.timestamp = null;
                    await fetchProjects(true);
                }
                return success;
            } else {
                console.warn('⚠️ [useProjects.synchronizeProjectPeriode] projectUtils non disponible');
                return false;
            }
        } catch (err) {
            console.error('❌ [useProjects.synchronizeProjectPeriode] Erreur:', err);
            setError(err.message);
            return false;
        }
    }, [supabase, fetchProjects]);
    
    // NOUVELLE FONCTION: Mettre à jour la période du projet basé sur des sessions
    const updateProjectPeriode = useCallback(async (projectId, sessions) => {
        try {
            console.log(`📅 [useProjects.updateProjectPeriode] Mise à jour période pour projet ${projectId}`);
            setError(null);
            
            // Formater la période basée sur les sessions
            const periodeFormatée = window.projectUtils ? 
                window.projectUtils.formatPeriodeProjet(sessions) : 
                (sessions.length === 1 ? 
                    window.projectUtils?.formatDateRange(sessions[0].dateDebut, sessions[0].dateFin) || 'À définir' : 
                    'Plusieurs périodes');
            
            if (!periodeFormatée || periodeFormatée === '') {
                console.warn('⚠️ [useProjects.updateProjectPeriode] Aucune période formatée générée');
                return null;
            }
            
            // Mettre à jour le projet
            const { data, error: updateError } = await supabase
                .from('projects')
                .update({ periode_souhaitee: periodeFormatée })
                .eq('id', projectId)
                .select(`
                    *,
                    entreprise:entreprise_id(id, nom, adresse),
                    logiciel:logiciel_id(id, nom, description),
                    commercial:commercial_id(id, prenom, nom, email),
                    contact:contact_id(id, prenom, nom, email)
                `)
                .single();
            
            if (updateError) {
                console.error('❌ [useProjects.updateProjectPeriode] Erreur mise à jour:', updateError);
                throw updateError;
            }
            
            console.log(`✅ [useProjects.updateProjectPeriode] Projet ${projectId} mis à jour avec période: "${periodeFormatée}"`);
            
            // Invalider le cache et recharger
            cacheRef.current.timestamp = null;
            await fetchProjects(true);
            
            return data;
        } catch (err) {
            console.error('❌ [useProjects.updateProjectPeriode] Erreur:', err);
            setError(err.message);
            throw err;
        }
    }, [supabase, fetchProjects]);
    
    // FONCTION DE DÉBOGAGE: Invalider le cache et forcer le rechargement
    const invalidateCache = useCallback(async () => {
        console.log('🔄 [useProjects] Invalidation du cache et rechargement forcé des projets');
        cacheRef.current.timestamp = null;
        await fetchProjects(true);
    }, [fetchProjects]);
    
    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);
    
    return { 
        projects, 
        loading, 
        error, 
        createProject, 
        updateProject, 
        deleteProject, 
        updateProjectPdc, 
        resetProjectPdc, 
        refetch: fetchProjects,
        // Nouvelles fonctions pour la gestion des lieux
        synchronizeProjectLieu,
        updateProjectLieu,
        // Nouvelles fonctions pour la gestion des périodes
        synchronizeProjectPeriode,
        updateProjectPeriode,
        // Fonction de débogage
        invalidateCache
    };
}

// Export global
window.useProjects = useProjects;