// Utilitaires communs pour les workflows de tâches
window.TaskWorkflowUtils = {
    
    // Fonction pour formater les dates de sessions
    formatSessionDate: (dateString) => {
        if (!dateString) return '';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            console.error('Erreur lors du formatage de date:', error);
            return dateString;
        }
    },
    
    // Fonction pour formater les heures
    formatSessionTime: (dateString) => {
        if (!dateString) return '';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error('Erreur lors du formatage d\'heure:', error);
            return dateString;
        }
    },
    
    // Fonction pour calculer la durée entre deux dates
    calculateDuration: (startDate, endDate) => {
        if (!startDate || !endDate) return 0;
        
        try {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const diffMs = end.getTime() - start.getTime();
            const diffDays = diffMs / (1000 * 60 * 60 * 24);
            return Math.round(diffDays * 2) / 2; // Arrondir au demi-jour
        } catch (error) {
            console.error('Erreur lors du calcul de durée:', error);
            return 0;
        }
    },
    
    // Fonction pour valider les données de session
    validateSessionData: (sessionData) => {
        const errors = [];
        
        if (!sessionData.duration || sessionData.duration <= 0) {
            errors.push('La durée de la session est requise');
        }
        
        if (!sessionData.formateurId) {
            errors.push('Un formateur doit être sélectionné');
        }
        
        if (!sessionData.dateDebut) {
            errors.push('La date de début est requise');
        }
        
        if (!sessionData.dateFin) {
            errors.push('La date de fin est requise');
        }
        
        if (!sessionData.typeLieu) {
            errors.push('Le type de lieu doit être spécifié');
        }
        
        if (sessionData.typeLieu === 'site' && !sessionData.adresse) {
            errors.push('L\'adresse est requise pour les formations sur site');
        }
        
        if (!sessionData.stagiaireIds || sessionData.stagiaireIds.length === 0) {
            errors.push('Au moins un stagiaire doit être sélectionné');
        }
        
        return errors;
    },
    
    // Fonction pour obtenir le statut d'une tâche avec style
    getTaskStatusDisplay: (status) => {
        const statusMap = {
            'pending': {
                label: 'En attente',
                className: 'bg-yellow-100 text-yellow-800 border-yellow-300'
            },
            'in_progress': {
                label: 'En cours',
                className: 'bg-blue-100 text-blue-800 border-blue-300'
            },
            'completed': {
                label: 'Terminé',
                className: 'bg-green-100 text-green-800 border-green-300'
            },
            'cancelled': {
                label: 'Annulé',
                className: 'bg-red-100 text-red-800 border-red-300'
            },
            'on_hold': {
                label: 'En pause',
                className: 'bg-orange-100 text-orange-800 border-orange-300'
            }
        };
        
        return statusMap[status] || {
            label: status || 'Inconnu',
            className: 'bg-gray-100 text-gray-800 border-gray-300'
        };
    },
    
    // Fonction pour obtenir l'icône d'une tâche selon son type
    getTaskIcon: (taskTitle) => {
        const iconMap = {
            'Demande de qualification': 'search',
            'Qualification': 'check-circle',
            'Devis': 'file-text',
            'Validation du devis': 'pen-tool',
            'Planification': 'calendar'
        };
        
        return iconMap[taskTitle] || 'file';
    },
    
    // Fonction pour générer un ID unique pour les sessions
    generateSessionId: () => {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },
    
    // Fonction pour parser les titres de sessions multi-jours
    parseSessionTitle: (title) => {
        const multiDayPattern = /^(.+?)\s*-\s*Jour\s+(\d+)\/(\d+)$/;
        const match = title.match(multiDayPattern);
        
        if (match) {
            return {
                baseTitle: match[1].trim(),
                dayIndex: parseInt(match[2]),
                totalDays: parseInt(match[3]),
                isMultiDay: true
            };
        }
        
        return {
            baseTitle: title,
            dayIndex: 1,
            totalDays: 1,
            isMultiDay: false
        };
    },
    
    // Fonction pour générer le titre d'une session multi-jours
    generateSessionTitle: (baseTitle, dayIndex, totalDays) => {
        if (totalDays > 1) {
            return `${baseTitle} - Jour ${dayIndex}/${totalDays}`;
        }
        return baseTitle;
    },
    
    // Fonction pour grouper les utilisateurs par entreprise
    groupUsersByEntreprise: (users) => {
        const grouped = {};
        
        users.forEach(user => {
            const entrepriseId = user.entreprise?.id || 'sans_entreprise';
            const entrepriseName = user.entreprise?.nom || 'Sans entreprise';
            
            if (!grouped[entrepriseId]) {
                grouped[entrepriseId] = {
                    id: entrepriseId,
                    nom: entrepriseName,
                    users: []
                };
            }
            
            grouped[entrepriseId].users.push(user);
        });
        
        return Object.values(grouped);
    },
    
    // Fonction pour filtrer les formateurs
    filterFormateurs: (users) => {
        return users.filter(user => 
            user.fonction && 
            user.fonction.nom && 
            user.fonction.nom.toLowerCase().includes('formateur')
        );
    },
    
    // Fonction pour filtrer les stagiaires (non-formateurs)
    filterStagiaires: (users) => {
        return users.filter(user => 
            !user.fonction || 
            !user.fonction.nom || 
            !user.fonction.nom.toLowerCase().includes('formateur')
        );
    },
    
    // Fonction pour formater une liste de noms
    formatUserNames: (users) => {
        return users.map(user => `${user.prenom} ${user.nom}`);
    },
    
    // Fonction pour créer un résumé de session
    createSessionSummary: (sessionData) => {
        const formattedDate = window.TaskWorkflowUtils.formatSessionDate(sessionData.dateDebut);
        const formattedTime = window.TaskWorkflowUtils.formatSessionTime(sessionData.dateDebut);
        const lieu = sessionData.typeLieu === 'distance' ? 'À distance' : sessionData.adresse || 'Sur site';
        
        return {
            title: `Session ${sessionData.sessionNumber}`,
            date: formattedDate,
            time: formattedTime,
            duration: `${sessionData.duration || 1} jour${(sessionData.duration || 1) > 1 ? 's' : ''}`,
            formateur: sessionData.formateurNom || 'Non assigné',
            lieu: lieu,
            stagiaires: sessionData.stagiaireNoms || [],
            status: sessionData.eventId ? 'Programmée' : 'En attente'
        };
    }
};

// Export des constantes utiles
window.TaskWorkflowUtils.TASK_TYPES = {
    QUALIFICATION_REQUEST: 'Demande de qualification',
    QUALIFICATION: 'Qualification',
    DEVIS: 'Devis',
    DEVIS_VALIDATION: 'Validation du devis',
    PLANIFICATION: 'Planification',
    GENERATION_DOCUMENTS: 'Génération documents',
    VALIDATION_DOCUMENTS: 'Validation des documents',
    EMARGEMENT: 'emargement',
    EVALUATION: 'evaluation',
    FACTURE: 'facture',
    DIPLOMES: 'diplômes'
};

window.TaskWorkflowUtils.SESSION_LIEU_TYPES = {
    DISTANCE: 'distance',
    SITE: 'site'
};

window.TaskWorkflowUtils.WORKFLOW_ORDER = {
    'Demande de qualification': 1,
    'Qualification': 2,
    'Devis': 3,
    'Validation du devis': 4,
    'Planification': 5,
    'Génération documents': 6,
    'Validation des documents': 7,
    'emargement': 8,
    'evaluation': 9,
    'facture': 10,
    'diplômes': 11
};