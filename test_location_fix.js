// Script de test pour valider la correction du lieu de formation
// À exécuter dans la console du navigateur sur la page avec un projet

// Fonction pour tester la correction du lieu
async function testLocationFix(projectId) {
    console.log('🧪 Test de la correction du lieu de formation pour projet:', projectId);
    
    if (!window.useDocumentGenerationService) {
        console.error('❌ Service de génération de documents non disponible');
        return false;
    }
    
    try {
        // Utiliser la fonction de test existante
        const result = await window.testLieuFormationCorrection(projectId);
        
        if (result && result.lieu_formation) {
            console.log('✅ Test réussi! Lieu formaté:', result.lieu_formation);
            
            // Vérifier que ce n'est pas le texte par défaut
            if (result.lieu_formation.includes('à l\'adresse à définir')) {
                console.warn('⚠️ Le lieu contient encore le texte par défaut');
                return false;
            }
            
            // Vérifier le format attendu "Session X: lieu"
            if (result.lieu_formation.includes('Session')) {
                console.log('✅ Format de session détecté correctement');
                return true;
            } else {
                console.log('ℹ️ Format simple détecté:', result.lieu_formation);
                return true;
            }
        } else {
            console.error('❌ Pas de lieu_formation dans les données retournées');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Erreur lors du test:', error);
        return false;
    }
}

// Instructions d'utilisation
console.log(`
🧪 SCRIPT DE TEST CHARGÉ

Pour tester la correction du lieu de formation:

1. Ouvrez la console du navigateur sur votre application
2. Collez ce script et appuyez sur Entrée
3. Exécutez: testLocationFix('VOTRE_PROJECT_ID')

Exemple:
testLocationFix('abc123-def456-ghi789')

Le test vérifiera que le lieu ne contient plus "à l'adresse à définir"
et qu'il est correctement formaté avec les adresses des sessions.
`);

// Export pour utilisation
window.testLocationFix = testLocationFix;