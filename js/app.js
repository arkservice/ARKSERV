// Composant App principal
function App() {
    const { useEffect } = React;
    
    useEffect(() => {
        lucide.createIcons();
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
        'useAgences',
        'generatePDFWithJsPDF',
        'TableView',
        'SimpleCalendar',
        'TimelineView',
        'StarRating',
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
        'Layout'
    ];
    
    const missingModules = requiredModules.filter(module => !window[module]);
    
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