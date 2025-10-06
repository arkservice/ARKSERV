// Service pour la gestion de la logique de qualification et RDV
function useQualificationService() {
    const { useState, useCallback } = React;
    const supabase = window.supabaseConfig.client;
    const { getExistingAppointment } = window.useFormateurs();

    // États spécifiques à la qualification
    const [existingAppointment, setExistingAppointment] = useState(null);
    const [loadingExistingAppointment, setLoadingExistingAppointment] = useState(false);

    // Fonction pour vérifier s'il y a un RDV existant pour une tâche
    const checkExistingAppointment = useCallback(async (tacheData) => {
        try {
            if (!tacheData?.project?.id) return null;
            
            setLoadingExistingAppointment(true);
            console.log('🔍 Vérification RDV existant pour projet:', tacheData.project.id);
            
            const appointment = await getExistingAppointment(tacheData.id, tacheData.project.id);
            
            if (appointment) {
                console.log('✅ RDV existant trouvé:', appointment);
                setExistingAppointment(appointment);
                return appointment;
            } else {
                console.log('ℹ️ Aucun RDV existant trouvé');
                setExistingAppointment(null);
                return null;
            }
        } catch (err) {
            console.error('Erreur lors de la vérification du RDV existant:', err);
            setExistingAppointment(null);
            return null;
        } finally {
            setLoadingExistingAppointment(false);
        }
    }, [getExistingAppointment]);

    // Fonction pour enrichir une tâche avec les données de RDV
    const enrichTaskWithAppointment = useCallback((tache, appointment = null) => {
        const appointmentData = appointment || existingAppointment;
        return {
            ...tache,
            project: tache.project,
            existingAppointment: appointmentData
        };
    }, [existingAppointment]);

    // Fonction pour gérer la navigation vers la booking d'appointment
    const handleAppointmentBookingNavigation = useCallback((tache, onNavigateToAppointmentBooking) => {
        if (!onNavigateToAppointmentBooking) {
            console.warn('⚠️ Fonction de navigation non fournie');
            return;
        }

        console.log("🎯 Navigation vers appointment booking avec tache:", tache);
        
        const enrichedTask = enrichTaskWithAppointment(tache);
        console.log("📋 Tâche enrichie avec projet:", enrichedTask.project);
        
        if (existingAppointment) {
            console.log("🔄 RDV existant détecté, mode modification:", existingAppointment);
        }
        
        onNavigateToAppointmentBooking(enrichedTask);
    }, [existingAppointment, enrichTaskWithAppointment]);

    // Fonction pour gérer la navigation vers la sélection PDC
    const handlePdcSelectionNavigation = useCallback((tache, onNavigateToPdcSelection) => {
        if (!onNavigateToPdcSelection) {
            console.warn('⚠️ Fonction de navigation PDC non fournie');
            return;
        }

        console.log("🎯 Navigation vers sélection PDC avec tache:", tache);
        onNavigateToPdcSelection(tache);
    }, []);

    // Fonction pour déterminer le statut du RDV
    const getAppointmentStatus = useCallback(() => {
        if (loadingExistingAppointment) return 'loading';
        if (existingAppointment) return 'existing';
        return 'none';
    }, [existingAppointment, loadingExistingAppointment]);

    // Fonction pour formater les informations du RDV existant
    const formatAppointmentInfo = useCallback((appointment = null) => {
        const appointmentData = appointment || existingAppointment;
        if (!appointmentData) return null;

        return {
            title: "Modifier le RDV existant",
            description: `RDV déjà fixé le ${appointmentData.date} à ${appointmentData.heure} avec ${appointmentData.formateurNom}. Cliquez pour le modifier.`,
            buttonClass: "border-orange-300 hover:border-orange-500 hover:bg-orange-50",
            iconClass: "text-orange-600"
        };
    }, [existingAppointment]);

    // Fonction pour obtenir les informations de création de RDV
    const getNewAppointmentInfo = useCallback(() => {
        return {
            title: "Prendre RDV avec un formateur",
            description: "Être accompagné par un expert pour choisir le programme le plus adapté à vos besoins",
            buttonClass: "border-green-300 hover:border-green-500 hover:bg-green-50",
            iconClass: "text-green-600"
        };
    }, []);

    // Fonction pour réinitialiser les états
    const resetQualificationState = useCallback(() => {
        setExistingAppointment(null);
        setLoadingExistingAppointment(false);
    }, []);

    return {
        // États
        existingAppointment,
        loadingExistingAppointment,
        
        // Actions
        setExistingAppointment,
        
        // Fonctions
        checkExistingAppointment,
        enrichTaskWithAppointment,
        handleAppointmentBookingNavigation,
        handlePdcSelectionNavigation,
        getAppointmentStatus,
        formatAppointmentInfo,
        getNewAppointmentInfo,
        resetQualificationState
    };
}

// Export global
window.useQualificationService = useQualificationService;