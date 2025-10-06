// Configuration Supabase
const supabaseUrl = 'https://qhtpibkaiyfrqxdtytag.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFodHBpYmthaXlmcnF4ZHR5dGFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMjE3MDYsImV4cCI6MjA2NjY5NzcwNn0.HBL78_qkP71sDRnIA6bQLtGWrf2VogGV1E_60B3q5G8';

// Instance Supabase
const supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

// Export pour utilisation dans d'autres modules
window.supabaseConfig = {
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
    client: supabase
};