// Hook personnalisé pour les tâches avec temps réel
function useTasks() {
    const { useState, useEffect, useCallback } = React;
    const supabase = window.supabaseConfig.client;
    const { user } = window.useAuth();
    // TEMPORAIRE: Désactivation du temps réel pour résoudre l'erreur 529
    // const { createChannel, removeChannel } = window.useRealtime();
    
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const fetchTasks = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const { data, error: fetchError } = await supabase
                .from('tasks')
                .select(`
                    *,
                    project:project_id(id, name, 
                        entreprise:entreprise_id(id, nom, adresse)
                    ),
                    assigned_user:assigned_to(id, prenom, nom),
                    created_user:created_by(id, prenom, nom)
                `)
                .order('workflow_order', { ascending: true })
                .order('created_at', { ascending: false });
            
            if (fetchError) throw fetchError;
            setTasks(data || []);
        } catch (err) {
            console.error('Erreur lors du chargement des tâches:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);
    
    // TEMPORAIRE: Fonction pour gérer les mises à jour temps réel (désactivée)
    /*
    const handleRealtimeChange = useCallback(async (payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;
        
        // Pour les changements, nous devons re-fetch les données avec les relations
        // car le payload temps réel ne contient que les données de base
        if (eventType === 'INSERT' || eventType === 'UPDATE') {
            try {
                const { data: fullRecord } = await supabase
                    .from('tasks')
                    .select(`
                        *,
                        project:project_id(id, name, 
                            entreprise:entreprise_id(id, nom, adresse)
                        ),
                        assigned_user:assigned_to(id, prenom, nom),
                        created_user:created_by(id, prenom, nom)
                    `)
                    .eq('id', newRecord.id)
                    .single();
                
                setTasks(current => {
                    if (eventType === 'INSERT') {
                        // Ajouter la nouvelle tâche si elle n'existe pas déjà
                        if (!current.find(t => t.id === fullRecord.id)) {
                            return [fullRecord, ...current];
                        }
                        return current;
                    } else {
                        // Mettre à jour la tâche existante
                        return current.map(t => 
                            t.id === fullRecord.id ? fullRecord : t
                        );
                    }
                });
            } catch (err) {
                console.error('Erreur lors du fetch des détails de la tâche:', err);
            }
        } else if (eventType === 'DELETE') {
            setTasks(current => current.filter(t => t.id !== oldRecord.id));
        }
    }, [supabase]);
    */
    
    const createTask = async (task) => {
        try {
            setError(null);
            const { data, error: insertError } = await supabase
                .from('tasks')
                .insert({
                    ...task,
                    created_by: user?.id || null
                })
                .select(`
                    *,
                    project:project_id(id, name, 
                        entreprise:entreprise_id(id, nom, adresse)
                    ),
                    assigned_user:assigned_to(id, prenom, nom),
                    created_user:created_by(id, prenom, nom)
                `)
                .single();
            
            if (insertError) throw insertError;
            // TEMPORAIRE: Rafraîchir manuellement (temps réel désactivé)
            await fetchTasks();
            return data;
        } catch (err) {
            console.error('Erreur lors de la création:', err);
            setError(err.message);
            throw err;
        }
    };
    
    const updateTask = async (id, updates) => {
        try {
            setError(null);
            const { data, error: updateError } = await supabase
                .from('tasks')
                .update(updates)
                .eq('id', id)
                .select(`
                    *,
                    project:project_id(id, name, 
                        entreprise:entreprise_id(id, nom, adresse)
                    ),
                    assigned_user:assigned_to(id, prenom, nom),
                    created_user:created_by(id, prenom, nom)
                `)
                .single();
            
            if (updateError) throw updateError;
            // TEMPORAIRE: Rafraîchir manuellement (temps réel désactivé)
            await fetchTasks();
            return data;
        } catch (err) {
            console.error('Erreur lors de la mise à jour:', err);
            setError(err.message);
            throw err;
        }
    };
    
    const deleteTask = async (id) => {
        try {
            setError(null);
            const { error: deleteError } = await supabase
                .from('tasks')
                .delete()
                .eq('id', id);
            
            if (deleteError) throw deleteError;
            // TEMPORAIRE: Rafraîchir manuellement (temps réel désactivé)
            await fetchTasks();
        } catch (err) {
            console.error('Erreur lors de la suppression:', err);
            setError(err.message);
            throw err;
        }
    };
    
    // Fonction pour mettre à jour uniquement la description d'une tâche
    const updateTaskDescription = async (taskId, newDescription) => {
        try {
            console.log(`🔄 [updateTaskDescription] Mise à jour description tâche ${taskId}:`, newDescription);
            setError(null);
            
            const { data, error: updateError } = await supabase
                .from('tasks')
                .update({ 
                    description: newDescription,
                    updated_at: new Date().toISOString()
                })
                .eq('id', taskId)
                .select()
                .single();
            
            if (updateError) throw updateError;
            
            console.log("✅ [updateTaskDescription] Description mise à jour avec succès:", data);
            return data;
        } catch (err) {
            console.error('❌ [updateTaskDescription] Erreur lors de la mise à jour de la description:', err);
            setError(err.message);
            throw err;
        }
    };
    
    const completeTask = async (taskId) => {
        try {
            setError(null);
            const { data, error: updateError } = await supabase
                .from('tasks')
                .update({ 
                    status: 'completed',
                    updated_at: new Date().toISOString()
                })
                .eq('id', taskId)
                .select(`
                    *,
                    project:project_id(id, name, 
                        entreprise:entreprise_id(id, nom, adresse)
                    ),
                    assigned_user:assigned_to(id, prenom, nom),
                    created_user:created_by(id, prenom, nom)
                `)
                .single();
            
            if (updateError) throw updateError;
            return data;
        } catch (err) {
            console.error('Erreur lors de la completion de la tâche:', err);
            setError(err.message);
            throw err;
        }
    };

    const autoCompleteQualificationTask = async (projectId, pdcData) => {
        try {
            setError(null);
            console.log(`🔧 [autoCompleteQualificationTask] Recherche tâche "Qualification" pour projet ${projectId}`);
            
            // Chercher la tâche "Qualification" pour ce projet (sans critère de statut)
            const { data: qualificationTask, error: findError } = await supabase
                .from('tasks')
                .select('id, title, status, assigned_to')
                .eq('project_id', projectId)
                .eq('title', 'Qualification')
                .eq('workflow_order', 2)
                .single();
            
            if (findError) {
                if (findError.code === 'PGRST116') {
                    console.log('Aucune tâche "Qualification" trouvée pour ce projet');
                    return null;
                } else {
                    throw findError;
                }
            }
            
            console.log(`✅ [autoCompleteQualificationTask] Tâche "Qualification" trouvée:`, qualificationTask);
            console.log(`🔍 [autoCompleteQualificationTask] Assignation actuelle: ${qualificationTask.assigned_to}`);
            
            // Créer la description personnalisée (courte pour l'affichage dans les tableaux)
            const pdcNumber = pdcData.pdc_number || 'N/A';
            
            const newDescription = `Plan de formation sélectionné par le client. PDC N°${pdcNumber}`;
            console.log(`📝 [autoCompleteQualificationTask] Nouvelle description: ${newDescription}`);
            console.log(`🚫 [autoCompleteQualificationTask] Réinitialisation de l'assignation (assigned_to: null)`);
            
            // Marquer la tâche comme terminée avec la nouvelle description (réinitialiser l'assignation)
            const { data, error: updateError } = await supabase
                .from('tasks')
                .update({ 
                    status: 'completed',
                    description: newDescription,
                    assigned_to: null, // Réinitialiser l'assignation car le client a choisi lui-même
                    updated_at: new Date().toISOString()
                })
                .eq('id', qualificationTask.id)
                .select(`
                    *,
                    project:project_id(id, name, 
                        entreprise:entreprise_id(id, nom, adresse)
                    ),
                    assigned_user:assigned_to(id, prenom, nom),
                    created_user:created_by(id, prenom, nom)
                `)
                .single();
            
            if (updateError) throw updateError;
            
            console.log(`✅ Tâche "Qualification" automatiquement marquée comme terminée pour le projet ${projectId}`);
            console.log(`✅ [autoCompleteQualificationTask] Assignation finale: ${data.assigned_to} (devrait être null)`);
            console.log(`✅ [autoCompleteQualificationTask] Statut final: ${data.status}`);
            return data;
            
        } catch (err) {
            console.error('Erreur lors de l\'auto-complétion de la tâche Qualification:', err);
            setError(err.message);
            throw err;
        }
    };

    const autoCompleteDevisTask = async (projectId, devisUrl) => {
        try {
            setError(null);
            console.log(`🔧 [autoCompleteDevisTask] Recherche tâche "Devis" pour projet ${projectId}`);
            
            // Chercher la tâche "Devis" pour ce projet
            const { data: devisTask, error: findError } = await supabase
                .from('tasks')
                .select('id, title, status, workflow_order')
                .eq('project_id', projectId)
                .eq('title', 'Devis')
                .eq('workflow_order', 3)
                .in('status', ['todo', 'in_progress'])
                .single();
            
            if (findError) {
                console.log('Aucune tâche "Devis" en attente trouvée pour ce projet:', findError);
                return null;
            }
            
            // Créer la description personnalisée
            const newDescription = `Devis uploadé avec succès. Document disponible en pièce jointe.`;
            
            // Marquer la tâche comme terminée avec la nouvelle description
            const { data, error: updateError } = await supabase
                .from('tasks')
                .update({ 
                    status: 'completed',
                    description: newDescription,
                    updated_at: new Date().toISOString()
                })
                .eq('id', devisTask.id)
                .select(`
                    *,
                    project:project_id(id, name, 
                        entreprise:entreprise_id(id, nom, adresse)
                    ),
                    assigned_user:assigned_to(id, prenom, nom),
                    created_user:created_by(id, prenom, nom)
                `)
                .single();
            
            if (updateError) throw updateError;
            
            console.log(`✅ Tâche "Devis" automatiquement marquée comme terminée pour le projet ${projectId}`);
            
            // Auto-déverrouiller la tâche suivante "Validation du devis"
            await autoUnlockValidationTask(projectId);
            
            return data;
            
        } catch (err) {
            console.error('Erreur lors de l\'auto-complétion de la tâche Devis:', err);
            setError(err.message);
            throw err;
        }
    };

    const autoUnlockValidationTask = async (projectId) => {
        try {
            console.log(`🔧 [autoUnlockValidationTask] Recherche tâche "Validation du devis" pour projet ${projectId}`);
            
            // Vérifier que la tâche "Devis" est bien terminée
            const { data: devisTask, error: devisError } = await supabase
                .from('tasks')
                .select('id, status')
                .eq('project_id', projectId)
                .eq('title', 'Devis')
                .eq('workflow_order', 3)
                .single();
            
            if (devisError || devisTask.status !== 'completed') {
                console.log('Tâche "Devis" non terminée, ne peut pas déverrouiller "Validation du devis"');
                return null;
            }
            
            // Chercher la tâche "Validation du devis" pour ce projet
            const { data: validationTask, error: findError } = await supabase
                .from('tasks')
                .select('id, title, status, workflow_order')
                .eq('project_id', projectId)
                .eq('title', 'Validation du devis')
                .eq('workflow_order', 4)
                .single();
            
            if (findError) {
                console.log('Aucune tâche "Validation du devis" trouvée pour ce projet:', findError);
                return null;
            }
            
            // Si la tâche est déjà active ou terminée, ne rien faire
            if (validationTask.status === 'todo' || validationTask.status === 'in_progress' || validationTask.status === 'completed') {
                console.log('Tâche "Validation du devis" déjà accessible ou terminée');
                return validationTask;
            }
            
            // Mettre la tâche en mode "todo" pour la déverrouiller
            const { data, error: updateError } = await supabase
                .from('tasks')
                .update({ 
                    status: 'todo',
                    updated_at: new Date().toISOString()
                })
                .eq('id', validationTask.id)
                .select(`
                    *,
                    project:project_id(id, name, 
                        entreprise:entreprise_id(id, nom, adresse)
                    ),
                    assigned_user:assigned_to(id, prenom, nom),
                    created_user:created_by(id, prenom, nom)
                `)
                .single();
            
            if (updateError) throw updateError;
            
            console.log(`✅ Tâche "Validation du devis" automatiquement déverrouillée pour le projet ${projectId}`);
            return data;
            
        } catch (err) {
            console.error('Erreur lors du déverrouillage de la tâche Validation du devis:', err);
            // Ne pas relancer l'erreur car c'est une action secondaire
            return null;
        }
    };

    const autoCompleteValidationTask = async (projectId, signedDevisUrl) => {
        try {
            setError(null);
            console.log(`🔧 [autoCompleteValidationTask] Recherche tâche "Validation du devis" pour projet ${projectId}`);
            
            // Chercher la tâche "Validation du devis" pour ce projet
            const { data: validationTask, error: findError } = await supabase
                .from('tasks')
                .select('id, title, status, workflow_order')
                .eq('project_id', projectId)
                .eq('title', 'Validation du devis')
                .eq('workflow_order', 4)
                .in('status', ['todo', 'in_progress'])
                .single();
            
            if (findError) {
                console.log('Aucune tâche "Validation du devis" en attente trouvée pour ce projet:', findError);
                return null;
            }
            
            // Créer la description personnalisée
            const newDescription = `Devis validé et signé électroniquement par le client. Document signé disponible.`;
            
            // Marquer la tâche comme terminée avec la nouvelle description
            const { data, error: updateError } = await supabase
                .from('tasks')
                .update({ 
                    status: 'completed',
                    description: newDescription,
                    updated_at: new Date().toISOString()
                })
                .eq('id', validationTask.id)
                .select(`
                    *,
                    project:project_id(id, name, 
                        entreprise:entreprise_id(id, nom, adresse)
                    ),
                    assigned_user:assigned_to(id, prenom, nom),
                    created_user:created_by(id, prenom, nom)
                `)
                .single();
            
            if (updateError) throw updateError;
            
            console.log(`✅ Tâche "Validation du devis" automatiquement marquée comme terminée pour le projet ${projectId}`);
            
            // Auto-déverrouiller la tâche suivante "Planification"
            await autoUnlockPlanificationTask(projectId);
            
            return data;
            
        } catch (err) {
            console.error('Erreur lors de l\'auto-complétion de la tâche Validation du devis:', err);
            setError(err.message);
            throw err;
        }
    };

    const autoUnlockPlanificationTask = async (projectId) => {
        try {
            console.log(`🔧 [autoUnlockPlanificationTask] Recherche tâche "Planification" pour projet ${projectId}`);
            
            // Vérifier que la tâche "Validation du devis" est bien terminée
            const { data: validationTask, error: validationError } = await supabase
                .from('tasks')
                .select('id, status')
                .eq('project_id', projectId)
                .eq('title', 'Validation du devis')
                .eq('workflow_order', 4)
                .single();
            
            if (validationError || validationTask.status !== 'completed') {
                console.log('Tâche "Validation du devis" non terminée, ne peut pas déverrouiller "Planification"');
                return null;
            }
            
            // Chercher la tâche "Planification" pour ce projet
            const { data: planificationTask, error: findError } = await supabase
                .from('tasks')
                .select('id, title, status, workflow_order')
                .eq('project_id', projectId)
                .eq('title', 'Planification')
                .eq('workflow_order', 5)
                .single();
            
            if (findError) {
                console.log('Aucune tâche "Planification" trouvée pour ce projet:', findError);
                return null;
            }
            
            // Si la tâche est déjà active ou terminée, ne rien faire
            if (planificationTask.status === 'todo' || planificationTask.status === 'in_progress' || planificationTask.status === 'completed') {
                console.log('Tâche "Planification" déjà accessible ou terminée');
                return planificationTask;
            }
            
            // Mettre la tâche en mode "todo" pour la déverrouiller
            const { data, error: updateError } = await supabase
                .from('tasks')
                .update({ 
                    status: 'todo',
                    updated_at: new Date().toISOString()
                })
                .eq('id', planificationTask.id)
                .select(`
                    *,
                    project:project_id(id, name, 
                        entreprise:entreprise_id(id, nom, adresse)
                    ),
                    assigned_user:assigned_to(id, prenom, nom),
                    created_user:created_by(id, prenom, nom)
                `)
                .single();
            
            if (updateError) throw updateError;
            
            console.log(`✅ Tâche "Planification" automatiquement déverrouillée pour le projet ${projectId}`);
            return data;
            
        } catch (err) {
            console.error('Erreur lors du déverrouillage de la tâche Planification:', err);
            // Ne pas relancer l'erreur car c'est une action secondaire
            return null;
        }
    };
    
    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);
    
    // TEMPORAIRE: Configuration du temps réel (désactivée)
    /*
    useEffect(() => {
        // Créer le channel de subscription pour la table tasks
        const channel = createChannel(
            'tasks-changes',
            'tasks',
            ['INSERT', 'UPDATE', 'DELETE'],
            handleRealtimeChange
        );
        
        // Nettoyage à la destruction du component
        return () => {
            if (channel) {
                removeChannel('tasks-changes');
            }
        };
    }, [createChannel, removeChannel, handleRealtimeChange]);
    */

    const autoCompletePlanificationTask = async (projectId) => {
        try {
            setError(null);
            console.log(`🔧 [autoCompletePlanificationTask] Recherche tâche "Planification" pour projet ${projectId}`);
            
            // Chercher la tâche "Planification" pour ce projet
            const { data: planificationTask, error: findError } = await supabase
                .from('tasks')
                .select('id, title, status, workflow_order')
                .eq('project_id', projectId)
                .eq('title', 'Planification')
                .eq('workflow_order', 5)
                .in('status', ['todo', 'in_progress'])
                .single();
            
            if (findError) {
                console.log('Aucune tâche "Planification" en attente trouvée pour ce projet:', findError);
                return null;
            }
            
            // Créer la description personnalisée
            const newDescription = `Formation planifiée et validée. Sessions programmées avec les stagiaires et formateurs.`;
            
            // Marquer la tâche comme terminée avec la nouvelle description
            const { data, error: updateError } = await supabase
                .from('tasks')
                .update({ 
                    status: 'completed',
                    description: newDescription,
                    updated_at: new Date().toISOString()
                })
                .eq('id', planificationTask.id)
                .select(`
                    *,
                    project:project_id(id, name, 
                        entreprise:entreprise_id(id, nom, adresse)
                    ),
                    assigned_user:assigned_to(id, prenom, nom),
                    created_user:created_by(id, prenom, nom)
                `)
                .single();
            
            if (updateError) throw updateError;
            
            console.log(`✅ Tâche "Planification" automatiquement marquée comme terminée pour le projet ${projectId}`);
            
            return data;
            
        } catch (err) {
            console.error('Erreur lors de l\'auto-complétion de la tâche Planification:', err);
            setError(err.message);
            throw err;
        }
    };

    // Fonction pour remettre la tâche "Génération documents" en statut "todo" après modification des sessions
    const resetDocumentGenerationTask = async (projectId) => {
        try {
            setError(null);
            console.log(`🔄 [resetDocumentGenerationTask] Recherche tâche "Génération documents" pour projet ${projectId}`);
            
            // Chercher la tâche "Génération documents" pour ce projet
            const { data: generationTask, error: findError } = await supabase
                .from('tasks')
                .select('id, title, status, description')
                .eq('project_id', projectId)
                .eq('title', 'Génération documents')
                .eq('workflow_order', 6)
                .single();
            
            if (findError) {
                if (findError.code === 'PGRST116') {
                    console.log('Aucune tâche "Génération documents" trouvée pour ce projet');
                    return null;
                } else {
                    throw findError;
                }
            }
            
            console.log(`📋 [resetDocumentGenerationTask] Tâche "Génération documents" trouvée:`, generationTask);
            
            // Si la tâche est déjà en statut "todo", pas besoin de la modifier
            if (generationTask.status === 'todo') {
                console.log(`ℹ️ [resetDocumentGenerationTask] Tâche déjà en statut "todo", aucune action nécessaire`);
                return generationTask;
            }
            
            // Créer la nouvelle description
            const newDescription = `Documents à régénérer suite à la modification des sessions de formation.`;
            console.log(`📝 [resetDocumentGenerationTask] Remise en statut "todo" avec description: ${newDescription}`);
            
            // Remettre la tâche en statut "todo"
            const { data, error: updateError } = await supabase
                .from('tasks')
                .update({ 
                    status: 'todo',
                    description: newDescription,
                    updated_at: new Date().toISOString()
                })
                .eq('id', generationTask.id)
                .select(`
                    *,
                    project:project_id(id, name, 
                        entreprise:entreprise_id(id, nom, adresse)
                    ),
                    assigned_user:assigned_to(id, prenom, nom),
                    created_user:created_by(id, prenom, nom)
                `)
                .single();
            
            if (updateError) throw updateError;
            
            console.log(`✅ [resetDocumentGenerationTask] Tâche "Génération documents" remise en statut "todo" pour le projet ${projectId}`);
            
            // Rafraîchir la liste des tâches
            await fetchTasks();
            
            return data;
            
        } catch (err) {
            console.error('❌ [resetDocumentGenerationTask] Erreur lors de la remise à zéro de la tâche Génération documents:', err);
            setError(err.message);
            throw err;
        }
    };
    
    return { tasks, loading, error, createTask, updateTask, deleteTask, updateTaskDescription, completeTask, autoCompleteQualificationTask, autoCompleteDevisTask, autoUnlockValidationTask, autoCompleteValidationTask, autoUnlockPlanificationTask, autoCompletePlanificationTask, resetDocumentGenerationTask, refetch: fetchTasks };
}

// Export global
window.useTasks = useTasks;