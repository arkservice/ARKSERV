// Composant App principal
function App() {
    const { useEffect } = React;

    useEffect(() => {
        // Utiliser la version safe qui attend que lucide soit chargé
        if (window.safeCreateIcons) {
            window.safeCreateIcons().catch(error => {
                console.error('Erreur lors de l\'initialisation des icônes Lucide:', error);
            });
        } else {
            console.warn('⚠️ safeCreateIcons n\'est pas disponible, tentative directe...');
            if (window.lucide && window.lucide.createIcons) {
                window.lucide.createIcons();
            }
        }
    }, []);

    return React.createElement(window.Layout);
}

// Rendu de l'application
function initializeApp() {
    // Vérifier que tous les modules nécessaires sont chargés
    const requiredModules = [
        'supabaseConfig',
        'useAuth',
        'useUserProfile',
        'useEntreprises',
        'useProjects',
        'useTasks',
        'useLogiciels',
        'usePdc',
        'useUsers',
        'useUserCompetences',
        'useUserPlanning',
        'useArkanceUsers',
        'useFormateurs',
        'useTemplates',
        'useFormation',
        'useEvaluation',
        'useRapportsStats',
        'useAgences',
        'generatePDFWithJsPDF',
        'TableView',
        'SimpleCalendar',
        'TimelineView',
        'StarRating',
        'StatCard',
        'FormateursTable',
        'PDCTable',
        'EntreprisesTable',
        'FiltersPanel',
        'Sidebar',
        'AuthProvider',
        'LoginModal',
        'EntreprisesPage',
        'EntrepriseDetailPage',
        'ProjectsPage',
        'ProjectDetailPage',
        'TasksPage',
        'TaskDetailPage',
        'LogicielsPage',
        'LogicielDetailPage',
        'PdcPage',
        'PdcDetailPage',
        'UsersPage',
        'UserDetailPage',
        'PlanningPage',
        'EntrepriseModal',
        'ProjectModal',
        'TaskModal',
        'UserModal',
        'UserCompetenceModal',
        'UserPlanningModal',
        'PdcModal',
        'AppointmentBookingPage',
        'TemplateBuilderPage',
        'FormationPrepPage',
        'EvaluationFormPage',
        'EvaluationListPage',
        'AgencesPage',
        'RapportsPage',
        'Layout'
    ];

    const missingModules = requiredModules.filter(module => !window[module]);

    // Vérifier que Lucide Icons est chargé
    if (!window.lucide || typeof window.lucide.createIcons !== 'function') {
        console.error('❌ Lucide Icons n\'est pas chargé correctement');
        missingModules.push('lucide');
    }

    // Vérifier que le helper Lucide est chargé
    if (!window.safeCreateIcons) {
        console.warn('⚠️ lucideHelper (safeCreateIcons) n\'est pas chargé');
        missingModules.push('safeCreateIcons');
    }

    if (missingModules.length > 0) {
        console.error('Modules manquants:', missingModules);
        return;
    }
    
    // Initialiser l'application avec React 18 createRoot
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(App));
}

// Export global
window.App = App;
window.initializeApp = initializeApp;