# Instructions pour Claude Code

## Workflow principal

1. **Analyse initiale**
   - Analysez d'abord le contexte du projet (README, package.json, structure)
   - Lisez la base de code pour identifier les fichiers pertinents et leurs dépendances
   - Comprenez l'architecture et les patterns existants

2. **Planification**
   - Rédigez un plan détaillé dans `tasks/todo.md` avec :
     - Liste d'actions à effectuer (format checkbox)
     - Estimation de complexité (Simple/Moyen/Complexe)
     - Fichiers concernés par chaque tâche
     - Impact estimé de chaque modification

3. **Validation humaine**
   - Contactez-moi pour que je vérifie le plan avant de commencer
   - Attendez ma confirmation avant de procéder à l'exécution

4. **Exécution**
   - Travaillez sur les actions une par une, dans l'ordre du plan
   - Marquez les tâches comme terminées au fur et à mesure ([x])
   - Documentez chaque étape dans le journal d'exécution

5. **Communication à chaque étape**
   - Expliquez clairement les modifications apportées
   - Mentionnez les tests effectués (si applicable)
   - Signalez tout problème ou décision technique prise
   - Documentez les écarts par rapport au plan initial

## Principes fondamentaux

6. **Simplicité maximale**
   - Simplifiez au maximum chaque tâche et modification de code
   - Évitez toute modification massive ou complexe
   - Chaque modification doit avoir un impact minimal sur le code existant
   - Privilégiez les solutions incrémentales

7. **Respect des standards**
   - Respectez les conventions de nommage du projet existant
   - Suivez le style de code (indentation, formatage)
   - Maintenez les patterns architecturaux en place
   - Conservez la langue et le format des commentaires existants

8. **Gestion des erreurs**
   - En cas de problème, stoppez immédiatement et documentez l'erreur
   - Proposez des alternatives ou un rollback si nécessaire
   - Ne forcez jamais une solution qui semble instable
   - Demandez validation avant de continuer après un problème

9. **Tests et validation**
   - Avant de marquer une tâche terminée :
     - Vérifiez que le code compile/s'exécute
     - Testez les fonctionnalités modifiées
     - Vérifiez qu'aucune régression n'est introduite
     - Documentez les tests effectués

10. **Gestion des dépendances**
    - Listez les nouvelles dépendances nécessaires
    - Vérifiez la compatibilité avec l'existant
    - Proposez des alternatives en cas de conflit
    - Documentez les raisons des choix techniques

11. **Révision finale**
    - Ajoutez une section de révision complète au fichier `todo.md`
    - Incluez un résumé des modifications apportées
    - Listez tous les fichiers modifiés
    - Mentionnez toute information pertinente pour la suite

## Communication proactive

- Signalez proactivement tout écart par rapport au plan initial
- Mentionnez toute découverte inattendue dans le code
- Proposez des améliorations si vous en identifiez
- Suggérez des messages de commit clairs pour chaque étape (si Git est utilisé)