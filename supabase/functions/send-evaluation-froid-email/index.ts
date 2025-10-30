import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const BASE_URL = 'https://arkance-training.world/index.html';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Gérer les requêtes OPTIONS pour CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Vérifier la clé API Resend
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY non configurée');
    }

    // Récupérer les données de la requête
    const { evaluationId, isRelance = false } = await req.json();

    if (!evaluationId) {
      return new Response(JSON.stringify({ error: 'evaluationId est requis' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialiser le client Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Récupérer les données complètes de l'évaluation
    const { data: evaluation, error: evaluationError } = await supabase
      .from('evaluation')
      .select(`
        *,
        formation:formation_id(
          name,
          prj,
          pdc:pdc_id(ref, pdc_number),
          formateur:formateur_id(nom, prenom)
        )
      `)
      .eq('id', evaluationId)
      .single();

    if (evaluationError || !evaluation) {
      throw new Error(`Évaluation non trouvée: ${evaluationError?.message}`);
    }

    // Vérifier que l'évaluation est de type 'chaude'
    if (evaluation.evaluation_type !== 'chaude') {
      throw new Error('Cette évaluation n\'est pas de type "chaude"');
    }

    // Vérifier que le stagiaire a un email
    if (!evaluation.stagiaire_email) {
      throw new Error('Email du stagiaire non trouvé');
    }

    // Vérifier que le token existe
    if (!evaluation.evaluation_froid_token) {
      throw new Error('Token d\'évaluation à froid non généré');
    }

    // Vérifier que l'évaluation à froid n'a pas déjà été complétée
    if (evaluation.froid_satisfaction_globale !== null) {
      console.log('⚠️  L\'évaluation à froid a déjà été complétée');
      return new Response(
        JSON.stringify({
          success: false,
          message: 'L\'évaluation à froid a déjà été complétée',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Générer l'URL du formulaire d'évaluation à froid
    const evaluationFroidUrl = `${BASE_URL}#/evaluation-froid/${evaluation.evaluation_froid_token}`;

    console.log(`📧 Préparation de l'email ${isRelance ? '(RELANCE)' : ''} à froid pour ${evaluation.stagiaire_email}`);

    // Préparer le message d'introduction
    const introMessage = isRelance
      ? `
        <p>Nous vous avions envoyé un email il y a quelques jours pour recueillir votre retour d'expérience suite à la formation que vous avez suivie.</p>
        <p><strong>Nous n'avons pas encore reçu votre réponse</strong> et votre avis est très important pour nous.</p>
        <p>Pourriez-vous prendre quelques minutes pour compléter cette évaluation ?</p>
      `
      : `
        <p>Il y a maintenant 30 jours que vous avez suivi une formation chez ARKANCE.</p>
        <p>Nous souhaitons recueillir votre retour d'expérience après cette période de mise en pratique.</p>
        <p>Votre avis nous est précieux et nous permettra d'améliorer continuellement nos formations.</p>
      `;

    // Composer l'email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #374151; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f3f4f6;">
        <div style="background-color: #133e5e; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">${isRelance ? 'Rappel : ' : ''}Votre avis nous intéresse !</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">Évaluation à froid - 30 jours après la formation</p>
        </div>

        <div style="background-color: white; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="margin-top: 0;">Bonjour ${evaluation.stagiaire_prenom || ''} ${evaluation.stagiaire_nom || ''},</p>

          ${introMessage}

          <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #133e5e;">
            <h2 style="color: #133e5e; margin-top: 0; font-size: 18px;">${evaluation.formation?.name || 'Formation'}</h2>

            <table style="width: 100%; margin: 15px 0; font-size: 14px;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 140px;"><strong>Référence :</strong></td>
                <td style="padding: 8px 0;">${evaluation.formation?.prj || 'Non spécifié'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>Formateur :</strong></td>
                <td style="padding: 8px 0;">${evaluation.formation?.formateur ? `${evaluation.formation.formateur.prenom || ''} ${evaluation.formation.formateur.nom || ''}` : 'Non spécifié'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>Plan de cours :</strong></td>
                <td style="padding: 8px 0;">${evaluation.formation?.pdc?.ref || evaluation.formation?.pdc?.pdc_number || 'Non spécifié'}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #16a34a;">
            <h3 style="color: #16a34a; margin-top: 0; font-size: 16px;">📝 Quelques questions rapides :</h3>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Avez-vous pu mettre en pratique les connaissances acquises ?</li>
              <li>Cette formation a-t-elle amélioré votre efficacité au quotidien ?</li>
              <li>Recommanderiez-vous cette formation à vos collègues ?</li>
            </ul>
            <p style="margin-bottom: 0; font-size: 14px; color: #166534;"><em>⏱️ Durée estimée : 3 minutes</em></p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${evaluationFroidUrl}"
               style="display: inline-block; background-color: #133e5e; color: white; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              Répondre à l'évaluation
            </a>
          </div>

          <p style="font-size: 14px; color: #6b7280; text-align: center;">
            Ou copiez ce lien dans votre navigateur :<br>
            <a href="${evaluationFroidUrl}" style="color: #133e5e; word-break: break-all;">${evaluationFroidUrl}</a>
          </p>

          <p style="margin-top: 30px;">Nous vous remercions par avance pour le temps que vous consacrerez à cette évaluation.</p>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
            <p style="margin: 5px 0;"><strong>ARKANCE</strong></p>
            <p style="margin: 5px 0;">LE VAL SAINT QUENTIN - Bâtiment C - 2, rue René Caudron - CS 30764</p>
            <p style="margin: 5px 0;">78961 Voisins-le-Bretonneux Cedex</p>
            <p style="margin: 5px 0;">www.arkance.world</p>
            <p style="margin: 5px 0;">Tél. : 01 39 44 18 18</p>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log('📧 Envoi de l\'email via Resend...');

    // Envoyer l'email via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ARKANCE Formation <noreply@arkance-training.world>',
        to: [evaluation.stagiaire_email],
        cc: ['franck.delcuse@arkance.world', 'adrien.kapper@arkance.world'],
        subject: isRelance
          ? `Rappel : Votre avis sur la formation "${evaluation.formation?.name || 'Formation'}"`
          : `Votre avis 30 jours après la formation "${evaluation.formation?.name || 'Formation'}"`,
        html: emailHtml,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      throw new Error(`Erreur Resend: ${JSON.stringify(resendData)}`);
    }

    console.log('✅ Email envoyé avec succès');

    // Mettre à jour la date d'envoi dans la base de données
    const updateField = isRelance ? 'evaluation_froid_relance_sent_at' : 'evaluation_froid_sent_at';
    const { error: updateError } = await supabase
      .from('evaluation')
      .update({ [updateField]: new Date().toISOString() })
      .eq('id', evaluationId);

    if (updateError) {
      console.error('⚠️  Erreur lors de la mise à jour de la date d\'envoi:', updateError);
    } else {
      console.log(`✅ Date d'envoi mise à jour (${updateField})`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Email ${isRelance ? 'de relance ' : ''}envoyé avec succès à ${evaluation.stagiaire_email}`,
        resendId: resendData.id,
        evaluationFroidUrl,
        isRelance,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Erreur dans send-evaluation-froid-email:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
