// Script de migration pour corriger les données de planification de formations
// À exécuter depuis la console du navigateur une fois connecté à l'application

// ÉTAPE 1: Identifier les projets avec incohérences (stagiaires ET lieux)
async function analyserIncohérences() {
    console.log('🔍 === ANALYSE DES INCOHÉRENCES ===');
    
    const supabase = window.supabaseConfig.client;
    
    // Récupérer tous les projets de formation
    const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, name, stagiaires, entreprise_id, type')
        .eq('type', 'formation');
    
    if (projectsError) {
        console.error('❌ Erreur récupération projets:', projectsError);
        return;
    }
    
    console.log(`📊 ${projects.length} projet(s) de formation trouvé(s)`);
    
    const incohérences = [];
    
    for (const project of projects) {
        console.log(`\n🔍 Analyse du projet: ${project.name} (${project.id})`);
        
        // Récupérer tous les événements de formation pour ce projet
        const { data: events, error: eventsError } = await supabase
            .from('evenement')
            .select('id, titre, client_user_id, date_debut')
            .eq('projet_id', project.id)
            .eq('type_evenement', 'formation');
        
        if (eventsError) {
            console.error(`❌ Erreur récupération événements pour projet ${project.id}:`, eventsError);
            continue;
        }
        
        // Analyser les incohérences STAGIAIRES
        const projectStagiaires = project.stagiaires || [];
        const eventsWithStagiaires = events.filter(e => e.client_user_id && e.client_user_id.length > 0);
        const eventsWithoutStagiaires = events.filter(e => !e.client_user_id || e.client_user_id.length === 0);
        
        // Collecter tous les stagiaires uniques des événements
        const eventStagiaires = [...new Set(events.flatMap(e => e.client_user_id || []))];
        
        // Analyser les incohérences LIEUX
        const projectLieu = project.lieu_projet || '';
        const eventLieux = [...new Set(events.map(e => e.lieu || 'À définir'))];
        const lieuFormatéAttendu = window.projectUtils ? 
            window.projectUtils.formatLieuProjetFromEvents(events) : 
            eventLieux.join(', ');
        
        // Analyser les incohérences PÉRIODES
        const projectPeriode = project.periode_souhaitee || '';
        const periodeFormatéeAttendue = window.projectUtils ? 
            window.projectUtils.formatPeriodeProjetFromEvents(events) : 
            'À définir';
        
        console.log(`   📊 Projet: ${projectStagiaires.length} stagiaire(s), lieu: "${projectLieu}", période: "${projectPeriode}"`);
        console.log(`   📅 Événements: ${events.length} total, ${eventsWithStagiaires.length} avec stagiaires, ${eventsWithoutStagiaires.length} sans stagiaires`);
        console.log(`   👥 Stagiaires uniques dans événements: ${eventStagiaires.length}`);
        console.log(`   🏢 Lieux uniques dans événements: ${eventLieux.length} (${eventLieux.join(', ')})`);
        console.log(`   🏢 Lieu formaté attendu: "${lieuFormatéAttendu}"`);
        console.log(`   📅 Période formatée attendue: "${periodeFormatéeAttendue}"`);
        
        // Détecter les incohérences
        const stagiaireIncohérent = 
            projectStagiaires.length === 0 || // Projet sans stagiaires
            eventsWithoutStagiaires.length > 0 || // Événements sans stagiaires
            JSON.stringify(projectStagiaires.sort()) !== JSON.stringify(eventStagiaires.sort()); // Désynchronisation
        
        const lieuIncohérent = 
            !projectLieu || projectLieu === '' || projectLieu === 'À définir' || // Projet sans lieu
            projectLieu !== lieuFormatéAttendu; // Lieu projet différent du formaté
        
        const periodeIncohérente = 
            !projectPeriode || projectPeriode === '' || projectPeriode === 'À définir' || // Projet sans période
            projectPeriode !== periodeFormatéeAttendue; // Période projet différente de la formatée
        
        const hasIncohérence = stagiaireIncohérent || lieuIncohérent || periodeIncohérente;
        
        if (hasIncohérence) {
            const incohérence = {
                projectId: project.id,
                projectName: project.name,
                // Données stagiaires
                projectStagiaires,
                eventStagiaires,
                eventsTotal: events.length,
                eventsWithStagiaires: eventsWithStagiaires.length,
                eventsWithoutStagiaires: eventsWithoutStagiaires.length,
                stagiaireIncohérent,
                // Données lieux
                projectLieu,
                eventLieux,
                lieuFormatéAttendu,
                lieuIncohérent,
                // Données périodes
                projectPeriode,
                periodeFormatéeAttendue,
                periodeIncohérente,
                events: events.map(e => ({
                    id: e.id,
                    titre: e.titre,
                    clientUserIds: e.client_user_id || [],
                    lieu: e.lieu || 'À définir',
                    dateDebut: e.date_debut
                }))
            };
            
            incohérences.push(incohérence);
            const typesIncohérences = [
                stagiaireIncohérent ? 'Stagiaires' : '',
                lieuIncohérent ? 'Lieux' : '',
                periodeIncohérente ? 'Périodes' : ''
            ].filter(Boolean);
            console.log(`   ⚠️ INCOHÉRENCE DÉTECTÉE:`, typesIncohérences.join(', '));
        } else {
            console.log(`   ✅ Données cohérentes`);
        }
    }
    
    console.log(`\n📊 === RÉSUMÉ DE L'ANALYSE ===`);
    console.log(`✅ Projets cohérents: ${projects.length - incohérences.length}`);
    console.log(`⚠️ Projets avec incohérences: ${incohérences.length}`);
    
    return incohérences;
}

// ÉTAPE 2: Corriger les incohérences
async function corrigerIncohérences(incohérences) {
    console.log('\n🔧 === CORRECTION DES INCOHÉRENCES ===');
    
    const supabase = window.supabaseConfig.client;
    let correctionCount = 0;
    
    for (const incohérence of incohérences) {
        console.log(`\n🔧 Correction du projet: ${incohérence.projectName} (${incohérence.projectId})`);
        
        // Stratégie de correction STAGIAIRES:
        // 1. Si le projet a des stagiaires mais les événements non -> propager vers événements
        // 2. Si les événements ont des stagiaires mais pas le projet -> propager vers projet
        // 3. Si différence -> utiliser l'union des deux listes
        
        let stagiairesFinal = [];
        let stratégieStag = '';
        
        if (incohérence.stagiaireIncohérent) {
            if (incohérence.projectStagiaires.length > 0 && incohérence.eventStagiaires.length === 0) {
                // Cas 1: Projet a des stagiaires, événements non
                stagiairesFinal = incohérence.projectStagiaires;
                stratégieStag = 'Propager stagiaires du projet vers événements';
            } else if (incohérence.projectStagiaires.length === 0 && incohérence.eventStagiaires.length > 0) {
                // Cas 2: Événements ont des stagiaires, projet non
                stagiairesFinal = incohérence.eventStagiaires;
                stratégieStag = 'Propager stagiaires des événements vers projet';
            } else {
                // Cas 3: Union des deux listes
                stagiairesFinal = [...new Set([...incohérence.projectStagiaires, ...incohérence.eventStagiaires])];
                stratégieStag = 'Union des stagiaires projet + événements';
            }
            console.log(`   📋 Stratégie Stagiaires: ${stratégieStag}`);
            console.log(`   👥 Stagiaires finaux: ${stagiairesFinal.length} stagiaire(s)`);
        } else {
            stagiairesFinal = incohérence.projectStagiaires;
        }
        
        // Stratégie de correction LIEUX:
        let lieuFinal = '';
        let stratégieLieu = '';
        
        if (incohérence.lieuIncohérent) {
            lieuFinal = incohérence.lieuFormatéAttendu;
            stratégieLieu = 'Utiliser lieu formaté depuis événements';
            console.log(`   📋 Stratégie Lieu: ${stratégieLieu}`);
            console.log(`   🏢 Lieu final: "${lieuFinal}"`);
        } else {
            lieuFinal = incohérence.projectLieu;
        }
        
        // Stratégie de correction PÉRIODES:
        let periodeFinal = '';
        let stratégiePeriode = '';
        
        if (incohérence.periodeIncohérente) {
            periodeFinal = incohérence.periodeFormatéeAttendue;
            stratégiePeriode = 'Utiliser période formatée depuis événements';
            console.log(`   📋 Stratégie Période: ${stratégiePeriode}`);
            console.log(`   📅 Période finale: "${periodeFinal}"`);
        } else {
            periodeFinal = incohérence.projectPeriode;
        }
        
        // Préparer les mises à jour du projet
        const projectUpdates = {};
        if (incohérence.stagiaireIncohérent) {
            projectUpdates.stagiaires = stagiairesFinal;
        }
        if (incohérence.lieuIncohérent) {
            projectUpdates.lieu_projet = lieuFinal;
        }
        if (incohérence.periodeIncohérente) {
            projectUpdates.periode_souhaitee = periodeFinal;
        }
        
        // Mettre à jour le projet
        const { error: projectError } = await supabase
            .from('projects')
            .update(projectUpdates)
            .eq('id', incohérence.projectId);
        
        if (projectError) {
            console.error(`   ❌ Erreur mise à jour projet:`, projectError);
            continue;
        }
        
        console.log(`   ✅ Projet mis à jour avec:`, projectUpdates);
        
        // Mettre à jour tous les événements de formation (seulement les stagiaires, les lieux restent dans leurs événements)
        if (incohérence.stagiaireIncohérent) {
            const updatePromises = incohérence.events.map(async (event) => {
                const { error: eventError } = await supabase
                    .from('evenement')
                    .update({ client_user_id: stagiairesFinal })
                    .eq('id', event.id);
                
                if (eventError) {
                    console.error(`   ❌ Erreur mise à jour événement ${event.id}:`, eventError);
                    return false;
                }
                
                return true;
            });
        
            const results = await Promise.all(updatePromises);
            const successCount = results.filter(Boolean).length;
            
            console.log(`   ✅ Événements mis à jour: ${successCount}/${incohérence.events.length}`);
            
            if (successCount === incohérence.events.length) {
                correctionCount++;
            }
        } else {
            console.log(`   ℹ️ Pas de mise à jour d'événements nécessaire (stagiaires cohérents)`);
            correctionCount++;
        }
    }
    
    console.log(`\n✅ === CORRECTION TERMINÉE ===`);
    console.log(`✅ Projets corrigés: ${correctionCount}/${incohérences.length}`);
    
    return correctionCount;
}

// FONCTION PRINCIPALE
async function migrerDonnéesStagiaires() {
    console.log('🚀 === DÉBUT DE LA MIGRATION ===');
    console.log('📅 Date:', new Date().toLocaleString());
    
    try {
        // Étape 1: Analyser
        const incohérences = await analyserIncohérences();
        
        if (!incohérences || incohérences.length === 0) {
            console.log('✅ Aucune incohérence trouvée. Migration non nécessaire.');
            return;
        }
        
        // Demander confirmation
        console.log('\n⚠️ === ATTENTION ===');
        console.log('Cette migration va modifier les données de production.');
        console.log('Voulez-vous continuer? Tapez: migrerDonnéesStagiaires.confirmer()');
        
        // Sauvegarder les incohérences pour la confirmation
        window.migrationData = incohérences;
        
    } catch (error) {
        console.error('❌ Erreur lors de la migration:', error);
    }
}

// Fonction de confirmation
migrerDonnéesStagiaires.confirmer = async function() {
    if (!window.migrationData) {
        console.error('❌ Aucune donnée de migration trouvée. Relancez migrerDonnéesStagiaires() d\'abord.');
        return;
    }
    
    console.log('🔧 Lancement de la correction...');
    
    try {
        const correctionCount = await corrigerIncohérences(window.migrationData);
        
        console.log('\n🎉 === MIGRATION TERMINÉE ===');
        console.log(`✅ ${correctionCount} projet(s) corrigé(s)`);
        console.log('📅 Date fin:', new Date().toLocaleString());
        
        // Nettoyer
        delete window.migrationData;
        
        // Recommander une nouvelle analyse
        console.log('\n💡 Recommandation: Relancez migrerDonnéesStagiaires() pour vérifier que tout est correct.');
        
    } catch (error) {
        console.error('❌ Erreur lors de la correction:', error);
    }
};

// Export pour usage dans la console
window.migrerDonnéesStagiaires = migrerDonnéesStagiaires;

console.log('📋 === SCRIPT DE MIGRATION CHARGÉ ===');
console.log('💡 Pour démarrer la migration, tapez: migrerDonnéesStagiaires()');