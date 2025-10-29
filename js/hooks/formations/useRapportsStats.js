// Hook personnalisé pour calculer les statistiques de rapports
function useRapportsStats(evaluations, filters = {}) {
    const { useMemo } = React;

    // Fonction utilitaire pour calculer la moyenne
    const calculateAverage = (values) => {
        const validValues = values.filter(v => v !== null && v !== undefined && !isNaN(v));
        if (validValues.length === 0) return 0;
        return validValues.reduce((sum, v) => sum + v, 0) / validValues.length;
    };

    // Fonction pour filtrer les évaluations selon les filtres actifs
    const filteredEvaluations = useMemo(() => {
        let filtered = [...evaluations];

        // Filtre par période
        if (filters.startDate || filters.endDate) {
            filtered = filtered.filter(eval => {
                const evalDate = new Date(eval.submitted_at);
                if (filters.startDate && evalDate < new Date(filters.startDate)) return false;
                if (filters.endDate && evalDate > new Date(filters.endDate)) return false;
                return true;
            });
        }

        // Filtre par formateur
        if (filters.formateurId) {
            filtered = filtered.filter(eval => eval.formation?.formateur?.id === filters.formateurId);
        }

        // Filtre par entreprise
        if (filters.entrepriseId) {
            filtered = filtered.filter(eval => eval.formation?.entreprise?.id === filters.entrepriseId);
        }

        // Filtre par PDC
        if (filters.pdcId) {
            filtered = filtered.filter(eval => eval.formation?.pdc?.id === filters.pdcId);
        }

        // Filtre par logiciel
        if (filters.logicielId) {
            filtered = filtered.filter(eval => eval.formation?.pdc?.logiciel?.id === filters.logicielId);
        }

        // Filtre par statut
        if (filters.statut) {
            filtered = filtered.filter(eval => eval.statut === filters.statut);
        }

        return filtered;
    }, [evaluations, filters]);

    // Calculer les statistiques globales
    const statsGlobales = useMemo(() => {
        const total = filteredEvaluations.length;
        const traitees = filteredEvaluations.filter(e => e.statut === 'Traitée').length;

        // Stagiaires uniques (basé sur email)
        const stagiaireEmails = new Set(
            filteredEvaluations.map(e => e.stagiaire_email).filter(Boolean)
        );
        const nbStagiairesUniques = stagiaireEmails.size;

        // Entreprises uniques
        const entrepriseIds = new Set(
            filteredEvaluations
                .map(e => e.stagiaire_societe)
                .filter(Boolean)
        );
        const nbEntreprisesUniques = entrepriseIds.size;

        // Notes moyennes globales
        const notesMoyennes = {
            organisation: calculateAverage(filteredEvaluations.map(e =>
                calculateAverage([
                    e.org_communication_objectifs,
                    e.org_duree_formation,
                    e.org_composition_groupe,
                    e.org_respect_engagements
                ])
            )),
            moyens: calculateAverage(filteredEvaluations.map(e =>
                calculateAverage([
                    e.moyens_evaluation_locaux,
                    e.moyens_materiel_informatique,
                    e.moyens_formation_distance,
                    e.moyens_support_cours
                ].filter(v => v !== null))
            )),
            pedagogie: calculateAverage(filteredEvaluations.map(e =>
                calculateAverage([
                    e.peda_niveau_difficulte,
                    e.peda_rythme_progression,
                    e.peda_qualite_contenu_theorique,
                    e.peda_qualite_contenu_pratique,
                    e.peda_connaissance_formateur,
                    e.peda_approche_pedagogique,
                    e.peda_ecoute_disponibilite,
                    e.peda_animation_formateur
                ])
            )),
            satisfaction: calculateAverage(filteredEvaluations.map(e =>
                calculateAverage([
                    e.satisf_repondu_attentes,
                    e.satisf_atteint_objectifs,
                    e.satisf_adequation_metier,
                    e.satisf_recommandation,
                    e.satisf_niveau_global
                ])
            ))
        };

        // Moyenne globale
        const moyenneGlobale = calculateAverage([
            notesMoyennes.organisation,
            notesMoyennes.moyens,
            notesMoyennes.pedagogie,
            notesMoyennes.satisfaction
        ]);

        // Taux de recommandation
        const tauxRecommandation = calculateAverage(
            filteredEvaluations.map(e => e.satisf_recommandation).filter(Boolean)
        ) / 5 * 100;

        // Calculer le nombre de jours de formation dispensés
        // Compter les jours uniques par projet (formation.id)
        const joursFormationMap = new Map();
        filteredEvaluations.forEach(e => {
            const formationId = e.formation?.id;
            if (formationId && !joursFormationMap.has(formationId)) {
                // Priorité : pdc.duree_en_jour sinon projects.duree/7
                let jours = 0;
                if (e.formation.pdc?.duree_en_jour != null) {
                    jours = e.formation.pdc.duree_en_jour;
                } else if (e.formation.duree) {
                    const dureeStr = e.formation.duree.toString().trim();
                    const match = dureeStr.match(/(\d+\.?\d*)/);
                    if (match) {
                        const value = parseFloat(match[1]);
                        if (dureeStr.toLowerCase().includes('j')) {
                            jours = value;
                        } else {
                            // Convertir heures en jours (diviser par 7)
                            jours = Math.ceil(value / 7);
                        }
                    }
                }
                joursFormationMap.set(formationId, jours);
            }
        });

        const nbJoursFormation = Array.from(joursFormationMap.values())
            .reduce((sum, jours) => sum + jours, 0);

        // Calculer le nombre de formations (projets uniques)
        const nbFormations = joursFormationMap.size;

        return {
            total,
            traitees,
            tauxTraitees: total > 0 ? (traitees / total * 100) : 0,
            nbStagiairesUniques,
            nbEntreprisesUniques,
            nbFormations,
            nbJoursFormation,
            notesMoyennes,
            moyenneGlobale,
            tauxRecommandation
        };
    }, [filteredEvaluations]);

    // Statistiques par formateur
    const statsByFormateur = useMemo(() => {
        const formateurMap = new Map();

        filteredEvaluations.forEach(eval => {
            const formateur = eval.formation?.formateur;
            if (!formateur) return;

            const formateurId = formateur.id;
            if (!formateurMap.has(formateurId)) {
                formateurMap.set(formateurId, {
                    formateur: formateur,
                    evaluations: [],
                    nbFormations: 0,
                    nbStagiaires: new Set()
                });
            }

            const stats = formateurMap.get(formateurId);
            stats.evaluations.push(eval);
            stats.nbStagiaires.add(eval.stagiaire_email);
        });

        // Compter les formations uniques par formateur
        const formationMap = new Map();
        filteredEvaluations.forEach(eval => {
            const formateurId = eval.formation?.formateur?.id;
            const formationId = eval.formation?.id;
            if (formateurId && formationId) {
                if (!formationMap.has(formateurId)) {
                    formationMap.set(formateurId, new Set());
                }
                formationMap.get(formateurId).add(formationId);
            }
        });

        // Calculer les moyennes pour chaque formateur
        const results = [];
        formateurMap.forEach((stats, formateurId) => {
            const evals = stats.evaluations;

            const notesMoyennes = {
                organisation: calculateAverage(evals.map(e =>
                    calculateAverage([
                        e.org_communication_objectifs,
                        e.org_duree_formation,
                        e.org_composition_groupe,
                        e.org_respect_engagements
                    ])
                )),
                moyens: calculateAverage(evals.map(e =>
                    calculateAverage([
                        e.moyens_evaluation_locaux,
                        e.moyens_materiel_informatique,
                        e.moyens_formation_distance,
                        e.moyens_support_cours
                    ].filter(v => v !== null))
                )),
                pedagogie: calculateAverage(evals.map(e =>
                    calculateAverage([
                        e.peda_niveau_difficulte,
                        e.peda_rythme_progression,
                        e.peda_qualite_contenu_theorique,
                        e.peda_qualite_contenu_pratique,
                        e.peda_connaissance_formateur,
                        e.peda_approche_pedagogique,
                        e.peda_ecoute_disponibilite,
                        e.peda_animation_formateur
                    ])
                )),
                satisfaction: calculateAverage(evals.map(e =>
                    calculateAverage([
                        e.satisf_repondu_attentes,
                        e.satisf_atteint_objectifs,
                        e.satisf_adequation_metier,
                        e.satisf_recommandation,
                        e.satisf_niveau_global
                    ])
                ))
            };

            const moyenneGlobale = calculateAverage([
                notesMoyennes.organisation,
                notesMoyennes.moyens,
                notesMoyennes.pedagogie,
                notesMoyennes.satisfaction
            ]);

            const tauxRecommandation = calculateAverage(
                evals.map(e => e.satisf_recommandation).filter(Boolean)
            ) / 5 * 100;

            const nbQualiopiCompletes = evals.filter(e => e.qualiopi_formateur_themes).length;

            results.push({
                formateur: stats.formateur,
                nbEvaluations: evals.length,
                nbFormations: formationMap.get(formateurId)?.size || 0,
                nbStagiaires: stats.nbStagiaires.size,
                notesMoyennes,
                moyenneGlobale,
                tauxRecommandation,
                nbQualiopiCompletes,
                tauxQualiopiCompletes: evals.length > 0 ? (nbQualiopiCompletes / evals.length * 100) : 0
            });
        });

        // Trier par moyenne globale décroissante
        return results.sort((a, b) => b.moyenneGlobale - a.moyenneGlobale);
    }, [filteredEvaluations]);

    // Statistiques par PDC (Plan de cours)
    const statsByPDC = useMemo(() => {
        const pdcMap = new Map();

        filteredEvaluations.forEach(eval => {
            const pdc = eval.formation?.pdc;
            if (!pdc) return;

            const pdcId = pdc.id;
            if (!pdcMap.has(pdcId)) {
                pdcMap.set(pdcId, {
                    pdc: pdc,
                    evaluations: [],
                    formations: new Set(),
                    stagiaires: new Set()
                });
            }

            const stats = pdcMap.get(pdcId);
            stats.evaluations.push(eval);
            if (eval.formation?.id) stats.formations.add(eval.formation.id);
            if (eval.stagiaire_email) stats.stagiaires.add(eval.stagiaire_email);
        });

        const results = [];
        pdcMap.forEach((stats, pdcId) => {
            const evals = stats.evaluations;

            const notesMoyennes = {
                organisation: calculateAverage(evals.map(e =>
                    calculateAverage([
                        e.org_communication_objectifs,
                        e.org_duree_formation,
                        e.org_composition_groupe,
                        e.org_respect_engagements
                    ])
                )),
                moyens: calculateAverage(evals.map(e =>
                    calculateAverage([
                        e.moyens_evaluation_locaux,
                        e.moyens_materiel_informatique,
                        e.moyens_formation_distance,
                        e.moyens_support_cours
                    ].filter(v => v !== null))
                )),
                pedagogie: calculateAverage(evals.map(e =>
                    calculateAverage([
                        e.peda_niveau_difficulte,
                        e.peda_rythme_progression,
                        e.peda_qualite_contenu_theorique,
                        e.peda_qualite_contenu_pratique,
                        e.peda_connaissance_formateur,
                        e.peda_approche_pedagogique,
                        e.peda_ecoute_disponibilite,
                        e.peda_animation_formateur
                    ])
                )),
                satisfaction: calculateAverage(evals.map(e =>
                    calculateAverage([
                        e.satisf_repondu_attentes,
                        e.satisf_atteint_objectifs,
                        e.satisf_adequation_metier,
                        e.satisf_recommandation,
                        e.satisf_niveau_global
                    ])
                ))
            };

            const moyenneGlobale = calculateAverage([
                notesMoyennes.organisation,
                notesMoyennes.moyens,
                notesMoyennes.pedagogie,
                notesMoyennes.satisfaction
            ]);

            results.push({
                pdc: stats.pdc,
                nbEvaluations: evals.length,
                nbFormations: stats.formations.size,
                nbStagiaires: stats.stagiaires.size,
                notesMoyennes,
                moyenneGlobale
            });
        });

        return results.sort((a, b) => b.moyenneGlobale - a.moyenneGlobale);
    }, [filteredEvaluations]);

    // Statistiques par entreprise
    const statsByEntreprise = useMemo(() => {
        const entrepriseMap = new Map();

        filteredEvaluations.forEach(eval => {
            const entreprise = eval.stagiaire_societe;
            if (!entreprise) return;

            if (!entrepriseMap.has(entreprise)) {
                entrepriseMap.set(entreprise, {
                    nom: entreprise,
                    evaluations: [],
                    formations: new Set(),
                    stagiaires: new Set()
                });
            }

            const stats = entrepriseMap.get(entreprise);
            stats.evaluations.push(eval);
            if (eval.formation?.id) stats.formations.add(eval.formation.id);
            if (eval.stagiaire_email) stats.stagiaires.add(eval.stagiaire_email);
        });

        const results = [];
        entrepriseMap.forEach((stats, entrepriseNom) => {
            const evals = stats.evaluations;

            const moyenneGlobale = calculateAverage(evals.map(e => e.satisf_niveau_global));

            results.push({
                entreprise: entrepriseNom,
                nbEvaluations: evals.length,
                nbFormations: stats.formations.size,
                nbStagiaires: stats.stagiaires.size,
                moyenneGlobale
            });
        });

        return results.sort((a, b) => b.nbFormations - a.nbFormations);
    }, [filteredEvaluations]);

    // Statistiques Qualiopi
    const statsQualiopi = useMemo(() => {
        // Filtrer les évaluations qui ont des données Qualiopi
        const evalsWithQualiopi = filteredEvaluations.filter(
            e => e.qualiopi_themes && Object.keys(e.qualiopi_themes).length > 0
        );

        if (evalsWithQualiopi.length === 0) {
            return null;
        }

        // Calculer les progressions moyennes par thème
        const themeProgressions = {};
        const themeComparisons = {};

        evalsWithQualiopi.forEach(eval => {
            const themes = eval.qualiopi_themes;
            const formateurThemes = eval.qualiopi_formateur_themes || {};

            Object.keys(themes).forEach(themeKey => {
                const theme = themes[themeKey];

                if (!themeProgressions[themeKey]) {
                    themeProgressions[themeKey] = {
                        titre: theme.titre,
                        progressions: [],
                        avants: [],
                        apres: []
                    };
                    themeComparisons[themeKey] = {
                        titre: theme.titre,
                        stagiaire: [],
                        formateur: []
                    };
                }

                // Progression
                const progression = (theme.apres || 0) - (theme.avant || 0);
                themeProgressions[themeKey].progressions.push(progression);
                themeProgressions[themeKey].avants.push(theme.avant || 0);
                themeProgressions[themeKey].apres.push(theme.apres || 0);

                // Comparaison stagiaire/formateur
                themeComparisons[themeKey].stagiaire.push(theme.apres || 0);
                if (formateurThemes[themeKey]?.note) {
                    themeComparisons[themeKey].formateur.push(formateurThemes[themeKey].note);
                }
            });
        });

        // Calculer les moyennes
        const progressionsMoyennes = {};
        Object.keys(themeProgressions).forEach(themeKey => {
            const data = themeProgressions[themeKey];
            progressionsMoyennes[themeKey] = {
                titre: data.titre,
                progressionMoyenne: calculateAverage(data.progressions),
                avantMoyenne: calculateAverage(data.avants),
                apresMoyenne: calculateAverage(data.apres)
            };
        });

        const comparisonsMoyennes = {};
        Object.keys(themeComparisons).forEach(themeKey => {
            const data = themeComparisons[themeKey];
            comparisonsMoyennes[themeKey] = {
                titre: data.titre,
                stagiaireMoyenne: calculateAverage(data.stagiaire),
                formateurMoyenne: calculateAverage(data.formateur),
                ecart: calculateAverage(data.stagiaire) - calculateAverage(data.formateur)
            };
        });

        return {
            progressionsMoyennes,
            comparisonsMoyennes,
            nbEvaluationsQualiopi: evalsWithQualiopi.length
        };
    }, [filteredEvaluations]);

    // Statistiques temporelles
    const statsTemporelles = useMemo(() => {
        // Grouper par mois
        const parMois = {};

        filteredEvaluations.forEach(eval => {
            const date = new Date(eval.submitted_at);
            const moisKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!parMois[moisKey]) {
                parMois[moisKey] = {
                    mois: moisKey,
                    nombre: 0,
                    noteMoyenne: []
                };
            }

            parMois[moisKey].nombre++;
            parMois[moisKey].noteMoyenne.push(eval.satisf_niveau_global);
        });

        // Transformer en tableau et calculer les moyennes
        const evolution = Object.keys(parMois)
            .sort()
            .map(moisKey => ({
                mois: moisKey,
                nombre: parMois[moisKey].nombre,
                noteMoyenne: calculateAverage(parMois[moisKey].noteMoyenne)
            }));

        return evolution;
    }, [filteredEvaluations]);

    // Détail des notes par question
    const detailNotes = useMemo(() => {
        return {
            organisation: {
                communication_objectifs: calculateAverage(filteredEvaluations.map(e => e.org_communication_objectifs)),
                duree_formation: calculateAverage(filteredEvaluations.map(e => e.org_duree_formation)),
                composition_groupe: calculateAverage(filteredEvaluations.map(e => e.org_composition_groupe)),
                respect_engagements: calculateAverage(filteredEvaluations.map(e => e.org_respect_engagements))
            },
            moyens: {
                evaluation_locaux: calculateAverage(filteredEvaluations.map(e => e.moyens_evaluation_locaux)),
                materiel_informatique: calculateAverage(filteredEvaluations.map(e => e.moyens_materiel_informatique)),
                formation_distance: calculateAverage(filteredEvaluations.map(e => e.moyens_formation_distance)),
                support_cours: calculateAverage(filteredEvaluations.map(e => e.moyens_support_cours)),
                restauration: calculateAverage(filteredEvaluations.map(e => e.moyens_restauration).filter(Boolean))
            },
            pedagogie: {
                niveau_difficulte: calculateAverage(filteredEvaluations.map(e => e.peda_niveau_difficulte)),
                rythme_progression: calculateAverage(filteredEvaluations.map(e => e.peda_rythme_progression)),
                qualite_contenu_theorique: calculateAverage(filteredEvaluations.map(e => e.peda_qualite_contenu_theorique)),
                qualite_contenu_pratique: calculateAverage(filteredEvaluations.map(e => e.peda_qualite_contenu_pratique)),
                connaissance_formateur: calculateAverage(filteredEvaluations.map(e => e.peda_connaissance_formateur)),
                approche_pedagogique: calculateAverage(filteredEvaluations.map(e => e.peda_approche_pedagogique)),
                ecoute_disponibilite: calculateAverage(filteredEvaluations.map(e => e.peda_ecoute_disponibilite)),
                animation_formateur: calculateAverage(filteredEvaluations.map(e => e.peda_animation_formateur))
            },
            satisfaction: {
                repondu_attentes: calculateAverage(filteredEvaluations.map(e => e.satisf_repondu_attentes)),
                atteint_objectifs: calculateAverage(filteredEvaluations.map(e => e.satisf_atteint_objectifs)),
                adequation_metier: calculateAverage(filteredEvaluations.map(e => e.satisf_adequation_metier)),
                recommandation: calculateAverage(filteredEvaluations.map(e => e.satisf_recommandation)),
                niveau_global: calculateAverage(filteredEvaluations.map(e => e.satisf_niveau_global))
            }
        };
    }, [filteredEvaluations]);

    return {
        statsGlobales,
        statsByFormateur,
        statsByPDC,
        statsByEntreprise,
        statsQualiopi,
        statsTemporelles,
        detailNotes,
        nbEvaluationsFiltrees: filteredEvaluations.length
    };
}

// Export global
window.useRapportsStats = useRapportsStats;
