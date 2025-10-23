// Service d'import de projets depuis CSV
(function() {
    'use strict';

// Cache pour l'ID de l'entreprise Arkance
let arkanceEntrepriseIdCache = null;

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
 * Génère un token unique pour l'évaluation de formation
 * @returns {string} - Token unique au format "eval_XXXXXXXXXXXXXXXXXXXXX"
 */
function generateToken() {
    return 'eval_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Récupère l'ID de l'entreprise Arkance
 * @param {Object} supabase - Client Supabase
 * @returns {Promise<string|null>} - ID de l'entreprise Arkance
 */
async function getArkanceEntrepriseId(supabase) {
    // Utiliser le cache si disponible
    if (arkanceEntrepriseIdCache) {
        return arkanceEntrepriseIdCache;
    }

    // Rechercher l'entreprise Arkance
    const { data, error } = await supabase
        .from('entreprise')
        .select('id')
        .ilike('nom', '%arkance%')
        .limit(1)
        .maybeSingle();

    if (error) {
        console.warn('Erreur lors de la recherche de l\'entreprise Arkance:', error.message);
        return null;
    }

    if (data) {
        arkanceEntrepriseIdCache = data.id;
        return data.id;
    }

    return null;
}

/**
 * Trouve ou crée une entreprise
 * @param {Object} supabase - Client Supabase
 * @param {string} companyName - Nom de l'entreprise
 * @returns {Promise<string>} - ID de l'entreprise
 */
async function findOrCreateEntreprise(supabase, companyName) {
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
 * Trouve un PDC par son numéro
 * @param {Object} supabase - Client Supabase
 * @param {string} pdcNumber - Numéro du PDC (ex: "11553")
 * @returns {Promise<string|null>} - ID du PDC ou null si non trouvé
 */
async function findPDC(supabase, pdcNumber) {
    if (!pdcNumber) {
        return null;
    }

    // Rechercher par numéro de PDC
    const { data, error } = await supabase
        .from('pdc')
        .select('id')
        .eq('pdc_number', pdcNumber)
        .limit(1)
        .maybeSingle();

    if (error) {
        console.warn(`Erreur recherche PDC ${pdcNumber}:`, error.message);
        return null;
    }

    return data ? data.id : null;
}

/**
 * Recherche ou crée un utilisateur (formateur ou commercial)
 * Utilise plusieurs stratégies de recherche pour trouver les utilisateurs malgré les variations de casse et d'ordre
 * Si l'utilisateur n'existe pas, le crée automatiquement avec un compte auth.users et user_profile
 * @param {Object} supabase - Client Supabase
 * @param {string} fullName - Nom complet (prénom + nom)
 * @param {string} roleType - 'formateur' ou 'commercial'
 * @returns {Promise<string|null>} - ID de l'utilisateur
 */
async function findOrCreateUser(supabase, fullName, roleType) {
    if (!fullName) {
        return null;
    }

    // Récupérer les IDs de fonction et service
    const fonctionMap = {
        'formateur': 'accae4a9-7a0f-43ea-949d-a2b58fb58a92',
        'commercial': '65b79c9a-6de8-4da3-8ecd-b63bac6ab174'
    };
    const serviceMap = {
        'formateur': 'f8adb825-339c-44b0-8267-6abc23a4c036',  // Service "training"
        'commercial': '92281977-2181-453e-91a5-7058c1e05a55'  // Service "commerce"
    };
    const fonctionId = fonctionMap[roleType];
    const serviceId = serviceMap[roleType];

    if (!fonctionId) {
        console.warn(`Type de fonction invalide: ${roleType}`);
        return null;
    }

    // Cas spécial : Subcontractor FRANCE (user_profile SANS auth)
    if (fullName === 'Subcontractor FRANCE') {
        // Vérifier si déjà existant
        const { data: existing } = await supabase
            .from('user_profile')
            .select('id')
            .eq('nom', 'FRANCE')
            .eq('prenom', 'Subcontractor')
            .eq('fonction_id', fonctionId)
            .maybeSingle();

        if (existing) {
            console.log(`✓ Subcontractor FRANCE trouvé: ${existing.id}`);
            return existing.id;
        }

        // Créer user_profile SANS compte auth
        const arkanceId = await getArkanceEntrepriseId(supabase);
        const { data: profile, error: profileError } = await supabase
            .from('user_profile')
            .insert({
                prenom: 'Subcontractor',
                nom: 'FRANCE',
                email: 'subcontractor@external.com',
                fonction_id: fonctionId,
                service_id: serviceId,
                entreprise_id: arkanceId
            })
            .select('id')
            .single();

        if (profileError) {
            console.error(`Erreur création Subcontractor FRANCE:`, profileError.message);
            return null;
        }

        console.log(`✓ Subcontractor FRANCE créé (sans auth): ${profile.id}`);
        return profile.id;
    }

    // Nettoyer et séparer le nom
    const nameParts = fullName.trim().split(/\s+/); // Split par espaces multiples
    if (nameParts.length < 2) {
        console.warn(`Nom d'utilisateur invalide: ${fullName}`);
        return null;
    }

    // Stratégie 1: Prénom Nom (ordre standard)
    const prenom1 = nameParts[0];
    const nom1 = nameParts.slice(1).join(' ');

    const { data: result1, error: error1 } = await supabase
        .from('user_profile')
        .select('id')
        .ilike('nom', nom1)
        .ilike('prenom', prenom1)
        .eq('fonction_id', fonctionId)
        .maybeSingle();

    if (!error1 && result1) {
        console.log(`✓ Utilisateur trouvé (stratégie 1): ${fullName} -> ${result1.id}`);
        return result1.id;
    }

    // Stratégie 2: Nom Prénom (ordre inversé)
    const nom2 = nameParts[0];
    const prenom2 = nameParts.slice(1).join(' ');

    const { data: result2, error: error2 } = await supabase
        .from('user_profile')
        .select('id')
        .ilike('nom', nom2)
        .ilike('prenom', prenom2)
        .eq('fonction_id', fonctionId)
        .maybeSingle();

    if (!error2 && result2) {
        console.log(`✓ Utilisateur trouvé (stratégie 2 - ordre inversé): ${fullName} -> ${result2.id}`);
        return result2.id;
    }

    // Stratégie 3: Recherche partielle dans nom OU prénom
    const searchPattern = `%${fullName}%`;
    const { data: result3, error: error3 } = await supabase
        .from('user_profile')
        .select('id, nom, prenom')
        .eq('fonction_id', fonctionId)
        .or(`nom.ilike.${searchPattern},prenom.ilike.${searchPattern}`)
        .limit(1)
        .maybeSingle();

    if (!error3 && result3) {
        console.log(`✓ Utilisateur trouvé (stratégie 3 - partielle): ${fullName} -> ${result3.prenom} ${result3.nom} (${result3.id})`);
        return result3.id;
    }

    // Aucune stratégie n'a trouvé l'utilisateur - CRÉER AUTOMATIQUEMENT
    console.log(`⚙ Création automatique de l'utilisateur: "${fullName}" (${roleType})`);

    try {
        // Préparer les données
        const prenom = prenom1;
        const nom = nom1;

        // Fonction pour nettoyer les caractères accentués et spéciaux
        const normalizeString = (str) => {
            return str
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '') // Retirer les accents
                .replace(/[^a-z0-9]/g, ''); // Retirer les caractères spéciaux
        };

        const email = `${normalizeString(prenom)}.${normalizeString(nom)}@arkance.world`;

        // Helper pour attendre (délai)
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        // 1. Créer le compte auth.users avec signUp (pas besoin de permissions admin)
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: 'user1234',
            options: {
                emailRedirectTo: window.location.origin,
                data: {
                    email_confirm: false
                }
            }
        });

        let userId;

        if (authError) {
            if (authError.message?.includes('already registered')) {
                console.warn(`⚠ Email déjà enregistré pour ${fullName}: ${email} - Création user_profile uniquement`);

                // Récupérer l'ID de l'utilisateur existant en auth
                const { data: existingAuthUser } = await supabase.auth.admin.getUserByEmail(email);

                if (!existingAuthUser || !existingAuthUser.user) {
                    console.error(`Impossible de récupérer l'utilisateur auth pour ${email}`);
                    return null;
                }

                userId = existingAuthUser.user.id;
            } else {
                console.error(`Erreur création auth pour ${fullName}:`, authError.message);
                return null;
            }
        } else {
            if (!authData || !authData.user) {
                console.error(`Aucun utilisateur créé pour ${fullName}`);
                return null;
            }
            userId = authData.user.id;

            // Ajouter un délai pour éviter le rate limiting
            await delay(500);
        }

        // 2. Récupérer l'ID de l'entreprise Arkance
        const arkanceId = await getArkanceEntrepriseId(supabase);

        // 3. Créer le profil user_profile
        const { data: profile, error: profileError } = await supabase
            .from('user_profile')
            .insert({
                id: userId, // Même ID que auth.users (nouveau ou existant)
                prenom: prenom,
                nom: nom,
                email: email,
                fonction_id: fonctionId,
                service_id: serviceId,  // Service correspondant à la fonction
                entreprise_id: arkanceId
            })
            .select('id')
            .single();

        if (profileError) {
            console.error(`Erreur création user_profile pour ${fullName}:`, profileError.message);
            // Note: Le compte auth sera nettoyé par cascade ou RLS
            return null;
        }

        console.log(`✓ Utilisateur créé avec succès: ${fullName} (${email}) -> ${profile.id}`);
        return profile.id;

    } catch (err) {
        console.error(`Erreur lors de la création de l'utilisateur ${fullName}:`, err);
        return null;
    }
}

/**
 * Recherche un projet existant par PRJ ou netsuite_id
 * @param {Object} supabase - Client Supabase
 * @param {string} prj - Numéro PRJ (ex: "15626")
 * @param {string} netsuiteId - ID NetSuite (souvent identique au PRJ)
 * @returns {Promise<Object|null>} - Projet existant ou null
 */
async function findExistingProject(supabase, prj, netsuiteId) {
    if (!prj && !netsuiteId) {
        return null;
    }

    // Chercher par PRJ ou netsuite_id
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .or(`prj.eq.${prj},netsuite_id.eq.${netsuiteId}`)
        .maybeSingle();

    if (error) {
        console.warn(`Erreur recherche projet existant (PRJ: ${prj}):`, error.message);
        return null;
    }

    return data;
}

/**
 * Crée un projet dans Supabase
 * @param {Object} supabase - Client Supabase
 * @param {Object} projectData - Données du projet
 * @param {string|null} currentUserId - ID de l'utilisateur actuel (pour created_by)
 * @returns {Promise<Object>} - Projet créé
 */
async function createProject(supabase, projectData, currentUserId = null) {
    // Générer un token d'évaluation unique si non fourni
    const evaluation_token = projectData.evaluation_token || generateToken();

    const { data, error} = await supabase
        .from('projects')
        .insert({
            ...projectData,
            created_by: currentUserId,
            evaluation_token
        })
        .select()
        .single();

    if (error) {
        throw new Error(`Erreur création projet: ${error.message}`);
    }

    return data;
}

/**
 * Met à jour un projet existant
 * @param {Object} supabase - Client Supabase
 * @param {string} projectId - ID du projet à mettre à jour
 * @param {Object} updateData - Données à mettre à jour
 * @returns {Promise<Object>} - Projet mis à jour
 */
async function updateProject(supabase, projectId, updateData) {
    const { data, error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', projectId)
        .select()
        .single();

    if (error) {
        throw new Error(`Erreur mise à jour projet: ${error.message}`);
    }

    return data;
}

/**
 * Détermine le type de lieu à partir d'une adresse
 * @param {string} address - Adresse de formation
 * @returns {string} - Type de lieu ("Dans nos locaux", "Dans vos locaux", "À distance")
 */
function determineLieuFromAddress(address) {
    if (!address) return "Dans vos locaux";

    const addressUpper = address.toUpperCase();

    // Si commence par ARKANCE → Dans nos locaux
    if (addressUpper.startsWith('ARKANCE')) {
        return "Dans nos locaux";
    }

    // Si contient FOAD ou A DISTANCE → À distance
    if (addressUpper.includes('FOAD') || addressUpper.includes('A DISTANCE') || addressUpper.includes('À DISTANCE')) {
        return "À distance";
    }

    // Sinon → Dans vos locaux
    return "Dans vos locaux";
}

/**
 * Crée des événements de formation (sessions)
 * @param {Object} supabase - Client Supabase
 * @param {string} projectId - ID du projet
 * @param {string} entrepriseId - ID de l'entreprise
 * @param {Array<Array<Date>>} sessions - Sessions (groupes de dates)
 * @param {Object} hours - {startTime, endTime}
 * @param {string} location - Lieu de formation
 * @param {string} software - Nom du logiciel
 * @returns {Promise<Array>} - Événements créés
 */
async function createFormationSessions(supabase, projectId, entrepriseId, sessions, hours, location, software) {
    if (sessions.length === 0) {
        return [];
    }

    const events = [];

    sessions.forEach((sessionDates, index) => {
        const sessionNumber = index + 1;
        const totalSessions = sessions.length;

        // Première date de la session
        const firstDate = sessionDates[0];
        const lastDate = sessionDates[sessionDates.length - 1];

        // Titre de la session
        let titre = `Formation ${software}`;
        if (totalSessions > 1) {
            titre += ` - Session ${sessionNumber}/${totalSessions}`;
        } else {
            titre += ` - Session ${sessionNumber}`;
        }

        // Dates de début et fin avec horaires
        const dateDebut = window.csvParser.combineDateAndTime(firstDate, hours.startTime);
        const dateFin = window.csvParser.combineDateAndTime(lastDate, hours.endTime);

        // Description avec les dates de la session
        const datesFormatted = sessionDates.map(d => {
            return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        });
        const description = `Session du ${datesFormatted[0]} au ${datesFormatted[datesFormatted.length - 1]}`;

        events.push({
            titre,
            description,
            date_debut: dateDebut.toISOString(),
            date_fin: dateFin.toISOString(),
            type_evenement: 'formation',
            statut: 'planifie',
            priorite: 'normale',
            lieu: determineLieuFromAddress(location),
            adresse: location,
            projet_id: projectId,
            entreprise_cliente_id: entrepriseId
        });
    });

    // Insérer tous les événements
    const { data, error } = await supabase
        .from('evenement')
        .insert(events)
        .select();

    if (error) {
        throw new Error(`Erreur création événements: ${error.message}`);
    }

    return data;
}

/**
 * Analyse les données CSV avant import
 * Vérifie les entités manquantes qui devront être créées automatiquement
 * @param {Object} supabase - Client Supabase
 * @param {Array} rows - Lignes CSV parsées
 * @returns {Promise<Object>} - Résumé de l'analyse
 */
async function analyzeImportData(supabase, rows) {
    const analysis = {
        totalProjects: rows.length,
        newProjects: 0,
        existingProjects: 0,
        newEntreprises: [],
        newFormateurs: [],
        newCommerciaux: [],
        missingPDC: [],
        errors: []
    };

    // Récupérer toutes les entreprises existantes
    const { data: existingEntreprises } = await supabase
        .from('entreprise')
        .select('nom')
        .eq('type_entreprise', 'client');

    const entrepriseNames = new Set(existingEntreprises?.map(e => e.nom) || []);

    // Helper pour vérifier si un utilisateur existe (sans le créer)
    const userExists = async (fullName, roleType) => {
        if (!fullName || fullName === 'Subcontractor FRANCE') {
            return true; // Considérer comme existant pour ne pas le lister
        }

        const nameParts = fullName.trim().split(/\s+/);
        if (nameParts.length < 2) return true;

        const fonctionMap = {
            'formateur': 'accae4a9-7a0f-43ea-949d-a2b58fb58a92',
            'commercial': '65b79c9a-6de8-4da3-8ecd-b63bac6ab174'
        };
        const fonctionId = fonctionMap[roleType];

        // Essayer les 3 stratégies de recherche
        const prenom1 = nameParts[0];
        const nom1 = nameParts.slice(1).join(' ');

        // Stratégie 1
        const { data: r1 } = await supabase
            .from('user_profile')
            .select('id')
            .ilike('nom', nom1)
            .ilike('prenom', prenom1)
            .eq('fonction_id', fonctionId)
            .maybeSingle();
        if (r1) return true;

        // Stratégie 2
        const { data: r2 } = await supabase
            .from('user_profile')
            .select('id')
            .ilike('nom', prenom1)
            .ilike('prenom', nom1)
            .eq('fonction_id', fonctionId)
            .maybeSingle();
        if (r2) return true;

        // Stratégie 3
        const { data: r3 } = await supabase
            .from('user_profile')
            .select('id')
            .eq('fonction_id', fonctionId)
            .or(`nom.ilike.%${fullName}%,prenom.ilike.%${fullName}%`)
            .limit(1)
            .maybeSingle();
        if (r3) return true;

        return false;
    };

    // Analyser chaque ligne
    for (const row of rows) {
        const parsed = window.csvParser.parseProjectRow(row);

        // Entreprises (seront créées automatiquement)
        if (parsed.companyName && !entrepriseNames.has(parsed.companyName)) {
            if (!analysis.newEntreprises.includes(parsed.companyName)) {
                analysis.newEntreprises.push(parsed.companyName);
            }
        }

        // Formateurs (vérifier s'ils existent déjà)
        if (parsed.formateur && parsed.formateur !== 'Subcontractor FRANCE') {
            const exists = await userExists(parsed.formateur, 'formateur');
            if (!exists && !analysis.newFormateurs.includes(parsed.formateur)) {
                analysis.newFormateurs.push(parsed.formateur);
            }
        }

        // Commerciaux (vérifier s'ils existent déjà)
        if (parsed.salesRep) {
            const exists = await userExists(parsed.salesRep, 'commercial');
            if (!exists && !analysis.newCommerciaux.includes(parsed.salesRep)) {
                analysis.newCommerciaux.push(parsed.salesRep);
            }
        }

        // PDC
        if (parsed.pdcNumber) {
            const pdcId = await findPDC(supabase, parsed.pdcNumber);
            if (!pdcId && !analysis.missingPDC.includes(parsed.pdcNumber)) {
                analysis.missingPDC.push(parsed.pdcNumber);
            }
        }

        // Projets (vérifier s'ils existent déjà)
        const existingProject = await findExistingProject(supabase, parsed.prj, parsed.netsuiteId);
        if (existingProject) {
            analysis.existingProjects++;
        } else {
            analysis.newProjects++;
        }
    }

    return analysis;
}

/**
 * Importe les projets depuis les données CSV
 * @param {Object} supabase - Client Supabase
 * @param {Array} rows - Lignes CSV parsées et validées
 * @param {Function} onProgress - Callback pour la progression (row, index, total)
 * @returns {Promise<Object>} - Résumé de l'import
 */
async function importProjects(supabase, rows, onProgress = null) {
    const results = {
        success: 0,
        errors: [],
        projectsCreated: [],
        projectsUpdated: [],
        entreprisesCreated: [],
        sessionsCreated: 0
    };

    // Récupérer l'utilisateur actuel pour le champ created_by
    const currentUserId = await getCurrentUser(supabase);

    if (!currentUserId) {
        console.warn('⚠ Aucun utilisateur connecté - les projets seront créés sans created_by');
    } else {
        console.log(`✓ Import effectué par l'utilisateur: ${currentUserId}`);
    }

    for (let i = 0; i < rows.length; i++) {
        try {
            const row = rows[i];
            const parsed = window.csvParser.parseProjectRow(row);

            // 1. Créer ou trouver l'entreprise
            const entrepriseId = await findOrCreateEntreprise(supabase, parsed.companyName);

            if (!results.entreprisesCreated.includes(parsed.companyName)) {
                results.entreprisesCreated.push(parsed.companyName);
            }

            // 2. Trouver le PDC
            const pdcId = await findPDC(supabase, parsed.pdcNumber);

            // 3. Trouver ou créer le formateur
            const formateurId = await findOrCreateUser(supabase, parsed.formateur, 'formateur');

            // 4. Trouver ou créer le commercial
            const commercialId = await findOrCreateUser(supabase, parsed.salesRep, 'commercial');

            // 5. Vérifier si le projet existe déjà
            const existingProject = await findExistingProject(supabase, parsed.prj, parsed.netsuiteId);

            let project;
            let isUpdate = false;

            if (existingProject) {
                // Projet existe déjà, le mettre à jour
                console.log(`ℹ Projet existant trouvé: PRJ${parsed.prj} (${existingProject.id})`);

                // Préparer les données de mise à jour (ne mettre à jour que les champs manquants)
                const updateData = {};

                if (!existingProject.formateur_id && formateurId) {
                    updateData.formateur_id = formateurId;
                }
                if (!existingProject.commercial_id && commercialId) {
                    updateData.commercial_id = commercialId;
                }
                if (!existingProject.entreprise_id && entrepriseId) {
                    updateData.entreprise_id = entrepriseId;
                }
                if (!existingProject.pdc_id && pdcId) {
                    updateData.pdc_id = pdcId;
                }
                if (!existingProject.nombre_stagiaire && parsed.numberOfClients) {
                    updateData.nombre_stagiaire = parsed.numberOfClients;
                }
                if (!existingProject.lieu_projet && parsed.location) {
                    updateData.lieu_projet = parsed.location;
                }

                if (Object.keys(updateData).length > 0) {
                    project = await updateProject(supabase, existingProject.id, updateData);
                    isUpdate = true;
                    console.log(`✓ Projet mis à jour: PRJ${parsed.prj} (${Object.keys(updateData).length} champs)`);
                } else {
                    project = existingProject;
                    console.log(`→ Projet déjà complet: PRJ${parsed.prj}, aucune mise à jour nécessaire`);
                }
            } else {
                // Nouveau projet, le créer
                const projectName = `${parsed.companyName} - ${parsed.software}`;

                const projectData = {
                    netsuite_id: parsed.netsuiteId,
                    prj: parsed.prj,
                    name: projectName,
                    description: 'Projet importé depuis CSV',
                    type: 'formation',
                    status: 'active',
                    entreprise_id: entrepriseId,
                    pdc_id: pdcId,
                    formateur_id: formateurId,
                    commercial_id: commercialId,
                    nombre_stagiaire: parsed.numberOfClients,
                    lieu_projet: parsed.location,
                    heures_formation: row['Training Hours'] || ''
                };

                project = await createProject(supabase, projectData, currentUserId);
                console.log(`✓ Nouveau projet créé: PRJ${parsed.prj}`);
            }

            // Notifier la progression avec l'information création/mise à jour
            if (onProgress) {
                onProgress(parsed, i + 1, rows.length, isUpdate);
            }

            // 6. Créer les sessions (événements) seulement pour les nouveaux projets
            let sessions = [];
            if (!isUpdate) {
                sessions = await createFormationSessions(
                    supabase,
                    project.id,
                    entrepriseId,
                    parsed.sessions,
                    parsed.hours,
                    parsed.location,
                    parsed.software
                );
                results.sessionsCreated += sessions.length;
            } else {
                console.log(`→ Sessions non créées (projet existant)`);
            }

            results.success++;
            const projectName = `${parsed.companyName} - ${parsed.software}`;

            if (isUpdate) {
                results.projectsUpdated.push({
                    prj: parsed.prj,
                    name: projectName,
                    updated: true
                });
            } else {
                results.projectsCreated.push({
                    prj: parsed.prj,
                    name: projectName,
                    sessions: sessions.length
                });
            }

        } catch (error) {
            results.errors.push({
                row: i + 2, // +2 car ligne 1 = header
                prj: window.csvParser.parseProjectRow(rows[i]).prj,
                error: error.message
            });
        }
    }

    return results;
}

// Export global
window.projectImportService = {
    analyzeImportData,
    importProjects
};

})();
