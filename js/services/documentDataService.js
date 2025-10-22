/**
 * Service de préparation des données pour la génération de documents PDF
 * Centralise toute la logique de conversion des données projet en données de documents
 */

/**
 * Génère des données par défaut pour une convocation
 * @returns {Object} Données de convocation par défaut
 */
function getDefaultConvocationData() {
    return {
        destinataire: 'Monsieur/Madame',
        objet: 'Convocation pour une formation',
        date: new Date().toLocaleDateString('fr-FR'),
        formation: 'Formation',
        concept: 'Formation professionnelle',
        lieu: 'À définir',
        dates: 'Dates à définir',
        heures: '09h00 à 17h00',
        stagiaires: 'Stagiaires à définir',
        signataire: 'Responsable formation',
        titre_signataire: 'Service Formation'
    };
}

/**
 * Génère des données par défaut pour une convention
 * @returns {Object} Données de convention par défaut
 */
function getDefaultConventionData() {
    return {
        numero: new Date().getFullYear() + ' PRJ-00000',
        societe: 'Société cliente',
        adresse: 'Adresse de la société',
        representant: 'Représentant légal',
        duree: '1 jour',
        formateur: 'Formateur ARKANCE',
        programme: 'Programme de formation',
        moyens: 'Moyens pédagogiques',
        formation: 'Formation professionnelle',
        cout: '0,00',
        tva: '0,00',
        total: '0,00',
        stagiaires: '1 participant(s)',
        dates: 'Dates à définir selon planning',
        lieu_type: 'sur_site',
        lieu_formation: 'formation à distance ou en présentiel selon modalités',
        editeur: 'Autodesk',
        logiciel: 'Logiciel',
        type_pdc: 'Concepts de base'
    };
}

/**
 * Transforme les données de sessions Supabase (snake_case) en camelCase
 * pour compatibilité avec les fonctions de formatage
 *
 * IMPORTANT: Cette fonction détecte automatiquement si les sessions sont déjà
 * au format camelCase (provenant de useProjectSessions) pour éviter une double transformation
 *
 * @param {Array<Object>} sessions - Sessions avec champs snake_case ou camelCase
 * @returns {Array<Object>} Sessions avec champs camelCase
 */
function transformSessionData(sessions) {
    if (!sessions || sessions.length === 0) return [];

    return sessions.map(session => {
        // Si déjà au format camelCase (dateDebut existe), retourner tel quel
        if (session.dateDebut) {
            return {
                ...session,
                // S'assurer que dateDebut et dateFin sont des objets Date
                dateDebut: session.dateDebut instanceof Date ? session.dateDebut : new Date(session.dateDebut),
                dateFin: session.dateFin instanceof Date ? session.dateFin : new Date(session.dateFin)
            };
        }

        // Sinon, transformer depuis snake_case vers camelCase
        return {
            ...session,
            dateDebut: session.date_debut ? new Date(session.date_debut) : null,
            dateFin: session.date_fin ? new Date(session.date_fin) : null
        };
    });
}

/**
 * Convertit les données d'un projet en données de convocation
 * Utilise les utilitaires FormationUtils et SessionFormatUtils
 *
 * @param {Object} project - Projet contenant toutes les données nécessaires
 * @param {Object} supabase - Client Supabase pour les requêtes
 * @returns {Promise<Object>} Données formatées pour la convocation
 */
async function getConvocationDataFromProject(project, supabase) {
    if (!project) return getDefaultConvocationData();

    const entreprise = project.entreprise || {};
    const commercial = project.commercial || {};
    const contact = project.contact || {};
    const pdc = project.pdc || {};

    // Récupérer les sessions détaillées du projet
    let sessions = [];
    try {
        const { data: sessionsData, error: sessionsError } = await supabase
            .from('evenement')
            .select('*')
            .eq('projet_id', project.id)
            .order('date_debut', { ascending: true });

        if (!sessionsError && sessionsData) {
            sessions = transformSessionData(sessionsData);
        }
    } catch (error) {
        console.warn('⚠️ [DocumentData] Erreur récupération sessions pour convocation:', error);
    }

    // Récupérer les stagiaires avec fallback intelligent
    const stagiairesArray = await window.FormationUtils.fetchStagiairesWithFallback(
        project.stagiaire_ids,
        sessions,
        supabase
    );

    // Formater les sessions pour l'affichage
    const sessionsFormattees = sessions.length > 0 ?
        window.SessionFormatUtils.formatSessionsList(sessions) :
        window.SessionFormatUtils.formatSessionFromProject(project);

    // Convertir la liste de stagiaires en string pour compatibilité
    const stagiairesString = stagiairesArray.length > 0 ?
        stagiairesArray.join(', ') :
        `${project.nombre_stagiaire || 1} participant(s) pour ${project.name || 'la formation'}`;

    // Construire le nom de formation avec l'utilitaire
    const formationNom = window.FormationUtils.buildFormationName(pdc);

    // Formater les références SOASF et PRJ
    const numeroSO = String(project.so || 0).padStart(5, '0');
    const numeroPRJ = project.prj || 'XXXXX';
    const referenceSoasf = `SOASF${numeroSO}`;
    const referencePrj = `PRJ${numeroPRJ}`;
    const references = `${referenceSoasf} - ${referencePrj}`;

    return {
        destinataire: contact.prenom && contact.nom ?
            `${contact.prenom.charAt(0).toUpperCase() + contact.prenom.slice(1)} ${contact.nom.toUpperCase()}` :
            'Monsieur/Madame',
        objet: 'Convocation pour une formation',
        date: new Date().toLocaleDateString('fr-FR'),
        formation: formationNom,
        concept: pdc.logiciel?.nom || 'Formation professionnelle',
        // Références SOASF et PRJ
        reference_soasf: referenceSoasf,
        reference_prj: referencePrj,
        references: references,
        // Sessions détaillées au lieu de champs agrégés
        sessions: sessionsFormattees,
        // Garder les anciens champs comme fallback pour compatibilité
        lieu: project.lieu_projet || 'Formation à distance',
        dates: project.periode_souhaitee || 'Dates à définir',
        heures: '09h00 à 12h00 et de 13h00 à 17h00',
        stagiaires: stagiairesString,
        stagiairesListe: stagiairesArray,
        signataire: commercial.prenom && commercial.nom ?
            `${commercial.prenom} ${commercial.nom}` :
            'Geoffrey La MENDOLA',
        titre_signataire: 'Ingénieur Commercial',
        // Informations entreprise cliente pour l'adresse en haut à droite
        entreprise_nom: entreprise.nom || 'Entreprise',
        entreprise_adresse: entreprise.adresse || 'Adresse non renseignée'
    };
}

/**
 * Convertit les données d'un projet en données de convention
 * Utilise les utilitaires FormationUtils et SessionFormatUtils
 *
 * @param {Object} project - Projet contenant toutes les données nécessaires
 * @param {Array<Object>} projectSessions - Sessions préchargées (optionnel)
 * @param {Object} supabase - Client Supabase pour les requêtes
 * @returns {Promise<Object>} Données formatées pour la convention
 */
async function getConventionDataFromProject(project, projectSessions = null, supabase) {
    if (!project) return getDefaultConventionData();

    console.log('🔍🔍🔍 [DEBUG getConventionDataFromProject] projet ENTRANT:', project);
    console.log('🔍🔍🔍 [DEBUG] project.formateur_id:', project.formateur_id);
    console.log('🔍🔍🔍 [DEBUG] project.formateur:', project.formateur);

    const entreprise = project.entreprise || {};
    const commercial = project.commercial || {};
    const contact = project.contact || {};
    const logiciel = project.logiciel || {};
    const pdc = project.pdc || {};

    // Utiliser les sessions préchargées ou les récupérer si nécessaire
    let sessions = projectSessions || [];
    let formateurInfo = null;
    let lieuFormation = 'Lieu à définir';

    try {
        // Si pas de sessions préchargées, les récupérer directement via Supabase
        if (!projectSessions || projectSessions.length === 0) {
            const { data: sessionsData, error: sessionsError } = await supabase
                .from('evenement')
                .select('*')
                .eq('projet_id', project.id)
                .order('date_debut', { ascending: true });

            if (!sessionsError && sessionsData) {
                sessions = transformSessionData(sessionsData);
            }
        } else {
            // Transformer aussi les sessions préchargées si elles existent
            sessions = transformSessionData(projectSessions);
        }

        // Récupérer le formateur du projet en priorité, sinon des sessions
        console.log('🔍 [documentDataService] project.formateur:', project.formateur);

        if (project.formateur) {
            console.log('🔍 [documentDataService] formateur.prenom:', project.formateur.prenom);
            console.log('🔍 [documentDataService] formateur.nom:', project.formateur.nom);

            const prenomFormat = project.formateur.prenom || '';
            const nomFormat = project.formateur.nom || '';
            formateurInfo = `${prenomFormat} ${nomFormat}`.trim();

            console.log('🔍 [documentDataService] formateurInfo calculé:', formateurInfo);
        }

        // Si formateurInfo est vide ou non défini, chercher dans les sessions
        if (!formateurInfo || formateurInfo === '') {
            console.log('⚠️ [documentDataService] Formateur projet vide, recherche dans sessions...');
            formateurInfo = window.SessionFormatUtils.getFormateurFromSessions(sessions) || 'Formateur ARKANCE';
        }

        console.log('✅ [documentDataService] formateurInfo final:', formateurInfo);

        // Formater les lieux des sessions (Session 1: lieu1, Session 2: lieu2)
        lieuFormation = window.SessionFormatUtils.formatSessionsLocations(sessions);
        console.log('📍 [documentDataService] Lieux formatés:', lieuFormation);

    } catch (error) {
        console.error('⚠️ [DocumentData] Erreur récupération sessions pour convention:', error);
        lieuFormation = 'formation à distance ou en présentiel selon modalités';
    }

    // Générer un numéro de convention basé sur l'année et le numéro PRJ
    const year = new Date().getFullYear();

    // Calculer la durée depuis le PDC
    const dureeJours = pdc.duree_en_jour || 5;
    const dureeText = dureeJours === 1 ? '1 jour' : `${dureeJours} jour(s)`;

    // Construire le nom de formation avec l'utilitaire
    const formationNom = window.FormationUtils.buildFormationName(pdc);

    // Récupérer les stagiaires par nom (comme dans getConvocationDataFromProject)
    const stagiairesArray = await window.FormationUtils.fetchStagiairesWithFallback(
        project.stagiaire_ids,
        sessions,
        supabase
    );

    // Formater les sessions détaillées (sans lieu pour convention, uniquement les dates)
    console.log('🔍 [documentDataService] Sessions AVANT formatSessionsList:', sessions);
    console.log('🔍 [documentDataService] Nombre de sessions:', sessions.length);
    if (sessions.length > 0) {
        console.log('🔍 [documentDataService] Première session:', sessions[0]);
        console.log('🔍 [documentDataService] dateDebut de la première session:', sessions[0].dateDebut);
        console.log('🔍 [documentDataService] dateFin de la première session:', sessions[0].dateFin);
    }

    const sessionsFormattees = sessions.length > 0 ?
        window.SessionFormatUtils.formatSessionsList(sessions, false) :
        window.SessionFormatUtils.formatSessionFromProject(project);

    console.log('🔍 [documentDataService] sessionsFormattees APRÈS formatSessionsList:', sessionsFormattees);

    // Convertir les noms de stagiaires en string
    const stagiairesString = stagiairesArray.length > 0 ?
        stagiairesArray.join(', ') :
        `${project.nombre_stagiaire || 1} participant(s)`;

    return {
        numero: `${year} PRJ-${project.prj || 'XXXXX'}`,
        societe: entreprise.nom || 'Société',
        adresse: entreprise.adresse || 'Adresse non renseignée',
        representant: contact.prenom && contact.nom ?
            `${contact.prenom.charAt(0).toUpperCase() + contact.prenom.slice(1)} ${contact.nom.toUpperCase()}` :
            'Monsieur le Directeur',
        duree: dureeText,
        formateur: formateurInfo,
        programme: project.name || 'Formation spécialisée',
        moyens: 'Formation en présentiel avec supports pédagogiques et exercices pratiques',
        formation: formationNom,
        cout: '6750,00', // Valeurs par défaut - à terme, récupérer du devis
        tva: '1350,00',
        total: '8100,00',

        // Nouvelles données pour les 7 articles détaillés
        stagiaires: stagiairesString, // Noms complets des stagiaires
        stagiairesListe: stagiairesArray, // Array des noms pour usage ultérieur
        sessionsFormattees: sessionsFormattees, // Array des sessions formatées
        dates: project.periode_souhaitee || 'Dates à définir selon planning', // Fallback
        lieu_type: project.lieu_projet?.toLowerCase().includes('distance') ? 'distance' : 'sur_site',
        lieu_formation: lieuFormation,
        editeur: pdc.logiciel?.editeur || 'Autodesk', // Éditeur du logiciel via PDC
        logiciel: pdc.logiciel?.nom || logiciel.nom || project.name || 'Logiciel',
        type_pdc: pdc.nom || project.type_formation || 'Concepts de base'
    };
}

/**
 * Génère des données par défaut pour un diplôme
 * @returns {Object} Données de diplôme par défaut
 */
function getDefaultDiplomeData() {
    return {
        stagiaire_prenom: 'Prénom',
        stagiaire_nom: 'NOM',
        nom_formation: 'Formation professionnelle',
        dates: 'Dates non définies',
        duree: '0',
        lieu: 'VOISINS-LE-BRETONNEUX',
        date_emission: new Date().toLocaleDateString('fr-FR'),
        responsable: 'Responsable ARKANCE',
        legal: 'SAS au capital de 1 800 000 € RCS Versailles B339 - SIREN 339715542 - Code NAF 6202A - N° TVA FR53339715542 - NDA 11780231378'
    };
}

/**
 * Convertit les données d'une évaluation en données de diplôme
 * Récupère les informations depuis l'évaluation, la formation et les sessions
 *
 * @param {Object} evaluation - Évaluation contenant toutes les données nécessaires
 * @param {Object} supabase - Client Supabase pour les requêtes
 * @returns {Promise<Object>} Données formatées pour le diplôme
 */
async function getDiplomeDataFromEvaluation(evaluation, supabase) {
    if (!evaluation) return getDefaultDiplomeData();

    const formation = evaluation.formation || {};
    const pdc = formation.pdc || {};
    const logiciel = pdc.logiciel || {};
    const formateur = formation.formateur || {};

    // Récupérer les événements (sessions) liés à la formation
    let sessionDates = [];
    let dureeHeures = '0';
    let lieuFormation = '';
    let adresseFormation = '';

    try {
        const { data: events, error: eventsError } = await supabase
            .from('evenement')
            .select('date_debut, date_fin, lieu, adresse')
            .eq('projet_id', formation.id)
            .eq('type_evenement', 'formation')
            .order('date_debut', { ascending: true });

        if (eventsError) {
            console.warn('Erreur récupération événements:', eventsError);
        } else if (events && events.length > 0) {
            // Extraire tous les jours entre date_debut et date_fin pour chaque événement
            const uniqueDates = new Map(); // Utiliser Map pour conserver l'ordre

            events.forEach(event => {
                const dateDebut = new Date(event.date_debut);
                const dateFin = new Date(event.date_fin);

                // Parcourir tous les jours entre date_debut et date_fin (inclus)
                const currentDate = new Date(dateDebut);

                while (currentDate <= dateFin) {
                    const dateKey = currentDate.toLocaleDateString('fr-FR'); // Clé unique par jour

                    if (!uniqueDates.has(dateKey)) {
                        // Formater : "28 octobre 2025"
                        const dateStr = currentDate.toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                        });
                        uniqueDates.set(dateKey, dateStr);
                    }

                    // Passer au jour suivant
                    currentDate.setDate(currentDate.getDate() + 1);
                }
            });

            sessionDates = Array.from(uniqueDates.values());

            // Extraire le lieu et l'adresse du premier événement
            if (events.length > 0) {
                lieuFormation = events[0].lieu || '';
                adresseFormation = events[0].adresse || '';
            }
        }
    } catch (error) {
        console.warn('Erreur lors de la récupération des sessions:', error);
    }

    // Calculer la durée = nombre de jours uniques × 7 heures
    const nombreJours = sessionDates.length;
    dureeHeures = (nombreJours * 7).toString();

    // Construire le nom de la formation : logiciel + version + métier + type
    // Exemple: "AutoCAD Electrical 2024 - ELECTRICITE BASE"
    const metier = pdc.metier_pdc || {};
    const type = pdc.type_pdc || {};

    const parties = [];

    // Partie 1 : Logiciel + Version
    if (logiciel.nom) {
        if (pdc.version_logiciel) {
            parties.push(`${logiciel.nom} ${pdc.version_logiciel}`);
        } else {
            parties.push(logiciel.nom);
        }
    }

    // Partie 2 : Métier + Type
    if (metier.nom && type.nom) {
        parties.push(`${metier.nom} ${type.nom}`);
    } else if (metier.nom) {
        parties.push(metier.nom);
    } else if (type.nom) {
        parties.push(type.nom);
    }

    const nomFormation = parties.length > 0 ? parties.join(' - ') : 'Formation professionnelle';

    // Formater le nom du responsable
    const responsable = formateur.prenom && formateur.nom
        ? `${formateur.prenom} ${formateur.nom}`
        : 'Responsable ARKANCE';

    // Extraire le lieu (ville uniquement)
    let lieu = 'VOISINS-LE-BRETONNEUX';
    if (formation.lieu_projet) {
        // Si le lieu contient "VOISINS" ou "Voisins", utiliser ce format
        if (formation.lieu_projet.toLowerCase().includes('voisins')) {
            lieu = 'VOISINS-LE-BRETONNEUX';
        } else if (formation.lieu_projet.toLowerCase().includes('distance')) {
            lieu = 'Formation à distance';
        } else {
            // Sinon, utiliser le lieu tel quel
            lieu = formation.lieu_projet;
        }
    }

    // Formater les dates avec "le :" ou "les :"
    let datesFormatted = 'Dates non définies';
    if (sessionDates.length > 0) {
        const prefix = sessionDates.length === 1 ? 'le' : 'les';
        datesFormatted = `${prefix} : ${sessionDates.join(', ')}`;
    }

    // Formater la durée avec "Durée : X heures"
    const dureeFormatted = `Durée : ${dureeHeures} heures`;

    return {
        stagiaire_prenom: evaluation.stagiaire_prenom || 'Prénom',
        stagiaire_nom: evaluation.stagiaire_nom || 'NOM',
        stagiaire_societe: evaluation.stagiaire_societe || '',
        nom_formation: nomFormation,
        dates: datesFormatted,
        duree: dureeFormatted,
        lieu: lieu,
        lieu_formation: lieuFormation,
        adresse_formation: adresseFormation,
        date_emission: new Date().toLocaleDateString('fr-FR'),
        responsable: responsable,
        legal: 'SAS au capital de 1 800 000 € RCS Versailles B339 - SIREN 339715542 - Code NAF 6202A - N° TVA FR53339715542 - NDA 11780231378'
    };
}

// Export global pour utilisation dans le projet
if (typeof window !== 'undefined') {
    window.DocumentDataService = {
        getDefaultConvocationData,
        getDefaultConventionData,
        getConvocationDataFromProject,
        getConventionDataFromProject,
        getDefaultDiplomeData,
        getDiplomeDataFromEvaluation
    };
}
