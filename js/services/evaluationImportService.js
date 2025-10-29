// Service d'import d'évaluations depuis CSV
(function() {
    'use strict';

/**
 * Récupère l'utilisateur actuellement connecté
 * @param {Object} supabase - Client Supabase
 * @returns {Promise<string|null>} - ID de l'utilisateur connecté
 */
async function getCurrentUser(supabase) {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            console.warn('Aucun utilisateur connecté pour l\'import');
            return null;
        }

        return user.id;
    } catch (err) {
        console.warn('Erreur lors de la récupération de l\'utilisateur actuel:', err);
        return null;
    }
}

/**
 * Table de normalisation des noms de logiciels
 * Permet de gérer les variations de casse, abréviations et préfixes éditeur
 */
const LOGICIEL_MAPPING = {
    // Normalisation casse
    'autocad': 'AutoCAD',
    'revit': 'Revit',
    'covadis': 'Covadis',
    'inventor': 'Inventor',
    'twinmotion': 'Twinmotion',
    'civil 3d': 'Civil 3D',
    'plant 3d': 'Plant 3D',
    'advance steel': 'Advance Steel',
    'advance concrete': 'Advance Concrete',
    'bim track': 'BIM Track',
    'bimtrack': 'BIM Track',
    'navisworks': 'Navisworks',
    'recap': 'ReCap',
    'vault': 'Vault',

    // Avec/sans préfixe éditeur
    'autodesk autocad': 'AutoCAD',
    'autodesk revit': 'Revit',
    'autodesk covadis': 'Covadis',
    'autodesk inventor': 'Inventor',
    'autodesk twinmotion': 'Twinmotion',
    'autodesk civil 3d': 'Civil 3D',
    'autodesk plant 3d': 'Plant 3D',
    'autodesk advance steel': 'Advance Steel',
    'autodesk advance concrete': 'Advance Concrete',
    'autodesk navisworks': 'Navisworks',
    'autodesk recap': 'ReCap',
    'autodesk vault': 'Vault',

    // Abréviations courantes
    'acad': 'AutoCAD',
    'c3d': 'Civil 3D',
    'p3d': 'Plant 3D',
};

/**
 * Recherche ou crée un logiciel dans la base de données
 * Gère la normalisation des noms (casse, abréviations, préfixes)
 * @param {Object} supabase - Client Supabase
 * @param {string} softwareName - Nom du logiciel depuis CSV
 * @returns {Promise<Object|null>} - {id, nom, wasCreated} ou null si nom invalide
 */
async function findOrCreateLogiciel(supabase, softwareName) {
    if (!softwareName || typeof softwareName !== 'string') return null;

    // 1. Normalisation du nom
    const normalized = softwareName.toLowerCase().trim();

    // Chercher dans la table de mapping
    const mappedName = LOGICIEL_MAPPING[normalized] || softwareName.trim();
    const originalName = softwareName.trim(); // Garder le nom original pour le suivi

    // 2. Recherche du logiciel existant (insensible à la casse)
    const { data: existing, error: searchError } = await supabase
        .from('logiciel')
        .select('id, nom')
        .ilike('nom', mappedName)
        .maybeSingle();

    if (searchError) {
        console.warn(`Erreur recherche logiciel "${mappedName}":`, searchError.message);
        return null;
    }

    if (existing) {
        console.log(`✓ Logiciel existant trouvé: ${existing.nom} (${existing.id})`);
        return {
            id: existing.id,
            nom: existing.nom,
            originalName: originalName,
            wasCreated: false
        };
    }

    // 3. Créer le logiciel s'il n'existe pas
    const { data: created, error: createError } = await supabase
        .from('logiciel')
        .insert({
            nom: mappedName,
            description: `Importé automatiquement depuis CSV le ${new Date().toLocaleDateString('fr-FR')}`
        })
        .select('id, nom')
        .single();

    if (createError) {
        console.warn(`Erreur création logiciel "${mappedName}":`, createError.message);
        return null;
    }

    console.log(`✓ Nouveau logiciel créé: ${created.nom} (${created.id})`);
    return {
        id: created.id,
        nom: created.nom,
        originalName: originalName,
        wasCreated: true
    };
}

/**
 * Recherche ou crée un projet de formation
 * Utilise PRJ pour rechercher et crée si absent
 * @param {Object} supabase - Client Supabase
 * @param {string} prj - Numéro PRJ
 * @param {string} entrepriseId - ID entreprise
 * @param {string} formateurId - ID formateur
 * @param {string} commercialId - ID commercial
 * @param {string} currentUserId - ID utilisateur qui fait l'import
 * @param {Object} evaluationData - Données d'évaluation contenant logiciel et dureeHeures
 * @returns {Promise<Object>} - Projet trouvé ou créé + info logiciel {project, logicielInfo}
 */
async function findOrCreateProject(supabase, prj, entrepriseId, formateurId, commercialId, currentUserId, evaluationData = {}) {
    if (!prj) {
        throw new Error('PRJ manquant');
    }

    // Chercher le projet existant par PRJ
    const { data: existing, error: searchError } = await supabase
        .from('projects')
        .select('id, name, prj')
        .eq('prj', prj)
        .maybeSingle();

    if (searchError) {
        throw new Error(`Erreur recherche projet PRJ${prj}: ${searchError.message}`);
    }

    if (existing) {
        console.log(`✓ Projet existant trouvé: PRJ${prj} (${existing.id})`);
        return { project: existing, logicielInfo: null };
    }

    // Projet n'existe pas, le créer
    // Récupérer le nom de l'entreprise pour le nom du projet
    const { data: entreprise } = await supabase
        .from('entreprise')
        .select('nom')
        .eq('id', entrepriseId)
        .single();

    const projectName = entreprise ? `${entreprise.nom} - Formation` : `Formation PRJ${prj}`;

    // Générer un token d'évaluation unique
    const evaluation_token = 'eval_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // Enrichissement avec logiciel et durée
    let logicielId = null;
    let logicielInfo = null;
    if (evaluationData.logiciel) {
        logicielInfo = await findOrCreateLogiciel(supabase, evaluationData.logiciel);
        logicielId = logicielInfo?.id || null;
    }

    const { data: created, error: createError } = await supabase
        .from('projects')
        .insert({
            prj: prj,
            netsuite_id: prj,
            name: projectName,
            description: 'Projet créé automatiquement depuis import CSV évaluations',
            type: 'formation',
            status: 'active',
            entreprise_id: entrepriseId,
            formateur_id: formateurId,
            commercial_id: commercialId,
            created_by: currentUserId,
            evaluation_token: evaluation_token,
            logiciel_id: logicielId,
            duree: evaluationData.dureeHeures || null
        })
        .select('id, name, prj')
        .single();

    if (createError) {
        throw new Error(`Erreur création projet PRJ${prj}: ${createError.message}`);
    }

    console.log(`✓ Nouveau projet créé: PRJ${prj} (${created.id})`);
    return { project: created, logicielInfo };
}

/**
 * Crée une évaluation dans la base de données
 * Vérifie d'abord si une évaluation identique existe déjà pour éviter les doublons
 * Compare TOUS les champs pour détecter les vrais doublons
 * @param {Object} supabase - Client Supabase
 * @param {string} formationId - ID du projet formation
 * @param {Object} evaluationData - Données de l'évaluation parsées
 * @returns {Promise<Object>} - Évaluation créée ou existante
 */
async function createEvaluation(supabase, formationId, evaluationData) {
    // Récupérer toutes les évaluations existantes pour cette formation
    const { data: existingEvals, error: checkError } = await supabase
        .from('evaluation')
        .select('*')
        .eq('formation_id', formationId);

    if (checkError) {
        console.warn('Erreur lors de la vérification des doublons:', checkError.message);
    }

    // Vérifier si une évaluation avec TOUS les champs identiques existe
    if (existingEvals && existingEvals.length > 0) {
        for (const existing of existingEvals) {
            // Comparer tous les champs importants
            const isDuplicate =
                existing.stagiaire_email === evaluationData.stagiaireEmail &&
                existing.stagiaire_nom === evaluationData.stagiaireNom &&
                existing.stagiaire_prenom === evaluationData.stagiairePrenom &&
                existing.stagiaire_fonction === evaluationData.stagiaireFonction &&
                existing.stagiaire_societe === evaluationData.stagiaireSociete &&
                // Organisation
                existing.org_communication_objectifs === evaluationData.orgCommunicationObjectifs &&
                existing.org_duree_formation === evaluationData.orgDureeFormation &&
                existing.org_composition_groupe === evaluationData.orgCompositionGroupe &&
                existing.org_respect_engagements === evaluationData.orgRespectEngagements &&
                (existing.org_commentaires || null) === (evaluationData.orgCommentaires || null) &&
                // Moyens
                existing.moyens_evaluation_locaux === evaluationData.moyensEvaluationLocaux &&
                existing.moyens_materiel_informatique === evaluationData.moyensMaterielInformatique &&
                existing.moyens_support_cours === evaluationData.moyensSupportCours &&
                existing.moyens_formation_distance === evaluationData.moyensFormationDistance &&
                existing.moyens_restauration === evaluationData.moyensRestauration &&
                (existing.moyens_commentaires || null) === (evaluationData.moyensCommentaires || null) &&
                // Pédagogie
                existing.peda_niveau_difficulte === evaluationData.pedaNiveauDifficulte &&
                existing.peda_rythme_progression === evaluationData.pedaRythmeProgression &&
                existing.peda_qualite_contenu_theorique === evaluationData.pedaQualiteContenuTheorique &&
                existing.peda_qualite_contenu_pratique === evaluationData.pedaQualiteContenuPratique &&
                existing.peda_connaissance_formateur === evaluationData.pedaConnaissanceFormateur &&
                existing.peda_approche_pedagogique === evaluationData.pedaApprochePedagogique &&
                existing.peda_ecoute_disponibilite === evaluationData.pedaEcouteDisponibilite &&
                existing.peda_animation_formateur === evaluationData.pedaAnimationFormateur &&
                (existing.peda_commentaires || null) === (evaluationData.pedaCommentaires || null) &&
                // Satisfaction
                existing.satisf_repondu_attentes === evaluationData.satisfReponduAttentes &&
                existing.satisf_atteint_objectifs === evaluationData.satisfAtteintObjectifs &&
                existing.satisf_adequation_metier === evaluationData.satisfAdequationMetier &&
                existing.satisf_recommandation === evaluationData.satisfRecommandation &&
                existing.satisf_niveau_global === evaluationData.satisfNiveauGlobal &&
                (existing.satisf_commentaires || null) === (evaluationData.satisfCommentaires || null) &&
                (existing.satisf_precision_besoins || null) === (evaluationData.satisfBesoinFormationComplementaire || null);

            if (isDuplicate) {
                console.log(`⚠️ Évaluation complètement identique détectée: ${evaluationData.stagiaireEmail} pour formation ${formationId}`);
                throw new Error(`Évaluation identique déjà existante pour ${evaluationData.stagiairePrenom} ${evaluationData.stagiaireNom} (${evaluationData.stagiaireEmail})`);
            }
        }
    }

    // Générer le token pour l'évaluation à froid
    const generateFroidToken = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = 'eval_froid_';
        for (let i = 0; i < 32; i++) {
            token += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return token;
    };

    const { data, error } = await supabase
        .from('evaluation')
        .insert({
            formation_id: formationId,
            stagiaire_nom: evaluationData.stagiaireNom,
            stagiaire_prenom: evaluationData.stagiairePrenom,
            stagiaire_email: evaluationData.stagiaireEmail,
            stagiaire_fonction: evaluationData.stagiaireFonction,
            stagiaire_societe: evaluationData.stagiaireSociete,

            // Type et token pour évaluation à froid
            evaluation_type: 'chaude',
            evaluation_froid_token: generateFroidToken(),

            // Organisation
            org_communication_objectifs: evaluationData.orgCommunicationObjectifs,
            org_duree_formation: evaluationData.orgDureeFormation,
            org_composition_groupe: evaluationData.orgCompositionGroupe,
            org_respect_engagements: evaluationData.orgRespectEngagements,
            org_commentaires: evaluationData.orgCommentaires || null,

            // Moyens
            moyens_evaluation_locaux: evaluationData.moyensEvaluationLocaux,
            moyens_materiel_informatique: evaluationData.moyensMaterielInformatique,
            moyens_support_cours: evaluationData.moyensSupportCours,
            moyens_formation_distance: evaluationData.moyensFormationDistance,
            moyens_restauration: evaluationData.moyensRestauration,
            moyens_commentaires: evaluationData.moyensCommentaires || null,

            // Pédagogie
            peda_niveau_difficulte: evaluationData.pedaNiveauDifficulte,
            peda_rythme_progression: evaluationData.pedaRythmeProgression,
            peda_qualite_contenu_theorique: evaluationData.pedaQualiteContenuTheorique,
            peda_qualite_contenu_pratique: evaluationData.pedaQualiteContenuPratique,
            peda_connaissance_formateur: evaluationData.pedaConnaissanceFormateur,
            peda_approche_pedagogique: evaluationData.pedaApprochePedagogique,
            peda_ecoute_disponibilite: evaluationData.pedaEcouteDisponibilite,
            peda_animation_formateur: evaluationData.pedaAnimationFormateur,
            peda_commentaires: evaluationData.pedaCommentaires || null,

            // Satisfaction
            satisf_repondu_attentes: evaluationData.satisfReponduAttentes,
            satisf_atteint_objectifs: evaluationData.satisfAtteintObjectifs,
            satisf_adequation_metier: evaluationData.satisfAdequationMetier,
            satisf_recommandation: evaluationData.satisfRecommandation,
            satisf_niveau_global: evaluationData.satisfNiveauGlobal,
            satisf_commentaires: evaluationData.satisfCommentaires || null,
            satisf_besoin_formation_complementaire: evaluationData.satisfBesoinFormationComplementaire ? true : false,
            satisf_precision_besoins: evaluationData.satisfBesoinFormationComplementaire || null,

            // Date de soumission
            submitted_at: evaluationData.dateSaisie ? evaluationData.dateSaisie.toISOString() : new Date().toISOString(),

            // Statut par défaut
            statut: 'À traiter'
        })
        .select()
        .single();

    if (error) {
        throw new Error(`Erreur création évaluation: ${error.message}`);
    }

    return data;
}

/**
 * Normalise un email pour gérer les variations de domaine Arkance
 * @param {string} email - Email à normaliser
 * @returns {string} - Email normalisé
 */
function normalizeEmail(email) {
    if (!email) return '';

    let normalized = email.toLowerCase().trim();

    // Remplacer toutes les variations de domaine Arkance par @arkance.world
    normalized = normalized.replace(/@arkance-systems\.com$/i, '@arkance.world');
    normalized = normalized.replace(/@arkance-systems\.fr$/i, '@arkance.world');
    normalized = normalized.replace(/@arkance\.com$/i, '@arkance.world');
    normalized = normalized.replace(/@arkance\.fr$/i, '@arkance.world');

    return normalized;
}

/**
 * Analyse les données CSV avant import
 * Vérifie les entités manquantes qui devront être créées automatiquement
 * @param {Object} supabase - Client Supabase
 * @param {Array} rows - Lignes CSV parsées
 * @returns {Promise<Object>} - Résumé de l'analyse
 */
async function analyzeEvaluationImport(supabase, rows) {
    const analysis = {
        totalEvaluations: rows.length,
        newProjects: 0,
        existingProjects: 0,
        newEntreprises: [],
        newFormateurs: [],
        newCommerciaux: [],
        newLogiciels: [],
        existingLogiciels: [],
        validRows: 0,
        invalidRows: [],
        errors: []
    };

    // Récupérer toutes les entreprises existantes
    const { data: existingEntreprises } = await supabase
        .from('entreprise')
        .select('nom')
        .eq('type_entreprise', 'client');

    const entrepriseNames = new Set(existingEntreprises?.map(e => e.nom) || []);

    // Récupérer tous les projets existants (pour vérifier PRJ)
    const { data: existingProjects } = await supabase
        .from('projects')
        .select('prj');

    const projectPrjs = new Set(existingProjects?.map(p => p.prj) || []);

    // OPTIMISATION: Charger TOUS les utilisateurs UNE SEULE FOIS
    const { data: allUsers } = await supabase
        .from('user_profile')
        .select('id, prenom, nom, email');

    // Créer un cache en mémoire pour recherche rapide
    const userCache = new Map();
    (allUsers || []).forEach(user => {
        // Clé 1: prenom_nom
        const key1 = `${user.prenom}_${user.nom}`.toLowerCase().trim();
        userCache.set(key1, true);

        // Clé 2: nom_prenom (ordre inversé)
        const key2 = `${user.nom}_${user.prenom}`.toLowerCase().trim();
        userCache.set(key2, true);

        // Clé 3: email (original et normalisé)
        if (user.email) {
            // Email original
            userCache.set(user.email.toLowerCase().trim(), true);
            // Email normalisé (pour gérer les variations de domaine)
            const normalizedEmail = normalizeEmail(user.email);
            userCache.set(normalizedEmail, true);
        }
    });

    // Récupérer tous les logiciels existants
    const { data: existingLogiciels } = await supabase
        .from('logiciel')
        .select('nom');

    const logicielNames = new Set(
        (existingLogiciels || []).map(l => l.nom.toLowerCase().trim())
    );

    // Helper pour vérifier si un logiciel existe
    const logicielExists = (softwareName) => {
        if (!softwareName) return false;
        const normalized = softwareName.toLowerCase().trim();
        // Vérifier le nom normalisé
        const mappedName = (LOGICIEL_MAPPING[normalized] || softwareName).toLowerCase().trim();
        return logicielNames.has(mappedName);
    };

    // Helper pour vérifier si un utilisateur existe (recherche en mémoire, instantanée)
    const userExists = (email, roleType) => {
        if (!email) return true;

        // Normaliser l'email du CSV pour gérer les variations de domaine
        const normalizedEmail = normalizeEmail(email);

        // Stratégie 1 : Vérifier par email normalisé (prioritaire)
        if (userCache.has(normalizedEmail)) {
            return true;
        }

        // Stratégie 2 : Vérifier par email original (au cas où)
        if (userCache.has(email.toLowerCase().trim())) {
            return true;
        }

        // Stratégie 3 : Extraire le nom depuis l'email et vérifier
        const nameInfo = window.csvEvaluationParser.extractNameFromEmail(email);
        if (!nameInfo) return false;

        const nameParts = nameInfo.fullName.trim().split(/\s+/);
        if (nameParts.length < 2) return false;

        // Stratégie 4 : Prénom Nom
        const prenom1 = nameParts[0];
        const nom1 = nameParts.slice(1).join(' ');
        const key1 = `${prenom1}_${nom1}`.toLowerCase().trim();
        if (userCache.has(key1)) return true;

        // Stratégie 5 : Nom Prénom (ordre inversé)
        const nom2 = nameParts[0];
        const prenom2 = nameParts.slice(1).join(' ');
        const key2 = `${nom2}_${prenom2}`.toLowerCase().trim();
        if (userCache.has(key2)) return true;

        return false;
    };

    // Analyser chaque ligne
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const parsed = window.csvEvaluationParser.parseEvaluationRow(row);
        const validation = window.csvEvaluationParser.validateEvaluationRow(row);

        if (!validation.valid) {
            analysis.invalidRows.push({
                index: i + 2,
                prj: parsed.prj,
                stagiaire: `${parsed.stagiairePrenom} ${parsed.stagiaireNom}`,
                errors: validation.errors
            });
            continue;
        }

        analysis.validRows++;

        // Entreprises
        if (parsed.companyName && !entrepriseNames.has(parsed.companyName)) {
            if (!analysis.newEntreprises.includes(parsed.companyName)) {
                analysis.newEntreprises.push(parsed.companyName);
            }
        }

        // Projets
        if (projectPrjs.has(parsed.prj)) {
            analysis.existingProjects++;
        } else {
            analysis.newProjects++;
        }

        // Formateurs
        if (parsed.formateurEmail) {
            const exists = userExists(parsed.formateurEmail, 'formateur');
            if (!exists && !analysis.newFormateurs.find(f => f.email === parsed.formateurEmail)) {
                analysis.newFormateurs.push({
                    fullName: parsed.formateurFullName,
                    email: parsed.formateurEmail
                });
            }
        }

        // Commerciaux
        if (parsed.commercialEmail) {
            const exists = userExists(parsed.commercialEmail, 'commercial');
            if (!exists && !analysis.newCommerciaux.find(c => c.email === parsed.commercialEmail)) {
                analysis.newCommerciaux.push({
                    fullName: parsed.commercialFullName,
                    email: parsed.commercialEmail
                });
            }
        }

        // Logiciels
        if (parsed.logiciel) {
            const normalized = parsed.logiciel.toLowerCase().trim();
            const mappedName = LOGICIEL_MAPPING[normalized] || parsed.logiciel.trim();

            if (logicielExists(parsed.logiciel)) {
                // Logiciel existant
                if (!analysis.existingLogiciels.find(l => l.nom === mappedName)) {
                    analysis.existingLogiciels.push({
                        nom: mappedName,
                        originalName: parsed.logiciel
                    });
                }
            } else {
                // Nouveau logiciel à créer
                if (!analysis.newLogiciels.find(l => l.nom === mappedName)) {
                    analysis.newLogiciels.push({
                        nom: mappedName,
                        originalName: parsed.logiciel
                    });
                }
            }
        }
    }

    return analysis;
}

/**
 * Importe les évaluations depuis les données CSV
 * @param {Object} supabase - Client Supabase
 * @param {Array} rows - Lignes CSV parsées et validées
 * @param {Function} onProgress - Callback pour la progression (parsed, index, total)
 * @param {number} limit - Limite du nombre de lignes à importer (pour tests)
 * @param {Object} userMappings - Mappings manuels {email: userId} pour éviter la création automatique
 * @returns {Promise<Object>} - Résumé de l'import
 */
async function importEvaluations(supabase, rows, onProgress = null, limit = null, userMappings = {}) {
    const results = {
        success: 0,
        errors: [],
        evaluationsCreated: [],
        projectsCreated: [],
        entreprisesCreated: [],
        usersCreated: [],
        logicielsRecognized: [], // Logiciels existants trouvés
        logicielsCreated: []     // Logiciels créés automatiquement
    };

    // Limiter le nombre de lignes si demandé
    const rowsToImport = limit ? rows.slice(0, limit) : rows;
    console.log(`🚀 Import de ${rowsToImport.length} évaluations...`);

    // Récupérer l'utilisateur actuel
    const currentUserId = await getCurrentUser(supabase);

    for (let i = 0; i < rowsToImport.length; i++) {
        try {
            const row = rowsToImport[i];
            const parsed = window.csvEvaluationParser.parseEvaluationRow(row);

            // Valider la ligne
            const validation = window.csvEvaluationParser.validateEvaluationRow(row);
            if (!validation.valid) {
                results.errors.push({
                    row: i + 2,
                    prj: parsed.prj,
                    stagiaire: `${parsed.stagiairePrenom} ${parsed.stagiaireNom}`,
                    error: validation.errors.join(', ')
                });
                continue;
            }

            // 1. Créer ou trouver l'entreprise
            const entrepriseId = await window.projectImportService.findOrCreateEntreprise ?
                await window.projectImportService.findOrCreateEntreprise(supabase, parsed.companyName) :
                await findOrCreateEntrepriseLocal(supabase, parsed.companyName);

            if (!results.entreprisesCreated.includes(parsed.companyName)) {
                results.entreprisesCreated.push(parsed.companyName);
            }

            // 2. Trouver ou créer le formateur
            let formateurId = null;
            if (parsed.formateurEmail) {
                // Vérifier d'abord s'il y a un mapping manuel
                const manualMapping = userMappings[parsed.formateurEmail];

                if (manualMapping && manualMapping !== 'CREATE_NEW') {
                    // Utiliser le mapping manuel
                    formateurId = manualMapping;
                    console.log(`✓ Utilisation mapping manuel pour formateur: ${parsed.formateurFullName} -> ${formateurId}`);
                } else {
                    // Pas de mapping ou CREATE_NEW : comportement normal (recherche/création)
                    formateurId = await window.projectImportService.findOrCreateUser ?
                        await window.projectImportService.findOrCreateUser(supabase, parsed.formateurFullName, 'formateur', parsed.formateurEmail) :
                        await findOrCreateUserLocal(supabase, parsed.formateurEmail, 'formateur');
                }
            }

            if (formateurId && !results.usersCreated.includes(parsed.formateurFullName)) {
                results.usersCreated.push(parsed.formateurFullName);
            }

            // 3. Trouver ou créer le commercial
            let commercialId = null;
            if (parsed.commercialEmail) {
                // Vérifier d'abord s'il y a un mapping manuel
                const manualMapping = userMappings[parsed.commercialEmail];

                if (manualMapping && manualMapping !== 'CREATE_NEW') {
                    // Utiliser le mapping manuel
                    commercialId = manualMapping;
                    console.log(`✓ Utilisation mapping manuel pour commercial: ${parsed.commercialFullName} -> ${commercialId}`);
                } else {
                    // Pas de mapping ou CREATE_NEW : comportement normal (recherche/création)
                    commercialId = await window.projectImportService.findOrCreateUser ?
                        await window.projectImportService.findOrCreateUser(supabase, parsed.commercialFullName, 'commercial', parsed.commercialEmail) :
                        await findOrCreateUserLocal(supabase, parsed.commercialEmail, 'commercial');
                }
            }

            if (commercialId && !results.usersCreated.includes(parsed.commercialFullName)) {
                results.usersCreated.push(parsed.commercialFullName);
            }

            // 4. Trouver ou créer le projet
            const { project, logicielInfo } = await findOrCreateProject(
                supabase,
                parsed.prj,
                entrepriseId,
                formateurId,
                commercialId,
                currentUserId,
                parsed // Passer les données d'évaluation pour enrichissement
            );

            if (!results.projectsCreated.find(p => p.prj === parsed.prj)) {
                results.projectsCreated.push({
                    prj: parsed.prj,
                    name: project.name
                });
            }

            // Tracker les logiciels reconnus vs créés
            if (logicielInfo) {
                if (logicielInfo.wasCreated) {
                    // Logiciel créé automatiquement
                    if (!results.logicielsCreated.find(l => l.nom === logicielInfo.nom)) {
                        results.logicielsCreated.push({
                            nom: logicielInfo.nom,
                            originalName: logicielInfo.originalName
                        });
                    }
                } else {
                    // Logiciel existant reconnu
                    if (!results.logicielsRecognized.find(l => l.nom === logicielInfo.nom)) {
                        results.logicielsRecognized.push({
                            nom: logicielInfo.nom,
                            originalName: logicielInfo.originalName
                        });
                    }
                }
            }

            // 5. Créer l'évaluation
            const evaluation = await createEvaluation(supabase, project.id, parsed);

            results.evaluationsCreated.push({
                prj: parsed.prj,
                stagiaire: `${parsed.stagiairePrenom} ${parsed.stagiaireNom}`,
                email: parsed.stagiaireEmail
            });

            results.success++;

            // Notifier la progression
            if (onProgress) {
                onProgress(parsed, i + 1, rowsToImport.length);
            }

        } catch (error) {
            const parsed = window.csvEvaluationParser.parseEvaluationRow(rowsToImport[i]);
            results.errors.push({
                row: i + 2,
                prj: parsed.prj,
                stagiaire: `${parsed.stagiairePrenom} ${parsed.stagiaireNom}`,
                error: error.message
            });
            console.error(`Erreur ligne ${i + 2}:`, error);
        }
    }

    console.log(`✅ Import terminé: ${results.success} évaluations créées, ${results.errors.length} erreurs`);
    return results;
}

/**
 * Fonction locale pour créer/trouver une entreprise
 * Utilisée en fallback si projectImportService n'est pas disponible
 */
async function findOrCreateEntrepriseLocal(supabase, companyName) {
    if (!companyName) {
        throw new Error('Nom d\'entreprise manquant');
    }

    // Rechercher l'entreprise existante
    const { data: existing, error: searchError } = await supabase
        .from('entreprise')
        .select('id')
        .eq('nom', companyName)
        .eq('type_entreprise', 'client')
        .maybeSingle();

    if (searchError) {
        throw new Error(`Erreur recherche entreprise: ${searchError.message}`);
    }

    if (existing) {
        return existing.id;
    }

    // Créer une nouvelle entreprise
    const { data: created, error: createError } = await supabase
        .from('entreprise')
        .insert({
            nom: companyName,
            type_entreprise: 'client'
        })
        .select('id')
        .single();

    if (createError) {
        throw new Error(`Erreur création entreprise: ${createError.message}`);
    }

    return created.id;
}

/**
 * Fonction locale pour créer/trouver un utilisateur
 * Utilisée en fallback si projectImportService n'est pas disponible
 * Utilise 3 stratégies de recherche et ne filtre PAS par fonction (multi-rôles)
 */
async function findOrCreateUserLocal(supabase, email, roleType) {
    if (!email) return null;

    const nameInfo = window.csvEvaluationParser.extractNameFromEmail(email);
    if (!nameInfo) return null;

    const nameParts = nameInfo.fullName.trim().split(/\s+/);
    if (nameParts.length < 2) {
        console.warn(`Nom d'utilisateur invalide: ${nameInfo.fullName}`);
        return null;
    }

    // Stratégie 1 : Prénom Nom (ordre standard)
    const prenom1 = nameParts[0];
    const nom1 = nameParts.slice(1).join(' ');

    const { data: result1 } = await supabase
        .from('user_profile')
        .select('id')
        .ilike('nom', nom1)
        .ilike('prenom', prenom1)
        .maybeSingle();

    if (result1) {
        console.log(`✓ Utilisateur trouvé (stratégie 1): ${nameInfo.fullName} -> ${result1.id}`);
        return result1.id;
    }

    // Stratégie 2 : Nom Prénom (ordre inversé)
    const nom2 = nameParts[0];
    const prenom2 = nameParts.slice(1).join(' ');

    const { data: result2 } = await supabase
        .from('user_profile')
        .select('id')
        .ilike('nom', nom2)
        .ilike('prenom', prenom2)
        .maybeSingle();

    if (result2) {
        console.log(`✓ Utilisateur trouvé (stratégie 2 - ordre inversé): ${nameInfo.fullName} -> ${result2.id}`);
        return result2.id;
    }

    // Stratégie 3 : Recherche partielle dans nom OU prénom
    const searchPattern = `%${nameInfo.fullName}%`;
    const { data: result3 } = await supabase
        .from('user_profile')
        .select('id, nom, prenom')
        .or(`nom.ilike.${searchPattern},prenom.ilike.${searchPattern}`)
        .limit(1)
        .maybeSingle();

    if (result3) {
        console.log(`✓ Utilisateur trouvé (stratégie 3 - partielle): ${nameInfo.fullName} -> ${result3.prenom} ${result3.nom} (${result3.id})`);
        return result3.id;
    }

    // Si non trouvé, retourner null (ne pas créer dans ce fallback)
    console.warn(`Utilisateur non trouvé: ${nameInfo.fullName} (${email})`);
    return null;
}

// Export global
window.evaluationImportService = {
    analyzeEvaluationImport,
    importEvaluations,
    findOrCreateProject,
    createEvaluation
};

})();
