# send-evaluation-email

Edge Function pour envoyer le bilan Qualiopi au formateur après une session de formation.

## Fonctionnement

Cette fonction est appelée automatiquement depuis le frontend lorsqu'un formateur valide une évaluation et que son statut passe à "Traitée".

### Workflow

1. Le formateur complète l'évaluation et valide
2. Le frontend génère le PDF Qualiopi et l'upload sur Supabase Storage
3. Le frontend met à jour le statut de l'évaluation à "Traitée"
4. Le frontend appelle cette Edge Function avec `evaluationId`
5. L'Edge Function télécharge le PDF et l'envoie par email au formateur

## Paramètres

```typescript
{
  evaluationId: string // ID de l'évaluation dans la table evaluation
}
```

## Validation

La fonction vérifie que :
- `evaluationId` est fourni
- L'évaluation existe dans la base de données
- Le statut est "Traitée"
- Le PDF Qualiopi (`pdf_qualiopi_url`) est disponible
- L'email du formateur (`email_formateur`) est renseigné

## Variables d'environnement requises

```bash
RESEND_API_KEY=re_xxx
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
```

## Déploiement

### En local (développement)

```bash
# Installer Supabase CLI si nécessaire
npm install -g supabase

# Démarrer les services locaux
supabase start

# Déployer la fonction localement
supabase functions serve send-evaluation-email
```

### En production

```bash
# Déployer sur Supabase
supabase functions deploy send-evaluation-email

# Configurer les secrets (une seule fois)
supabase secrets set RESEND_API_KEY=re_xxx
```

## Tests

### Test manuel depuis le frontend

L'appel se fait depuis `EvaluationListPage.js` dans la fonction `handleSaveFormateurEvaluation` :

```javascript
const { data: emailData, error: emailError } = await supabase.functions.invoke(
    'send-evaluation-email',
    { body: { evaluationId: evaluation.id } }
);
```

### Test avec curl

```bash
curl -i --location --request POST 'https://qhtpibkaiyfrqxdtytag.supabase.co/functions/v1/send-evaluation-email' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"evaluationId":"YOUR_EVALUATION_ID"}'
```

## Structure de l'email

L'email envoyé contient :
- **Destinataire** : Email du formateur (`email_formateur`)
- **Sujet** : "Bilan Qualiopi - [Thème] - [Date]"
- **Corps** : Template HTML professionnel avec détails de la formation
- **Pièce jointe** : PDF Qualiopi généré

## Gestion des erreurs

La fonction retourne :
- **200** : Email envoyé avec succès
- **400** : Paramètres invalides ou manquants
- **500** : Erreur serveur (Supabase ou Resend)

## Logs

Les logs sont accessibles via :
```bash
supabase functions logs send-evaluation-email
```

## Notes

- Cette fonction utilise **Resend** pour l'envoi d'emails
- Le PDF est téléchargé depuis Supabase Storage puis converti en base64 pour l'attachement
- Les dates sont formatées en français avec le fuseau horaire Europe/Paris
- L'approche est identique à `send-formation-email` pour la cohérence
