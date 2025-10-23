// Hook personnalisé pour la gestion des utilisateurs
function useUsers() {
    const { useState, useEffect, useCallback } = React;
    const supabase = window.supabaseConfig.client;
    
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const { data, error: fetchError } = await supabase
                .from('user_profile')
                .select(`
                    *,
                    entreprise:entreprise_id(id, nom, type_entreprise),
                    service:service_id(id, nom),
                    fonction:fonction_id(id, nom),
                    user_competence!user_id(
                        id,
                        niveau,
                        logiciel:logiciel_id(
                            id,
                            nom,
                            logo
                        )
                    )
                `)
                .order('created_at', { ascending: false });
            
            if (fetchError) throw fetchError;
            
            // RLS gère maintenant le filtrage automatiquement
            // Plus besoin de filtrer côté frontend
            setUsers(data || []);
        } catch (err) {
            console.error('Erreur lors du chargement des utilisateurs:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);
    
    const createUser = async (user) => {
        try {
            setError(null);
            const { data, error: insertError } = await supabase
                .from('user_profile')
                .insert(user)
                .select()
                .single();
            
            if (insertError) throw insertError;
            await fetchUsers();
            return data;
        } catch (err) {
            console.error('Erreur lors de la création:', err);
            setError(err.message);
            throw err;
        }
    };
    
    const createUserWithAuth = async (userData) => {
        try {
            setError(null);
            
            console.log('🔄 Début création utilisateur:', { email: userData.email, nom: userData.nom, prenom: userData.prenom });
            
            // Extraire email et password des données
            const { email, password, ...profileData } = userData;
            
            if (!email || !password) {
                throw new Error('Email et mot de passe sont requis');
            }
            
            console.log('📧 Données profil à insérer:', profileData);
            
            // Créer d'abord le compte auth avec confirmation désactivée
            console.log('🔐 Création compte auth...');
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    emailRedirectTo: window.location.origin,
                    data: {
                        email_confirm: false
                    }
                }
            });
            
            if (authError) {
                console.error('❌ Erreur auth:', authError);
                if (authError.message.includes('already registered')) {
                    throw new Error('Cet email est déjà utilisé');
                }
                throw authError;
            }
            
            if (!authData.user) {
                console.error('❌ Pas de données utilisateur retournées');
                throw new Error('Erreur lors de la création du compte');
            }
            
            console.log('✅ Compte auth créé:', authData.user.id);
            
            // Créer le profil avec le même ID que le compte auth
            console.log('👤 Création profil utilisateur...');
            const { data: profileDataResult, error: profileError } = await supabase
                .from('user_profile')
                .insert({
                    ...profileData,
                    id: authData.user.id,
                    email: email  // Stocker l'email dans user_profile aussi
                })
                .select()
                .single();
            
            if (profileError) {
                console.error('❌ Erreur profil:', profileError);
                console.log('🗑️ Nettoyage : compte auth sera supprimé par cascade ou RLS');
                throw profileError;
            }
            
            console.log('✅ Profil créé:', profileDataResult.id);

            await fetchUsers();

            // Émettre l'événement pour notifier les autres composants
            if (window.EventBus && window.EventBusEvents) {
                window.EventBus.emit(window.EventBusEvents.USER_CREATED, {
                    userId: profileDataResult.id,
                    user: profileDataResult,
                    timestamp: new Date().toISOString()
                });
            }

            return profileDataResult;
        } catch (err) {
            console.error('💥 Erreur finale création utilisateur:', err);
            setError(err.message);
            throw err;
        }
    };
    
    const updateUser = async (id, updates) => {
        try {
            setError(null);
            const { data, error: updateError } = await supabase
                .from('user_profile')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (updateError) throw updateError;

            await fetchUsers();

            // Émettre l'événement pour notifier les autres composants
            if (window.EventBus && window.EventBusEvents) {
                window.EventBus.emit(window.EventBusEvents.USER_UPDATED, {
                    userId: data.id,
                    user: data,
                    timestamp: new Date().toISOString()
                });
            }

            return data;
        } catch (err) {
            console.error('Erreur lors de la mise à jour:', err);
            setError(err.message);
            throw err;
        }
    };
    
    const deleteUser = async (id) => {
        try {
            setError(null);
            
            // Suppression en cascade pour éviter les erreurs de contraintes de clés étrangères
            console.log(`🗑️ Début suppression utilisateur ${id}`);
            
            // 1. Supprimer les compétences utilisateur
            console.log('🗑️ Suppression des compétences...');
            const { error: competencesError } = await supabase
                .from('user_competence')
                .delete()
                .eq('user_id', id);
            
            if (competencesError) {
                console.error('Erreur suppression compétences:', competencesError);
                throw new Error(`Erreur lors de la suppression des compétences: ${competencesError.message}`);
            }
            
            // 2. Supprimer les événements de planning
            console.log('🗑️ Suppression des événements de planning...');
            const { error: evenementsError } = await supabase
                .from('evenement')
                .delete()
                .eq('user_id', id);
            
            if (evenementsError) {
                console.error('Erreur suppression événements:', evenementsError);
                throw new Error(`Erreur lors de la suppression des événements: ${evenementsError.message}`);
            }
            
            // 3. Retirer l'utilisateur de la liste des stagiaires des projets
            console.log('🗑️ Mise à jour des projets (suppression des listes de stagiaires)...');
            const { data: projectsWithUser, error: projectsSelectError } = await supabase
                .from('projects')
                .select('id, stagiaire_ids')
                .contains('stagiaire_ids', [id]);

            if (projectsSelectError) {
                console.error('Erreur sélection projets:', projectsSelectError);
                throw new Error(`Erreur lors de la recherche des projets: ${projectsSelectError.message}`);
            }

            // Mettre à jour chaque projet pour retirer l'utilisateur de la liste des stagiaires
            if (projectsWithUser && projectsWithUser.length > 0) {
                for (const project of projectsWithUser) {
                    const updatedStagiaires = (project.stagiaire_ids || []).filter(stagiaireId => stagiaireId !== id);

                    const { error: projectUpdateError } = await supabase
                        .from('projects')
                        .update({ stagiaire_ids: updatedStagiaires })
                        .eq('id', project.id);

                    if (projectUpdateError) {
                        console.error(`Erreur mise à jour projet ${project.id}:`, projectUpdateError);
                        throw new Error(`Erreur lors de la mise à jour du projet ${project.id}: ${projectUpdateError.message}`);
                    }
                }
                console.log(`✅ ${projectsWithUser.length} projet(s) mis à jour`);
            }
            
            // 4. Supprimer les événements où l'utilisateur est dans client_user_id
            console.log('🗑️ Mise à jour des événements (suppression des listes client_user_id)...');
            const { data: eventsWithUser, error: eventsSelectError } = await supabase
                .from('evenement')
                .select('id, client_user_id')
                .contains('client_user_id', [id]);
            
            if (eventsSelectError) {
                console.error('Erreur sélection événements:', eventsSelectError);
                throw new Error(`Erreur lors de la recherche des événements: ${eventsSelectError.message}`);
            }
            
            // Mettre à jour chaque événement pour retirer l'utilisateur de la liste client_user_id
            if (eventsWithUser && eventsWithUser.length > 0) {
                for (const event of eventsWithUser) {
                    const updatedClientUserIds = (event.client_user_id || []).filter(clientId => clientId !== id);
                    
                    const { error: eventUpdateError } = await supabase
                        .from('evenement')
                        .update({ client_user_id: updatedClientUserIds })
                        .eq('id', event.id);
                    
                    if (eventUpdateError) {
                        console.error(`Erreur mise à jour événement ${event.id}:`, eventUpdateError);
                        throw new Error(`Erreur lors de la mise à jour de l'événement ${event.id}: ${eventUpdateError.message}`);
                    }
                }
                console.log(`✅ ${eventsWithUser.length} événement(s) mis à jour`);
            }
            
            // 5. Mettre à jour les projets où l'utilisateur est contact
            console.log('🗑️ Mise à jour des projets (suppression contact_id)...');
            const { data: projectsAsContact, error: projectsContactSelectError } = await supabase
                .from('projects')
                .select('id, name')
                .eq('contact_id', id);
            
            if (projectsContactSelectError) {
                console.error('Erreur sélection projets (contact):', projectsContactSelectError);
                throw new Error(`Erreur lors de la recherche des projets (contact): ${projectsContactSelectError.message}`);
            }
            
            if (projectsAsContact && projectsAsContact.length > 0) {
                const { error: projectsContactUpdateError } = await supabase
                    .from('projects')
                    .update({ contact_id: null })
                    .eq('contact_id', id);
                
                if (projectsContactUpdateError) {
                    console.error('Erreur mise à jour projets (contact):', projectsContactUpdateError);
                    throw new Error(`Erreur lors de la mise à jour des projets (contact): ${projectsContactUpdateError.message}`);
                }
                console.log(`✅ ${projectsAsContact.length} projet(s) mis à jour (contact retiré)`);
            }
            
            // 6. Mettre à jour les projets où l'utilisateur est commercial
            console.log('🗑️ Mise à jour des projets (suppression commercial_id)...');
            const { data: projectsAsCommercial, error: projectsCommercialSelectError } = await supabase
                .from('projects')
                .select('id, name')
                .eq('commercial_id', id);
            
            if (projectsCommercialSelectError) {
                console.error('Erreur sélection projets (commercial):', projectsCommercialSelectError);
                throw new Error(`Erreur lors de la recherche des projets (commercial): ${projectsCommercialSelectError.message}`);
            }
            
            if (projectsAsCommercial && projectsAsCommercial.length > 0) {
                const { error: projectsCommercialUpdateError } = await supabase
                    .from('projects')
                    .update({ commercial_id: null })
                    .eq('commercial_id', id);
                
                if (projectsCommercialUpdateError) {
                    console.error('Erreur mise à jour projets (commercial):', projectsCommercialUpdateError);
                    throw new Error(`Erreur lors de la mise à jour des projets (commercial): ${projectsCommercialUpdateError.message}`);
                }
                console.log(`✅ ${projectsAsCommercial.length} projet(s) mis à jour (commercial retiré)`);
            }
            
            // 7. Mettre à jour les compétences où l'utilisateur est évaluateur
            console.log('🗑️ Mise à jour des compétences (suppression evaluateur_id)...');
            const { data: competencesAsEvaluateur, error: competencesEvaluateurSelectError } = await supabase
                .from('user_competence')
                .select('id')
                .eq('evaluateur_id', id);
            
            if (competencesEvaluateurSelectError) {
                console.error('Erreur sélection compétences (évaluateur):', competencesEvaluateurSelectError);
                throw new Error(`Erreur lors de la recherche des compétences (évaluateur): ${competencesEvaluateurSelectError.message}`);
            }
            
            if (competencesAsEvaluateur && competencesAsEvaluateur.length > 0) {
                const { error: competencesEvaluateurUpdateError } = await supabase
                    .from('user_competence')
                    .update({ evaluateur_id: null })
                    .eq('evaluateur_id', id);
                
                if (competencesEvaluateurUpdateError) {
                    console.error('Erreur mise à jour compétences (évaluateur):', competencesEvaluateurUpdateError);
                    throw new Error(`Erreur lors de la mise à jour des compétences (évaluateur): ${competencesEvaluateurUpdateError.message}`);
                }
                console.log(`✅ ${competencesAsEvaluateur.length} compétence(s) mise(s) à jour (évaluateur retiré)`);
            }
            
            // 8. Mettre à jour les tâches où l'utilisateur est assigné
            console.log('🗑️ Mise à jour des tâches (suppression assigned_to)...');
            const { data: tasksAssigned, error: tasksAssignedSelectError } = await supabase
                .from('tasks')
                .select('id, title')
                .eq('assigned_to', id);
            
            if (tasksAssignedSelectError) {
                console.error('Erreur sélection tâches (assigné):', tasksAssignedSelectError);
                throw new Error(`Erreur lors de la recherche des tâches (assigné): ${tasksAssignedSelectError.message}`);
            }
            
            if (tasksAssigned && tasksAssigned.length > 0) {
                const { error: tasksAssignedUpdateError } = await supabase
                    .from('tasks')
                    .update({ assigned_to: null })
                    .eq('assigned_to', id);
                
                if (tasksAssignedUpdateError) {
                    console.error('Erreur mise à jour tâches (assigné):', tasksAssignedUpdateError);
                    throw new Error(`Erreur lors de la mise à jour des tâches (assigné): ${tasksAssignedUpdateError.message}`);
                }
                console.log(`✅ ${tasksAssigned.length} tâche(s) mise(s) à jour (assignation retirée)`);
            }
            
            // 9. Mettre à jour les tâches créées par l'utilisateur
            console.log('🗑️ Mise à jour des tâches (suppression created_by)...');
            const { data: tasksCreated, error: tasksCreatedSelectError } = await supabase
                .from('tasks')
                .select('id, title')
                .eq('created_by', id);
            
            if (tasksCreatedSelectError) {
                console.error('Erreur sélection tâches (créateur):', tasksCreatedSelectError);
                throw new Error(`Erreur lors de la recherche des tâches (créateur): ${tasksCreatedSelectError.message}`);
            }
            
            if (tasksCreated && tasksCreated.length > 0) {
                const { error: tasksCreatedUpdateError } = await supabase
                    .from('tasks')
                    .update({ created_by: null })
                    .eq('created_by', id);
                
                if (tasksCreatedUpdateError) {
                    console.error('Erreur mise à jour tâches (créateur):', tasksCreatedUpdateError);
                    throw new Error(`Erreur lors de la mise à jour des tâches (créateur): ${tasksCreatedUpdateError.message}`);
                }
                console.log(`✅ ${tasksCreated.length} tâche(s) mise(s) à jour (créateur retiré)`);
            }
            
            // 10. Finalement, supprimer le profil utilisateur
            console.log('🗑️ Suppression du profil utilisateur...');
            const { error: deleteError } = await supabase
                .from('user_profile')
                .delete()
                .eq('id', id);
            
            if (deleteError) {
                console.error('Erreur suppression profil:', deleteError);
                throw new Error(`Erreur lors de la suppression du profil: ${deleteError.message}`);
            }
            
            console.log('✅ Utilisateur supprimé avec succès');
            await fetchUsers();

            // Émettre l'événement pour notifier les autres composants
            if (window.EventBus && window.EventBusEvents) {
                window.EventBus.emit(window.EventBusEvents.USER_DELETED, {
                    userId: id,
                    timestamp: new Date().toISOString()
                });
            }

        } catch (err) {
            console.error('Erreur lors de la suppression:', err);
            setError(err.message);
            throw err;
        }
    };
    
    // Récupérer les utilisateurs d'une entreprise spécifique
    const getUsersByEntreprise = useCallback(async (entrepriseId) => {
        try {
            if (!entrepriseId) return [];
            
            const { data, error: fetchError } = await supabase
                .from('user_profile')
                .select(`
                    id,
                    prenom,
                    nom,
                    email,
                    entreprise:entreprise_id(id, nom),
                    service:service_id(id, nom),
                    fonction:fonction_id(id, nom)
                `)
                .eq('entreprise_id', entrepriseId)
                .order('prenom', { ascending: true });
            
            if (fetchError) throw fetchError;
            return data || [];
        } catch (err) {
            console.error('Erreur lors du chargement des utilisateurs d\'entreprise:', err);
            return [];
        }
    }, []);

    // Résoudre automatiquement un service par nom (créer si n'existe pas)
    const resolveServiceByName = async (serviceName) => {
        if (!serviceName || serviceName.trim() === '') return null;
        
        const nom = serviceName.trim();
        
        // Chercher le service existant
        const { data: existingService, error: searchError } = await supabase
            .from('service')
            .select('id, nom')
            .ilike('nom', nom)
            .single();
        
        if (searchError && searchError.code !== 'PGRST116') {
            throw searchError;
        }
        
        if (existingService) {
            return existingService.id;
        }
        
        // Créer le nouveau service
        const { data: newService, error: createError } = await supabase
            .from('service')
            .insert({ nom })
            .select('id')
            .single();
        
        if (createError) throw createError;
        return newService.id;
    };

    // Résoudre automatiquement une fonction par nom (créer si n'existe pas)
    const resolveFonctionByName = async (fonctionName) => {
        if (!fonctionName || fonctionName.trim() === '') return null;
        
        const nom = fonctionName.trim();
        
        // Chercher la fonction existante
        const { data: existingFonction, error: searchError } = await supabase
            .from('fonction')
            .select('id, nom')
            .ilike('nom', nom)
            .single();
        
        if (searchError && searchError.code !== 'PGRST116') {
            throw searchError;
        }
        
        if (existingFonction) {
            return existingFonction.id;
        }
        
        // Créer la nouvelle fonction
        const { data: newFonction, error: createError } = await supabase
            .from('fonction')
            .insert({ nom })
            .select('id')
            .single();
        
        if (createError) throw createError;
        return newFonction.id;
    };

    // Obtenir l'entreprise Arkance (type interne)
    const getArkanceEntreprise = async () => {
        const { data: arkanceEntreprise, error } = await supabase
            .from('entreprise')
            .select('id')
            .eq('type_entreprise', 'interne')
            .single();
        
        if (error) throw new Error('Impossible de trouver l\'entreprise Arkance (type interne)');
        return arkanceEntreprise.id;
    };

    // Import en lot des utilisateurs depuis CSV
    const importUsersFromCSV = async (csvData, progressCallback) => {
        const results = { success: [], errors: [] };
        
        try {
            // Obtenir l'ID de l'entreprise Arkance
            const arkanceEntrepriseId = await getArkanceEntreprise();
            
            for (let i = 0; i < csvData.length; i++) {
                const userData = csvData[i];
                
                try {
                    // Appeler le callback de progression
                    if (progressCallback) {
                        progressCallback({ current: i, total: csvData.length });
                    }
                    
                    // Résoudre le service et la fonction
                    const serviceId = await resolveServiceByName(userData.service);
                    const fonctionId = await resolveFonctionByName(userData.fonction);
                    
                    // Préparer les données utilisateur complètes
                    const completeUserData = {
                        nom: userData.nom,
                        prenom: userData.prenom,
                        email: userData.email,
                        telephone: userData.telephone,
                        password: userData.motDePasse,
                        role: userData.role,
                        entreprise_id: arkanceEntrepriseId,
                        service_id: serviceId,
                        fonction_id: fonctionId
                    };
                    
                    // Créer l'utilisateur avec auth
                    const createdUser = await createUserWithAuth(completeUserData);
                    
                    results.success.push({
                        line: userData._lineNumber,
                        nom: userData.nom,
                        prenom: userData.prenom,
                        email: userData.email,
                        id: createdUser.id
                    });
                    
                } catch (userError) {
                    console.error(`Erreur import ligne ${userData._lineNumber}:`, userError);
                    results.errors.push({
                        line: userData._lineNumber,
                        nom: userData.nom,
                        prenom: userData.prenom,
                        email: userData.email,
                        error: userError.message || 'Erreur inconnue'
                    });
                }
            }
            
            // Callback final de progression
            if (progressCallback) {
                progressCallback({ current: csvData.length, total: csvData.length });
            }
            
        } catch (globalError) {
            console.error('Erreur globale lors de l\'import:', globalError);
            throw new Error(`Erreur globale: ${globalError.message}`);
        }
        
        return results;
    };
    
    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);
    
    return { 
        users, 
        loading, 
        error, 
        createUser, 
        createUserWithAuth,
        updateUser, 
        deleteUser, 
        refetch: fetchUsers,
        getUsersByEntreprise,
        importUsersFromCSV,
        resolveServiceByName,
        resolveFonctionByName
    };
}

// Export global
window.useUsers = useUsers;