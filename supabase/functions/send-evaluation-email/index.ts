import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
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
    const { evaluationId } = await req.json();

    if (!evaluationId) {
      return new Response(JSON.stringify({ error: 'evaluationId est requis' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialiser le client Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Récupérer les données complètes de l'évaluation
    const { data: evaluation, error: evaluationError } = await supabase
      .from('evaluation')
      .select('*')
      .eq('id', evaluationId)
      .single();

    if (evaluationError || !evaluation) {
      throw new Error(`Évaluation non trouvée: ${evaluationError?.message}`);
    }

    // Vérifier que le statut est "Traitée"
    if (evaluation.statut !== 'Traitée') {
      throw new Error(`Statut invalide: ${evaluation.statut}. Requis: "Traitée"`);
    }

    // Vérifier que le PDF Qualiopi existe
    if (!evaluation.pdf_qualiopi_url) {
      throw new Error('Le PDF Qualiopi doit être généré avant l\'envoi');
    }

    // Vérifier que l'email du formateur existe
    if (!evaluation.email_formateur) {
      throw new Error('Email du formateur non trouvé');
    }

    // Télécharger le PDF
    const pdfResponse = await fetch(evaluation.pdf_qualiopi_url);

    if (!pdfResponse.ok) {
      throw new Error('Erreur lors du téléchargement du PDF Qualiopi');
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();

    // Convertir en base64 pour Resend
    const pdfBase64 = btoa(
      new Uint8Array(pdfBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    // Formater la date de la session avec fuseau horaire Europe/Paris
    let sessionDate = 'Non spécifiée';
    if (evaluation.date_session) {
      const date = new Date(evaluation.date_session);
      sessionDate = date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Europe/Paris'
      });
      sessionDate = sessionDate.charAt(0).toUpperCase() + sessionDate.slice(1);
    }

    // Composer l'email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #133e5e; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">Évaluation de formation ARKANCE</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">Référence Qualiopi</p>
        </div>

        <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="margin-top: 0;">Bonjour ${evaluation.nom_formateur || 'Formateur'},</p>

          <p>Merci d'avoir animé la formation. Vous trouverez ci-joint le bilan Qualiopi de cette session.</p>

          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
            <h2 style="color: #133e5e; margin-top: 0; font-size: 18px;">Détails de la formation</h2>

            <table style="width: 100%; margin: 15px 0;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 140px;"><strong>Thème :</strong></td>
                <td style="padding: 8px 0;">${evaluation.theme || 'Non spécifié'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>Formateur :</strong></td>
                <td style="padding: 8px 0;">${evaluation.nom_formateur || 'Non spécifié'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>Email :</strong></td>
                <td style="padding: 8px 0;">${evaluation.email_formateur || 'Non spécifié'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>Date session :</strong></td>
                <td style="padding: 8px 0;">${sessionDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>Nombre de participants :</strong></td>
                <td style="padding: 8px 0;">${evaluation.nombre_participants || '0'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>Statut :</strong></td>
                <td style="padding: 8px 0;">
                  <span style="background-color: #10b981; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                    ${evaluation.statut}
                  </span>
                </td>
              </tr>
            </table>

            ${evaluation.notes ? `
              <h3 style="color: #133e5e; font-size: 16px; margin-top: 20px; margin-bottom: 10px;">Notes</h3>
              <div style="background-color: #f3f4f6; padding: 12px; border-radius: 6px; font-size: 14px;">
                ${evaluation.notes}
              </div>
            ` : ''}
          </div>

          <p style="margin-bottom: 5px;"><strong>Document joint :</strong></p>
          <ul style="margin-top: 5px;">
            <li>Bilan Qualiopi de la formation</li>
          </ul>

          <p>Pour toute question concernant cette évaluation, n'hésitez pas à nous contacter.</p>

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

    // Créer un sujet d'email descriptif
    const subject = `Bilan Qualiopi - ${evaluation.theme || 'Formation'} - ${sessionDate}`;

    // Envoyer l'email via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'ARKANCE Formation <noreply@arkance-training.world>',
        to: [evaluation.email_formateur],
        subject: subject,
        html: emailHtml,
        attachments: [
          {
            filename: `bilan_qualiopi_${evaluation.id || Date.now()}.pdf`,
            content: pdfBase64
          }
        ]
      })
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      throw new Error(`Erreur Resend: ${JSON.stringify(resendData)}`);
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Email envoyé avec succès à ${evaluation.email_formateur}`,
      resendId: resendData.id
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Erreur dans send-evaluation-email:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
